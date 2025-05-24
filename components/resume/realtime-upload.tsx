"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Share2,
  Trash2,
  Zap,
  Clock,
  TrendingUp,
  Users,
  Award,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RealtimeAnalysis {
  success: boolean
  analysis_time: number
  overall_score: number
  grade: string
  experience_level: string
  experience_confidence: number
  skills: {
    technical: {
      programming_languages: string[]
      frameworks: string[]
      databases: string[]
      cloud_platforms: string[]
      devops: string[]
      tools: string[]
    }
    total_count: number
    confidence_scores: Record<string, number>
  }
  job_recommendations: Array<{
    title: string
    match_percentage: number
    salary_range: string
    category: string
    market_demand: string
  }>
  improvement_suggestions: Array<{
    category: string
    suggestion: string
    priority: string
    impact: string
  }>
  score_breakdown: {
    technical_skills: number
    experience: number
    content_quality: number
    completeness: number
  }
  feedback: string[]
  extraction_info: {
    method: string
    success: boolean
    extraction_time: number
    text_length: number
  }
}

interface UploadedFile {
  file: File
  status: "uploading" | "analyzing" | "completed" | "error"
  progress: number
  analysis?: RealtimeAnalysis
  errorMessage?: string
}

export function RealtimeUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Process each file immediately
    newFiles.forEach((uploadedFile) => {
      processFileRealtime(uploadedFile)
    })
  }, [])

  const processFileRealtime = async (uploadedFile: UploadedFile) => {
    setIsAnalyzing(true)

    try {
      // Simulate upload progress (fast for real-time)
      for (let progress = 0; progress <= 100; progress += 50) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setUploadedFiles((prev) => prev.map((file) => (file.file === uploadedFile.file ? { ...file, progress } : file)))
      }

      // Start real-time analysis
      setUploadedFiles((prev) =>
        prev.map((file) => (file.file === uploadedFile.file ? { ...file, status: "analyzing" } : file)),
      )

      // Create form data
      const formData = new FormData()
      formData.append("file", uploadedFile.file)

      // Call real-time analysis API
      const startTime = Date.now()
      const response = await fetch("/api/analyze-resume-realtime", {
        method: "POST",
        body: formData,
      })

      const analysisTime = (Date.now() - startTime) / 1000

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Real-time analysis failed")
      }

      const analysis: RealtimeAnalysis = await response.json()

      if (!analysis.success) {
        throw new Error(analysis.error || "Analysis was not successful")
      }

      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.file === uploadedFile.file
            ? {
                ...file,
                status: "completed",
                analysis: {
                  ...analysis,
                  analysis_time: analysisTime, // Use actual API call time
                },
              }
            : file,
        ),
      )
    } catch (error) {
      console.error("Real-time analysis failed:", error)
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.file === uploadedFile.file
            ? {
                ...file,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Real-time analysis failed",
              }
            : file,
        ),
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== fileToRemove))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB for real-time
    multiple: false, // Single file for real-time processing
  })

  return (
    <div className="space-y-6">
      {/* Real-time Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="flex items-center gap-4">
            <span className="font-medium text-blue-800">⚡ Real-Time Analysis:</span>
            <Badge variant="default" className="bg-blue-600">
              Instant Results
            </Badge>
            <Badge variant="default" className="bg-green-600">
              15s Processing
            </Badge>
            <Badge variant="default" className="bg-purple-600">
              Live Feedback
            </Badge>
          </div>
          <p className="text-xs mt-2 text-blue-700">
            Get immediate insights with optimized PDF processing and instant skill detection.
          </p>
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "text-center cursor-pointer transition-colors rounded-lg p-8",
              isDragActive ? "bg-blue-50" : "hover:bg-gray-50",
              isAnalyzing && "pointer-events-none opacity-50",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex justify-center mb-4">
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              ) : (
                <Upload className="h-16 w-16 text-blue-500" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? "Drop your resume here" : "Real-Time Resume Analysis"}
            </h3>
            <p className="text-gray-600 mb-4">
              {isAnalyzing ? "Analyzing your resume..." : "Get instant feedback in under 15 seconds"}
            </p>
            <p className="text-sm text-gray-500 mb-4">Supports PDF files up to 5MB</p>
            <Button
              size="lg"
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAnalyzing ? "Processing..." : "Choose PDF File"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Results */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Real-Time Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-10 w-10 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 truncate">{uploadedFile.file.name}</p>
                      <p className="text-sm text-gray-500">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {uploadedFile.analysis && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600">
                            Analyzed in {uploadedFile.analysis.analysis_time.toFixed(1)}s
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.file)}>
                    <Trash2 className="h-4 w-4" />
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
                      <p className="text-sm text-blue-600 font-medium">Real-time analysis in progress...</p>
                      <p className="text-xs text-gray-500">Processing PDF and extracting insights</p>
                    </div>
                  </div>
                )}

                {uploadedFile.status === "completed" && uploadedFile.analysis && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">
                        Real-time analysis completed in {uploadedFile.analysis.analysis_time.toFixed(1)} seconds!
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-2xl font-bold text-green-700">
                              {uploadedFile.analysis.overall_score}%
                            </div>
                            <div className="text-sm text-green-600">Score ({uploadedFile.analysis.grade})</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="text-2xl font-bold text-blue-700 capitalize">
                              {uploadedFile.analysis.experience_level}
                            </div>
                            <div className="text-sm text-blue-600">Experience</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="text-2xl font-bold text-purple-700">
                              {uploadedFile.analysis.skills.total_count}
                            </div>
                            <div className="text-sm text-purple-600">Skills Found</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="text-2xl font-bold text-orange-700">
                              {uploadedFile.analysis.job_recommendations.length}
                            </div>
                            <div className="text-sm text-orange-600">Job Matches</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Skills Detected (Real-time)</h4>
                      <div className="space-y-3">
                        {Object.entries(uploadedFile.analysis.skills.technical).map(
                          ([category, skills]) =>
                            skills.length > 0 && (
                              <div key={category}>
                                <p className="text-sm font-medium text-gray-700 mb-1 capitalize">
                                  {category.replace("_", " ")}:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {skills.slice(0, 5).map((skill: string, skillIndex: number) => (
                                    <Badge key={skillIndex} variant="secondary" className="bg-blue-100 text-blue-800">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {skills.length > 5 && <Badge variant="outline">+{skills.length - 5} more</Badge>}
                                </div>
                              </div>
                            ),
                        )}
                      </div>
                    </div>

                    {/* Top Job Recommendations */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Top Job Matches</h4>
                      <div className="space-y-2">
                        {uploadedFile.analysis.job_recommendations.slice(0, 3).map((job, jobIndex) => (
                          <div key={jobIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{job.title}</p>
                              <p className="text-sm text-gray-600">{job.salary_range}</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={job.match_percentage >= 80 ? "default" : "secondary"}
                                className={job.match_percentage >= 80 ? "bg-green-600" : ""}
                              >
                                {job.match_percentage}% match
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{job.market_demand} demand</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Improvements */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Instant Feedback</h4>
                      <div className="space-y-2">
                        {uploadedFile.analysis.improvement_suggestions.slice(0, 3).map((suggestion, sugIndex) => (
                          <div key={sugIndex} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{suggestion.suggestion}</p>
                              <p className="text-xs text-gray-600">Impact: {suggestion.impact}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`ml-auto ${
                                suggestion.priority === "High"
                                  ? "border-red-300 text-red-700"
                                  : suggestion.priority === "Medium"
                                    ? "border-yellow-300 text-yellow-700"
                                    : "border-green-300 text-green-700"
                              }`}
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button className="flex-1">View Detailed Analysis</Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Results
                      </Button>
                    </div>
                  </div>
                )}

                {uploadedFile.status === "error" && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600 font-medium">Real-time analysis failed</p>
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
