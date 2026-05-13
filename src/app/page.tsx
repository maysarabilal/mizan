import Navbar from './(landing)/_sections/Navbar'
import HeroSection from './(landing)/_sections/HeroSection'
import ProblemSection from './(landing)/_sections/ProblemSection'
import FeaturesSection from './(landing)/_sections/FeaturesSection'
import ScreenshotsSection from './(landing)/_sections/ScreenshotsSection'
import PricingSection from './(landing)/_sections/PricingSection'
import TestimonialsSection from './(landing)/_sections/TestimonialsSection'
import CtaSection from './(landing)/_sections/CtaSection'
import Footer from './(landing)/_sections/Footer'
import ScrollToTop from './(landing)/_sections/ScrollToTop'
import ScrollProgress from './(landing)/_sections/ScrollProgress'
import FaqSection from './(landing)/_sections/FaqSection'
import FeedbackSurveySection from './(landing)/_sections/FeedbackSurveySection'

export default function LandingPage() {
  return (
    <div dir="rtl" lang="ar" className="bg-l-navy min-h-screen overflow-x-hidden font-[family-name:var(--font-cairo)]">
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <ScreenshotsSection />
        <PricingSection />
        <FeedbackSurveySection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}
