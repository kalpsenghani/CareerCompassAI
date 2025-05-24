import { PDFParser } from "./pdf-parser"

interface ResumeAnalysis {
  skills: {
    technical: string[]
    soft: string[]
    industry: string[]
  }
  experience_level: "junior" | "mid" | "senior"
  job_recommendations: Array<{
    title: string
    match_percentage: number
    required_skills: string[]
    salary_range: string
  }>
  improvement_suggestions: Array<{
    category: "skills" | "experience" | "format"
    suggestion: string
    priority: "high" | "medium" | "low"
  }>
  interview_questions: Array<{
    question: string
    category: "technical" | "behavioral" | "situational"
    difficulty: "easy" | "medium" | "hard"
  }>
  overall_score: number
  extracted_text: string
}

export class AIAnalysisService {
  private openaiApiKey: string
  private huggingFaceApiKey: string
  private openaiBaseURL: string
  private huggingFaceBaseURL: string

  constructor() {
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""
    this.huggingFaceApiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || ""
    this.openaiBaseURL = "https://api.openai.com/v1"
    this.huggingFaceBaseURL = "https://api-inference.huggingface.co/models"
  }

  async analyzeResume(file: File): Promise<ResumeAnalysis> {
    // Extract text from the actual file
    const extractedText = await this.extractTextFromFile(file)

    if (!extractedText || extractedText.length < 50) {
      throw new Error("Could not extract meaningful text from the file. Please ensure the file contains readable text.")
    }

    // Analyze the extracted text
    const analysis = await this.performAnalysis(extractedText)

    return {
      ...analysis,
      extracted_text: extractedText,
      overall_score: this.calculateOverallScore(analysis),
    }
  }

  private async extractTextFromFile(file: File): Promise<string> {
    try {
      if (file.type === "application/pdf") {
        return await PDFParser.extractTextFromPDF(file)
      } else if (
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return await PDFParser.extractTextFromDOC(file)
      } else if (file.type === "text/plain") {
        return await file.text()
      } else {
        throw new Error("Unsupported file type")
      }
    } catch (error) {
      console.error("File extraction error:", error)
      throw new Error(
        "Failed to extract text from file. Please ensure the file is not corrupted and contains readable text.",
      )
    }
  }

  private async performAnalysis(resumeText: string): Promise<Omit<ResumeAnalysis, "overall_score" | "extracted_text">> {
    // First try OpenAI if API key is available
    if (this.openaiApiKey) {
      try {
        return await this.analyzeWithOpenAI(resumeText)
      } catch (error) {
        console.warn("OpenAI analysis failed, falling back to alternative:", error)
      }
    }

    // Try Hugging Face as fallback
    if (this.huggingFaceApiKey) {
      try {
        return await this.analyzeWithHuggingFace(resumeText)
      } catch (error) {
        console.warn("Hugging Face analysis failed, using intelligent fallback:", error)
      }
    }

    // Use intelligent fallback analysis
    return this.getIntelligentFallbackAnalysis(resumeText)
  }

