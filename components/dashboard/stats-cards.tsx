import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Target, FileText, Star } from "lucide-react"

const stats = [
  {
    title: "Resume Score",
    value: "85%",
    change: "+12%",
    changeType: "positive",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    title: "Job Matches",
    value: "24",
    change: "+8",
    changeType: "positive",
    icon: Target,
    color: "text-emerald-600",
  },
  {
    title: "Skill Rating",
    value: "4.2",
    change: "+0.3",
    changeType: "positive",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    title: "Career Growth",
    value: "92%",
    change: "+5%",
    changeType: "positive",
    icon: TrendingUp,
    color: "text-purple-600",
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.changeType === "positive" ? "text-emerald-600" : "text-red-600"}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
