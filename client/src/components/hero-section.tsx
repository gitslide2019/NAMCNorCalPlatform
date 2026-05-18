import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlueprintSurface, Eyebrow, Stat, Ticker, RevealOnScroll } from "@/components/editorial";
import { MemberSpotlightCard } from "@/components/member-spotlight-card";
import amirPhoto from "@assets/Amir_-_Construction_Containment_Services_-_NAMC_Member_Spotlig_1772032281757.png";

const tickerItems = [
  "Est. 1969 — Oakland, CA",
  "55+ years of advocacy",
  "$1B+ project capacity",
  "DBE · SBE · DVBE pathways",
  "Member spotlight: Amir Jenkins, 5DCCS",
  "Hard Hat Awards · Fall 2026",
];

export function HeroSection() {
  const scrollToApply = () => {
    document.querySelector("#apply")?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToWhy = () => {
    document.querySelector("#why-join")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative">
      <BlueprintSurface as="div" className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <RevealOnScroll>
                <Eyebrow className="text-primary/90 mb-5">
                  Issue 01 · The Construction Journal
                </Eyebrow>
              </RevealOnScroll>

              <RevealOnScroll delay={80}>
                <h1
                  className="font-display text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.9] tracking-[-0.045em] text-white font-semibold"
                  data-testid="text-hero-title"
                >
                  Build the Bay,
                  <br />
                  <span className="font-black italic tracking-[-0.05em] text-white">together.</span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={160}>
                <p
                  className="mt-7 max-w-xl text-lg sm:text-xl text-white/75 leading-[1.55] font-light"
                  data-testid="text-hero-subtitle"
                >
                  The National Association of Minority Contractors, Northern California
                  Chapter — opportunity, advocacy, and contractor development for
                  minority-owned construction businesses since 1969.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={240}>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Button
                    size="lg"
                    onClick={scrollToApply}
                    data-testid="button-hero-apply"
                    className="rounded-full px-7 h-12"
                  >
                    Apply for Membership
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <button
                    type="button"
                    onClick={scrollToWhy}
                    data-testid="button-hero-learn-more"
                    className="text-white/80 hover:text-white text-sm font-medium underline-offset-4 hover:underline px-2 py-2 text-left sm:text-center"
                  >
                    Read the case for joining ↓
                  </button>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={320}>
                <div className="mt-12 grid grid-cols-3 gap-6 sm:gap-10 max-w-md">
                  <Stat value="55+" label="Years" />
                  <Stat value="$1B+" label="Capacity" />
                  <Stat value="DBE" label="Pathways" />
                </div>
              </RevealOnScroll>
            </div>

            <div className="lg:col-span-5">
              <RevealOnScroll delay={120}>
                <div className="relative">
                  <div className="absolute -top-3 -left-3 hidden sm:flex items-center gap-2 rounded-full bg-primary px-3 py-1 z-10 shadow-lg">
                    <span className="font-display text-xs uppercase tracking-widest font-semibold">
                      Spotlight
                    </span>
                  </div>
                  <MemberSpotlightCard
                    name="Amir Jenkins"
                    role="CEO"
                    company="5D Construction Containment"
                    photo={amirPhoto}
                    caption="Member · San Jose, CA"
                    data-testid="card-hero-spotlight"
                  />
                  <p className="mt-4 text-sm text-white/65 max-w-xs">
                    Veteran-owned. DBE / SBE / DVBE certified. One year in,
                    $1M bonded — and just getting started.
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </BlueprintSurface>
      <Ticker items={tickerItems} data-testid="ticker-hero" />
    </section>
  );
}
