import os
import json
import re
import sys
import traceback
from typing import Dict, List, Any, Optional, Tuple
import requests
from io import BytesIO
import logging
from datetime import datetime
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# PDF processing libraries
try:
    import PyPDF2
    import pdfplumber
    import fitz  # PyMuPDF for better text extraction
except ImportError:
    logger.info("Installing PDF processing libraries...")
    os.system("pip install PyPDF2 pdfplumber PyMuPDF")
    import PyPDF2
    import pdfplumber
    import fitz

# Text processing libraries
try:
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tag import pos_tag
    from nltk.chunk import ne_chunk
    from nltk.tree import Tree
except ImportError:
    logger.info("Installing NLTK...")
    os.system("pip install nltk")
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tag import pos_tag
    from nltk.chunk import ne_chunk
    from nltk.tree import Tree

# Machine learning libraries for advanced analysis
try:
    import spacy
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    logger.info("Installing ML libraries...")
    os.system("pip install spacy scikit-learn")
    import spacy
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

# Download required NLTK data
required_nltk_data = ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger', 'maxent_ne_chunker', 'words']
for data in required_nltk_data:
    try:
        nltk.data.find(f'tokenizers/{data}')
    except LookupError:
        try:
            nltk.download(data, quiet=True)
        except Exception as e:
            logger.warning(f"Could not download {data}: {e}")

