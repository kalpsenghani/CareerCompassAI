import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { JobMatches } from "@/components/jobs/job-matches"

export default function JobsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Matches</h1>
          <p className="text-gray-600 mt-2">
            Discover personalized job opportunities based on your skills and experience.
          </p>
        </div>
        <JobMatches />
      </div>
    </DashboardLayout>
  )
}
