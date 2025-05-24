import pdfParse from 'pdf-parse';
import compromise from 'compromise';

// Common technical skills and their categories
const SKILLS_DATABASE = {
  programming_languages: [
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'ruby', 'php', 'swift', 'kotlin',
    'go', 'rust', 'scala', 'perl', 'r', 'matlab', 'sql', 'html', 'css'
  ],
  frameworks: [
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
    'asp.net', 'next.js', 'nuxt', 'svelte', 'gatsby', 'bootstrap', 'tailwind', 'material-ui'
  ],
  databases: [
    'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sql server', 'sqlite', 'cassandra',
    'elasticsearch', 'dynamodb', 'firebase', 'neo4j'
  ],
  cloud_platforms: [
    'aws', 'azure', 'gcp', 'heroku', 'digitalocean', 'linode', 'vultr', 'cloudflare',
    'firebase', 'netlify', 'vercel'
  ],
  devops: [
    'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'terraform', 'ansible',
    'prometheus', 'grafana', 'nagios', 'splunk', 'elk stack'
  ],
  tools: [
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'trello',
    'postman', 'swagger', 'figma', 'sketch', 'adobe xd'
  ]
};

interface SkillsAnalysis {
  technical: Record<string, string[]>;
  total_count: number;
  confidence_scores: Record<string, number>;
}

interface ExperienceAnalysis {
  level: string;
  confidence: number;
}

interface ScoreBreakdown {
  technical_skills: number;
  experience: number;
  content_quality: number;
  completeness: number;
}

interface JobRecommendation {
  title: string;
  match_percentage: number;
  salary_range: string;
  category: string;
  market_demand: string;
}

interface ImprovementSuggestion {
  category: string;
  suggestion: string;
  priority: string;
  impact: string;
}

interface AnalysisResult {
  success: boolean;
  analysis_time: number;
  overall_score: number;
  grade: string;
  experience_level: string;
  experience_confidence: number;
  skills: SkillsAnalysis;
  job_recommendations: JobRecommendation[];
  improvement_suggestions: ImprovementSuggestion[];
  score_breakdown: ScoreBreakdown;
  feedback: string[];
  extraction_info: {
    method: string;
    success: boolean;
    extraction_time: number;
    text_length: number;
  };
  error?: string;
  analysis_method?: string;
}

export class ResumeAnalyzer {
  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private extractSkills(text: string): SkillsAnalysis {
    const words = text.toLowerCase().split(/\s+/);
    const skills: Record<string, string[]> = {
      programming_languages: [],
      frameworks: [],
      databases: [],
      cloud_platforms: [],
      devops: [],
      tools: []
    };
    const confidence_scores: Record<string, number> = {};

    // Process each word and check against skills database
    words.forEach(word => {
      Object.entries(SKILLS_DATABASE).forEach(([category, skillList]) => {
        if (skillList.includes(word)) {
          if (!skills[category].includes(word)) {
            skills[category].push(word);
            confidence_scores[word] = 1.0; // High confidence for exact matches
          }
        }
      });
    });

    // Calculate total skills count
    const total_count = Object.values(skills).reduce((sum, arr) => sum + arr.length, 0);

    return { technical: skills, total_count, confidence_scores };
  }

  private extractExperience(text: string): ExperienceAnalysis {
    // Use regex patterns to find experience-related information
    const yearPattern = /\b(\d+)\s*(?:years?|yrs?)\b/gi;
    const matches = text.match(yearPattern) || [];
    const years = matches.map(match => parseInt(match.split(/\s+/)[0]));
    const experienceYears = years.reduce((sum, y) => sum + y, 0);

    // Look for experience-related keywords
    const experienceKeywords = {
      senior: ['senior', 'lead', 'principal', 'architect'],
      mid: ['mid-level', 'intermediate', 'experienced'],
      junior: ['junior', 'entry', 'associate']
    };

    let level = 'Entry Level';
    let confidence = 0.5;

    // Check for experience keywords
    const lowerText = text.toLowerCase();
    if (experienceKeywords.senior.some(keyword => lowerText.includes(keyword))) {
      level = 'Senior';
      confidence = 0.9;
    } else if (experienceKeywords.mid.some(keyword => lowerText.includes(keyword))) {
      level = 'Mid-Level';
      confidence = 0.8;
    } else if (experienceKeywords.junior.some(keyword => lowerText.includes(keyword))) {
      level = 'Junior';
      confidence = 0.7;
    }

    // Adjust based on years of experience
    if (experienceYears >= 8) {
      level = 'Senior';
      confidence = 0.9;
    } else if (experienceYears >= 5) {
      level = 'Mid-Level';
      confidence = 0.8;
    } else if (experienceYears >= 2) {
      level = 'Junior';
      confidence = 0.7;
    }

    return { level, confidence };
  }

