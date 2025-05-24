import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a promise to handle the Python process
    const analysisResult = await new Promise((resolve, reject) => {
      // Path to the Python script
      const pythonScript = path.join(process.cwd(), "services", "resume_analyzer.py")

      // Spawn Python process
      const pythonProcess = spawn("python3", [
        "-c",
        `
import sys
import json
import base64
sys.path.append('${path.join(process.cwd(), "services")}')

from resume_analyzer import ResumeAnalyzer

# Read the base64 encoded PDF data from stdin
pdf_data = sys.stdin.buffer.read()

try:
    analyzer = ResumeAnalyzer()
    result = analyzer.analyze_resume(pdf_data, "${file.name}")
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`,
      ])

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            // Parse the last line as JSON (the result)
            const lines = output.trim().split("\n")
            const resultLine = lines[lines.length - 1]
            const result = JSON.parse(resultLine)

            if (result.error) {
              reject(new Error(result.error))
            } else {
              resolve(result)
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${parseError}\nOutput: ${output}\nError: ${errorOutput}`))
          }
        } else {
          reject(new Error(`Python process failed with code ${code}\nError: ${errorOutput}\nOutput: ${output}`))
        }
      })

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })

      // Send the PDF data to Python
      pythonProcess.stdin.write(buffer)
      pythonProcess.stdin.end()
    })

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Resume analysis failed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 })
  }
}
