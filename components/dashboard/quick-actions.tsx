import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Target, MessageSquare, TrendingUp } from "lucide-react"

const actions = [
  {
    title: "Upload New Resume",
    description: "Get fresh AI analysis and insights",
    icon: Upload,
    href: "/dashboard/upload",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    title: "Find Job Matches",
    description: "Discover personalized opportunities",
    icon: Target,
    href: "/dashboard/jobs",
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    title: "Practice Interview",
    description: "Prepare with AI-generated questions",
    icon: MessageSquare,
    href: "/dashboard/interview",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    title: "Career Planning",
    description: "Map your professional growth",
    icon: TrendingUp,
    href: "/dashboard/career",
    color: "bg-orange-500 hover:bg-orange-600",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <div className={`p-2 rounded-lg ${action.color} text-white`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
            <Button variant="outline" size="sm">
              Start
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
