import { Card, CardContent } from "@/components/ui/card"
import { Upload, Brain, Target, TrendingUp } from "lucide-react"

const steps = [
  {
    step: 1,
    icon: Upload,
    title: "Upload Your Resume",
    description:
      "Simply drag and drop your resume in PDF, DOC, or DOCX format. Our system supports multiple file types and sizes.",
    color: "bg-blue-500",
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Analysis",
    description:
      "Our advanced AI algorithms analyze your resume, extracting skills, experience, and identifying optimization opportunities.",
    color: "bg-purple-500",
  },
  {
    step: 3,
    icon: Target,
    title: "Get Recommendations",
    description:
      "Receive personalized job matches, skill gap analysis, and detailed improvement suggestions tailored to your goals.",
    color: "bg-emerald-500",
  },
  {
    step: 4,
    icon: TrendingUp,
    title: "Accelerate Growth",
    description: "Implement our recommendations, track your progress, and watch your career opportunities multiply.",
    color: "bg-orange-500",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">How It Works</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in minutes with our simple, powerful process that transforms your career prospects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
              )}

              <Card className="relative z-10 hover:shadow-xl transition-all duration-300 border-0 bg-white hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-4 rounded-full ${step.color} mb-4 relative`}>
                    <step.icon className="h-8 w-8 text-white" />
                    <div className="absolute -top-2 -right-2 bg-white text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
