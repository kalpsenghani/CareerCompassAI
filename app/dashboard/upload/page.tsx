import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { RealtimeUpload } from "@/components/resume/realtime-upload"

export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload your Resume</h1>
          <p className="text-gray-600 mt-2">Get started by uploading your resume below.</p>
        </div>
        <div className="mt-6">
          <RealtimeUpload />
        </div>
      </div>
    </DashboardLayout>
  )
}
