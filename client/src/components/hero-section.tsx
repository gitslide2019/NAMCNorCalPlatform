import { ArrowRight, ArrowUpRight } from "lucide-react";
import amirPhoto from "@assets/Amir_-_Construction_Containment_Services_-_NAMC_Member_Spotlig_1772032281757.png";
import { Stat } from "@/components/namc/Stat";
import { RevealOnScroll } from "@/components/namc/RevealOnScroll";

export function HeroSection() {
  const scrollTo = (sel: string) => {
    document.querySelector(sel)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden paper border-b border-border">
      {/* Subtle blueprint grid in the background */}
      <div className="absolute inset-0 blueprint opacity-30 pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28">
        {/* Eyebrow row */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <span className="font-numeral text-primary text-2xl sm:text-3xl leading-none">№01</span>
          <span className="h-px flex-1 max-w-24 bg-foreground/20" aria-hidden />
          <span className="eyebrow text-foreground/60">Northern California Chapter · Est. 1969</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          {/* Headline column */}
          <div className="lg:col-span-7 stagger" style={{ ["--i" as never]: 0 }}>
            <h1
              className="font-display text-display lg:text-mega font-semibold leading-[0.95] mb-6 sm:mb-8"
              data-testid="text-hero-title"
              style={{ ["--i" as never]: 0 }}
            >
              Building a stronger{" "}
              <span className="italic font-light">Bay&nbsp;Area</span>,{" "}
              <span className="gold-mark">one minority contractor</span> at a time.
            </h1>
            <p
              className="text-base sm:text-lg text-foreground/70 max-w-xl mb-7 leading-relaxed"
              data-testid="text-hero-subtitle"
              style={{ ["--i" as never]: 1 }}
            >
              The oldest minority construction trade association in the United States — opening project pipelines,
              advocacy, training, and community for contractors across Northern California.
            </p>
            <div className="flex flex-wrap items-center gap-3" style={{ ["--i" as never]: 2 }}>
              <button
                onClick={() => scrollTo("#apply")}
                className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3.5 text-sm font-semibold press hover:bg-foreground/90"
                data-testid="button-hero-apply"
              >
                Apply for membership
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => scrollTo("#why-join")}
                className="group inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-foreground/80 hover:text-foreground press"
                data-testid="button-hero-learn-more"
              >
                Why join
                <ArrowUpRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Photo + stat column */}
          <div className="lg:col-span-5">
            <RevealOnScroll>
              <figure className="relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden edge-card">
                <img
                  src={amirPhoto}
                  alt="Amir Jenkins, NAMC member, on a Bay Area jobsite"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  loading="eager"
                  data-testid="img-hero-member"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="eyebrow text-primary">Member · 5DCCS</span>
                  <p className="font-display text-2xl mt-2 leading-tight">Amir Jenkins</p>
                  <p className="text-xs text-white/70 mt-1">San Jose · Modular containment</p>
                </figcaption>
                <div className="absolute top-4 right-4 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                  Member spotlight
                </div>
              </figure>
            </RevealOnScroll>
          </div>
        </div>

        {/* Stats strip — editorial */}
        <div className="mt-12 sm:mt-16 pt-8 border-t-2 border-foreground/10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-8">
            <Stat value="$1B+" label="Annual project capacity" data-testid="stat-project-capacity" />
            <Stat value="55" label="Years of excellence" hint="Founded Oakland, 1969" data-testid="stat-years" />
            <Stat value="50+" label="Hall-of-Fame members" data-testid="stat-hall-of-fame" />
            <Stat value="25M+" label="Workers represented" data-testid="stat-workers" />
          </div>
        </div>
      </div>
    </section>
  );
}
