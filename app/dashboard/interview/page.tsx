import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InterviewPrep } from "@/components/interview/interview-prep"

export default function InterviewPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Preparation</h1>
          <p className="text-gray-600 mt-2">
            Practice with AI-generated questions tailored to your skills and target roles.
          </p>
        </div>
        <InterviewPrep />
      </div>
    </DashboardLayout>
  )
}
