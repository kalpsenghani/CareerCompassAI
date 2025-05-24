"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, X, CheckCircle, AlertCircle, Brain, Zap, Target, Download, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { aiAnalysisService } from "@/services/ai-analysis"
import { exportToPDF, shareResults } from "@/services/export-service"

interface UploadedFile {
  file: File
  progress: number
  status: "uploading" | "analyzing" | "completed" | "error"
  analysis?: any
  analysisMethod?: "openai" | "huggingface" | "intelligent"
  errorMessage?: string
}

export function EnhancedResumeUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Process each file
    newFiles.forEach((uploadedFile) => {
      processFile(uploadedFile)
    })
  }, [])

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        setUploadedFiles((prev) => prev.map((file) => (file.file === uploadedFile.file ? { ...file, progress } : file)))
      }

      // Start analysis
      setUploadedFiles((prev) =>
        prev.map((file) => (file.file === uploadedFile.file ? { ...file, status: "analyzing" } : file)),
      )

      // Perform real AI analysis with actual file content
      const analysis = await aiAnalysisService.analyzeResume(uploadedFile.file)

      // Determine which analysis method was used
      let analysisMethod: "openai" | "huggingface" | "intelligent" = "intelligent"
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        analysisMethod = "openai"
      } else if (process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY) {
        analysisMethod = "huggingface"
      }

      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.file === uploadedFile.file
            ? {
                ...file,
                status: "completed",
                analysisMethod,
                analysis: {
                  score: analysis.overall_score,
                  skills: analysis.skills.technical.slice(0, 5),
                  recommendations: analysis.improvement_suggestions.slice(0, 3),
                  jobMatches: analysis.job_recommendations.length,
                  experienceLevel: analysis.experience_level,
                  fullAnalysis: analysis,
                  extractedText: analysis.extracted_text,
                },
              }
            : file,
        ),
      )
    } catch (error) {
      console.error("Analysis failed:", error)
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.file === uploadedFile.file
            ? {
                ...file,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Analysis failed",
              }
            : file,
        ),
      )
    }
  }

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== fileToRemove))
  }

  const handleExportPDF = async (analysis: any, fileName: string) => {
    try {
      await exportToPDF(analysis, fileName)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export PDF. Please try again.")
    }
  }

  const handleShareResults = async (analysis: any, fileName: string) => {
    try {
      await shareResults(analysis, fileName)
    } catch (error) {
      console.error("Share failed:", error)
      alert("Failed to share results. Please try again.")
    }
  }

  const getAnalysisMethodIcon = (method?: string) => {
    switch (method) {
      case "openai":
        return <Brain className="h-4 w-4 text-purple-600" />
      case "huggingface":
        return <Zap className="h-4 w-4 text-orange-600" />
      default:
        return <Target className="h-4 w-4 text-blue-600" />
    }
  }

  const getAnalysisMethodLabel = (method?: string) => {
    switch (method) {
      case "openai":
        return "OpenAI GPT"
      case "huggingface":
        return "Hugging Face"
      default:
        return "Intelligent Analysis"
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "text-center cursor-pointer transition-colors rounded-lg p-8",
              isDragActive ? "bg-blue-50" : "hover:bg-gray-50",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? "Drop your resume here" : "Upload your resume"}
            </h3>
            <p className="text-gray-600 mb-4">Get real AI-powered analysis of your actual resume content</p>
            <p className="text-sm text-gray-500 mb-4">Supports PDF, DOC, DOCX, and TXT files up to 10MB</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-10 w-10 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 truncate">{uploadedFile.file.name}</p>
                      <p className="text-sm text-gray-500">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {uploadedFile.analysisMethod && (
                        <div className="flex items-center gap-2 mt-1">
                          {getAnalysisMethodIcon(uploadedFile.analysisMethod)}
                          <span className="text-xs text-gray-600">
                            Analyzed with {getAnalysisMethodLabel(uploadedFile.analysisMethod)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.file)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {uploadedFile.status === "uploading" && (
                  <div className="space-y-2">
                    <Progress value={uploadedFile.progress} className="w-full" />
                    <p className="text-sm text-gray-500">Uploading... {uploadedFile.progress}%</p>
                  </div>
                )}

                {uploadedFile.status === "analyzing" && (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Extracting and analyzing resume content...</p>
                      <p className="text-xs text-gray-500">Reading your actual resume data</p>
                    </div>
                  </div>
                )}

                {uploadedFile.status === "completed" && uploadedFile.analysis && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">Analysis completed successfully!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{uploadedFile.analysis.score}%</div>
                        <div className="text-sm text-blue-700">Resume Score</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{uploadedFile.analysis.skills.length}</div>
                        <div className="text-sm text-green-700">Skills Found</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">{uploadedFile.analysis.jobMatches}</div>
                        <div className="text-sm text-purple-700">Job Matches</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-600 capitalize">
                          {uploadedFile.analysis.experienceLevel}
                        </div>
                        <div className="text-sm text-orange-700">Experience Level</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Top Skills Identified</h4>
                        <div className="flex flex-wrap gap-2">
                          {uploadedFile.analysis.skills.map((skill: string, skillIndex: number) => (
                            <Badge key={skillIndex} variant="secondary" className="bg-blue-100 text-blue-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Recommendations</h4>
                        <div className="space-y-2">
                          {uploadedFile.analysis.recommendations.map((rec: any, recIndex: number) => (
                            <div key={recIndex} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-sm text-gray-700">{rec.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {uploadedFile.analysis.extractedText && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Extracted Text Preview</h4>
                          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <p className="text-xs text-gray-600">
                              {uploadedFile.analysis.extractedText.substring(0, 300)}...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button className="flex-1">View Full Analysis</Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleExportPDF(uploadedFile.analysis.fullAnalysis, uploadedFile.file.name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShareResults(uploadedFile.analysis.fullAnalysis, uploadedFile.file.name)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                )}

                {uploadedFile.status === "error" && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600 font-medium">Analysis failed</p>
                      <p className="text-xs text-gray-500">
                        {uploadedFile.errorMessage || "Please try uploading again"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
