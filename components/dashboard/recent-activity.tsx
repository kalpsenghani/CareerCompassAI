import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Target, MessageSquare, TrendingUp } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "resume_upload",
    title: "Resume analyzed successfully",
    description: "Your Software Engineer resume received a score of 85%",
    timestamp: "2 hours ago",
    icon: FileText,
    status: "completed",
  },
  {
    id: 2,
    type: "job_match",
    title: "New job matches found",
    description: "8 new positions match your profile",
    timestamp: "4 hours ago",
    icon: Target,
    status: "new",
  },
  {
    id: 3,
    type: "interview_prep",
    title: "Interview questions generated",
    description: "15 technical questions for Senior Developer role",
    timestamp: "1 day ago",
    icon: MessageSquare,
    status: "completed",
  },
  {
    id: 4,
    type: "career_insight",
    title: "Career path updated",
    description: "New skills recommended for your growth",
    timestamp: "2 days ago",
    icon: TrendingUp,
    status: "completed",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <activity.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{activity.title}</h3>
                  <Badge variant={activity.status === "new" ? "default" : "secondary"}>{activity.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
