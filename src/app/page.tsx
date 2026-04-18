import { Navbar } from './(home)/_components/Navbar';
import { HeroSection } from './(home)/_components/HeroSection';
import { FeaturesSection } from './(home)/_components/FeaturesSection';
import { HowItWorksSection } from './(home)/_components/HowItWorksSection';
import { AiSection } from './(home)/_components/AiSection';
import { PricingSection } from './(home)/_components/PricingSection';
import { CtaSection } from './(home)/_components/CtaSection';
import { Footer } from './(home)/_components/Footer';
import { RevealWrapper } from './(home)/_components/RevealWrapper';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main>
        <HeroSection />
        <RevealWrapper>
          <FeaturesSection />
        </RevealWrapper>
        <RevealWrapper>
          <HowItWorksSection />
        </RevealWrapper>
        <RevealWrapper>
          <AiSection />
        </RevealWrapper>
        <RevealWrapper>
          <PricingSection />
        </RevealWrapper>
        <RevealWrapper>
          <CtaSection />
        </RevealWrapper>
      </main>
      <Footer />
    </div>
  );
}
