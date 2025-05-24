import { chatPDFService } from "./chatpdf-service"
import { aiAnalysisService } from "./ai-analysis"

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
    company_type: string
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
  extracted_data: any
  chatpdf_source_id?: string
  analysis_method: "chatpdf" | "fallback"
}

export class EnhancedAIAnalysisService {
  private openaiApiKey: string
  private huggingFaceApiKey: string

  constructor() {
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""
    this.huggingFaceApiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || ""
  }

  async analyzeResumeWithChatPDF(file: File): Promise<ResumeAnalysis> {
    console.log("Starting resume analysis with ChatPDF...")

    // First test ChatPDF connection
    if (process.env.NEXT_PUBLIC_CHATPDF_API_KEY) {
      try {
        console.log("Testing ChatPDF connection...")
        const connectionTest = await chatPDFService.testConnection()

        if (!connectionTest.success) {
          console.warn("ChatPDF connection test failed:", connectionTest.message)
          console.log("Falling back to standard analysis...")
          return await this.performFallbackAnalysis(file)
        }

        console.log("ChatPDF connection successful, proceeding with ChatPDF analysis...")
        return await this.performChatPDFAnalysis(file)
      } catch (error) {
        console.warn("ChatPDF analysis failed, falling back to standard analysis:", error)
        return await this.performFallbackAnalysis(file)
      }
    } else {
      console.log("ChatPDF API key not available, using fallback analysis")
      return await this.performFallbackAnalysis(file)
    }
  }

  private async performChatPDFAnalysis(file: File): Promise<ResumeAnalysis> {
    let sourceId: string | null = null

    try {
      // Step 1: Upload PDF to ChatPDF
      console.log("Step 1: Uploading PDF to ChatPDF...")
      sourceId = await chatPDFService.uploadPDF(file)
      console.log("PDF uploaded successfully, sourceId:", sourceId)

      // Step 2: Extract structured data from PDF
      console.log("Step 2: Extracting resume data...")
      const extractedData = await chatPDFService.extractResumeData(sourceId)
      console.log("Resume data extracted successfully")

      // Step 3: Perform comprehensive analysis using ChatPDF
      console.log("Step 3: Performing AI analysis...")
      const analysis = await this.performChatPDFAnalysisSteps(sourceId, extractedData)
      console.log("AI analysis completed successfully")

      // Step 4: Calculate overall score
      const overallScore = this.calculateOverallScore(analysis)

      return {
        ...analysis,
        overall_score: overallScore,
        extracted_data: extractedData,
        chatpdf_source_id: sourceId,
        analysis_method: "chatpdf",
      }
    } catch (error) {
      console.error("ChatPDF analysis failed at step:", error)

      // Clean up if we created a source
      if (sourceId) {
        try {
          await chatPDFService.deletePDF(sourceId)
        } catch (cleanupError) {
          console.warn("Failed to cleanup ChatPDF source:", cleanupError)
        }
      }

      throw error
    }
  }

  private async performFallbackAnalysis(file: File): Promise<ResumeAnalysis> {
    console.log("Performing fallback analysis...")

    try {
      // Use the original AI analysis service
      const analysis = await aiAnalysisService.analyzeResume(file)

      return {
        skills: analysis.skills,
        experience_level: analysis.experience_level,
        job_recommendations: analysis.job_recommendations,
        improvement_suggestions: analysis.improvement_suggestions,
        interview_questions: analysis.interview_questions,
        overall_score: analysis.overall_score,
        extracted_data: { fullText: analysis.extracted_text },
        analysis_method: "fallback",
      }
    } catch (error) {
      console.error("Fallback analysis also failed:", error)
      throw new Error("Both ChatPDF and fallback analysis failed. Please try again.")
    }
  }

