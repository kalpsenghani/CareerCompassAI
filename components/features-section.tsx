import { Card, CardContent } from "@/components/ui/card"
import { Brain, Target, TrendingUp, FileText, MessageSquare, Shield, Zap, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Resume Analysis",
    description:
      "Advanced AI algorithms analyze your resume to identify strengths, weaknesses, and optimization opportunities.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description: "Get personalized job recommendations based on your skills, experience, and career goals.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Career Path Planning",
    description: "Visualize your career trajectory and get actionable steps to reach your professional goals.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: FileText,
    title: "Resume Optimization",
    description: "Receive detailed suggestions to improve your resume format, content, and ATS compatibility.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: MessageSquare,
    title: "Interview Preparation",
    description: "Get tailored interview questions and practice scenarios based on your target roles.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: BarChart3,
    title: "Skills Gap Analysis",
    description: "Identify missing skills and get learning recommendations to boost your marketability.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "Real-time Insights",
    description: "Instant analysis and recommendations powered by the latest AI technology.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Privacy Protected",
    description: "Your data is encrypted and secure. We never share your information with third parties.",
    gradient: "from-green-500 to-emerald-500",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Powerful Features for Career Success
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform provides comprehensive career intelligence to help you make informed decisions and
            accelerate your professional growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:scale-105"
            >
              <CardContent className="p-6">
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
