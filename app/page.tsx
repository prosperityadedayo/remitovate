import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AIQuickInvoice } from "@/components/marketing/ai-quick-invoice";
import { MobileSection } from "@/components/marketing/mobile-section";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <AIQuickInvoice />
        <MobileSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
