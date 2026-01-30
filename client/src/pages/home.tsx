import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { WhyJoinSection } from "@/components/why-join-section";
import { MembershipTiersSection } from "@/components/membership-tiers-section";
import { GetInvolvedSection } from "@/components/get-involved-section";
import { ApplicationFormSection } from "@/components/application-form-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <WhyJoinSection />
        <MembershipTiersSection />
        <GetInvolvedSection />
        <ApplicationFormSection />
      </main>
      <Footer />
    </div>
  );
}
