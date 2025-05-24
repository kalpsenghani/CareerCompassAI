import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  )
}
