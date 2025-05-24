import { Suspense } from "react"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { CTASection } from "@/components/cta-section"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Suspense fallback={<LoadingSpinner />}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </Suspense>
    </div>
  )
}
