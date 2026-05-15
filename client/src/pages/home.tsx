import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { WhyJoinSection } from "@/components/why-join-section";
import { MembershipTiersSection } from "@/components/membership-tiers-section";
import { MemberSpotlightSection } from "@/components/member-spotlight-section";
import { GetInvolvedSection } from "@/components/get-involved-section";
import { ApplicationFormSection } from "@/components/application-form-section";
import { Footer } from "@/components/footer";
import { Ticker } from "@/components/namc/Ticker";

const tickerItems = [
  "New project opportunities posted weekly",
  "Hard Hat Awards · Nominations open",
  "iConstruction pre-apprenticeship enrolling now",
  "Legislative Day in Sacramento · Save the date",
  "Member Spotlight · Amir Jenkins, 5DCCS",
  "Membership renewal · Jan 1 – Dec 31",
  "977 66th Ave · Oakland, CA",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Ticker items={tickerItems} />
      <main className="flex-1">
        <HeroSection />
        <WhyJoinSection />
        <MembershipTiersSection />
        <MemberSpotlightSection />
        <GetInvolvedSection />
        <ApplicationFormSection />
      </main>
      <Footer />
    </div>
  );
}
