import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SettingsPage } from "@/components/settings/settings-page"

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences.</p>
        </div>
        <SettingsPage />
      </div>
    </DashboardLayout>
  )
}
