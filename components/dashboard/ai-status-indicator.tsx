"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Target, CheckCircle, AlertCircle, FileText } from "lucide-react"

interface AIServiceStatus {
  chatpdf: "available" | "unavailable"
  openai: "available" | "unavailable" | "quota_exceeded"
  huggingface: "available" | "unavailable"
  intelligent: "available"
}

export function AIStatusIndicator() {
  const [status, setStatus] = useState<AIServiceStatus>({
    chatpdf: "unavailable",
    openai: "unavailable",
    huggingface: "unavailable",
    intelligent: "available",
  })

  useEffect(() => {
    // Check API key availability
    const newStatus: AIServiceStatus = {
      chatpdf: process.env.NEXT_PUBLIC_CHATPDF_API_KEY ? "available" : "unavailable",
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? "available" : "unavailable",
      huggingface: process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY ? "available" : "unavailable",
      intelligent: "available",
    }
    setStatus(newStatus)
  }, [])

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "quota_exceeded":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case "available":
        return "bg-green-100 text-green-800"
      case "quota_exceeded":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">AI Analysis Services Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">ChatPDF</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.chatpdf)}
              <Badge className={getStatusColor(status.chatpdf)}>
                {status.chatpdf === "available" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">OpenAI GPT</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.openai)}
              <Badge className={getStatusColor(status.openai)}>
                {status.openai === "available" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Hugging Face</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.huggingface)}
              <Badge className={getStatusColor(status.huggingface)}>
                {status.huggingface === "available" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Intelligent Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.intelligent)}
              <Badge className={getStatusColor(status.intelligent)}>Always Active</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {status.chatpdf === "available"
            ? "✅ ChatPDF is active! Upload PDFs for the most accurate analysis."
            : "Add your ChatPDF API key for enhanced PDF processing capabilities."}
        </p>
      </CardContent>
    </Card>
  )
}
