import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CareerPath } from "@/components/career/career-path"

export default function CareerPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Career Path Planning</h1>
          <p className="text-gray-600 mt-2">
            Visualize your career trajectory and get actionable steps to reach your professional goals.
          </p>
        </div>
        <CareerPath />
      </div>
    </DashboardLayout>
  )
}
