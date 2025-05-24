"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { chatPDFService } from "@/services/chatpdf-service"
import { CheckCircle, AlertCircle, MessageSquare, Trash2, Loader2 } from "lucide-react"

export function ChatPDFTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [sourceId, setSourceId] = useState<string>("")
  const [question, setQuestion] = useState<string>("")
  const [chatResponse, setChatResponse] = useState<string>("")
  const [isChatting, setIsChatting] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const testAPIKey = async () => {
    setIsTestingConnection(true)
    setError("")
    setResult(null)

    try {
      const connectionTest = await chatPDFService.testConnection()

      if (connectionTest.success) {
        setResult({
          message: connectionTest.message,
          apiKey: process.env.NEXT_PUBLIC_CHATPDF_API_KEY
            ? `${process.env.NEXT_PUBLIC_CHATPDF_API_KEY.substring(0, 8)}...`
            : "Not configured",
        })
      } else {
        setError(connectionTest.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test failed")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const testFileUpload = async (file: File) => {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const uploadedSourceId = await chatPDFService.uploadPDF(file)
      setSourceId(uploadedSourceId)
      setResult({
        message: "PDF uploaded successfully!",
        sourceId: uploadedSourceId,
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsLoading(false)
    }
  }

  const testChat = async () => {
    if (!sourceId || !question.trim()) return

    setIsChatting(true)
    setChatResponse("")

    try {
      const response = await chatPDFService.chatWithPDF(sourceId, [
        {
          role: "user",
          content: question,
        },
      ])
      setChatResponse(response.content)
    } catch (err) {
      setChatResponse(`Error: ${err instanceof Error ? err.message : "Chat failed"}`)
    } finally {
      setIsChatting(false)
    }
  }

  const cleanupSource = async () => {
    if (!sourceId) return

    try {
      await chatPDFService.deletePDF(sourceId)
      setSourceId("")
      setResult(null)
      setChatResponse("")
      setQuestion("")
      alert("PDF source cleaned up successfully!")
    } catch (err) {
      alert(`Cleanup failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      testFileUpload(file)
    } else {
      setError("Please select a PDF file")
    }
  }

  return (
    <div className="space-y-6">
      {/* API Key Test */}
      <Card>
        <CardHeader>
          <CardTitle>1. API Key & Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPIKey} disabled={isTestingConnection} className="w-full">
            {isTestingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test ChatPDF API Connection"
            )}
          </Button>

          {result && result.apiKey && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">{result.message}</p>
              </div>
              <p className="text-green-600 text-sm mt-1">API Key: {result.apiKey}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <div className="mt-2 text-sm text-red-600">
                <p>
                  <strong>Troubleshooting:</strong>
                </p>
                <ul className="list-disc list-inside mt-1">
                  <li>Check if your ChatPDF API key is correctly set</li>
                  <li>Verify the API key has sufficient credits</li>
                  <li>Ensure you're not hitting rate limits</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload Test */}
      <Card>
        <CardHeader>
          <CardTitle>2. PDF Upload Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Select a PDF file to test upload:
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Uploading to ChatPDF...</span>
              </div>
            )}

            {result && result.sourceId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">{result.message}</p>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    <strong>Source ID:</strong> {result.sourceId}
                  </p>
                  <p>
                    <strong>File:</strong> {result.fileName}
                  </p>
                  <p>
                    <strong>Size:</strong> {result.fileSize}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Test */}
      {sourceId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>3. Chat with PDF Test</span>
              <Button variant="outline" size="sm" onClick={cleanupSource}>
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  Ask a question about the PDF:
                </label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What is this document about?"
                  onKeyPress={(e) => e.key === "Enter" && testChat()}
                  disabled={isChatting}
                />
              </div>

              <Button onClick={testChat} disabled={isChatting || !question.trim()} className="w-full">
                {isChatting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting response...
                  </>
                ) : (
                  "Ask Question"
                )}
              </Button>

              {chatResponse && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-blue-800 font-medium mb-2">ChatPDF Response:</p>
                      <Textarea value={chatResponse} readOnly rows={6} className="w-full text-sm bg-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Questions */}
      {sourceId && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Questions to Try</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "What is this document about?",
                "Summarize the main points",
                "What skills are mentioned?",
                "What experience is described?",
                "What education is listed?",
                "What are the key achievements?",
              ].map((sampleQuestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(sampleQuestion)}
                  className="text-left justify-start"
                  disabled={isChatting}
                >
                  {sampleQuestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                className={
                  process.env.NEXT_PUBLIC_CHATPDF_API_KEY ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }
              >
                {process.env.NEXT_PUBLIC_CHATPDF_API_KEY ? "API Key Configured" : "API Key Missing"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={sourceId ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {sourceId ? "PDF Uploaded" : "No PDF Uploaded"}
              </Badge>
            </div>
          </div>

          {!process.env.NEXT_PUBLIC_CHATPDF_API_KEY && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>To use ChatPDF:</strong> Add your ChatPDF API key as NEXT_PUBLIC_CHATPDF_API_KEY in your
                environment variables.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
