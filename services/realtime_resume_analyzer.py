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
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# PDF processing libraries
try:
    import PyPDF2
    import pdfplumber
    import fitz  # PyMuPDF
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
except ImportError:
    logger.info("Installing NLTK...")
    os.system("pip install nltk")
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer

# Download required NLTK data
required_nltk_data = ['punkt', 'stopwords', 'wordnet']
for data in required_nltk_data:
    try:
        nltk.data.find(f'tokenizers/{data}')
    except LookupError:
        try:
            nltk.download(data, quiet=True)
        except Exception as e:
            logger.warning(f"Could not download {data}: {e}")

class RealtimeResumeAnalyzer:
    def __init__(self):
        self.openai_api_key = os.getenv('NEXT_PUBLIC_OPENAI_API_KEY')
        
        # Initialize NLP components
        try:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
        except Exception as e:
            logger.warning(f"NLTK initialization failed: {e}")
            self.lemmatizer = None
            self.stop_words = set()
        
        # Real-time skill patterns for instant detection
        self.skill_patterns = {
            'programming_languages': {
                'python': [r'\bpython\b', r'\bpy\b', r'\bdjango\b', r'\bflask\b', r'\bfastapi\b'],
                'javascript': [r'\bjavascript\b', r'\bjs\b', r'\bnode\.?js\b', r'\breact\b', r'\bvue\b', r'\bangular\b'],
                'java': [r'\bjava\b', r'\bspring\b', r'\bhibernate\b'],
                'typescript': [r'\btypescript\b', r'\bts\b'],
                'c++': [r'\bc\+\+\b', r'\bcpp\b'],
                'c#': [r'\bc#\b', r'\bcsharp\b', r'\b\.net\b'],
                'php': [r'\bphp\b', r'\blaravel\b', r'\bsymfony\b'],
                'go': [r'\bgolang\b', r'\bgo\s+lang\b'],
                'rust': [r'\brust\b'],
                'swift': [r'\bswift\b'],
                'kotlin': [r'\bkotlin\b'],
                'sql': [r'\bsql\b', r'\bmysql\b', r'\bpostgresql\b', r'\bsqlite\b']
            },
            'frameworks': {
                'react': [r'\breact\b', r'\breactjs\b', r'\breact\.js\b'],
                'angular': [r'\bangular\b', r'\bangularjs\b'],
                'vue': [r'\bvue\b', r'\bvuejs\b', r'\bvue\.js\b'],
                'express': [r'\bexpress\b', r'\bexpress\.js\b'],
                'django': [r'\bdjango\b'],
                'flask': [r'\bflask\b'],
                'spring': [r'\bspring\b', r'\bspring\s+boot\b'],
                'laravel': [r'\blaravel\b'],
                'rails': [r'\brails\b', r'\bruby\s+on\s+rails\b']
            },
            'databases': {
                'mysql': [r'\bmysql\b'],
                'postgresql': [r'\bpostgresql\b', r'\bpostgres\b'],
                'mongodb': [r'\bmongodb\b', r'\bmongo\b'],
                'redis': [r'\bredis\b'],
                'elasticsearch': [r'\belasticsearch\b', r'\belastic\b'],
                'oracle': [r'\boracle\b'],
                'sqlite': [r'\bsqlite\b']
            },
            'cloud_platforms': {
                'aws': [r'\baws\b', r'\bamazon\s+web\s+services\b', r'\bec2\b', r'\bs3\b', r'\blambda\b'],
                'azure': [r'\bazure\b', r'\bmicrosoft\s+azure\b'],
                'gcp': [r'\bgcp\b', r'\bgoogle\s+cloud\b', r'\bapp\s+engine\b'],
                'heroku': [r'\bheroku\b'],
                'vercel': [r'\bvercel\b'],
                'netlify': [r'\bnetlify\b']
            },
            'devops': {
                'docker': [r'\bdocker\b'],
                'kubernetes': [r'\bkubernetes\b', r'\bk8s\b'],
                'jenkins': [r'\bjenkins\b'],
                'git': [r'\bgit\b', r'\bgithub\b', r'\bgitlab\b'],
                'terraform': [r'\bterraform\b'],
                'ansible': [r'\bansible\b'],
                'ci/cd': [r'\bci/cd\b', r'\bcontinuous\s+integration\b', r'\bcontinuous\s+deployment\b']
            },
            'tools': {
                'vscode': [r'\bvscode\b', r'\bvisual\s+studio\s+code\b'],
                'intellij': [r'\bintellij\b'],
                'jira': [r'\bjira\b'],
                'confluence': [r'\bconfluence\b'],
                'slack': [r'\bslack\b'],
                'figma': [r'\bfigma\b'],
                'photoshop': [r'\bphotoshop\b'],
                'sketch': [r'\bsketch\b']
            }
        }
        
        # Experience level indicators
        self.experience_indicators = {
            'senior': [
                r'\bsenior\b', r'\blead\b', r'\bprincipal\b', r'\barchitect\b', 
                r'\bmanager\b', r'\bdirector\b', r'\bhead\s+of\b', r'\bcto\b',
                r'\bteam\s+lead\b', r'\btechnical\s+lead\b', r'\bstaff\s+engineer\b'
            ],
            'mid': [
                r'\bmid-level\b', r'\bintermediate\b', r'\bsoftware\s+engineer\s+ii\b',
                r'\bassociate\b', r'\bspecialist\b'
            ],
            'years': [
                r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
                r'(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)',
                r'over\s*(\d+)\s*years?',
                r'more\s*than\s*(\d+)\s*years?'
            ]
        }
        
        # Job role patterns
        self.job_role_patterns = {
            'software_engineer': [r'\bsoftware\s+engineer\b', r'\bsoftware\s+developer\b', r'\bdeveloper\b'],
            'frontend_developer': [r'\bfrontend\b', r'\bfront-end\b', r'\bfront\s+end\b', r'\bui\s+developer\b'],
            'backend_developer': [r'\bbackend\b', r'\bback-end\b', r'\bback\s+end\b', r'\bserver\s+side\b'],
            'fullstack_developer': [r'\bfullstack\b', r'\bfull-stack\b', r'\bfull\s+stack\b'],
            'data_scientist': [r'\bdata\s+scientist\b', r'\bdata\s+analyst\b', r'\bmachine\s+learning\b'],
            'devops_engineer': [r'\bdevops\b', r'\bsite\s+reliability\b', r'\binfrastructure\b'],
            'mobile_developer': [r'\bmobile\s+developer\b', r'\bios\s+developer\b', r'\bandroid\s+developer\b'],
            'product_manager': [r'\bproduct\s+manager\b', r'\bpm\b', r'\bproduct\s+owner\b']
        }

    def extract_text_realtime(self, pdf_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """Fast text extraction optimized for real-time analysis"""
        extraction_info = {
            'method': 'unknown',
            'success': False,
            'extraction_time': 0,
            'text_length': 0,
            'page_count': 0
        }
        
        start_time = time.time()
        
        # Try PyMuPDF first (fastest and most reliable)
        try:
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
            extraction_info['page_count'] = pdf_document.page_count
            
            text = ""
            for page_num in range(pdf_document.page_count):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                if page_text.strip():
                    text += page_text + "\n"
            
            pdf_document.close()
            
            if len(text.strip()) > 100:
                extraction_info['method'] = 'pymupdf'
                extraction_info['success'] = True
                extraction_info['text_length'] = len(text)
                extraction_info['extraction_time'] = time.time() - start_time
                return text, extraction_info
                
        except Exception as e:
            logger.warning(f"PyMuPDF failed: {e}")
        
        # Fallback to pdfplumber
        try:
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                extraction_info['page_count'] = len(pdf.pages)
                text = ""
                
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                if len(text.strip()) > 100:
                    extraction_info['method'] = 'pdfplumber'
                    extraction_info['success'] = True
                    extraction_info['text_length'] = len(text)
                    extraction_info['extraction_time'] = time.time() - start_time
                    return text, extraction_info
                    
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}")
        
        # Final fallback to PyPDF2
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
            extraction_info['page_count'] = len(pdf_reader.pages)
            text = ""
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            extraction_info['method'] = 'pypdf2'
            extraction_info['success'] = True
            extraction_info['text_length'] = len(text)
            extraction_info['extraction_time'] = time.time() - start_time
            return text, extraction_info
            
        except Exception as e:
            logger.error(f"All extraction methods failed: {e}")
        
        extraction_info['extraction_time'] = time.time() - start_time
        return "", extraction_info

    def clean_text_fast(self, text: str) -> str:
        """Fast text cleaning for real-time processing"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep important ones
        text = re.sub(r'[^\w\s\.\,\-\@$$$$\[\]\{\}\/\\\:\;\!\?\$\%\&\*\+\=\<\>\|\~\`\'\"]', ' ', text)
        
        # Remove page markers
        text = re.sub(r'page\s+\d+', '', text, flags=re.IGNORECASE)
        
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def extract_skills_realtime(self, text: str) -> Dict[str, Any]:
        """Real-time skill extraction with instant feedback"""
        skills_found = {
            'programming_languages': [],
            'frameworks': [],
            'databases': [],
            'cloud_platforms': [],
            'devops': [],
            'tools': [],
            'total_count': 0,
            'confidence_scores': {},
            'skill_contexts': {}
        }
        
        text_lower = text.lower()
        
        # Extract skills by category
        for category, skills in self.skill_patterns.items():
            category_skills = []
            
            for skill_name, patterns in skills.items():
                skill_found = False
                total_matches = 0
                contexts = []
                
                for pattern in patterns:
                    matches = list(re.finditer(pattern, text_lower, re.IGNORECASE))
                    if matches:
                        skill_found = True
                        total_matches += len(matches)
                        
                        # Extract context for first few matches
                        for match in matches[:2]:
                            start = max(0, match.start() - 30)
                            end = min(len(text), match.end() + 30)
                            context = text[start:end].strip()
                            contexts.append(context)
                
                if skill_found:
                    formatted_skill = self.format_skill_name(skill_name)
                    category_skills.append(formatted_skill)
                    
                    # Calculate confidence based on frequency
                    confidence = min(total_matches * 15 + 60, 95)
                    skills_found['confidence_scores'][formatted_skill] = confidence
                    skills_found['skill_contexts'][formatted_skill] = contexts
            
            skills_found[category] = category_skills
        
        # Calculate total count
        skills_found['total_count'] = sum(len(skills) for key, skills in skills_found.items() 
                                        if isinstance(skills, list))
        
        return skills_found

    def format_skill_name(self, skill: str) -> str:
        """Format skill names properly"""
        special_cases = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'nodejs': 'Node.js',
            'reactjs': 'React.js',
            'vuejs': 'Vue.js',
            'mysql': 'MySQL',
            'postgresql': 'PostgreSQL',
            'mongodb': 'MongoDB',
            'aws': 'AWS',
            'gcp': 'Google Cloud Platform',
            'html': 'HTML',
            'css': 'CSS',
            'sql': 'SQL',
            'ci/cd': 'CI/CD'
        }
        
        return special_cases.get(skill.lower(), skill.title())

    def analyze_experience_realtime(self, text: str, skills_count: int) -> Dict[str, Any]:
        """Real-time experience level analysis"""
        experience_analysis = {
            'level': 'junior',
            'confidence': 50,
            'years_found': [],
            'indicators': [],
            'leadership_score': 0,
            'technical_depth': skills_count
        }
        
        text_lower = text.lower()
        
        # Extract years of experience
        for pattern in self.experience_indicators['years']:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                try:
                    years = int(match)
                    if 0 < years <= 50:  # Reasonable range
                        experience_analysis['years_found'].append(years)
                except ValueError:
                    continue
        
        # Check for senior indicators
        senior_count = 0
        for pattern in self.experience_indicators['senior']:
            if re.search(pattern, text_lower):
                senior_count += 1
                experience_analysis['indicators'].append(f"Senior keyword: {pattern}")
        
        # Check for mid-level indicators
        mid_count = 0
        for pattern in self.experience_indicators['mid']:
            if re.search(pattern, text_lower):
                mid_count += 1
                experience_analysis['indicators'].append(f"Mid-level keyword: {pattern}")
        
        # Leadership indicators
        leadership_patterns = [
            r'led\s+(?:a\s+)?team',
            r'managed\s+\d+',
            r'mentored',
            r'supervised',
            r'coordinated'
        ]
        
        for pattern in leadership_patterns:
            if re.search(pattern, text_lower):
                experience_analysis['leadership_score'] += 1
        
        # Determine level
        max_years = max(experience_analysis['years_found']) if experience_analysis['years_found'] else 0
        
        if max_years >= 8 or senior_count >= 2:
            experience_analysis['level'] = 'senior'
            experience_analysis['confidence'] = 85
        elif max_years >= 3 or mid_count >= 1 or skills_count >= 10:
            experience_analysis['level'] = 'mid'
            experience_analysis['confidence'] = 75
        else:
            experience_analysis['level'] = 'junior'
            experience_analysis['confidence'] = 65
        
        # Adjust confidence based on indicators
        if experience_analysis['leadership_score'] > 0:
            experience_analysis['confidence'] += 10
        
        if skills_count > 15:
            experience_analysis['confidence'] += 5
        
        experience_analysis['confidence'] = min(experience_analysis['confidence'], 95)
        
        return experience_analysis

    def generate_job_matches_realtime(self, skills: Dict, experience: Dict) -> List[Dict[str, Any]]:
        """Generate real-time job matches"""
        matches = []
        
        # Determine primary role based on skills
        role_scores = {}
        
        # Software Engineer
        if skills['programming_languages']:
            role_scores['software_engineer'] = len(skills['programming_languages']) * 10
        
        # Frontend Developer
        frontend_skills = ['react', 'angular', 'vue', 'javascript', 'typescript']
        frontend_count = sum(1 for skill in skills['frameworks'] + skills['programming_languages'] 
                           if any(fs in skill.lower() for fs in frontend_skills))
        if frontend_count > 0:
            role_scores['frontend_developer'] = frontend_count * 15
        
        # Backend Developer
        backend_skills = ['python', 'java', 'node.js', 'express', 'django', 'spring']
        backend_count = sum(1 for skill in skills['frameworks'] + skills['programming_languages'] 
                          if any(bs in skill.lower() for bs in backend_skills))
        if backend_count > 0:
            role_scores['backend_developer'] = backend_count * 15
        
        # Full-stack Developer
        if frontend_count > 0 and backend_count > 0:
            role_scores['fullstack_developer'] = (frontend_count + backend_count) * 12
        
        # DevOps Engineer
        if skills['devops'] or skills['cloud_platforms']:
            role_scores['devops_engineer'] = (len(skills['devops']) + len(skills['cloud_platforms'])) * 20
        
        # Data Scientist
        data_skills = ['python', 'r', 'sql']
        data_count = sum(1 for skill in skills['programming_languages'] 
                        if any(ds in skill.lower() for ds in data_skills))
        if data_count > 0:
            role_scores['data_scientist'] = data_count * 18
        
        # Generate matches for top roles
        experience_level = experience['level']
        
        for role, score in sorted(role_scores.items(), key=lambda x: x[1], reverse=True)[:5]:
            match_percentage = min(score + 40, 95)
            
            salary_ranges = {
                'junior': {'min': 60000, 'max': 90000},
                'mid': {'min': 90000, 'max': 130000},
                'senior': {'min': 130000, 'max': 180000}
            }
            
            salary = salary_ranges[experience_level]
            
            matches.append({
                'title': self.format_job_title(role, experience_level),
                'match_percentage': match_percentage,
                'salary_range': f"${salary['min']:,} - ${salary['max']:,}",
                'category': role.replace('_', ' ').title(),
                'remote_friendly': True,
                'market_demand': 'High' if match_percentage > 80 else 'Medium',
                'required_skills': self.get_role_required_skills(role),
                'growth_potential': 'High'
            })
        
        return matches

    def format_job_title(self, role: str, experience_level: str) -> str:
        """Format job titles based on role and experience"""
        titles = {
            'software_engineer': {
                'junior': 'Junior Software Engineer',
                'mid': 'Software Engineer',
                'senior': 'Senior Software Engineer'
            },
            'frontend_developer': {
                'junior': 'Junior Frontend Developer',
                'mid': 'Frontend Developer',
                'senior': 'Senior Frontend Developer'
            },
            'backend_developer': {
                'junior': 'Junior Backend Developer',
                'mid': 'Backend Developer',
                'senior': 'Senior Backend Developer'
            },
            'fullstack_developer': {
                'junior': 'Junior Full-Stack Developer',
                'mid': 'Full-Stack Developer',
                'senior': 'Senior Full-Stack Developer'
            },
            'devops_engineer': {
                'junior': 'DevOps Engineer',
                'mid': 'DevOps Engineer',
                'senior': 'Senior DevOps Engineer'
            },
            'data_scientist': {
                'junior': 'Junior Data Scientist',
                'mid': 'Data Scientist',
                'senior': 'Senior Data Scientist'
            }
        }
        
        return titles.get(role, {}).get(experience_level, role.replace('_', ' ').title())

    def get_role_required_skills(self, role: str) -> List[str]:
        """Get required skills for specific roles"""
        role_skills = {
            'software_engineer': ['Programming', 'Problem Solving', 'Version Control'],
            'frontend_developer': ['JavaScript', 'HTML/CSS', 'React/Angular/Vue'],
            'backend_developer': ['Server-side Programming', 'Databases', 'APIs'],
            'fullstack_developer': ['Frontend Frameworks', 'Backend Development', 'Databases'],
            'devops_engineer': ['CI/CD', 'Cloud Platforms', 'Containerization'],
            'data_scientist': ['Python/R', 'Statistics', 'Machine Learning']
        }
        
        return role_skills.get(role, ['Programming', 'Problem Solving'])

    def calculate_resume_score_realtime(self, text: str, skills: Dict, experience: Dict) -> Dict[str, Any]:
        """Real-time resume scoring"""
        score_breakdown = {
            'technical_skills': 0,
            'experience': 0,
            'content_quality': 0,
            'completeness': 0,
            'total_score': 0,
            'grade': 'F',
            'feedback': []
        }
        
        # Technical Skills (40 points)
        skills_score = min(skills['total_count'] * 3, 40)
        score_breakdown['technical_skills'] = skills_score
        
        if skills_score >= 30:
            score_breakdown['feedback'].append("Excellent technical skill diversity")
        elif skills_score >= 20:
            score_breakdown['feedback'].append("Good technical skills")
        else:
            score_breakdown['feedback'].append("Consider adding more technical skills")
        
        # Experience (30 points)
        exp_score = 15  # Base score
        if experience['level'] == 'senior':
            exp_score += 15
        elif experience['level'] == 'mid':
            exp_score += 10
        else:
            exp_score += 5
        
        if experience['leadership_score'] > 0:
            exp_score += 5
        
        score_breakdown['experience'] = min(exp_score, 30)
        
        # Content Quality (20 points)
        content_score = 10  # Base score
        
        # Check for quantifiable achievements
        if re.search(r'\d+%|\d+\s*years?|\$\d+|increased|improved|reduced', text.lower()):
            content_score += 5
            score_breakdown['feedback'].append("Good use of quantifiable achievements")
        
        # Check for action verbs
        action_verbs = ['developed', 'implemented', 'designed', 'led', 'managed', 'created', 'built']
        if any(verb in text.lower() for verb in action_verbs):
            content_score += 5
        
        score_breakdown['content_quality'] = content_score
        
        # Completeness (10 points)
        completeness_score = 0
        
        # Check for contact info
        if re.search(r'email|@|phone|\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}', text.lower()):
            completeness_score += 3
        
        # Check for education
        if re.search(r'education|degree|university|college|bachelor|master', text.lower()):
            completeness_score += 3
        
        # Check for experience section
        if re.search(r'experience|employment|work|position', text.lower()):
            completeness_score += 4
        
        score_breakdown['completeness'] = completeness_score
        
        # Calculate total
        total = (score_breakdown['technical_skills'] + 
                score_breakdown['experience'] + 
                score_breakdown['content_quality'] + 
                score_breakdown['completeness'])
        
        score_breakdown['total_score'] = total
        
        # Assign grade
        if total >= 90:
            score_breakdown['grade'] = 'A+'
        elif total >= 85:
            score_breakdown['grade'] = 'A'
        elif total >= 80:
            score_breakdown['grade'] = 'A-'
        elif total >= 75:
            score_breakdown['grade'] = 'B+'
        elif total >= 70:
            score_breakdown['grade'] = 'B'
        elif total >= 65:
            score_breakdown['grade'] = 'B-'
        elif total >= 60:
            score_breakdown['grade'] = 'C+'
        else:
            score_breakdown['grade'] = 'C'
        
        return score_breakdown

    def generate_improvement_suggestions_realtime(self, skills: Dict, experience: Dict, score: Dict) -> List[Dict[str, str]]:
        """Generate real-time improvement suggestions"""
        suggestions = []
        
        # Skills suggestions
        if skills['total_count'] < 8:
            suggestions.append({
                'category': 'Technical Skills',
                'suggestion': 'Add more technical skills to increase your marketability',
                'priority': 'High',
                'impact': 'Significantly increases job opportunities'
            })
        
        if not skills['cloud_platforms']:
            suggestions.append({
                'category': 'Cloud Skills',
                'suggestion': 'Learn cloud platforms like AWS, Azure, or Google Cloud',
                'priority': 'High',
                'impact': 'Cloud skills are in high demand'
            })
        
        if not skills['devops']:
            suggestions.append({
                'category': 'DevOps',
                'suggestion': 'Gain experience with Docker, CI/CD, or version control',
                'priority': 'Medium',
                'impact': 'Essential for modern development workflows'
            })
        
        # Experience suggestions
        if experience['level'] == 'junior' and experience['leadership_score'] == 0:
            suggestions.append({
                'category': 'Leadership',
                'suggestion': 'Highlight any mentoring, training, or project leadership experience',
                'priority': 'Medium',
                'impact': 'Shows growth potential and soft skills'
            })
        
        # Content suggestions
        if score['content_quality'] < 15:
            suggestions.append({
                'category': 'Content',
                'suggestion': 'Add quantifiable achievements with specific metrics and results',
                'priority': 'High',
                'impact': 'Makes your resume more compelling to recruiters'
            })
        
        return suggestions[:5]  # Return top 5 suggestions

    def analyze_resume_realtime(self, pdf_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """Main real-time analysis function"""
        start_time = time.time()
        
        try:
            # Extract text
            extracted_text, extraction_info = self.extract_text_realtime(pdf_bytes)
            
            if not extraction_info['success'] or len(extracted_text.strip()) < 50:
                raise ValueError("Could not extract meaningful text from PDF")
            
            # Clean text
            cleaned_text = self.clean_text_fast(extracted_text)
            
            # Extract skills
            skills_analysis = self.extract_skills_realtime(cleaned_text)
            
            # Analyze experience
            experience_analysis = self.analyze_experience_realtime(cleaned_text, skills_analysis['total_count'])
            
            # Generate job matches
            job_matches = self.generate_job_matches_realtime(skills_analysis, experience_analysis)
            
            # Calculate score
            score_analysis = self.calculate_resume_score_realtime(cleaned_text, skills_analysis, experience_analysis)
            
            # Generate suggestions
            suggestions = self.generate_improvement_suggestions_realtime(skills_analysis, experience_analysis, score_analysis)
            
            # Calculate total analysis time
            analysis_time = time.time() - start_time
            
            # Compile result
            result = {
                'success': True,
                'analysis_time': round(analysis_time, 2),
                'extraction_info': extraction_info,
                'overall_score': score_analysis['total_score'],
                'grade': score_analysis['grade'],
                'experience_level': experience_analysis['level'],
                'experience_confidence': experience_analysis['confidence'],
                'skills': {
                    'technical': {
                        'programming_languages': skills_analysis['programming_languages'],
                        'frameworks': skills_analysis['frameworks'],
                        'databases': skills_analysis['databases'],
                        'cloud_platforms': skills_analysis['cloud_platforms'],
                        'devops': skills_analysis['devops'],
                        'tools': skills_analysis['tools']
                    },
                    'total_count': skills_analysis['total_count'],
                    'confidence_scores': skills_analysis['confidence_scores']
                },
                'job_recommendations': job_matches,
                'improvement_suggestions': suggestions,
                'score_breakdown': score_breakdown,
                'feedback': score_analysis['feedback'],
                'extracted_data': {
                    'text_length': len(extracted_text),
                    'cleaned_text_length': len(cleaned_text),
                    'filename': filename
                },
                'analysis_method': 'realtime_python'
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Real-time analysis failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'analysis_time': time.time() - start_time,
                'analysis_method': 'realtime_python_failed'
            }

# Test function
if __name__ == "__main__":
    analyzer = RealtimeResumeAnalyzer()
    
    # Test with sample text
    sample_text = """
    John Smith
    Senior Software Engineer
    Email: john.smith@email.com | Phone: (555) 123-4567
    
    EXPERIENCE
    Senior Software Engineer | TechCorp | 2020 - Present
    • Led team of 5 developers in building microservices with Python and React
    • Improved application performance by 40% using AWS and Docker
    • Implemented CI/CD pipelines with Jenkins and Kubernetes
    
    Software Engineer | StartupXYZ | 2018 - 2020
    • Developed full-stack applications using JavaScript, Node.js, and PostgreSQL
    • Increased user engagement by 25% through React frontend improvements
    
    SKILLS
    Programming: Python, JavaScript, TypeScript, Java
    Frameworks: React, Angular, Django, Express.js
    Databases: PostgreSQL, MongoDB, Redis
    Cloud: AWS, Azure, Docker, Kubernetes
    Tools: Git, Jenkins, JIRA
    
    EDUCATION
    Bachelor of Computer Science | University of Technology | 2014-2018
    """
    
    # Simulate PDF bytes
    pdf_bytes = sample_text.encode('utf-8')
    
    try:
        result = analyzer.analyze_resume_realtime(pdf_bytes, "john_smith_resume.pdf")
        
        print("\n" + "="*60)
        print("REAL-TIME RESUME ANALYSIS RESULTS")
        print("="*60)
        
        if result['success']:
            print(f"Analysis completed in {result['analysis_time']} seconds")
            print(f"Overall Score: {result['overall_score']}/100 (Grade: {result['grade']})")
            print(f"Experience Level: {result['experience_level']} ({result['experience_confidence']}% confidence)")
            print(f"Total Skills Found: {result['skills']['total_count']}")
            
            print(f"\nTop Skills:")
            for category, skills in result['skills']['technical'].items():
                if skills:
                    print(f"  {category.title()}: {', '.join(skills[:3])}")
            
            print(f"\nTop Job Matches:")
            for i, job in enumerate(result['job_recommendations'][:3], 1):
                print(f"  {i}. {job['title']} - {job['match_percentage']}% match")
            
            print(f"\nImprovement Suggestions:")
            for i, suggestion in enumerate(result['improvement_suggestions'][:3], 1):
                print(f"  {i}. [{suggestion['priority']}] {suggestion['suggestion']}")
        else:
            print(f"Analysis failed: {result['error']}")
        
        print("="*60)
        
    except Exception as e:
        print(f"Test failed: {e}")
