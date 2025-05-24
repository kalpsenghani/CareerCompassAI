import { StatsCards } from "./stats-cards"
import { RecentActivity } from "./recent-activity"
import { QuickActions } from "./quick-actions"
import { ProgressChart } from "./progress-chart"
import { AIStatusIndicator } from "./ai-status-indicator"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-600 mt-2">Here's what's happening with your career journey.</p>
      </div>

      <AIStatusIndicator />

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <ProgressChart />
      </div>

      <RecentActivity />
    </div>
  )
}