  private async analyzeWithOpenAI(
    resumeText: string,
  ): Promise<Omit<ResumeAnalysis, "overall_score" | "extracted_text">> {
    const prompt = this.createAnalysisPrompt(resumeText)

    const response = await fetch(`${this.openaiBaseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert career advisor and resume analyst. Analyze the provided resume text and provide detailed, actionable insights in the exact JSON format requested. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    const analysisText = data.choices[0].message.content
    const analysis = JSON.parse(analysisText)

    return analysis
  }

  private async analyzeWithHuggingFace(
    resumeText: string,
  ): Promise<Omit<ResumeAnalysis, "overall_score" | "extracted_text">> {
    // For now, fall back to intelligent analysis since HF free tier is limited for this use case
    return this.getIntelligentFallbackAnalysis(resumeText)
  }

  private getIntelligentFallbackAnalysis(resumeText: string): Omit<ResumeAnalysis, "overall_score" | "extracted_text"> {
    const text = resumeText.toLowerCase()

    // Extract skills using keyword matching
    const technicalSkills = this.extractTechnicalSkills(text)
    const softSkills = this.extractSoftSkills(text)
    const industrySkills = this.extractIndustrySkills(text)

    // Determine experience level
    const experienceLevel = this.determineExperienceLevel(text)

    // Generate job recommendations based on skills
    const jobRecommendations = this.generateJobRecommendations(technicalSkills, experienceLevel)

    // Generate improvement suggestions
    const improvements = this.generateImprovementSuggestions(text, technicalSkills)

    // Generate interview questions
    const interviewQuestions = this.generateInterviewQuestions(technicalSkills, experienceLevel)

    return {
      skills: {
        technical: technicalSkills,
        soft: softSkills,
        industry: industrySkills,
      },
      experience_level: experienceLevel,
      job_recommendations: jobRecommendations,
      improvement_suggestions: improvements,
      interview_questions: interviewQuestions,
    }
  }

  private extractTechnicalSkills(text: string): string[] {
    const skillsDatabase = {
      programming: [
        "javascript",
        "python",
        "java",
        "c++",
        "c#",
        "typescript",
        "php",
        "ruby",
        "go",
        "rust",
        "swift",
        "kotlin",
        "scala",
        "perl",
        "r",
        "matlab",
        "sql",
        "html",
        "css",
        "xml",
        "json",
      ],
      frontend: [
        "react",
        "vue",
        "angular",
        "svelte",
        "jquery",
        "bootstrap",
        "tailwind",
        "sass",
        "less",
        "webpack",
        "vite",
        "parcel",
        "gulp",
        "grunt",
      ],
      backend: ["node.js", "express", "django", "flask", "spring", "laravel", "rails", "asp.net", "fastapi", "nestjs"],
      database: [
        "mysql",
        "postgresql",
        "mongodb",
        "redis",
        "sqlite",
        "oracle",
        "sql server",
        "cassandra",
        "elasticsearch",
      ],
      cloud: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "gitlab ci", "github actions"],
      tools: ["git", "github", "gitlab", "jira", "confluence", "slack", "figma", "photoshop", "illustrator", "sketch"],
      mobile: ["react native", "flutter", "ionic", "xamarin", "android", "ios", "swift", "kotlin"],
      data: ["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "spark", "hadoop", "tableau", "power bi"],
    }

    const foundSkills: string[] = []

    Object.values(skillsDatabase)
      .flat()
      .forEach((skill) => {
        const skillVariations = [skill, skill.replace(/\./g, ""), skill.replace(/\s/g, ""), skill.replace(/-/g, " ")]

        if (
          skillVariations.some((variation) => text.includes(variation.toLowerCase())) &&
          !foundSkills.some((existing) => existing.toLowerCase() === skill.toLowerCase())
        ) {
          foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1))
        }
      })

    return foundSkills.slice(0, 12) // Return top 12 skills
  }

  private extractSoftSkills(text: string): string[] {
    const softSkillsKeywords = {
      Leadership: ["lead", "manage", "mentor", "supervise", "direct", "coordinate", "oversee"],
      Communication: ["present", "communicate", "collaborate", "coordinate", "negotiate", "articulate"],
      "Problem Solving": ["solve", "debug", "troubleshoot", "analyze", "optimize", "resolve", "investigate"],
      Teamwork: ["team", "collaborate", "cooperate", "work together", "cross-functional"],
      Adaptability: ["adapt", "flexible", "learn", "agile", "scrum", "versatile"],
      "Project Management": ["project", "manage", "plan", "organize", "schedule", "deliver"],
      "Critical Thinking": ["analyze", "evaluate", "assess", "strategic", "decision"],
      "Time Management": ["deadline", "prioritize", "efficient", "organize", "multitask"],
    }

    const foundSoftSkills: string[] = []

    Object.entries(softSkillsKeywords).forEach(([skill, keywords]) => {
      if (keywords.some((keyword) => text.includes(keyword))) {
        foundSoftSkills.push(skill)
      }
    })

    return foundSoftSkills.length > 0 ? foundSoftSkills : ["Communication", "Problem Solving", "Teamwork"]
  }

  private extractIndustrySkills(text: string): string[] {
    const industryKeywords = {
      "Software Development": ["software", "development", "programming", "coding", "application"],
      "Web Development": ["web", "frontend", "backend", "fullstack", "website"],
      "Data Science": ["data", "analytics", "machine learning", "ai", "statistics", "analysis"],
      DevOps: ["devops", "ci/cd", "deployment", "infrastructure", "automation"],
      "Mobile Development": ["mobile", "ios", "android", "react native", "flutter"],
      "Cloud Computing": ["cloud", "aws", "azure", "serverless", "microservices"],
      Cybersecurity: ["security", "cybersecurity", "encryption", "vulnerability", "penetration"],
      "UI/UX Design": ["design", "user experience", "user interface", "ux", "ui", "figma"],
    }

    const foundIndustrySkills: string[] = []

    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      if (keywords.some((keyword) => text.includes(keyword))) {
        foundIndustrySkills.push(industry)
      }
    })

    return foundIndustrySkills.length > 0 ? foundIndustrySkills : ["Software Development"]
  }

  private determineExperienceLevel(text: string): "junior" | "mid" | "senior" {
    const seniorKeywords = ["senior", "lead", "principal", "architect", "manager", "director", "head of", "vp", "cto"]
    const midKeywords = ["3 years", "4 years", "5 years", "6 years", "7 years", "mid-level", "intermediate"]

    // Extract years of experience
    const experienceNumbers = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi)

    if (seniorKeywords.some((keyword) => text.includes(keyword))) {
      return "senior"
    }

    if (experienceNumbers) {
      const years = experienceNumbers.map((match) => {
        const num = match.match(/\d+/)?.[0]
        return num ? Number.parseInt(num) : 0
      })
      const maxYears = Math.max(...years)
      if (maxYears >= 7) return "senior"
      if (maxYears >= 3) return "mid"
    }

    if (midKeywords.some((keyword) => text.includes(keyword))) {
      return "mid"
    }

    return "junior"
  }

  private generateJobRecommendations(
    skills: string[],
    experienceLevel: "junior" | "mid" | "senior",
  ): Array<{
    title: string
    match_percentage: number
    required_skills: string[]
    salary_range: string
  }> {
    const jobTemplates = {
      junior: [
        {
          title: "Junior Software Developer",
          baseMatch: 85,
          skills: ["JavaScript", "HTML", "CSS"],
          salary: "$60,000 - $80,000",
        },
        {
          title: "Frontend Developer",
          baseMatch: 80,
          skills: ["React", "JavaScript", "CSS"],
          salary: "$65,000 - $85,000",
        },
        {
          title: "Backend Developer",
          baseMatch: 75,
          skills: ["Node.js", "Python", "SQL"],
          salary: "$70,000 - $90,000",
        },
        { title: "QA Engineer", baseMatch: 70, skills: ["Testing", "Automation", "SQL"], salary: "$55,000 - $75,000" },
      ],
      mid: [
        {
          title: "Full Stack Developer",
          baseMatch: 90,
          skills: ["React", "Node.js", "JavaScript"],
          salary: "$90,000 - $120,000",
        },
        {
          title: "Software Engineer",
          baseMatch: 85,
          skills: ["Python", "JavaScript", "SQL"],
          salary: "$95,000 - $125,000",
        },
        {
          title: "DevOps Engineer",
          baseMatch: 80,
          skills: ["AWS", "Docker", "Kubernetes"],
          salary: "$100,000 - $130,000",
        },
        { title: "Data Engineer", baseMatch: 75, skills: ["Python", "SQL", "Spark"], salary: "$105,000 - $135,000" },
      ],
      senior: [
        {
          title: "Senior Software Engineer",
          baseMatch: 95,
          skills: ["JavaScript", "Python", "AWS"],
          salary: "$130,000 - $160,000",
        },
        {
          title: "Technical Lead",
          baseMatch: 90,
          skills: ["Leadership", "Architecture", "Mentoring"],
          salary: "$140,000 - $170,000",
        },
        {
          title: "Principal Engineer",
          baseMatch: 85,
          skills: ["System Design", "Leadership", "Strategy"],
          salary: "$160,000 - $200,000",
        },
        {
          title: "Engineering Manager",
          baseMatch: 80,
          skills: ["Management", "Leadership", "Strategy"],
          salary: "$150,000 - $190,000",
        },
      ],
    }

    return jobTemplates[experienceLevel].map((job) => {
      const matchingSkills = job.skills.filter((skill) =>
        skills.some((userSkill) => userSkill.toLowerCase().includes(skill.toLowerCase())),
      )
      const matchBonus = matchingSkills.length * 5

      return {
        title: job.title,
        match_percentage: Math.min(job.baseMatch + matchBonus + Math.floor(Math.random() * 5), 100),
        required_skills: [...matchingSkills, ...skills.slice(0, 3)].slice(0, 5),
        salary_range: job.salary,
      }
    })
  }

  private generateImprovementSuggestions(
    text: string,
    skills: string[],
  ): Array<{
    category: "skills" | "experience" | "format"
    suggestion: string
    priority: "high" | "medium" | "low"
  }> {
    const suggestions = []

    // Skills suggestions
    if (skills.length < 5) {
      suggestions.push({
        category: "skills" as const,
        suggestion:
          "Add more technical skills to strengthen your profile. Consider learning cloud technologies like AWS or containerization with Docker.",
        priority: "high" as const,
      })
    }

    // Experience suggestions
    if (!text.includes("led") && !text.includes("managed") && !text.includes("improved")) {
      suggestions.push({
        category: "experience" as const,
        suggestion:
          "Include leadership experience and quantifiable achievements with specific metrics (e.g., 'Improved performance by 30%', 'Led team of 5 developers').",
        priority: "high" as const,
      })
    }

    // Format suggestions
    if (!text.includes("bachelor") && !text.includes("degree") && !text.includes("university")) {
      suggestions.push({
        category: "format" as const,
        suggestion:
          "Consider adding your educational background and relevant certifications to strengthen your profile.",
        priority: "medium" as const,
      })
    }

    if (!text.includes("github") && !text.includes("portfolio") && !text.includes("project")) {
      suggestions.push({
        category: "format" as const,
        suggestion: "Include links to your GitHub profile, portfolio, or notable projects to showcase your work.",
        priority: "medium" as const,
      })
    }

    suggestions.push({
      category: "format" as const,
      suggestion:
        "Optimize your resume for ATS (Applicant Tracking Systems) by using standard section headers and keywords from job descriptions.",
      priority: "low" as const,
    })

    return suggestions
  }

  private generateInterviewQuestions(
    skills: string[],
    experienceLevel: "junior" | "mid" | "senior",
  ): Array<{
    question: string
    category: "technical" | "behavioral" | "situational"
    difficulty: "easy" | "medium" | "hard"
  }> {
    const primarySkill = skills[0] || "programming"
    const difficultyLevel = experienceLevel === "senior" ? "hard" : experienceLevel === "mid" ? "medium" : "easy"

    const questionTemplates = {
      technical: [
        {
          question: `Explain your experience with ${primarySkill} and how you've used it in projects.`,
          difficulty: "medium" as const,
        },
        {
          question: "Describe the difference between synchronous and asynchronous programming.",
          difficulty: "medium" as const,
        },
        { question: "How would you optimize a slow-performing web application?", difficulty: "hard" as const },
        { question: "What are the principles of RESTful API design?", difficulty: "medium" as const },
        { question: "Explain the concept of database normalization.", difficulty: "medium" as const },
        { question: "How do you handle error handling in your applications?", difficulty: "easy" as const },
      ],
      behavioral: [
        {
          question: "Tell me about a challenging project you worked on and how you overcame obstacles.",
          difficulty: "medium" as const,
        },
        { question: "Describe a time when you had to learn a new technology quickly.", difficulty: "easy" as const },
        { question: "How do you handle conflicts within your development team?", difficulty: "medium" as const },
        {
          question: "Give an example of when you had to make a difficult technical decision.",
          difficulty: "hard" as const,
        },
        { question: "Describe a time when you had to work under tight deadlines.", difficulty: "easy" as const },
        { question: "How do you stay updated with new technologies and industry trends?", difficulty: "easy" as const },
      ],
      situational: [
        {
          question: "How would you approach debugging a production issue that's affecting users?",
          difficulty: "medium" as const,
        },
        {
          question: "What would you do if you disagreed with a technical decision made by your team lead?",
          difficulty: "medium" as const,
        },
        {
          question: "How would you handle a situation where project requirements change frequently?",
          difficulty: "easy" as const,
        },
        {
          question: "If you had to choose between meeting a deadline and ensuring code quality, what would you do?",
          difficulty: "hard" as const,
        },
        { question: "How would you onboard a new team member to your project?", difficulty: "medium" as const },
      ],
    }

    const questions: Array<{
      question: string
      category: "technical" | "behavioral" | "situational"
      difficulty: "easy" | "medium" | "hard"
    }> = []

    Object.entries(questionTemplates).forEach(([category, categoryQuestions]) => {
      const selectedQuestions = categoryQuestions.slice(0, 3)
      selectedQuestions.forEach((q) => {
        questions.push({
          question: q.question,
          category: category as "technical" | "behavioral" | "situational",
          difficulty: q.difficulty,
        })
      })
    })

    return questions
  }

  private createAnalysisPrompt(resumeText: string): string {
    return `
Analyze this resume text and provide a comprehensive assessment in JSON format:

Resume Text:
${resumeText}

Please return your analysis in this exact JSON structure:
{
  "skills": {
    "technical": ["list of technical skills found"],
    "soft": ["list of soft skills identified"],
    "industry": ["industry-specific skills"]
  },
  "experience_level": "junior|mid|senior",
  "job_recommendations": [
    {
      "title": "Job Title",
      "match_percentage": 85,
      "required_skills": ["skill1", "skill2"],
      "salary_range": "$XX,XXX - $XX,XXX"
    }
  ],
  "improvement_suggestions": [
    {
      "category": "skills|experience|format",
      "suggestion": "Specific actionable advice",
      "priority": "high|medium|low"
    }
  ],
  "interview_questions": [
    {
      "question": "Relevant interview question",
      "category": "technical|behavioral|situational",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Focus on:
1. Extracting all relevant skills (technical, soft, and industry-specific) from the actual resume text
2. Determining experience level based on years of experience and role progression mentioned
3. Suggesting job positions that match the candidate's actual profile and skills
4. Providing actionable improvement suggestions based on what's missing or could be enhanced
5. Creating relevant interview questions based on the candidate's background and skills
6. Being specific and actionable in all recommendations based on the resume content
`
  }

  private calculateOverallScore(analysis: any): number {
    let score = 70 // Base score

    // Add points for skills diversity
    const totalSkills =
      (analysis.skills?.technical?.length || 0) +
      (analysis.skills?.soft?.length || 0) +
      (analysis.skills?.industry?.length || 0)
    score += Math.min(totalSkills * 1.5, 25)

    // Add points for experience level
    if (analysis.experience_level === "senior") score += 15
    else if (analysis.experience_level === "mid") score += 10

    // Subtract points for high-priority improvements
    const highPriorityIssues = (analysis.improvement_suggestions || []).filter((s: any) => s.priority === "high").length
    score -= highPriorityIssues * 3

    return Math.max(Math.min(score, 100), 0)
  }
}

export const aiAnalysisService = new AIAnalysisService()
