"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Download, Share2, Trash2, Code } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  file: File
  progress: number
  status: "uploading" | "analyzing" | "completed" | "error"
  analysis?: any
  errorMessage?: string
}

export function PythonUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

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
      for (let progress = 0; progress <= 100; progress += 25) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setUploadedFiles((prev) => prev.map((file) => (file.file === uploadedFile.file ? { ...file, progress } : file)))
      }

      // Start analysis
      setUploadedFiles((prev) =>
        prev.map((file) => (file.file === uploadedFile.file ? { ...file, status: "analyzing" } : file)),
      )

      // Create form data
      const formData = new FormData()
      formData.append("file", uploadedFile.file)

      // Call Python analysis API
      const response = await fetch("/api/analyze-resume-python", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const analysis = await response.json()

      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.file === uploadedFile.file
            ? {
                ...file,
                status: "completed",
                analysis: {
                  score: analysis.overall_score,
                  skills: analysis.skills.technical.slice(0, 8),
                  recommendations: analysis.improvement_suggestions.slice(0, 3),
                  jobMatches: analysis.job_recommendations.length,
                  experienceLevel: analysis.experience_level,
                  fullAnalysis: analysis,
                  extractedData: analysis.extracted_data,
                  analysis_method: analysis.analysis_method,
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Code className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-4">
            <span>Python-Powered Analysis:</span>
            <Badge variant="default">Advanced PDF Processing</Badge>
            <Badge variant="default">NLTK Text Analysis</Badge>
            <Badge variant="default">Smart Skill Detection</Badge>
          </div>
          <p className="text-xs mt-2">
            Using PyPDF2, pdfplumber, and NLTK for comprehensive resume analysis with superior text extraction.
          </p>
        </AlertDescription>
      </Alert>

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
            <p className="text-gray-600 mb-4">Advanced Python-based analysis with superior PDF processing</p>
            <p className="text-sm text-gray-500 mb-4">Supports PDF files up to 10MB</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Choose PDF File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Python Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-10 w-10 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 truncate">{uploadedFile.file.name}</p>
                      <p className="text-sm text-gray-500">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {uploadedFile.analysis && (
                        <div className="flex items-center gap-2 mt-1">
                          <Code className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600">Method: {uploadedFile.analysis.analysis_method}</span>
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Analyzing with Python...</p>
                      <p className="text-xs text-gray-500">Advanced PDF processing and NLP analysis</p>
                    </div>
                  </div>
                )}

                {uploadedFile.status === "completed" && uploadedFile.analysis && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">Python analysis completed successfully!</p>
                    </div>

                    {/* Analysis Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{uploadedFile.analysis.score}%</div>
                        <div className="text-sm text-green-700">Resume Score</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{uploadedFile.analysis.skills.length}</div>
                        <div className="text-sm text-blue-700">Skills Found</div>
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

                    {/* Skills and Recommendations */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Technical Skills Detected</h4>
                        <div className="flex flex-wrap gap-2">
                          {uploadedFile.analysis.skills.map((skill: string, skillIndex: number) => (
                            <Badge key={skillIndex} variant="secondary" className="bg-green-100 text-green-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Improvement Recommendations</h4>
                        <div className="space-y-2">
                          {uploadedFile.analysis.recommendations.map((rec: any, recIndex: number) => (
                            <div key={recIndex} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-sm text-gray-700">{rec.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Extracted Data Preview */}
                      {uploadedFile.analysis.extractedData && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Text Extraction Quality</h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Characters extracted:</span>{" "}
                                {uploadedFile.analysis.extractedData.textLength}
                              </div>
                              <div>
                                <span className="font-medium">Processing method:</span> Advanced Python
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button className="flex-1">View Full Analysis</Button>
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
                      <p className="text-sm text-red-600 font-medium">Python analysis failed</p>
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
