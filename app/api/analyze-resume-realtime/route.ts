import { NextRequest, NextResponse } from "next/server"
import { ResumeAnalyzer } from "@/services/resume-analyzer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const filename = file?.name || "unknown"

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
          timestamp: new Date().toISOString(),
          filename,
          analysis_method: "realtime_api_failed",
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    // Validate file size (5MB limit for real-time processing)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB for real-time analysis" }, { status: 400 })
    }

    console.log(`Real-time processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Initialize analyzer and process the resume
    const analyzer = new ResumeAnalyzer()
    const result = await analyzer.analyzeResume(buffer, filename)

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      filename,
      analysis_method: "node_analysis",
    })
  } catch (error) {
    console.error("Real-time resume analysis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Real-time analysis failed",
        timestamp: new Date().toISOString(),
        filename: "unknown",
        analysis_method: "realtime_api_failed",
      },
      { status: 500 }
    )
  }
}
