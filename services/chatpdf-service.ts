interface ChatPDFSource {
  sourceId: string
}

interface ChatPDFMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatPDFResponse {
  content: string
  references?: Array<{ pageNumber: number }>
}

export class ChatPDFService {
  private apiKey: string
  private baseURL: string
  private timeout: number

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CHATPDF_API_KEY || ""
    this.baseURL = "https://api.chatpdf.com/v1"
    this.timeout = 30000 // 30 seconds timeout
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out after 30 seconds")
      }
      throw error
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      return { success: false, message: "ChatPDF API key not configured" }
    }

    try {
      console.log("Testing ChatPDF connection...")

      // Try a simple request to test the API key
      const response = await this.fetchWithTimeout(`${this.baseURL}/sources`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
        },
      })

      console.log("ChatPDF connection test response:", response.status)

      if (response.ok) {
        return { success: true, message: "ChatPDF API connection successful" }
      } else {
        const errorText = await response.text()
        return { success: false, message: `API test failed: ${response.status} - ${errorText}` }
      }
    } catch (error) {
      console.error("ChatPDF connection test error:", error)
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  async uploadPDF(file: File): Promise<string> {
    if (!this.apiKey) {
      throw new Error("ChatPDF API key not configured")
    }

    console.log("Uploading PDF to ChatPDF...", {
      fileName: file.name,
      size: file.size,
      type: file.type,
    })

    // Validate file
    if (file.type !== "application/pdf") {
      throw new Error("File must be a PDF")
    }

    if (file.size > 32 * 1024 * 1024) {
      throw new Error("File size must be less than 32MB")
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/sources/add-file`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
        },
        body: formData,
      })

      console.log("ChatPDF upload response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ChatPDF upload error response:", errorText)

        if (response.status === 401) {
          throw new Error("Invalid ChatPDF API key")
        } else if (response.status === 413) {
          throw new Error("File too large for ChatPDF")
        } else if (response.status === 429) {
          throw new Error("ChatPDF rate limit exceeded")
        } else {
          throw new Error(`ChatPDF upload failed: ${response.status} - ${errorText}`)
        }
      }

      const data: ChatPDFSource = await response.json()
      console.log("ChatPDF upload successful:", data.sourceId)
      return data.sourceId
    } catch (error) {
      console.error("ChatPDF upload error:", error)
      throw error
    }
  }

  async chatWithPDF(sourceId: string, messages: ChatPDFMessage[], includeReferences = true): Promise<ChatPDFResponse> {
    if (!this.apiKey) {
      throw new Error("ChatPDF API key not configured")
    }

    console.log("Chatting with PDF:", { sourceId, messageCount: messages.length })

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/chats/message`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId,
          messages,
          referenceSources: includeReferences,
        }),
      })

      console.log("ChatPDF chat response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ChatPDF chat error response:", errorText)

        if (response.status === 401) {
          throw new Error("Invalid ChatPDF API key")
        } else if (response.status === 404) {
          throw new Error("PDF source not found - it may have expired")
        } else if (response.status === 429) {
          throw new Error("ChatPDF rate limit exceeded")
        } else {
          throw new Error(`ChatPDF chat failed: ${response.status} - ${errorText}`)
        }
      }

      const result = await response.json()
      console.log("ChatPDF chat successful, response length:", result.content?.length || 0)
      return result
    } catch (error) {
      console.error("ChatPDF chat error:", error)
      throw error
    }
  }

  async deletePDF(sourceId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error("ChatPDF API key not configured")
    }

    console.log("Deleting PDF from ChatPDF:", sourceId)

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/sources/delete`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources: [sourceId],
        }),
      })

      console.log("ChatPDF delete response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ChatPDF delete error response:", errorText)
        throw new Error(`ChatPDF delete failed: ${response.status} - ${errorText}`)
      }

      console.log("ChatPDF delete successful")
    } catch (error) {
      console.error("ChatPDF delete error:", error)
      throw error
    }
  }

  async extractResumeData(sourceId: string): Promise<{
    personalInfo: any
    experience: any
    skills: any
    education: any
    fullText: string
  }> {
    console.log("Extracting resume data from ChatPDF:", sourceId)

    try {
      // Start with a simple test to make sure the PDF is accessible
      console.log("Testing PDF accessibility...")
      const testResponse = await this.chatWithPDF(sourceId, [
        {
          role: "user",
          content: "What type of document is this? Just give me a brief one-sentence answer.",
        },
      ])
      console.log("PDF accessibility test successful:", testResponse.content.substring(0, 100))

      // Extract personal information
      console.log("Extracting personal information...")
      const personalInfoResponse = await this.chatWithPDF(sourceId, [
        {
          role: "user",
          content: `Extract the personal information from this resume. Look for:
          - Full name
          - Email address
          - Phone number
          - Location/Address
          - LinkedIn profile
          - Portfolio/Website
          - Professional title/headline
          
          Return the information in a simple format. If any field is not found, skip it.`,
        },
      ])

      // Extract work experience
      console.log("Extracting work experience...")
      const experienceResponse = await this.chatWithPDF(sourceId, [
        {
          role: "user",
          content: `Extract all work experience from this resume. Look for:
          - Job titles
          - Company names
          - Employment dates
          - Key responsibilities
          - Achievements
          - Technologies used
          
          Provide a summary of the experience found.`,
        },
      ])

      // Extract skills
      console.log("Extracting skills...")
      const skillsResponse = await this.chatWithPDF(sourceId, [
        {
          role: "user",
          content: `Extract all skills mentioned in this resume. Categorize them as:
          - Technical skills (programming languages, frameworks, tools)
          - Soft skills (leadership, communication, etc.)
          - Industry-specific skills
          - Certifications
          
          List the skills you find.`,
        },
      ])

      // Extract education
      console.log("Extracting education...")
      const educationResponse = await this.chatWithPDF(sourceId, [
        {
          role: "user",
          content: `Extract education information from this resume:
          - Degrees and qualifications
          - Institution names
          - Graduation dates
          - Relevant coursework
          - Academic achievements
          
          Provide a summary of the education background.`,
        },
      ])

      // Get full text summary
      console.log("Getting full text summary...")
      const fullTextResponse = await this.chatWithPDF(sourceId, [
        {
          role: "user",
          content: `Provide a comprehensive summary of this entire resume including all sections and content. This will be used for further analysis.`,
        },
      ])

      console.log("Resume data extraction completed successfully")

      return {
        personalInfo: { raw: personalInfoResponse.content },
        experience: { raw: experienceResponse.content },
        skills: { raw: skillsResponse.content },
        education: { raw: educationResponse.content },
        fullText: fullTextResponse.content,
      }
    } catch (error) {
      console.error("Resume data extraction error:", error)
      throw error
    }
  }
}

export const chatPDFService = new ChatPDFService()
