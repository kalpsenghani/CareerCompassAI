import os
import json
import re
from typing import Dict, List, Any, Optional
import requests
from io import BytesIO

# PDF processing
try:
    import PyPDF2
    import pdfplumber
except ImportError:
    print("Installing PDF libraries...")
    os.system("pip install PyPDF2 pdfplumber")
    import PyPDF2
    import pdfplumber

# Text processing
try:
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
except ImportError:
    print("Installing NLTK...")
    os.system("pip install nltk")
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('averaged_perceptron_tagger')

class ResumeAnalyzer:
    def __init__(self):
        self.openai_api_key = os.getenv('NEXT_PUBLIC_OPENAI_API_KEY')
        self.huggingface_api_key = os.getenv('NEXT_PUBLIC_HUGGINGFACE_API_KEY')
        
        # Initialize NLTK components
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        # Skill databases
        self.technical_skills = {
            'programming_languages': [
                'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 
                'swift', 'kotlin', 'scala', 'typescript', 'r', 'matlab', 'perl'
            ],
            'web_frameworks': [
                'react', 'angular', 'vue', 'django', 'flask', 'express', 'spring', 
                'laravel', 'rails', 'asp.net', 'fastapi', 'nestjs', 'svelte'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 
                'sql server', 'cassandra', 'elasticsearch', 'dynamodb'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 
                'vercel', 'netlify', 'firebase'
            ],
            'tools_technologies': [
                'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 
                'terraform', 'ansible', 'webpack', 'vite', 'babel'
            ],
            'mobile_development': [
                'react native', 'flutter', 'ionic', 'xamarin', 'android', 'ios'
            ],
            'data_science': [
                'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 
                'keras', 'spark', 'hadoop', 'tableau', 'power bi'
            ]
        }
        
        self.soft_skills = [
            'leadership', 'communication', 'teamwork', 'problem solving', 
            'critical thinking', 'project management', 'time management',
            'adaptability', 'creativity', 'collaboration', 'analytical skills',
            'decision making', 'conflict resolution', 'mentoring', 'coaching'
        ]

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF using multiple methods for better accuracy"""
        text = ""
        
        try:
            # Method 1: pdfplumber (better for complex layouts)
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            if len(text.strip()) > 100:
                print(f"Successfully extracted {len(text)} characters using pdfplumber")
                return text
                
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
        
        try:
            # Method 2: PyPDF2 (fallback)
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            if len(text.strip()) > 100:
                print(f"Successfully extracted {len(text)} characters using PyPDF2")
                return text
                
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")
        
        # Method 3: Simple byte extraction (last resort)
        try:
            text = pdf_bytes.decode('utf-8', errors='ignore')
            # Clean up the text
            text = re.sub(r'[^\x20-\x7E\n]', ' ', text)
            text = re.sub(r'\s+', ' ', text)
            print(f"Fallback extraction yielded {len(text)} characters")
            return text
        except Exception as e:
            print(f"All extraction methods failed: {e}")
            return ""

    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess the extracted text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep important punctuation
        text = re.sub(r'[^\w\s\.\,\-$$$$]', ' ', text)
        
        # Remove very short lines (likely artifacts)
        lines = text.split('\n')
        cleaned_lines = [line.strip() for line in lines if len(line.strip()) > 3]
        
        return '\n'.join(cleaned_lines)

    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extract technical and soft skills from resume text"""
        text_lower = text.lower()
        
        found_technical = []
        found_soft = []
        
        # Extract technical skills
        for category, skills in self.technical_skills.items():
            for skill in skills:
                # Check for exact matches and variations
                patterns = [
                    skill,
                    skill.replace(' ', ''),
                    skill.replace('-', ' '),
                    skill.replace('.', '')
                ]
                
                for pattern in patterns:
                    if pattern in text_lower:
                        # Capitalize properly
                        formatted_skill = self.format_skill_name(skill)
                        if formatted_skill not in found_technical:
                            found_technical.append(formatted_skill)
                        break
        
        # Extract soft skills
        for skill in self.soft_skills:
            if skill in text_lower:
                formatted_skill = skill.title()
                if formatted_skill not in found_soft:
                    found_soft.append(formatted_skill)
        
        # Industry skills based on context
        industry_skills = self.extract_industry_skills(text_lower)
        
        return {
            'technical': found_technical[:15],  # Limit to top 15
            'soft': found_soft[:10],           # Limit to top 10
            'industry': industry_skills[:8]     # Limit to top 8
        }

    def format_skill_name(self, skill: str) -> str:
        """Format skill names properly"""
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
            'graphql': 'GraphQL'
        }
        
        return special_cases.get(skill.lower(), skill.title())

    def extract_industry_skills(self, text: str) -> List[str]:
        """Extract industry-specific skills and methodologies"""
        industry_keywords = {
            'Agile Development': ['agile', 'scrum', 'kanban', 'sprint'],
            'DevOps': ['devops', 'ci/cd', 'continuous integration', 'deployment'],
            'Machine Learning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
            'Data Science': ['data science', 'data analysis', 'analytics', 'big data'],
            'Cybersecurity': ['security', 'cybersecurity', 'encryption', 'penetration testing'],
            'Cloud Computing': ['cloud', 'serverless', 'microservices', 'containerization'],
            'Mobile Development': ['mobile', 'app development', 'ios development', 'android development'],
            'Web Development': ['web development', 'frontend', 'backend', 'full stack'],
            'UI/UX Design': ['ui', 'ux', 'user experience', 'user interface', 'design'],
            'Quality Assurance': ['qa', 'testing', 'automation testing', 'unit testing']
        }
        
        found_industries = []
        for industry, keywords in industry_keywords.items():
            if any(keyword in text for keyword in keywords):
                found_industries.append(industry)
        
        return found_industries

    def determine_experience_level(self, text: str) -> str:
        """Determine experience level based on resume content"""
        text_lower = text.lower()
        
        # Senior indicators
        senior_keywords = [
            'senior', 'lead', 'principal', 'architect', 'manager', 'director',
            'head of', 'vp', 'cto', 'chief', '10+ years', '8+ years', '7+ years'
        ]
        
        # Mid-level indicators
        mid_keywords = [
            'mid-level', 'intermediate', '3-6 years', '4-7 years', '5+ years'
        ]
        
        # Extract years of experience
        year_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)',
            r'experience.*?(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in'
        ]
        
        years_found = []
        for pattern in year_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                try:
                    years_found.append(int(match))
                except ValueError:
                    continue
        
        max_years = max(years_found) if years_found else 0
        
        # Decision logic
        if any(keyword in text_lower for keyword in senior_keywords) or max_years >= 7:
            return 'senior'
        elif any(keyword in text_lower for keyword in mid_keywords) or 3 <= max_years < 7:
            return 'mid'
        else:
            return 'junior'

    def generate_job_recommendations(self, skills: Dict[str, List[str]], experience_level: str) -> List[Dict[str, Any]]:
        """Generate job recommendations based on skills and experience"""
        
        job_templates = {
            'junior': [
                {
                    'title': 'Junior Software Developer',
                    'required_skills': ['JavaScript', 'HTML', 'CSS'],
                    'salary_range': '$50,000 - $75,000',
                    'company_type': 'Technology Startup'
                },
                {
                    'title': 'Frontend Developer',
                    'required_skills': ['React', 'JavaScript', 'CSS'],
                    'salary_range': '$55,000 - $80,000',
                    'company_type': 'Web Development Agency'
                },
                {
                    'title': 'Backend Developer',
                    'required_skills': ['Python', 'Node.js', 'SQL'],
                    'salary_range': '$60,000 - $85,000',
                    'company_type': 'Software Company'
                },
                {
                    'title': 'QA Engineer',
                    'required_skills': ['Testing', 'Automation', 'SQL'],
                    'salary_range': '$45,000 - $70,000',
                    'company_type': 'Enterprise'
                }
            ],
            'mid': [
                {
                    'title': 'Full Stack Developer',
                    'required_skills': ['React', 'Node.js', 'MongoDB'],
                    'salary_range': '$80,000 - $120,000',
                    'company_type': 'Technology Company'
                },
                {
                    'title': 'Software Engineer',
                    'required_skills': ['Python', 'JavaScript', 'AWS'],
                    'salary_range': '$90,000 - $130,000',
                    'company_type': 'Tech Startup'
                },
                {
                    'title': 'DevOps Engineer',
                    'required_skills': ['Docker', 'Kubernetes', 'AWS'],
                    'salary_range': '$95,000 - $140,000',
                    'company_type': 'Cloud Services'
                },
                {
                    'title': 'Data Engineer',
                    'required_skills': ['Python', 'SQL', 'Spark'],
                    'salary_range': '$100,000 - $145,000',
                    'company_type': 'Data Analytics'
                }
            ],
            'senior': [
                {
                    'title': 'Senior Software Engineer',
                    'required_skills': ['JavaScript', 'Python', 'System Design'],
                    'salary_range': '$130,000 - $180,000',
                    'company_type': 'Large Tech Company'
                },
                {
                    'title': 'Technical Lead',
                    'required_skills': ['Leadership', 'Architecture', 'Mentoring'],
                    'salary_range': '$140,000 - $190,000',
                    'company_type': 'Enterprise'
                },
                {
                    'title': 'Principal Engineer',
                    'required_skills': ['System Design', 'Leadership', 'Strategy'],
                    'salary_range': '$160,000 - $220,000',
                    'company_type': 'Technology Giant'
                },
                {
                    'title': 'Engineering Manager',
                    'required_skills': ['Management', 'Leadership', 'Technical Strategy'],
                    'salary_range': '$150,000 - $200,000',
                    'company_type': 'Software Company'
                }
            ]
        }
        
        templates = job_templates[experience_level]
        recommendations = []
        
        for template in templates:
            # Calculate match percentage based on skill overlap
            required_skills = template['required_skills']
            user_skills = skills['technical'] + skills['soft'] + skills['industry']
            
            matching_skills = [skill for skill in required_skills 
                             if any(skill.lower() in user_skill.lower() for user_skill in user_skills)]
            
            match_percentage = min(85 + len(matching_skills) * 3, 98)
            
            recommendations.append({
                'title': template['title'],
                'match_percentage': match_percentage,
                'required_skills': matching_skills + skills['technical'][:3],
                'salary_range': template['salary_range'],
                'company_type': template['company_type']
            })
        
        return recommendations

    def generate_improvement_suggestions(self, text: str, skills: Dict[str, List[str]]) -> List[Dict[str, str]]:
        """Generate improvement suggestions based on resume analysis"""
        suggestions = []
        
        # Skills suggestions
        if len(skills['technical']) < 5:
            suggestions.append({
                'category': 'skills',
                'suggestion': 'Add more technical skills to strengthen your profile. Consider learning cloud technologies like AWS or containerization with Docker.',
                'priority': 'high'
            })
        
        # Experience presentation
        if not any(word in text.lower() for word in ['improved', 'increased', 'reduced', 'achieved', 'led']):
            suggestions.append({
                'category': 'experience',
                'suggestion': 'Include quantifiable achievements with specific metrics (e.g., "Improved performance by 30%", "Led team of 5 developers").',
                'priority': 'high'
            })
        
        # Education and certifications
        if not any(word in text.lower() for word in ['bachelor', 'master', 'degree', 'certification', 'certified']):
            suggestions.append({
                'category': 'format',
                'suggestion': 'Consider adding your educational background and relevant certifications to strengthen your profile.',
                'priority': 'medium'
            })
        
        # Portfolio and projects
        if not any(word in text.lower() for word in ['github', 'portfolio', 'project', 'repository']):
            suggestions.append({
                'category': 'format',
                'suggestion': 'Include links to your GitHub profile, portfolio, or notable projects to showcase your work.',
                'priority': 'medium'
            })
        
        # ATS optimization
        suggestions.append({
            'category': 'format',
            'suggestion': 'Optimize your resume for ATS (Applicant Tracking Systems) by using standard section headers and keywords from job descriptions.',
            'priority': 'low'
        })
        
        return suggestions[:5]  # Limit to 5 suggestions

    def generate_interview_questions(self, skills: Dict[str, List[str]], experience_level: str) -> List[Dict[str, str]]:
        """Generate relevant interview questions based on skills and experience"""
        questions = []
        
        # Technical questions based on skills
        if skills['technical']:
            primary_skill = skills['technical'][0]
            questions.append({
                'question': f"Explain your experience with {primary_skill} and how you've used it in projects.",
                'category': 'technical',
                'difficulty': 'medium'
            })
        
        questions.extend([
            {
                'question': 'Describe the difference between synchronous and asynchronous programming.',
                'category': 'technical',
                'difficulty': 'medium'
            },
            {
                'question': 'How would you optimize a slow-performing application?',
                'category': 'technical',
                'difficulty': 'hard' if experience_level == 'senior' else 'medium'
            },
            {
                'question': 'Tell me about a challenging project you worked on and how you overcame obstacles.',
                'category': 'behavioral',
                'difficulty': 'medium'
            },
            {
                'question': 'Describe a time when you had to learn a new technology quickly.',
                'category': 'behavioral',
                'difficulty': 'easy'
            },
            {
                'question': 'How do you handle conflicts within your development team?',
                'category': 'behavioral',
                'difficulty': 'medium'
            },
            {
                'question': 'How would you approach debugging a production issue affecting users?',
                'category': 'situational',
                'difficulty': 'medium'
            },
            {
                'question': 'What would you do if you disagreed with a technical decision made by your team lead?',
                'category': 'situational',
                'difficulty': 'medium'
            }
        ])
        
        return questions[:8]  # Limit to 8 questions

    def calculate_overall_score(self, skills: Dict[str, List[str]], experience_level: str, text: str) -> int:
        """Calculate an overall resume score"""
        score = 70  # Base score
        
        # Skills diversity bonus
        total_skills = len(skills['technical']) + len(skills['soft']) + len(skills['industry'])
        score += min(total_skills * 1.5, 25)
        
        # Experience level bonus
        if experience_level == 'senior':
            score += 15
        elif experience_level == 'mid':
            score += 10
        
        # Content quality indicators
        quality_indicators = [
            'achieved', 'improved', 'led', 'managed', 'developed', 'implemented',
            'designed', 'optimized', 'increased', 'reduced', 'created'
        ]
        
        quality_score = sum(1 for indicator in quality_indicators if indicator in text.lower())
        score += min(quality_score * 2, 15)
        
        return min(max(score, 0), 100)

    def analyze_resume(self, pdf_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """Main analysis function that processes a resume PDF"""
        try:
            print(f"Starting analysis of {filename}")
            
            # Extract text from PDF
            extracted_text = self.extract_text_from_pdf(pdf_bytes)
            
            if len(extracted_text.strip()) < 50:
                raise ValueError("Could not extract meaningful text from PDF")
            
            print(f"Extracted {len(extracted_text)} characters from PDF")
            
            # Preprocess text
            cleaned_text = self.preprocess_text(extracted_text)
            
            # Extract skills
            skills = self.extract_skills(cleaned_text)
            print(f"Found {len(skills['technical'])} technical skills, {len(skills['soft'])} soft skills")
            
            # Determine experience level
            experience_level = self.determine_experience_level(cleaned_text)
            print(f"Determined experience level: {experience_level}")
            
            # Generate recommendations
            job_recommendations = self.generate_job_recommendations(skills, experience_level)
            improvement_suggestions = self.generate_improvement_suggestions(cleaned_text, skills)
            interview_questions = self.generate_interview_questions(skills, experience_level)
            
            # Calculate overall score
            overall_score = self.calculate_overall_score(skills, experience_level, cleaned_text)
            
            result = {
                'skills': skills,
                'experience_level': experience_level,
                'job_recommendations': job_recommendations,
                'improvement_suggestions': improvement_suggestions,
                'interview_questions': interview_questions,
                'overall_score': overall_score,
                'extracted_data': {
                    'fullText': extracted_text,
                    'cleanedText': cleaned_text,
                    'textLength': len(extracted_text),
                    'filename': filename
                },
                'analysis_method': 'python_advanced'
            }
            
            print(f"Analysis completed successfully. Score: {overall_score}")
            return result
            
        except Exception as e:
            print(f"Analysis failed: {str(e)}")
            raise e

# Test the analyzer
if __name__ == "__main__":
    analyzer = ResumeAnalyzer()
    
    # Test with a sample text (simulating PDF extraction)
    sample_text = """
    John Doe
    Software Engineer
    
    Experience:
    Senior Software Engineer at Tech Corp (2020-2023)
    - Developed web applications using React, Node.js, and MongoDB
    - Led a team of 5 developers
    - Improved application performance by 40%
    - Implemented CI/CD pipelines using Jenkins and Docker
    
    Skills:
    JavaScript, Python, React, Node.js, MongoDB, AWS, Docker, Git
    
    Education:
    Bachelor of Science in Computer Science
    """
    
    # Simulate PDF bytes
    pdf_bytes = sample_text.encode('utf-8')
    
    try:
        result = analyzer.analyze_resume(pdf_bytes, "sample_resume.pdf")
        print("\n=== ANALYSIS RESULTS ===")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Test failed: {e}")
