"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { aiAnalysisService } from "@/services/ai-analysis"

interface UploadedFile {
  file: File
  progress: number
  status: "uploading" | "analyzing" | "completed" | "error"
  analysis?: any
}

export function ResumeUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Simulate upload and analysis
    newFiles.forEach((uploadedFile, index) => {
      simulateUpload(uploadedFile, index)
    })
  }, [])

  const simulateUpload = async (uploadedFile: UploadedFile, index: number) => {
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setUploadedFiles((prev) =>
          prev.map((file, i) => (file.file === uploadedFile.file ? { ...file, progress } : file)),
        )
      }

      // Start analysis
      setUploadedFiles((prev) =>
        prev.map((file) => (file.file === uploadedFile.file ? { ...file, status: "analyzing" } : file)),
      )

      // Extract text from file (simplified for demo)
      let extractedText = ""
      try {
        if (uploadedFile.file.type === "application/pdf") {
          // For PDF files, use a sample text for demo purposes
          extractedText = `
          John Doe
          Software Engineer
          
          Experience:
          - 5 years of experience in full-stack development
          - Proficient in JavaScript, React, Node.js, Python
          - Experience with AWS, Docker, and microservices
          - Led a team of 3 developers on multiple projects
          
          Skills:
          - Frontend: React, Vue.js, HTML, CSS, TypeScript
          - Backend: Node.js, Python, Java, Express.js
          - Database: PostgreSQL, MongoDB, Redis
          - Cloud: AWS, Docker, Kubernetes
          - Tools: Git, Jenkins, JIRA
          
          Education:
          - Bachelor's in Computer Science
          - AWS Certified Solutions Architect
        `
        } else {
          // For other file types, try to read as text
          extractedText = await uploadedFile.file.text()
        }
      } catch (textError) {
        console.warn("Text extraction failed, using sample text:", textError)
        extractedText = "Sample resume text for analysis"
      }

      // Perform AI analysis with error handling
      const analysis = await aiAnalysisService.analyzeResume(extractedText)

      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.file === uploadedFile.file
            ? {
                ...file,
                status: "completed",
                analysis: {
                  score: analysis.overall_score,
                  skills: analysis.skills.technical.slice(0, 4), // Show first 4 skills
                  recommendations: analysis.improvement_suggestions.slice(0, 2),
                },
              }
            : file,
        ),
      )
    } catch (error) {
      console.error("Analysis failed:", error)
      setUploadedFiles((prev) =>
        prev.map((file) => (file.file === uploadedFile.file ? { ...file, status: "error" } : file)),
      )
    }
  }

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== fileToRemove))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? "Drop your resume here" : "Upload your resume"}
            </h3>
            <p className="text-gray-600 mb-4">Drag and drop your resume, or click to browse</p>
            <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX files up to 5MB</p>
            <Button className="mt-4">Choose File</Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h3>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{uploadedFile.file.name}</p>
                    <p className="text-sm text-gray-500">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>

                    {uploadedFile.status === "uploading" && (
                      <div className="mt-2">
                        <Progress value={uploadedFile.progress} className="w-full" />
                        <p className="text-xs text-gray-500 mt-1">Uploading... {uploadedFile.progress}%</p>
                      </div>
                    )}

                    {uploadedFile.status === "analyzing" && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-600">Analyzing with AI...</p>
                        </div>
                      </div>
                    )}

                    {uploadedFile.status === "completed" && uploadedFile.analysis && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-sm text-green-600">Analysis completed</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium">Resume Score: {uploadedFile.analysis.score}%</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Skills found: {uploadedFile.analysis.skills.join(", ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {uploadedFile.status === "error" && (
                      <div className="mt-2 flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-600">Analysis failed</p>
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.file)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
