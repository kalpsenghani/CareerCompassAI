import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          <div className="mb-8 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Career Intelligence
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Transform Your Career with{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI Insights
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100 sm:text-2xl">
            Upload your resume and get instant AI-powered analysis, personalized job recommendations, and expert career
            guidance to accelerate your professional growth.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Watch Demo
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">50K+</div>
              <div className="text-blue-200">Resumes Analyzed</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">95%</div>
              <div className="text-blue-200">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">24/7</div>
              <div className="text-blue-200">AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