class AdvancedResumeAnalyzer:
    def __init__(self):
        self.openai_api_key = os.getenv('NEXT_PUBLIC_OPENAI_API_KEY')
        self.huggingface_api_key = os.getenv('NEXT_PUBLIC_HUGGINGFACE_API_KEY')
        
        # Initialize NLP components
        try:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
        except Exception as e:
            logger.warning(f"NLTK initialization failed: {e}")
            self.lemmatizer = None
            self.stop_words = set()
        
        # Try to load spaCy model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.info("Installing spaCy English model...")
            os.system("python -m spacy download en_core_web_sm")
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception as e:
                logger.warning(f"Could not load spaCy model: {e}")
                self.nlp = None
        
        # Comprehensive skill databases
        self.skill_database = {
            'programming_languages': {
                'python': ['python', 'py', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
                'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
                'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
                'c++': ['c++', 'cpp', 'c plus plus'],
                'c#': ['c#', 'csharp', 'c sharp', '.net', 'asp.net'],
                'php': ['php', 'laravel', 'symfony', 'codeigniter'],
                'ruby': ['ruby', 'rails', 'ruby on rails'],
                'go': ['golang', 'go lang'],
                'rust': ['rust', 'cargo'],
                'swift': ['swift', 'ios'],
                'kotlin': ['kotlin', 'android'],
                'scala': ['scala', 'akka'],
                'typescript': ['typescript', 'ts'],
                'r': ['r programming', 'r language'],
                'matlab': ['matlab', 'simulink'],
                'perl': ['perl'],
                'shell': ['bash', 'shell scripting', 'powershell'],
                'sql': ['sql', 'mysql', 'postgresql', 'sqlite', 'oracle', 'sql server']
            },
            'web_technologies': {
                'frontend': ['html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material-ui', 'chakra-ui'],
                'backend': ['express', 'koa', 'fastify', 'spring boot', 'django rest', 'flask api'],
                'frameworks': ['react', 'angular', 'vue', 'svelte', 'ember', 'backbone'],
                'mobile': ['react native', 'flutter', 'ionic', 'xamarin', 'cordova'],
                'cms': ['wordpress', 'drupal', 'joomla', 'contentful', 'strapi']
            },
            'databases': {
                'relational': ['mysql', 'postgresql', 'sqlite', 'oracle', 'sql server', 'mariadb'],
                'nosql': ['mongodb', 'cassandra', 'couchdb', 'neo4j', 'dynamodb'],
                'cache': ['redis', 'memcached', 'elasticsearch'],
                'data_warehouse': ['snowflake', 'bigquery', 'redshift', 'databricks']
            },
            'cloud_platforms': {
                'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudformation'],
                'azure': ['azure', 'microsoft azure', 'azure functions', 'azure sql'],
                'gcp': ['gcp', 'google cloud', 'google cloud platform', 'app engine', 'cloud functions'],
                'others': ['heroku', 'digitalocean', 'linode', 'vultr', 'vercel', 'netlify']
            },
            'devops_tools': {
                'containerization': ['docker', 'kubernetes', 'podman', 'containerd'],
                'ci_cd': ['jenkins', 'github actions', 'gitlab ci', 'travis ci', 'circleci', 'azure devops'],
                'infrastructure': ['terraform', 'ansible', 'puppet', 'chef', 'cloudformation'],
                'monitoring': ['prometheus', 'grafana', 'elk stack', 'splunk', 'datadog', 'new relic'],
                'version_control': ['git', 'github', 'gitlab', 'bitbucket', 'svn']
            },
            'data_science': {
                'libraries': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras'],
                'visualization': ['matplotlib', 'seaborn', 'plotly', 'bokeh', 'd3.js'],
                'big_data': ['spark', 'hadoop', 'kafka', 'airflow', 'dask'],
                'ml_ops': ['mlflow', 'kubeflow', 'sagemaker', 'azure ml']
            },
            'security': {
                'tools': ['nmap', 'wireshark', 'metasploit', 'burp suite', 'owasp'],
                'concepts': ['penetration testing', 'vulnerability assessment', 'encryption', 'ssl/tls']
            },
            'testing': {
                'frameworks': ['jest', 'mocha', 'pytest', 'junit', 'selenium', 'cypress'],
                'types': ['unit testing', 'integration testing', 'e2e testing', 'performance testing']
            }
        }
        
        self.soft_skills = [
            'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
            'project management', 'time management', 'adaptability', 'creativity', 'collaboration',
            'analytical skills', 'decision making', 'conflict resolution', 'mentoring', 'coaching',
            'public speaking', 'presentation skills', 'negotiation', 'customer service',
            'strategic thinking', 'innovation', 'emotional intelligence', 'stress management'
        ]
        
        self.certifications = [
            'aws certified', 'azure certified', 'google cloud certified', 'cissp', 'cism', 'cisa',
            'pmp', 'scrum master', 'agile', 'itil', 'comptia', 'cisco certified', 'microsoft certified',
            'oracle certified', 'salesforce certified', 'kubernetes certified'
        ]
        
        # Industry-specific job roles and requirements
        self.job_market_data = {
            'software_engineer': {
                'junior': {
                    'salary_range': '$60,000 - $90,000',
                    'required_skills': ['programming', 'version control', 'debugging'],
                    'preferred_skills': ['web development', 'databases', 'testing']
                },
                'mid': {
                    'salary_range': '$90,000 - $130,000',
                    'required_skills': ['multiple programming languages', 'system design', 'databases'],
                    'preferred_skills': ['cloud platforms', 'devops', 'mentoring']
                },
                'senior': {
                    'salary_range': '$130,000 - $180,000',
                    'required_skills': ['architecture', 'leadership', 'system design'],
                    'preferred_skills': ['team management', 'strategic planning', 'innovation']
                }
            },
            'data_scientist': {
                'junior': {
                    'salary_range': '$70,000 - $100,000',
                    'required_skills': ['python/r', 'statistics', 'machine learning'],
                    'preferred_skills': ['sql', 'data visualization', 'pandas']
                },
                'mid': {
                    'salary_range': '$100,000 - $140,000',
                    'required_skills': ['advanced ml', 'big data', 'model deployment'],
                    'preferred_skills': ['deep learning', 'cloud platforms', 'mlops']
                },
                'senior': {
                    'salary_range': '$140,000 - $200,000',
                    'required_skills': ['ml strategy', 'team leadership', 'business acumen'],
                    'preferred_skills': ['research', 'innovation', 'stakeholder management']
                }
            },
            'devops_engineer': {
                'junior': {
                    'salary_range': '$65,000 - $95,000',
                    'required_skills': ['linux', 'scripting', 'ci/cd'],
                    'preferred_skills': ['docker', 'cloud basics', 'monitoring']
                },
                'mid': {
                    'salary_range': '$95,000 - $135,000',
                    'required_skills': ['kubernetes', 'infrastructure as code', 'cloud platforms'],
                    'preferred_skills': ['security', 'automation', 'performance optimization']
                },
                'senior': {
                    'salary_range': '$135,000 - $185,000',
                    'required_skills': ['architecture', 'security', 'team leadership'],
                    'preferred_skills': ['cost optimization', 'disaster recovery', 'compliance']
                }
            }
        }

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from PDF using multiple methods with detailed metadata"""
        extraction_metadata = {
            'methods_tried': [],
            'successful_method': None,
            'page_count': 0,
            'extraction_quality': 'unknown',
            'errors': []
        }
        
        text = ""
        
        # Method 1: PyMuPDF (fitz) - Best for complex layouts
        try:
            logger.info("Attempting text extraction with PyMuPDF...")
            extraction_metadata['methods_tried'].append('pymupdf')
            
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
            extraction_metadata['page_count'] = pdf_document.page_count
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                if page_text.strip():
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            pdf_document.close()
            
            if len(text.strip()) > 200:
                extraction_metadata['successful_method'] = 'pymupdf'
                extraction_metadata['extraction_quality'] = 'excellent'
                logger.info(f"PyMuPDF: Successfully extracted {len(text)} characters")
                return text, extraction_metadata
                
        except Exception as e:
            error_msg = f"PyMuPDF extraction failed: {str(e)}"
            logger.warning(error_msg)
            extraction_metadata['errors'].append(error_msg)
        
        # Method 2: pdfplumber - Good for tables and structured data
        try:
            logger.info("Attempting text extraction with pdfplumber...")
            extraction_metadata['methods_tried'].append('pdfplumber')
            
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                extraction_metadata['page_count'] = len(pdf.pages)
                
                for page_num, page in enumerate(pdf.pages):
                    # Extract text
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n--- Page {page_num + 1} ---\n{page_text}"
                    
                    # Extract tables if any
                    tables = page.extract_tables()
                    for table_num, table in enumerate(tables):
                        text += f"\n--- Table {table_num + 1} on Page {page_num + 1} ---\n"
                        for row in table:
                            if row:
                                text += " | ".join([cell or "" for cell in row]) + "\n"
            
            if len(text.strip()) > 200:
                extraction_metadata['successful_method'] = 'pdfplumber'
                extraction_metadata['extraction_quality'] = 'good'
                logger.info(f"pdfplumber: Successfully extracted {len(text)} characters")
                return text, extraction_metadata
                
        except Exception as e:
            error_msg = f"pdfplumber extraction failed: {str(e)}"
            logger.warning(error_msg)
            extraction_metadata['errors'].append(error_msg)
        
        # Method 3: PyPDF2 - Basic extraction
        try:
            logger.info("Attempting text extraction with PyPDF2...")
            extraction_metadata['methods_tried'].append('pypdf2')
            
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
            extraction_metadata['page_count'] = len(pdf_reader.pages)
            
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            if len(text.strip()) > 100:
                extraction_metadata['successful_method'] = 'pypdf2'
                extraction_metadata['extraction_quality'] = 'basic'
                logger.info(f"PyPDF2: Successfully extracted {len(text)} characters")
                return text, extraction_metadata
                
        except Exception as e:
            error_msg = f"PyPDF2 extraction failed: {str(e)}"
            logger.warning(error_msg)
            extraction_metadata['errors'].append(error_msg)
        
        # Method 4: Raw byte extraction (last resort)
        try:
            logger.info("Attempting raw byte extraction...")
            extraction_metadata['methods_tried'].append('raw_bytes')
            
            # Try to decode as text
            raw_text = pdf_bytes.decode('utf-8', errors='ignore')
            # Clean up the text
            cleaned_text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', raw_text)
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
            
            # Look for readable content
            words = cleaned_text.split()
            readable_words = [word for word in words if len(word) > 2 and word.isalpha()]
            
            if len(readable_words) > 50:
                text = cleaned_text
                extraction_metadata['successful_method'] = 'raw_bytes'
                extraction_metadata['extraction_quality'] = 'poor'
                logger.info(f"Raw extraction: Found {len(readable_words)} readable words")
                return text, extraction_metadata
                
        except Exception as e:
            error_msg = f"Raw extraction failed: {str(e)}"
            logger.warning(error_msg)
            extraction_metadata['errors'].append(error_msg)
        
        # If all methods fail
        extraction_metadata['extraction_quality'] = 'failed'
        logger.error("All text extraction methods failed")
        return "", extraction_metadata

    def preprocess_text(self, text: str) -> Dict[str, Any]:
        """Advanced text preprocessing with detailed analysis"""
        preprocessing_info = {
            'original_length': len(text),
            'cleaned_length': 0,
            'sentences': 0,
            'words': 0,
            'unique_words': 0,
            'sections_detected': [],
            'languages_detected': [],
            'encoding_issues': False
        }
        
        # Basic cleaning
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = re.sub(r'[^\w\s\.\,\-\@$$$$\[\]\{\}\/\\\:\;\!\?\$\%\&\*\+\=\<\>\|\~\`\'\"]', ' ', text)
        
        # Detect and fix encoding issues
        try:
            text.encode('utf-8')
        except UnicodeEncodeError:
            preprocessing_info['encoding_issues'] = True
            text = text.encode('utf-8', errors='ignore').decode('utf-8')
        
        # Remove page markers and artifacts
        text = re.sub(r'--- Page \d+ ---', '', text)
        text = re.sub(r'--- Table \d+ on Page \d+ ---', '', text)
        
        # Split into lines and clean
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            # Remove very short lines (likely artifacts)
            if len(line) > 2:
                # Remove lines that are mostly special characters
                if len(re.sub(r'[^\w\s]', '', line)) > len(line) * 0.3:
                    cleaned_lines.append(line)
        
        cleaned_text = '\n'.join(cleaned_lines)
        preprocessing_info['cleaned_length'] = len(cleaned_text)
        
        # Analyze text structure
        if self.nlp:
            try:
                doc = self.nlp(cleaned_text[:1000000])  # Limit for performance
                preprocessing_info['sentences'] = len(list(doc.sents))
                preprocessing_info['languages_detected'] = [doc.lang_]
            except Exception as e:
                logger.warning(f"spaCy analysis failed: {e}")
        
        # Basic word analysis
        words = re.findall(r'\b\w+\b', cleaned_text.lower())
        preprocessing_info['words'] = len(words)
        preprocessing_info['unique_words'] = len(set(words))
        
        # Detect resume sections
        section_patterns = {
            'contact': r'(email|phone|address|linkedin|github)',
            'summary': r'(summary|objective|profile|about)',
            'experience': r'(experience|employment|work history|professional)',
            'education': r'(education|degree|university|college|school)',
            'skills': r'(skills|technologies|competencies|expertise)',
            'projects': r'(projects|portfolio|work samples)',
            'certifications': r'(certifications|certificates|licenses)',
            'awards': r'(awards|achievements|honors|recognition)'
        }
        
        for section, pattern in section_patterns.items():
            if re.search(pattern, cleaned_text, re.IGNORECASE):
                preprocessing_info['sections_detected'].append(section)
        
        return {
            'cleaned_text': cleaned_text,
            'preprocessing_info': preprocessing_info
        }

    def extract_comprehensive_skills(self, text: str) -> Dict[str, Any]:
        """Extract skills with advanced pattern matching and categorization"""
        skills_analysis = {
            'technical_skills': {},
            'soft_skills': [],
            'certifications': [],
            'tools_and_technologies': [],
            'programming_languages': [],
            'frameworks_and_libraries': [],
            'databases': [],
            'cloud_platforms': [],
            'skill_confidence_scores': {},
            'skill_context': {},
            'years_of_experience': {}
        }
        
        text_lower = text.lower()
        
        # Extract technical skills with context
        for category, subcategories in self.skill_database.items():
            skills_analysis['technical_skills'][category] = {}
            
            for subcategory, skills in subcategories.items():
                found_skills = []
                
                for skill in skills:
                    # Create multiple search patterns
                    patterns = [
                        rf'\b{re.escape(skill)}\b',
                        rf'\b{re.escape(skill.replace(" ", ""))}\b',
                        rf'\b{re.escape(skill.replace("-", " "))}\b',
                        rf'\b{re.escape(skill.replace(".", ""))}\b'
                    ]
                    
                    for pattern in patterns:
                        matches = list(re.finditer(pattern, text_lower))
                        if matches:
                            formatted_skill = self.format_skill_name(skill)
                            if formatted_skill not in found_skills:
                                found_skills.append(formatted_skill)
                                
                                # Calculate confidence score based on frequency and context
                                confidence = min(len(matches) * 10 + 50, 95)
                                skills_analysis['skill_confidence_scores'][formatted_skill] = confidence
                                
                                # Extract context around skill mentions
                                contexts = []
                                for match in matches[:3]:  # Limit to first 3 contexts
                                    start = max(0, match.start() - 50)
                                    end = min(len(text), match.end() + 50)
                                    context = text[start:end].strip()
                                    contexts.append(context)
                                
                                skills_analysis['skill_context'][formatted_skill] = contexts
                                
                                # Try to extract years of experience
                                years = self.extract_skill_experience(text, skill)
                                if years:
                                    skills_analysis['years_of_experience'][formatted_skill] = years
                            break
                
                if found_skills:
                    skills_analysis['technical_skills'][category][subcategory] = found_skills
        
        # Extract soft skills
        for skill in self.soft_skills:
            if re.search(rf'\b{re.escape(skill)}\b', text_lower):
                formatted_skill = skill.title()
                skills_analysis['soft_skills'].append(formatted_skill)
        
        # Extract certifications
        for cert in self.certifications:
            if re.search(rf'\b{re.escape(cert)}\b', text_lower):
                skills_analysis['certifications'].append(cert.title())
        
        # Flatten technical skills for easier access
        all_technical = []
        for category in skills_analysis['technical_skills'].values():
            for subcategory in category.values():
                all_technical.extend(subcategory)
        
        skills_analysis['programming_languages'] = self.get_skills_by_category(skills_analysis, 'programming_languages')
        skills_analysis['frameworks_and_libraries'] = self.get_skills_by_category(skills_analysis, 'web_technologies')
        skills_analysis['databases'] = self.get_skills_by_category(skills_analysis, 'databases')
        skills_analysis['cloud_platforms'] = self.get_skills_by_category(skills_analysis, 'cloud_platforms')
        skills_analysis['tools_and_technologies'] = self.get_skills_by_category(skills_analysis, 'devops_tools')
        
        return skills_analysis

    def get_skills_by_category(self, skills_analysis: Dict, category: str) -> List[str]:
        """Helper to get skills by category"""
        skills = []
        if category in skills_analysis['technical_skills']:
            for subcategory in skills_analysis['technical_skills'][category].values():
                skills.extend(subcategory)
        return skills

    def extract_skill_experience(self, text: str, skill: str) -> Optional[int]:
        """Extract years of experience for a specific skill"""
        # Patterns to find experience with specific skills
        patterns = [
            rf'{re.escape(skill)}.*?(\d+)\+?\s*years?',
            rf'(\d+)\+?\s*years?.*?{re.escape(skill)}',
            rf'{re.escape(skill)}.*?(\d+)\+?\s*yrs?',
            rf'(\d+)\+?\s*yrs?.*?{re.escape(skill)}'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                try:
                    return int(matches[0])
                except (ValueError, IndexError):
                    continue
        
        return None

    def format_skill_name(self, skill: str) -> str:
        """Format skill names with proper capitalization"""
        special_cases = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'nodejs': 'Node.js',
            'reactjs': 'React.js',
            'vuejs': 'Vue.js',
            'angularjs': 'Angular.js',
            'mysql': 'MySQL',
            'postgresql': 'PostgreSQL',
            'mongodb': 'MongoDB',
            'aws': 'AWS',
            'gcp': 'Google Cloud Platform',
            'html': 'HTML',
            'css': 'CSS',
            'sql': 'SQL',
            'api': 'API',
            'rest': 'REST',
            'graphql': 'GraphQL',
            'docker': 'Docker',
            'kubernetes': 'Kubernetes',
            'jenkins': 'Jenkins',
            'git': 'Git',
            'github': 'GitHub',
            'gitlab': 'GitLab',
            'jira': 'JIRA',
            'ci/cd': 'CI/CD',
            'devops': 'DevOps',
            'mlops': 'MLOps',
            'tensorflow': 'TensorFlow',
            'pytorch': 'PyTorch',
            'scikit-learn': 'Scikit-learn',
            'pandas': 'Pandas',
            'numpy': 'NumPy'
        }
        
        return special_cases.get(skill.lower(), skill.title())

    def determine_experience_level(self, text: str, skills_analysis: Dict) -> Dict[str, Any]:
        """Comprehensive experience level determination"""
        experience_analysis = {
            'level': 'junior',
            'confidence': 0,
            'indicators': [],
            'years_found': [],
            'leadership_indicators': [],
            'technical_depth': 0,
            'breadth_score': 0
        }
        
        text_lower = text.lower()
        
        # Extract years of experience patterns
        year_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)',
            r'experience.*?(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in\s*(?:software|development|programming)',
            r'over\s*(\d+)\s*years?',
            r'more\s*than\s*(\d+)\s*years?'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                try:
                    years = int(match)
                    experience_analysis['years_found'].append(years)
                except ValueError:
                    continue
        
        # Senior level indicators
        senior_keywords = [
            'senior', 'lead', 'principal', 'architect', 'manager', 'director',
            'head of', 'vp', 'cto', 'chief', 'team lead', 'technical lead',
            'staff engineer', 'distinguished engineer'
        ]
        
        # Mid-level indicators
        mid_keywords = [
            'mid-level', 'intermediate', 'software engineer ii', 'engineer ii',
            'associate', 'specialist'
        ]
        
        # Leadership indicators
        leadership_patterns = [
            r'led\s+(?:a\s+)?team\s+of\s+(\d+)',
            r'managed\s+(\d+)\s+(?:developers|engineers|people)',
            r'mentored\s+(\d+)',
            r'supervised\s+(\d+)',
            r'coordinated\s+with\s+(\d+)'
        ]
        
        for pattern in leadership_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                try:
                    team_size = int(match)
                    experience_analysis['leadership_indicators'].append(f"Led team of {team_size}")
                except ValueError:
                    continue
        
        # Technical depth analysis
        total_skills = sum(len(category) for category_dict in skills_analysis['technical_skills'].values() 
                          for category in category_dict.values())
        experience_analysis['technical_depth'] = total_skills
        
        # Breadth analysis (different technology categories)
        categories_with_skills = sum(1 for category_dict in skills_analysis['technical_skills'].values() 
                                   if any(category for category in category_dict.values()))
        experience_analysis['breadth_score'] = categories_with_skills
        
        # Decision logic
        max_years = max(experience_analysis['years_found']) if experience_analysis['years_found'] else 0
        
        # Calculate confidence and level
        confidence_factors = []
        
        if max_years >= 8 or any(keyword in text_lower for keyword in senior_keywords):
            experience_analysis['level'] = 'senior'
            confidence_factors.append(70)
            experience_analysis['indicators'].append(f"Years: {max_years}" if max_years else "Senior keywords found")
            
        elif max_years >= 3 or any(keyword in text_lower for keyword in mid_keywords):
            experience_analysis['level'] = 'mid'
            confidence_factors.append(60)
            experience_analysis['indicators'].append(f"Years: {max_years}" if max_years else "Mid-level keywords found")
            
        else:
            experience_analysis['level'] = 'junior'
            confidence_factors.append(50)
            experience_analysis['indicators'].append("Limited experience indicators")
        
        # Adjust based on technical depth
        if total_skills > 15:
            confidence_factors.append(20)
            experience_analysis['indicators'].append(f"High technical skill count: {total_skills}")
        elif total_skills > 8:
            confidence_factors.append(10)
        
        # Adjust based on leadership
        if experience_analysis['leadership_indicators']:
            confidence_factors.append(15)
            experience_analysis['indicators'].extend(experience_analysis['leadership_indicators'])
        
        # Adjust based on breadth
        if categories_with_skills >= 4:
            confidence_factors.append(10)
            experience_analysis['indicators'].append(f"Broad technical expertise: {categories_with_skills} categories")
        
        experience_analysis['confidence'] = min(sum(confidence_factors), 95)
        
        return experience_analysis

    def generate_detailed_job_recommendations(self, skills_analysis: Dict, experience_analysis: Dict) -> List[Dict[str, Any]]:
        """Generate detailed job recommendations with market analysis"""
        recommendations = []
        experience_level = experience_analysis['level']
        
        # Determine primary technology stack
        primary_stack = self.determine_primary_stack(skills_analysis)
        
        # Generate role-specific recommendations
        role_generators = {
            'software_engineer': self.generate_software_engineer_roles,
            'data_scientist': self.generate_data_scientist_roles,
            'devops_engineer': self.generate_devops_roles,
            'frontend_developer': self.generate_frontend_roles,
            'backend_developer': self.generate_backend_roles,
            'fullstack_developer': self.generate_fullstack_roles,
            'mobile_developer': self.generate_mobile_roles,
            'security_engineer': self.generate_security_roles
        }
        
        for role_type, generator in role_generators.items():
            try:
                role_recommendations = generator(skills_analysis, experience_level, primary_stack)
                recommendations.extend(role_recommendations)
            except Exception as e:
                logger.warning(f"Failed to generate {role_type} recommendations: {e}")
        
        # Sort by match percentage and return top recommendations
        recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
        return recommendations[:8]

    def determine_primary_stack(self, skills_analysis: Dict) -> str:
        """Determine the primary technology stack"""
        # Count skills in different stacks
        stack_scores = {
            'web_fullstack': 0,
            'data_science': 0,
            'mobile': 0,
            'devops': 0,
            'security': 0
        }
        
        # Web/Full-stack indicators
        web_skills = ['javascript', 'react', 'angular', 'vue', 'node.js', 'html', 'css']
        for skill in web_skills:
            if any(skill.lower() in s.lower() for category in skills_analysis['technical_skills'].values() 
                  for subcategory in category.values() for s in subcategory):
                stack_scores['web_fullstack'] += 1
        
        # Data science indicators
        ds_skills = ['python', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'r']
        for skill in ds_skills:
            if any(skill.lower() in s.lower() for category in skills_analysis['technical_skills'].values() 
                  for subcategory in category.values() for s in subcategory):
                stack_scores['data_science'] += 1
        
        # Mobile indicators
        mobile_skills = ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android']
        for skill in mobile_skills:
            if any(skill.lower() in s.lower() for category in skills_analysis['technical_skills'].values() 
                  for subcategory in category.values() for s in subcategory):
                stack_scores['mobile'] += 1
        
        # DevOps indicators
        devops_skills = ['docker', 'kubernetes', 'jenkins', 'terraform', 'ansible', 'aws', 'azure']
        for skill in devops_skills:
            if any(skill.lower() in s.lower() for category in skills_analysis['technical_skills'].values() 
                  for subcategory in category.values() for s in subcategory):
                stack_scores['devops'] += 1
        
        return max(stack_scores, key=stack_scores.get)

    def generate_software_engineer_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate software engineer role recommendations"""
        roles = []
        
        base_role = {
            'category': 'Software Engineering',
            'remote_friendly': True,
            'growth_potential': 'High',
            'market_demand': 'Very High'
        }
        
        if experience_level == 'junior':
            roles.append({
                **base_role,
                'title': 'Junior Software Developer',
                'match_percentage': self.calculate_match_percentage(skills_analysis, ['programming', 'version control']),
                'salary_range': '$60,000 - $90,000',
                'company_types': ['Startups', 'Mid-size Companies', 'Agencies'],
                'required_skills': ['Programming fundamentals', 'Version control (Git)', 'Problem solving'],
                'preferred_skills': skills_analysis['programming_languages'][:3],
                'job_description': 'Entry-level position focusing on learning and contributing to software development projects.',
                'career_path': 'Junior → Mid-level → Senior → Lead/Principal'
            })
        
        elif experience_level == 'mid':
            roles.append({
                **base_role,
                'title': 'Software Engineer',
                'match_percentage': self.calculate_match_percentage(skills_analysis, ['programming', 'system design', 'databases']),
                'salary_range': '$90,000 - $130,000',
                'company_types': ['Tech Companies', 'Enterprise', 'Scale-ups'],
                'required_skills': ['Multiple programming languages', 'System design', 'Database knowledge'],
                'preferred_skills': skills_analysis['programming_languages'] + skills_analysis['databases'][:2],
                'job_description': 'Develop and maintain software systems with increasing responsibility and complexity.',
                'career_path': 'Mid-level → Senior → Staff/Principal → Engineering Manager'
            })
        
        else:  # senior
            roles.append({
                **base_role,
                'title': 'Senior Software Engineer',
                'match_percentage': self.calculate_match_percentage(skills_analysis, ['architecture', 'leadership', 'mentoring']),
                'salary_range': '$130,000 - $180,000',
                'company_types': ['Large Tech', 'Enterprise', 'High-growth Startups'],
                'required_skills': ['Software architecture', 'Technical leadership', 'Mentoring'],
                'preferred_skills': skills_analysis['programming_languages'] + ['System Design', 'Leadership'],
                'job_description': 'Lead technical initiatives, mentor junior developers, and drive architectural decisions.',
                'career_path': 'Senior → Staff/Principal → Distinguished Engineer → CTO'
            })
        
        return roles

    def generate_data_scientist_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate data scientist role recommendations"""
        # Check if candidate has data science skills
        ds_skills = skills_analysis.get('programming_languages', []) + \
                   self.get_skills_by_category(skills_analysis, 'data_science')
        
        if not any('python' in skill.lower() or 'r' in skill.lower() for skill in ds_skills):
            return []
        
        roles = []
        base_role = {
            'category': 'Data Science',
            'remote_friendly': True,
            'growth_potential': 'Very High',
            'market_demand': 'High'
        }
        
        if experience_level == 'junior':
            roles.append({
                **base_role,
                'title': 'Junior Data Scientist',
                'match_percentage': self.calculate_match_percentage(skills_analysis, ['python', 'statistics', 'sql']),
                'salary_range': '$70,000 - $100,000',
                'company_types': ['Tech Companies', 'Consulting', 'Research'],
                'required_skills': ['Python/R', 'Statistics', 'SQL', 'Data visualization'],
                'preferred_skills': ['Pandas', 'NumPy', 'Matplotlib', 'Jupyter'],
                'job_description': 'Analyze data, build basic models, and create visualizations under supervision.',
                'career_path': 'Junior → Mid-level → Senior → Principal Data Scientist'
            })
        
        return roles

    def generate_devops_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate DevOps role recommendations"""
        devops_skills = self.get_skills_by_category(skills_analysis, 'devops_tools') + \
                       self.get_skills_by_category(skills_analysis, 'cloud_platforms')
        
        if not devops_skills:
            return []
        
        roles = []
        base_role = {
            'category': 'DevOps/Infrastructure',
            'remote_friendly': True,
            'growth_potential': 'High',
            'market_demand': 'Very High'
        }
        
        if experience_level == 'mid' or experience_level == 'senior':
            roles.append({
                **base_role,
                'title': f'{"Senior " if experience_level == "senior" else ""}DevOps Engineer',
                'match_percentage': self.calculate_match_percentage(skills_analysis, ['docker', 'kubernetes', 'cloud']),
                'salary_range': '$95,000 - $135,000' if experience_level == 'mid' else '$135,000 - $185,000',
                'company_types': ['Tech Companies', 'Enterprise', 'Cloud Providers'],
                'required_skills': ['Containerization', 'CI/CD', 'Cloud platforms', 'Infrastructure as Code'],
                'preferred_skills': devops_skills[:5],
                'job_description': 'Design and maintain scalable infrastructure, automate deployments, and ensure system reliability.',
                'career_path': 'DevOps → Senior DevOps → Platform Engineer → Infrastructure Architect'
            })
        
        return roles

    def generate_frontend_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate frontend developer role recommendations"""
        frontend_skills = []
        web_tech = skills_analysis['technical_skills'].get('web_technologies', {})
        for category in web_tech.values():
            frontend_skills.extend(category)
        
        if not any('react' in skill.lower() or 'angular' in skill.lower() or 'vue' in skill.lower() 
                  for skill in frontend_skills):
            return []
        
        roles = []
        base_role = {
            'category': 'Frontend Development',
            'remote_friendly': True,
            'growth_potential': 'High',
            'market_demand': 'High'
        }
        
        roles.append({
            **base_role,
            'title': f'{"Senior " if experience_level == "senior" else ""}Frontend Developer',
            'match_percentage': self.calculate_match_percentage(skills_analysis, ['javascript', 'react', 'css']),
            'salary_range': self.get_salary_range('frontend', experience_level),
            'company_types': ['Tech Companies', 'Agencies', 'E-commerce'],
            'required_skills': ['JavaScript', 'Modern frameworks', 'CSS/SCSS', 'Responsive design'],
            'preferred_skills': frontend_skills[:5],
            'job_description': 'Build user interfaces and enhance user experience with modern web technologies.',
            'career_path': 'Frontend → Senior Frontend → Frontend Architect → Engineering Manager'
        })
        
        return roles

    def generate_backend_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate backend developer role recommendations"""
        backend_skills = skills_analysis['programming_languages'] + skills_analysis['databases']
        
        if not backend_skills:
            return []
        
        roles = []
        base_role = {
            'category': 'Backend Development',
            'remote_friendly': True,
            'growth_potential': 'High',
            'market_demand': 'Very High'
        }
        
        roles.append({
            **base_role,
            'title': f'{"Senior " if experience_level == "senior" else ""}Backend Developer',
            'match_percentage': self.calculate_match_percentage(skills_analysis, ['programming', 'databases', 'api']),
            'salary_range': self.get_salary_range('backend', experience_level),
            'company_types': ['Tech Companies', 'Enterprise', 'Fintech'],
            'required_skills': ['Server-side programming', 'Database design', 'API development', 'System architecture'],
            'preferred_skills': backend_skills[:5],
            'job_description': 'Design and implement server-side logic, databases, and APIs for web applications.',
            'career_path': 'Backend → Senior Backend → Backend Architect → Principal Engineer'
        })
        
        return roles

    def generate_fullstack_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate fullstack developer role recommendations"""
        has_frontend = any('react' in skill.lower() or 'angular' in skill.lower() or 'vue' in skill.lower() 
                          for category in skills_analysis['technical_skills'].get('web_technologies', {}).values()
                          for skill in category)
        has_backend = bool(skills_analysis['programming_languages'] and skills_analysis['databases'])
        
        if not (has_frontend and has_backend):
            return []
        
        roles = []
        base_role = {
            'category': 'Full-Stack Development',
            'remote_friendly': True,
            'growth_potential': 'Very High',
            'market_demand': 'Very High'
        }
        
        roles.append({
            **base_role,
            'title': f'{"Senior " if experience_level == "senior" else ""}Full-Stack Developer',
            'match_percentage': self.calculate_match_percentage(skills_analysis, ['frontend', 'backend', 'databases']),
            'salary_range': self.get_salary_range('fullstack', experience_level),
            'company_types': ['Startups', 'Tech Companies', 'Agencies'],
            'required_skills': ['Frontend frameworks', 'Backend development', 'Database design', 'Version control'],
            'preferred_skills': (skills_analysis['programming_languages'] + 
                               list(skills_analysis['technical_skills'].get('web_technologies', {}).get('frameworks', [])))[:6],
            'job_description': 'Develop both client and server-side applications with end-to-end responsibility.',
            'career_path': 'Full-Stack → Senior Full-Stack → Tech Lead → Engineering Manager'
        })
        
        return roles

    def generate_mobile_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate mobile developer role recommendations"""
        mobile_skills = self.get_skills_by_category(skills_analysis, 'web_technologies')
        mobile_keywords = ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android']
        
        has_mobile = any(keyword in skill.lower() for skill in mobile_skills for keyword in mobile_keywords)
        
        if not has_mobile:
            return []
        
        roles = []
        base_role = {
            'category': 'Mobile Development',
            'remote_friendly': True,
            'growth_potential': 'High',
            'market_demand': 'High'
        }
        
        roles.append({
            **base_role,
            'title': f'{"Senior " if experience_level == "senior" else ""}Mobile Developer',
            'match_percentage': self.calculate_match_percentage(skills_analysis, ['mobile', 'programming']),
            'salary_range': self.get_salary_range('mobile', experience_level),
            'company_types': ['Mobile-first Companies', 'Agencies', 'Enterprise'],
            'required_skills': ['Mobile frameworks', 'Platform-specific development', 'UI/UX principles'],
            'preferred_skills': [skill for skill in mobile_skills if any(kw in skill.lower() for kw in mobile_keywords)][:4],
            'job_description': 'Develop mobile applications for iOS and/or Android platforms.',
            'career_path': 'Mobile → Senior Mobile → Mobile Architect → Engineering Manager'
        })
        
        return roles

    def generate_security_roles(self, skills_analysis: Dict, experience_level: str, primary_stack: str) -> List[Dict[str, Any]]:
        """Generate security engineer role recommendations"""
        security_skills = self.get_skills_by_category(skills_analysis, 'security')
        security_certs = [cert for cert in skills_analysis['certifications'] 
                         if any(sec_term in cert.lower() for sec_term in ['security', 'cissp', 'cism', 'cisa'])]
        
        if not (security_skills or security_certs):
            return []
        
        roles = []
        base_role = {
            'category': 'Cybersecurity',
            'remote_friendly': True,
            'growth_potential': 'Very High',
            'market_demand': 'Very High'
        }
        
        if experience_level in ['mid', 'senior']:
            roles.append({
                **base_role,
                'title': f'{"Senior " if experience_level == "senior" else ""}Security Engineer',
                'match_percentage': self.calculate_match_percentage(skills_analysis, ['security', 'networking']),
                'salary_range': self.get_salary_range('security', experience_level),
                'company_types': ['Enterprise', 'Financial Services', 'Government'],
                'required_skills': ['Security frameworks', 'Risk assessment', 'Incident response', 'Compliance'],
                'preferred_skills': security_skills + security_certs,
                'job_description': 'Protect organizational assets through security architecture and threat mitigation.',
                'career_path': 'Security → Senior Security → Security Architect → CISO'
            })
        
        return roles

    def get_salary_range(self, role_type: str, experience_level: str) -> str:
        """Get salary range based on role type and experience level"""
        salary_ranges = {
            'frontend': {
                'junior': '$55,000 - $80,000',
                'mid': '$80,000 - $115,000',
                'senior': '$115,000 - $160,000'
            },
            'backend': {
                'junior': '$60,000 - $85,000',
                'mid': '$85,000 - $125,000',
                'senior': '$125,000 - $170,000'
            },
            'fullstack': {
                'junior': '$65,000 - $90,000',
                'mid': '$90,000 - $130,000',
                'senior': '$130,000 - $180,000'
            },
            'mobile': {
                'junior': '$60,000 - $85,000',
                'mid': '$85,000 - $120,000',
                'senior': '$120,000 - $165,000'
            },
            'security': {
                'junior': '$65,000 - $90,000',
                'mid': '$90,000 - $130,000',
                'senior': '$130,000 - $180,000'
            }
        }
        
        return salary_ranges.get(role_type, {}).get(experience_level, '$60,000 - $120,000')

    def calculate_match_percentage(self, skills_analysis: Dict, required_skills: List[str]) -> int:
        """Calculate job match percentage based on skills"""
        all_user_skills = []
        
        # Collect all user skills
        for category in skills_analysis['technical_skills'].values():
            for subcategory in category.values():
                all_user_skills.extend([skill.lower() for skill in subcategory])
        
        all_user_skills.extend([skill.lower() for skill in skills_analysis['soft_skills']])
        all_user_skills.extend([skill.lower() for skill in skills_analysis['certifications']])
        
        # Calculate matches
        matches = 0
        for required_skill in required_skills:
            if any(required_skill.lower() in user_skill for user_skill in all_user_skills):
                matches += 1
        
        # Base percentage + bonus for matches
        base_percentage = 65
        match_bonus = (matches / len(required_skills)) * 30 if required_skills else 0
        
        return min(base_percentage + match_bonus, 95)

    def generate_improvement_suggestions(self, text: str, skills_analysis: Dict, experience_analysis: Dict) -> List[Dict[str, Any]]:
        """Generate comprehensive improvement suggestions"""
        suggestions = []
        
        # Analyze resume structure and content
        structure_analysis = self.analyze_resume_structure(text)
        
        # Skills gap analysis
        if len(skills_analysis['programming_languages']) < 2:
            suggestions.append({
                'category': 'Technical Skills',
                'priority': 'High',
                'suggestion': 'Learn additional programming languages to increase versatility. Consider Python for data science or JavaScript for web development.',
                'impact': 'Significantly increases job opportunities',
                'timeline': '3-6 months',
                'resources': ['Online courses', 'Coding bootcamps', 'Practice projects']
            })
        
        # Cloud skills recommendation
        if not self.get_skills_by_category(skills_analysis, 'cloud_platforms'):
            suggestions.append({
                'category': 'Technical Skills',
                'priority': 'High',
                'suggestion': 'Gain cloud computing experience with AWS, Azure, or Google Cloud. Cloud skills are in high demand.',
                'impact': 'Opens opportunities in modern tech companies',
                'timeline': '2-4 months',
                'resources': ['AWS Free Tier', 'Azure Learning Path', 'Google Cloud Training']
            })
        
        # Quantifiable achievements
        if not self.has_quantifiable_achievements(text):
            suggestions.append({
                'category': 'Content Quality',
                'priority': 'High',
                'suggestion': 'Add quantifiable achievements with specific metrics (e.g., "Improved performance by 40%", "Led team of 5 developers").',
                'impact': 'Makes resume more compelling to recruiters',
                'timeline': '1-2 weeks',
                'resources': ['Resume writing guides', 'Achievement frameworks']
            })
        
        # Leadership experience
        if experience_analysis['level'] in ['mid', 'senior'] and not experience_analysis['leadership_indicators']:
            suggestions.append({
                'category': 'Experience',
                'priority': 'Medium',
                'suggestion': 'Highlight leadership experience, mentoring, or project management roles to demonstrate growth.',
                'impact': 'Essential for senior-level positions',
                'timeline': 'Immediate (if experience exists)',
                'resources': ['Leadership frameworks', 'Mentoring programs']
            })
        
        # Portfolio and projects
        if not self.has_portfolio_links(text):
            suggestions.append({
                'category': 'Portfolio',
                'priority': 'Medium',
                'suggestion': 'Include links to GitHub profile, portfolio website, or notable projects to showcase your work.',
                'impact': 'Provides concrete evidence of skills',
                'timeline': '2-4 weeks',
                'resources': ['GitHub Pages', 'Portfolio templates', 'Project documentation']
            })
        
        # Certifications
        if not skills_analysis['certifications']:
            suggestions.append({
                'category': 'Credentials',
                'priority': 'Medium',
                'suggestion': 'Consider obtaining relevant certifications (AWS, Google Cloud, Microsoft, etc.) to validate your skills.',
                'impact': 'Increases credibility and market value',
                'timeline': '1-3 months per certification',
                'resources': ['Official certification programs', 'Practice exams', 'Study groups']
            })
        
        # ATS optimization
        suggestions.append({
            'category': 'Format',
            'priority': 'Low',
            'suggestion': 'Optimize resume for ATS (Applicant Tracking Systems) by using standard section headers and relevant keywords.',
            'impact': 'Improves chances of passing initial screening',
            'timeline': '1-2 days',
            'resources': ['ATS optimization guides', 'Keyword research tools']
        })
        
        # Soft skills
        if len(skills_analysis['soft_skills']) < 3:
            suggestions.append({
                'category': 'Soft Skills',
                'priority': 'Low',
                'suggestion': 'Highlight soft skills like communication, teamwork, and problem-solving with specific examples.',
                'impact': 'Demonstrates well-rounded professional profile',
                'timeline': 'Immediate',
                'resources': ['Soft skills assessment', 'Professional development courses']
            })
        
        return suggestions[:6]  # Return top 6 suggestions

    def analyze_resume_structure(self, text: str) -> Dict[str, Any]:
        """Analyze the structure and organization of the resume"""
        structure = {
            'has_contact_info': False,
            'has_summary': False,
            'has_experience': False,
            'has_education': False,
            'has_skills_section': False,
            'section_count': 0,
            'estimated_length': 'unknown'
        }
        
        text_lower = text.lower()
        
        # Check for standard resume sections
        if re.search(r'(email|phone|linkedin|github)', text_lower):
            structure['has_contact_info'] = True
            structure['section_count'] += 1
        
        if re.search(r'(summary|objective|profile|about)', text_lower):
            structure['has_summary'] = True
            structure['section_count'] += 1
        
        if re.search(r'(experience|employment|work history)', text_lower):
            structure['has_experience'] = True
            structure['section_count'] += 1
        
        if re.search(r'(education|degree|university|college)', text_lower):
            structure['has_education'] = True
            structure['section_count'] += 1
        
        if re.search(r'(skills|technologies|competencies)', text_lower):
            structure['has_skills_section'] = True
            structure['section_count'] += 1
        
        # Estimate resume length
        word_count = len(text.split())
        if word_count < 200:
            structure['estimated_length'] = 'too_short'
        elif word_count < 600:
            structure['estimated_length'] = 'appropriate'
        else:
            structure['estimated_length'] = 'too_long'
        
        return structure

    def has_quantifiable_achievements(self, text: str) -> bool:
        """Check if resume contains quantifiable achievements"""
        achievement_patterns = [
            r'\d+%',  # Percentages
            r'increased.*?\d+',
            r'improved.*?\d+',
            r'reduced.*?\d+',
            r'saved.*?\$\d+',
            r'generated.*?\$\d+',
            r'managed.*?\$\d+',
            r'led.*?team.*?\d+',
            r'supervised.*?\d+'
        ]
        
        for pattern in achievement_patterns:
            if re.search(pattern, text.lower()):
                return True
        
        return False

    def has_portfolio_links(self, text: str) -> bool:
        """Check if resume contains portfolio or project links"""
        link_patterns = [
            r'github\.com',
            r'gitlab\.com',
            r'portfolio',
            r'project.*?link',
            r'demo.*?link',
            r'live.*?site'
        ]
        
        for pattern in link_patterns:
            if re.search(pattern, text.lower()):
                return True
        
        return False

    def generate_interview_questions(self, skills_analysis: Dict, experience_analysis: Dict) -> List[Dict[str, Any]]:
        """Generate comprehensive interview questions based on profile"""
        questions = []
        experience_level = experience_analysis['level']
        
        # Technical questions based on skills
        primary_skills = skills_analysis['programming_languages'][:2]
        for skill in primary_skills:
            questions.append({
                'question': f"Explain your experience with {skill} and describe a challenging project where you used it effectively.",
                'category': 'Technical',
                'difficulty': 'Medium',
                'skill_focus': skill,
                'follow_up': f"What are some best practices you follow when working with {skill}?"
            })
        
        # System design questions (for mid/senior levels)
        if experience_level in ['mid', 'senior']:
            questions.extend([
                {
                    'question': 'Design a scalable system for a social media platform that handles millions of users.',
                    'category': 'System Design',
                    'difficulty': 'Hard',
                    'skill_focus': 'Architecture',
                    'follow_up': 'How would you handle data consistency and caching?'
                },
                {
                    'question': 'How would you approach optimizing a slow-performing database query?',
                    'category': 'Technical',
                    'difficulty': 'Medium',
                    'skill_focus': 'Database Optimization',
                    'follow_up': 'What tools would you use to identify performance bottlenecks?'
                }
            ])
        
        # Behavioral questions
        questions.extend([
            {
                'question': 'Tell me about a time when you had to learn a new technology quickly for a project.',
                'category': 'Behavioral',
                'difficulty': 'Medium',
                'skill_focus': 'Adaptability',
                'follow_up': 'How do you typically approach learning new technologies?'
            },
            {
                'question': 'Describe a challenging bug you encountered and how you debugged it.',
                'category': 'Behavioral',
                'difficulty': 'Medium',
                'skill_focus': 'Problem Solving',
                'follow_up': 'What debugging strategies do you find most effective?'
            },
            {
                'question': 'How do you handle disagreements with team members about technical decisions?',
                'category': 'Behavioral',
                'difficulty': 'Medium',
                'skill_focus': 'Communication',
                'follow_up': 'Can you give an example of when you changed your mind based on feedback?'
            }
        ])
        
        # Leadership questions (for senior levels)
        if experience_level == 'senior':
            questions.extend([
                {
                    'question': 'How do you mentor junior developers and help them grow?',
                    'category': 'Leadership',
                    'difficulty': 'Medium',
                    'skill_focus': 'Mentoring',
                    'follow_up': 'What\'s the most rewarding mentoring experience you\'ve had?'
                },
                {
                    'question': 'Describe how you would handle a situation where your team is behind schedule on a critical project.',
                    'category': 'Leadership',
                    'difficulty': 'Hard',
                    'skill_focus': 'Project Management',
                    'follow_up': 'How do you balance quality with delivery  'Project Management',
                    'follow_up': 'How do you balance quality with delivery deadlines?'
                }
            ])
        
        # Situational questions
        questions.extend([
            {
                'question': 'How would you approach debugging a production issue that\'s affecting users?',
                'category': 'Situational',
                'difficulty': 'Medium',
                'skill_focus': 'Incident Response',
                'follow_up': 'What steps would you take to prevent similar issues in the future?'
            },
            {
                'question': 'If you had to choose between delivering a feature on time with technical debt or delaying for a cleaner implementation, what would you do?',
                'category': 'Situational',
                'difficulty': 'Hard',
                'skill_focus': 'Decision Making',
                'follow_up': 'How do you communicate technical trade-offs to non-technical stakeholders?'
            }
        ])
        
        # Industry-specific questions based on skills
        if self.get_skills_by_category(skills_analysis, 'data_science'):
            questions.append({
                'question': 'Explain the difference between supervised and unsupervised learning with examples.',
                'category': 'Technical',
                'difficulty': 'Medium',
                'skill_focus': 'Machine Learning',
                'follow_up': 'When would you choose one approach over the other?'
            })
        
        if self.get_skills_by_category(skills_analysis, 'cloud_platforms'):
            questions.append({
                'question': 'How would you design a cloud architecture for high availability and disaster recovery?',
                'category': 'Technical',
                'difficulty': 'Hard',
                'skill_focus': 'Cloud Architecture',
                'follow_up': 'What are the cost implications of your design choices?'
            })
        
        return questions[:10]  # Return top 10 questions

    def calculate_overall_score(self, skills_analysis: Dict, experience_analysis: Dict, text: str, extraction_metadata: Dict) -> Dict[str, Any]:
        """Calculate comprehensive resume score with detailed breakdown"""
        score_breakdown = {
            'technical_skills': 0,
            'experience_quality': 0,
            'content_structure': 0,
            'achievements': 0,
            'completeness': 0,
            'extraction_quality': 0,
            'total_score': 0,
            'grade': 'F',
            'strengths': [],
            'areas_for_improvement': []
        }
        
        # Technical Skills Score (30 points)
        total_technical_skills = sum(len(category) for category_dict in skills_analysis['technical_skills'].values() 
                                   for category in category_dict.values())
        
        if total_technical_skills >= 15:
            score_breakdown['technical_skills'] = 30
            score_breakdown['strengths'].append('Excellent technical skill diversity')
        elif total_technical_skills >= 10:
            score_breakdown['technical_skills'] = 25
            score_breakdown['strengths'].append('Good technical skill range')
        elif total_technical_skills >= 5:
            score_breakdown['technical_skills'] = 20
        else:
            score_breakdown['technical_skills'] = 10
            score_breakdown['areas_for_improvement'].append('Limited technical skills listed')
        
        # Experience Quality Score (25 points)
        experience_score = 15  # Base score
        
        if experience_analysis['level'] == 'senior':
            experience_score += 10
        elif experience_analysis['level'] == 'mid':
            experience_score += 5
        
        if experience_analysis['leadership_indicators']:
            experience_score += 5
            score_breakdown['strengths'].append('Leadership experience demonstrated')
        
        if experience_analysis['confidence'] > 80:
            experience_score += 5
        
        score_breakdown['experience_quality'] = min(experience_score, 25)
        
        # Content Structure Score (20 points)
        structure = self.analyze_resume_structure(text)
        structure_score = structure['section_count'] * 3
        
        if structure['estimated_length'] == 'appropriate':
            structure_score += 5
        elif structure['estimated_length'] == 'too_long':
            score_breakdown['areas_for_improvement'].append('Resume may be too lengthy')
        elif structure['estimated_length'] == 'too_short':
            score_breakdown['areas_for_improvement'].append('Resume lacks sufficient detail')
        
        score_breakdown['content_structure'] = min(structure_score, 20)
        
        # Achievements Score (15 points)
        if self.has_quantifiable_achievements(text):
            score_breakdown['achievements'] = 15
            score_breakdown['strengths'].append('Quantifiable achievements included')
        else:
            score_breakdown['achievements'] = 5
            score_breakdown['areas_for_improvement'].append('Add quantifiable achievements')
        
        # Completeness Score (10 points)
        completeness_score = 0
        
        if skills_analysis['certifications']:
            completeness_score += 3
            score_breakdown['strengths'].append('Professional certifications listed')
        
        if self.has_portfolio_links(text):
            completeness_score += 4
            score_breakdown['strengths'].append('Portfolio/project links included')
        
        if len(skills_analysis['soft_skills']) >= 3:
            completeness_score += 3
        else:
            score_breakdown['areas_for_improvement'].append('Include more soft skills')
        
        score_breakdown['completeness'] = completeness_score
        
        # Extraction Quality Bonus/Penalty (5 points)
        if extraction_metadata['extraction_quality'] == 'excellent':
            score_breakdown['extraction_quality'] = 5
        elif extraction_metadata['extraction_quality'] == 'good':
            score_breakdown['extraction_quality'] = 3
        elif extraction_metadata['extraction_quality'] == 'basic':
            score_breakdown['extraction_quality'] = 1
        else:
            score_breakdown['extraction_quality'] = 0
            score_breakdown['areas_for_improvement'].append('PDF format may need optimization')
        
        # Calculate total score
        total = (score_breakdown['technical_skills'] + 
                score_breakdown['experience_quality'] + 
                score_breakdown['content_structure'] + 
                score_breakdown['achievements'] + 
                score_breakdown['completeness'])
        
        score_breakdown['total_score'] = min(total, 100)
        
        # Assign grade
        if score_breakdown['total_score'] >= 90:
            score_breakdown['grade'] = 'A+'
        elif score_breakdown['total_score'] >= 85:
            score_breakdown['grade'] = 'A'
        elif score_breakdown['total_score'] >= 80:
            score_breakdown['grade'] = 'A-'
        elif score_breakdown['total_score'] >= 75:
            score_breakdown['grade'] = 'B+'
        elif score_breakdown['total_score'] >= 70:
            score_breakdown['grade'] = 'B'
        elif score_breakdown['total_score'] >= 65:
            score_breakdown['grade'] = 'B-'
        elif score_breakdown['total_score'] >= 60:
            score_breakdown['grade'] = 'C+'
        elif score_breakdown['total_score'] >= 55:
            score_breakdown['grade'] = 'C'
        else:
            score_breakdown['grade'] = 'C-'
        
        return score_breakdown

    def analyze_resume(self, pdf_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """Main comprehensive analysis function"""
        analysis_start_time = datetime.now()
        
        try:
            logger.info(f"Starting comprehensive analysis of {filename}")
            
            # Extract text from PDF
            extracted_text, extraction_metadata = self.extract_text_from_pdf(pdf_bytes)
            
            if len(extracted_text.strip()) < 50:
                raise ValueError("Could not extract meaningful text from PDF")
            
            logger.info(f"Text extraction completed: {len(extracted_text)} characters using {extraction_metadata['successful_method']}")
            
            # Preprocess text
            preprocessing_result = self.preprocess_text(extracted_text)
            cleaned_text = preprocessing_result['cleaned_text']
            preprocessing_info = preprocessing_result['preprocessing_info']
            
            logger.info(f"Text preprocessing completed: {preprocessing_info['cleaned_length']} characters after cleaning")
            
            # Extract comprehensive skills
            skills_analysis = self.extract_comprehensive_skills(cleaned_text)
            total_skills = sum(len(category) for category_dict in skills_analysis['technical_skills'].values() 
                             for category in category_dict.values())
            logger.info(f"Skills extraction completed: {total_skills} technical skills found")
            
            # Determine experience level
            experience_analysis = self.determine_experience_level(cleaned_text, skills_analysis)
            logger.info(f"Experience analysis completed: {experience_analysis['level']} level with {experience_analysis['confidence']}% confidence")
            
            # Generate job recommendations
            job_recommendations = self.generate_detailed_job_recommendations(skills_analysis, experience_analysis)
            logger.info(f"Generated {len(job_recommendations)} job recommendations")
            
            # Generate improvement suggestions
            improvement_suggestions = self.generate_improvement_suggestions(cleaned_text, skills_analysis, experience_analysis)
            logger.info(f"Generated {len(improvement_suggestions)} improvement suggestions")
            
            # Generate interview questions
            interview_questions = self.generate_interview_questions(skills_analysis, experience_analysis)
            logger.info(f"Generated {len(interview_questions)} interview questions")
            
            # Calculate comprehensive score
            score_analysis = self.calculate_overall_score(skills_analysis, experience_analysis, cleaned_text, extraction_metadata)
            logger.info(f"Score calculation completed: {score_analysis['total_score']}/100 (Grade: {score_analysis['grade']})")
            
            # Calculate analysis time
            analysis_time = (datetime.now() - analysis_start_time).total_seconds()
            
            # Compile comprehensive result
            result = {
                'analysis_metadata': {
                    'filename': filename,
                    'analysis_time_seconds': analysis_time,
                    'analysis_timestamp': analysis_start_time.isoformat(),
                    'analyzer_version': '2.0.0',
                    'extraction_method': extraction_metadata['successful_method'],
                    'extraction_quality': extraction_metadata['extraction_quality']
                },
                'extraction_details': {
                    'original_text_length': len(extracted_text),
                    'cleaned_text_length': len(cleaned_text),
                    'page_count': extraction_metadata.get('page_count', 0),
                    'methods_tried': extraction_metadata['methods_tried'],
                    'extraction_errors': extraction_metadata.get('errors', [])
                },
                'preprocessing_info': preprocessing_info,
                'skills_analysis': {
                    'technical_skills': skills_analysis['technical_skills'],
                    'soft_skills': skills_analysis['soft_skills'],
                    'certifications': skills_analysis['certifications'],
                    'programming_languages': skills_analysis['programming_languages'],
                    'frameworks_and_libraries': skills_analysis['frameworks_and_libraries'],
                    'databases': skills_analysis['databases'],
                    'cloud_platforms': skills_analysis['cloud_platforms'],
                    'tools_and_technologies': skills_analysis['tools_and_technologies'],
                    'skill_confidence_scores': skills_analysis['skill_confidence_scores'],
                    'years_of_experience': skills_analysis['years_of_experience'],
                    'total_technical_skills': sum(len(category) for category_dict in skills_analysis['technical_skills'].values() 
                                                for category in category_dict.values())
                },
                'experience_analysis': experience_analysis,
                'score_analysis': score_analysis,
                'job_recommendations': job_recommendations,
                'improvement_suggestions': improvement_suggestions,
                'interview_questions': interview_questions,
                'extracted_data': {
                    'full_text': extracted_text,
                    'cleaned_text': cleaned_text,
                    'text_length': len(extracted_text),
                    'filename': filename
                },
                'analysis_method': 'python_advanced_comprehensive'
            }
            
            logger.info(f"Comprehensive analysis completed successfully in {analysis_time:.2f} seconds")
            return result
            
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise e

# Test and demonstration
if __name__ == "__main__":
    analyzer = AdvancedResumeAnalyzer()
    
    # Test with comprehensive sample text
    sample_text = """
    John Doe
    Senior Software Engineer
    Email: john.doe@email.com | Phone: (555) 123-4567
    LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe
    
    PROFESSIONAL SUMMARY
    Experienced Senior Software Engineer with 8+ years of expertise in full-stack development,
    cloud architecture, and team leadership. Proven track record of delivering scalable solutions
    and mentoring junior developers.
    
    TECHNICAL SKILLS
    Programming Languages: JavaScript, Python, Java, TypeScript, Go
    Frontend: React, Angular, Vue.js, HTML5, CSS3, SASS
    Backend: Node.js, Express, Django, Spring Boot, FastAPI
    Databases: PostgreSQL, MongoDB, Redis, MySQL
    Cloud Platforms: AWS (EC2, S3, Lambda, RDS), Azure, Google Cloud Platform
    DevOps: Docker, Kubernetes, Jenkins, Terraform, Ansible
    Tools: Git, JIRA, Confluence, VS Code, IntelliJ
    
    PROFESSIONAL EXPERIENCE
    
    Senior Software Engineer | Tech Innovations Inc. | 2020 - Present
    • Led a team of 5 developers in building microservices architecture
    • Improved application performance by 45% through code optimization
    • Implemented CI/CD pipelines reducing deployment time by 60%
    • Mentored 3 junior developers, with 2 receiving promotions
    • Designed and developed RESTful APIs serving 1M+ requests daily
    
    Software Engineer | Digital Solutions Corp | 2018 - 2020
    • Developed full-stack web applications using React and Node.js
    • Increased user engagement by 30% through UI/UX improvements
    • Collaborated with cross-functional teams of 10+ members
    • Implemented automated testing reducing bugs by 40%
    
    Junior Software Developer | StartupXYZ | 2016 - 2018
    • Built responsive web applications using JavaScript and Python
    • Participated in agile development processes
    • Contributed to open-source projects on GitHub
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of Technology | 2012 - 2016
    
    CERTIFICATIONS
    • AWS Certified Solutions Architect
    • Google Cloud Professional Developer
    • Certified Scrum Master
    
    PROJECTS
    • E-commerce Platform: Built scalable platform handling 100K+ users
    • Real-time Chat Application: Developed using WebSocket and Redis
    • Machine Learning Pipeline: Created data processing pipeline using Python
    """
    
    # Simulate PDF bytes
    pdf_bytes = sample_text.encode('utf-8')
    
    try:
        result = analyzer.analyze_resume(pdf_bytes, "john_doe_resume.pdf")
        
        print("\n" + "="*80)
        print("COMPREHENSIVE RESUME ANALYSIS RESULTS")
        print("="*80)
        
        # Analysis metadata
        print(f"\nAnalysis completed in {result['analysis_metadata']['analysis_time_seconds']:.2f} seconds")
        print(f"Extraction method: {result['analysis_metadata']['extraction_method']}")
        print(f"Extraction quality: {result['analysis_metadata']['extraction_quality']}")
        
        # Score breakdown
        score = result['score_analysis']
        print(f"\nOVERALL SCORE: {score['total_score']}/100 (Grade: {score['grade']})")
        print(f"Technical Skills: {score['technical_skills']}/30")
        print(f"Experience Quality: {score['experience_quality']}/25")
        print(f"Content Structure: {score['content_structure']}/20")
        print(f"Achievements: {score['achievements']}/15")
        print(f"Completeness: {score['completeness']}/10")
        
        # Skills summary
        skills = result['skills_analysis']
        print(f"\nSKILLS SUMMARY:")
        print(f"Programming Languages: {', '.join(skills['programming_languages'][:5])}")
        print(f"Cloud Platforms: {', '.join(skills['cloud_platforms'][:3])}")
        print(f"Total Technical Skills: {skills['total_technical_skills']}")
        print(f"Certifications: {len(skills['certifications'])}")
        
        # Experience analysis
        exp = result['experience_analysis']
        print(f"\nEXPERIENCE ANALYSIS:")
        print(f"Level: {exp['level'].title()} ({exp['confidence']}% confidence)")
        print(f"Years found: {exp['years_found']}")
        print(f"Leadership indicators: {len(exp['leadership_indicators'])}")
        
        # Top job recommendations
        print(f"\nTOP JOB RECOMMENDATIONS:")
        for i, job in enumerate(result['job_recommendations'][:3], 1):
            print(f"{i}. {job['title']} - {job['match_percentage']}% match")
            print(f"   Salary: {job['salary_range']}")
            print(f"   Category: {job['category']}")
        
        # Top improvement suggestions
        print(f"\nIMPROVEMENT SUGGESTIONS:")
        for i, suggestion in enumerate(result['improvement_suggestions'][:3], 1):
            print(f"{i}. [{suggestion['priority']}] {suggestion['suggestion']}")
        
        print("\n" + "="*80)
        
    except Exception as e:
        print(f"Test failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
