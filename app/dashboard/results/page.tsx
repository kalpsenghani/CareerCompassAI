import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AnalysisResults } from "@/components/resume/analysis-results"

export default function ResultsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive AI-powered analysis of your resume with actionable insights.
          </p>
        </div>
        <AnalysisResults />
      </div>
    </DashboardLayout>
  )
}
