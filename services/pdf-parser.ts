export class PDFParser {
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Convert PDF to text using a more sophisticated approach
      const text = await this.parsePDFContent(uint8Array)
      return text
    } catch (error) {
      console.error("PDF parsing error:", error)
      throw new Error("Failed to extract text from PDF")
    }
  }

  private static async parsePDFContent(uint8Array: Uint8Array): Promise<string> {
    try {
      // Simple PDF text extraction - in production, use pdf-parse library
      const decoder = new TextDecoder("utf-8", { ignoreBOM: true })
      const text = decoder.decode(uint8Array)

      // Extract text between stream objects
      const textMatches = text.match(/stream\s*(.*?)\s*endstream/gs)
      let extractedText = ""

      if (textMatches) {
        textMatches.forEach((match) => {
          // Remove PDF commands and extract readable text
          let content = match.replace(/stream|endstream/g, "")
          content = content.replace(/[^\x20-\x7E\n\r]/g, " ")
          content = content.replace(/\s+/g, " ")
          extractedText += content + " "
        })
      }

      // If no text found in streams, try alternative extraction
      if (!extractedText.trim()) {
        // Look for text objects
        const textObjects = text.match(/BT\s*(.*?)\s*ET/gs)
        if (textObjects) {
          textObjects.forEach((obj) => {
            let content = obj.replace(/BT|ET/g, "")
            content = content.replace(/[^\x20-\x7E\n\r]/g, " ")
            content = content.replace(/\s+/g, " ")
            extractedText += content + " "
          })
        }
      }

      // Clean up the extracted text
      extractedText = extractedText
        .replace(/\s+/g, " ")
        .replace(/[^\w\s@.-]/g, " ")
        .trim()

      if (!extractedText || extractedText.length < 50) {
        throw new Error("Could not extract meaningful text from PDF")
      }

      return extractedText
    } catch (error) {
      throw new Error("PDF content extraction failed")
    }
  }

  static async extractTextFromDOC(file: File): Promise<string> {
    try {
      // For DOC/DOCX files, try to read as text
      const text = await file.text()
      return text
    } catch (error) {
      throw new Error("Failed to extract text from document")
    }
  }
}