  private async performChatPDFAnalysisSteps(
    sourceId: string,
    extractedData: any,
  ): Promise<Omit<ResumeAnalysis, "overall_score" | "extracted_data" | "chatpdf_source_id" | "analysis_method">> {
    console.log("Performing ChatPDF analysis steps...")

    try {
      // Get the full resume content first
      const fullContentResponse = await chatPDFService.chatWithPDF(sourceId, [
        {
          role: "user",
          content: `Please extract and provide the complete text content of this resume. Include all sections: personal information, work experience, education, skills, projects, and any other content. Provide it as plain text without formatting.`,
        },
      ])

      console.log("Full content extracted, length:", fullContentResponse.content.length)

      // Now use OpenAI to analyze the extracted content
      if (this.openaiApiKey) {
        console.log("Using OpenAI for detailed analysis...")
        return await this.analyzeWithOpenAI(fullContentResponse.content)
      } else {
        console.log("No OpenAI key, using ChatPDF for analysis...")
        return await this.analyzeWithChatPDF(sourceId)
      }
    } catch (error) {
      console.error("ChatPDF analysis steps failed:", error)
      throw error
    }
  }

  private async analyzeWithOpenAI(
    resumeContent: string,
  ): Promise<Omit<ResumeAnalysis, "overall_score" | "extracted_data" | "chatpdf_source_id" | "analysis_method">> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                "You are an expert resume analyzer and career advisor. Analyze resumes thoroughly and provide detailed, accurate insights.",
            },
            {
              role: "user",
              content: `Analyze this resume and provide a comprehensive analysis in JSON format:

RESUME CONTENT:
${resumeContent}

Please provide your analysis in this exact JSON structure:
{
  "skills": {
    "technical": ["list of technical skills found"],
    "soft": ["list of soft skills identified"],
    "industry": ["list of industry-specific skills"]
  },
  "experience_level": "junior|mid|senior",
  "job_recommendations": [
    {
      "title": "Job Title",
      "match_percentage": 85,
      "required_skills": ["skill1", "skill2"],
      "salary_range": "$X,000 - $Y,000",
      "company_type": "Company Type"
    }
  ],
  "improvement_suggestions": [
    {
      "category": "skills|experience|format",
      "suggestion": "Specific suggestion",
      "priority": "high|medium|low"
    }
  ],
  "interview_questions": [
    {
      "question": "Interview question",
      "category": "technical|behavioral|situational",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Base your analysis on the actual content provided. Be specific and accurate.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      // Parse the JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        console.log("OpenAI analysis completed successfully")
        return analysis
      } else {
        throw new Error("Failed to parse OpenAI response")
      }
    } catch (error) {
      console.error("OpenAI analysis failed:", error)
      throw error
    }
  }

  private async analyzeWithChatPDF(
    sourceId: string,
  ): Promise<Omit<ResumeAnalysis, "overall_score" | "extracted_data" | "chatpdf_source_id" | "analysis_method">> {
    // Detailed ChatPDF analysis with specific questions
    const skillsResponse = await chatPDFService.chatWithPDF(sourceId, [
      {
        role: "user",
        content: `Analyze this resume and extract ALL skills mentioned. Categorize them as:
      
      TECHNICAL SKILLS: Programming languages, frameworks, tools, software, technologies, platforms
      SOFT SKILLS: Leadership, communication, teamwork, problem-solving, management abilities
      INDUSTRY SKILLS: Domain-specific expertise, certifications, methodologies
      
      List each skill you find. Be comprehensive and specific.`,
      },
    ])

    const experienceResponse = await chatPDFService.chatWithPDF(sourceId, [
      {
        role: "user",
        content: `Determine the experience level of this candidate:
      - JUNIOR: 0-2 years of experience, entry-level positions, recent graduate
      - MID: 3-6 years of experience, some leadership, multiple roles
      - SENIOR: 7+ years of experience, leadership roles, senior positions
      
      Based on job titles, years mentioned, and responsibilities, what is their level? Explain your reasoning.`,
      },
    ])

    const jobsResponse = await chatPDFService.chatWithPDF(sourceId, [
      {
        role: "user",
        content: `Based on this candidate's background, recommend 4-5 specific job positions they would be qualified for. For each job, provide:
      - Exact job title
      - Match percentage (realistic assessment)
      - Required skills they already possess
      - Estimated salary range for their location/experience
      - Type of company (startup, enterprise, consulting, etc.)
      
      Be specific and realistic based on their actual experience and skills.`,
      },
    ])

    const improvementsResponse = await chatPDFService.chatWithPDF(sourceId, [
      {
        role: "user",
        content: `Provide 4-5 specific, actionable improvement suggestions for this resume:
      
      SKILLS: What technical or soft skills should they add?
      EXPERIENCE: How can they better present their achievements?
      FORMAT: What structural improvements would help?
      
      For each suggestion, specify the category and priority level (high/medium/low).`,
      },
    ])

    const questionsResponse = await chatPDFService.chatWithPDF(sourceId, [
      {
        role: "user",
        content: `Generate 8-10 interview questions specifically tailored to this candidate's background:
      
      TECHNICAL: Questions about their specific technologies and skills
      BEHAVIORAL: Questions about their experience and achievements
      SITUATIONAL: Scenario-based questions for their level
      
      Make questions specific to their actual background, not generic.`,
      },
    ])

    // Parse the responses into structured data
    return {
      skills: this.parseSkillsFromChatPDF(skillsResponse.content),
      experience_level: this.parseExperienceLevel(experienceResponse.content),
      job_recommendations: this.parseJobRecommendations(jobsResponse.content),
      improvement_suggestions: this.parseImprovements(improvementsResponse.content),
      interview_questions: this.parseInterviewQuestions(questionsResponse.content),
    }
  }

  private parseSkillsFromChatPDF(content: string): { technical: string[]; soft: string[]; industry: string[] } {
    const technical: string[] = []
    const soft: string[] = []
    const industry: string[] = []

    // Common technical skills to look for
    const techSkills = [
      "JavaScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "PHP",
      "Ruby",
      "Go",
      "Rust",
      "TypeScript",
      "React",
      "Angular",
      "Vue",
      "Node.js",
      "Express",
      "Django",
      "Flask",
      "Spring",
      "Laravel",
      "HTML",
      "CSS",
      "SASS",
      "SCSS",
      "Bootstrap",
      "Tailwind",
      "SQL",
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "SQLite",
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "Git",
      "GitHub",
      "GitLab",
      "Linux",
      "Windows",
      "macOS",
      "Ubuntu",
      "CentOS",
      "Figma",
      "Photoshop",
      "Illustrator",
      "Sketch",
      "Adobe XD",
    ]

    const softSkills = [
      "Leadership",
      "Communication",
      "Teamwork",
      "Problem Solving",
      "Critical Thinking",
      "Project Management",
      "Time Management",
      "Adaptability",
      "Creativity",
      "Collaboration",
      "Analytical Skills",
      "Decision Making",
      "Conflict Resolution",
      "Mentoring",
      "Coaching",
    ]

    // Extract skills mentioned in the content
    techSkills.forEach((skill) => {
      if (content.toLowerCase().includes(skill.toLowerCase())) {
        technical.push(skill)
      }
    })

    softSkills.forEach((skill) => {
      if (content.toLowerCase().includes(skill.toLowerCase())) {
        soft.push(skill)
      }
    })

    // Look for industry-specific terms
    const industryTerms = [
      "Agile",
      "Scrum",
      "DevOps",
      "CI/CD",
      "Machine Learning",
      "AI",
      "Data Science",
      "Cybersecurity",
      "Cloud Computing",
    ]
    industryTerms.forEach((term) => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        industry.push(term)
      }
    })

    return {
      technical: technical.slice(0, 10),
      soft: soft.slice(0, 8),
      industry: industry.slice(0, 6),
    }
  }

  private parseExperienceLevel(content: string): "junior" | "mid" | "senior" {
    const text = content.toLowerCase()

    if (
      text.includes("senior") ||
      text.includes("lead") ||
      text.includes("principal") ||
      text.includes("7+") ||
      text.includes("8+") ||
      text.includes("9+") ||
      text.includes("10+")
    ) {
      return "senior"
    } else if (
      text.includes("mid") ||
      text.includes("3") ||
      text.includes("4") ||
      text.includes("5") ||
      text.includes("6")
    ) {
      return "mid"
    }
    return "junior"
  }

  private parseJobRecommendations(content: string): Array<{
    title: string
    match_percentage: number
    required_skills: string[]
    salary_range: string
    company_type: string
  }> {
    // Extract job titles and create realistic recommendations
    const recommendations = []
    const lines = content.split("\n")

    for (const line of lines) {
      if (
        line.toLowerCase().includes("engineer") ||
        line.toLowerCase().includes("developer") ||
        line.toLowerCase().includes("analyst") ||
        line.toLowerCase().includes("manager")
      ) {
        const title = line
          .trim()
          .replace(/^[-*•]\s*/, "")
          .split(":")[0]
          .trim()
        if (title && title.length > 5 && title.length < 50) {
          recommendations.push({
            title: title,
            match_percentage: Math.floor(Math.random() * 20) + 75, // 75-95%
            required_skills: ["JavaScript", "Python", "SQL"], // Default skills
            salary_range: "$70,000 - $120,000",
            company_type: "Technology",
          })
        }
      }
    }

    // If no jobs found, provide defaults based on common roles
    if (recommendations.length === 0) {
      return [
        {
          title: "Software Engineer",
          match_percentage: 85,
          required_skills: ["JavaScript", "React", "Node.js"],
          salary_range: "$80,000 - $120,000",
          company_type: "Technology",
        },
        {
          title: "Full Stack Developer",
          match_percentage: 80,
          required_skills: ["JavaScript", "Python", "SQL"],
          salary_range: "$75,000 - $115,000",
          company_type: "Startup",
        },
      ]
    }

    return recommendations.slice(0, 4)
  }

  private parseImprovements(content: string): Array<{
    category: "skills" | "experience" | "format"
    suggestion: string
    priority: "high" | "medium" | "low"
  }> {
    const improvements = []
    const lines = content.split("\n")

    for (const line of lines) {
      if (
        line.trim() &&
        (line.includes("suggest") || line.includes("recommend") || line.includes("improve") || line.includes("add"))
      ) {
        const suggestion = line.trim().replace(/^[-*•]\s*/, "")
        if (suggestion.length > 10) {
          improvements.push({
            category: line.toLowerCase().includes("skill")
              ? ("skills" as const)
              : line.toLowerCase().includes("format")
                ? ("format" as const)
                : ("experience" as const),
            suggestion: suggestion,
            priority:
              line.toLowerCase().includes("important") || line.toLowerCase().includes("critical")
                ? ("high" as const)
                : ("medium" as const),
          })
        }
      }
    }

    if (improvements.length === 0) {
      return [
        {
          category: "skills",
          suggestion: "Consider adding cloud technologies like AWS to strengthen your profile",
          priority: "medium",
        },
        {
          category: "experience",
          suggestion: "Include more quantifiable achievements with specific metrics",
          priority: "high",
        },
      ]
    }

    return improvements.slice(0, 5)
  }

  private parseInterviewQuestions(content: string): Array<{
    question: string
    category: "technical" | "behavioral" | "situational"
    difficulty: "easy" | "medium" | "hard"
  }> {
    const questions = []
    const lines = content.split("\n")

    for (const line of lines) {
      if (line.includes("?") && line.trim().length > 20) {
        const question = line.trim().replace(/^[-*•]\s*/, "")
        const category = line.toLowerCase().includes("technical")
          ? ("technical" as const)
          : line.toLowerCase().includes("behavioral")
            ? ("behavioral" as const)
            : ("situational" as const)

        questions.push({
          question: question,
          category: category,
          difficulty: "medium" as const,
        })
      }
    }

    if (questions.length === 0) {
      return [
        {
          question: "Tell me about your experience with the technologies mentioned in your resume",
          category: "technical",
          difficulty: "medium",
        },
        {
          question: "Describe a challenging project you worked on and how you overcame obstacles",
          category: "behavioral",
          difficulty: "medium",
        },
      ]
    }

    return questions.slice(0, 8)
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

    return Math.max(Math.min(score, 100), 0)
  }

  async askResumeQuestion(sourceId: string, question: string): Promise<string> {
    try {
      const response = await chatPDFService.chatWithPDF(sourceId, [
        {
          role: "user",
          content: question,
        },
      ])
      return response.content
    } catch (error) {
      console.error("Failed to ask resume question:", error)
      throw error
    }
  }

  async cleanupChatPDF(sourceId: string): Promise<void> {
    try {
      await chatPDFService.deletePDF(sourceId)
    } catch (error) {
      console.warn("Failed to cleanup ChatPDF source:", error)
    }
  }
}

export const enhancedAIAnalysisService = new EnhancedAIAnalysisService()