  private calculateOverallScore(analysis: { score_breakdown: ScoreBreakdown }): number {
    const weights = {
      technical_skills: 0.4,
      experience: 0.3,
      content_quality: 0.2,
      completeness: 0.1
    };

    const score = 
      (analysis.score_breakdown.technical_skills * weights.technical_skills) +
      (analysis.score_breakdown.experience * weights.experience) +
      (analysis.score_breakdown.content_quality * weights.content_quality) +
      (analysis.score_breakdown.completeness * weights.completeness);

    return Math.round(score * 100);
  }

  private generateJobRecommendations(skills: SkillsAnalysis): JobRecommendation[] {
    // This would typically connect to a job database or API
    // For now, we'll return some sample recommendations based on skills
    return [
      {
        title: "Full Stack Developer",
        match_percentage: 85,
        salary_range: "$80,000 - $120,000",
        category: "Software Development",
        market_demand: "High"
      },
      {
        title: "Backend Developer",
        match_percentage: 75,
        salary_range: "$70,000 - $110,000",
        category: "Software Development",
        market_demand: "High"
      }
    ];
  }

  private generateImprovementSuggestions(analysis: { skills: SkillsAnalysis; experience_level: string }): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Check technical skills
    if (analysis.skills.total_count < 5) {
      suggestions.push({
        category: "Technical Skills",
        suggestion: "Add more technical skills to your resume",
        priority: "High",
        impact: "Significant"
      });
    }

    // Check experience
    if (analysis.experience_level === "Entry Level") {
      suggestions.push({
        category: "Experience",
        suggestion: "Highlight any relevant projects or internships",
        priority: "Medium",
        impact: "Moderate"
      });
    }

    return suggestions;
  }

  public async analyzeResume(pdfBuffer: Buffer, filename: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Invalid PDF buffer provided');
      }

      // Extract text from PDF
      const text = await this.extractTextFromPDF(pdfBuffer);

      // Perform analysis
      const skills = this.extractSkills(text);
      const experience = this.extractExperience(text);

      // Calculate scores
      const score_breakdown: ScoreBreakdown = {
        technical_skills: skills.total_count / 20, // Normalize to 0-1
        experience: experience.confidence,
        content_quality: 0.8, // This would be more sophisticated in a real implementation
        completeness: 0.7 // This would be more sophisticated in a real implementation
      };

      const overall_score = this.calculateOverallScore({ score_breakdown });

      // Generate recommendations and suggestions
      const job_recommendations = this.generateJobRecommendations(skills);
      const improvement_suggestions = this.generateImprovementSuggestions({
        skills,
        experience_level: experience.level
      });

      const analysis_time = (Date.now() - startTime) / 1000;

      return {
        success: true,
        analysis_time,
        overall_score,
        grade: overall_score >= 80 ? 'A' : overall_score >= 60 ? 'B' : overall_score >= 40 ? 'C' : 'D',
        experience_level: experience.level,
        experience_confidence: experience.confidence,
        skills,
        job_recommendations,
        improvement_suggestions,
        score_breakdown,
        feedback: [
          "Resume analysis completed successfully",
          `Identified ${skills.total_count} technical skills`,
          `Experience level: ${experience.level}`
        ],
        extraction_info: {
          method: "pdf-parse",
          success: true,
          extraction_time: analysis_time,
          text_length: text.length
        }
      };
    } catch (error) {
      console.error("Resume analysis failed:", error);
      return {
        success: false,
        analysis_time: (Date.now() - startTime) / 1000,
        overall_score: 0,
        grade: 'F',
        experience_level: 'Unknown',
        experience_confidence: 0,
        skills: {
          technical: {},
          total_count: 0,
          confidence_scores: {}
        },
        job_recommendations: [],
        improvement_suggestions: [],
        score_breakdown: {
          technical_skills: 0,
          experience: 0,
          content_quality: 0,
          completeness: 0
        },
        feedback: ["Analysis failed"],
        extraction_info: {
          method: "pdf-parse",
          success: false,
          extraction_time: (Date.now() - startTime) / 1000,
          text_length: 0
        },
        error: error instanceof Error ? error.message : "Unknown error during analysis",
        analysis_method: "node_analysis_failed"
      };
    }
  }
} 