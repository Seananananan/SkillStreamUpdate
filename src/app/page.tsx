import { redirect } from "next/navigation";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { getSession, roleHomePath } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(roleHomePath(session.role));
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <LandingNav />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AudienceSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
