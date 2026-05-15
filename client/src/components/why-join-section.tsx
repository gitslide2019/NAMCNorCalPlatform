import {
  Users, Building2, Scale, GraduationCap, Handshake, TrendingUp,
  Award, Globe, Network, FileCheck,
} from "lucide-react";
import { SectionNumeral } from "@/components/namc/SectionNumeral";
import { RevealOnScroll } from "@/components/namc/RevealOnScroll";

const benefits = [
  { icon: Users, title: "Full Member Access", description: "Exclusive access to Chapter services, resources, and programs designed for your success." },
  { icon: Network, title: "Industry Networking", description: "Network with top suppliers, GCs, architects, engineers, and developers." },
  { icon: Award, title: "Enhanced Reputation", description: "Affiliate with the most respected and oldest minority industry association." },
  { icon: TrendingUp, title: "Marketing Reach", description: "Tap into our broad industry network to amplify your firm's presence." },
  { icon: Handshake, title: "Government Connections", description: "Build relationships with agencies and stay ahead of legislative changes." },
  { icon: GraduationCap, title: "Contractor Development", description: "Training, capacity building, and growth programs to develop your business." },
  { icon: Building2, title: "Project Opportunities", description: "Connect with industry professionals and access contract opportunities." },
  { icon: Scale, title: "Advocacy & Voice", description: "Be represented by a leading voice for minority trade workers." },
  { icon: Globe, title: "National Network", description: "Join a network of local chapters with strategic and corporate partnerships nationwide." },
  { icon: FileCheck, title: "Tax-Deductible Dues", description: "NAMC is a 501(c)(3). Annual dues are tax-deductible." },
];

const pillars = [
  { title: "Deliver Work", desc: "Execute projects with excellence" },
  { title: "Enhance Communities", desc: "Give back to the community" },
  { title: "Develop People", desc: "Train the next generation" },
  { title: "Win Work", desc: "Grow your business" },
];

export function WhyJoinSection() {
  return (
    <section id="why-join" className="py-16 sm:py-24 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 mb-12 lg:mb-16 items-end">
          <div className="lg:col-span-7">
            <SectionNumeral number="02" label="Why Join" />
            <h2 className="font-display text-display-sm sm:text-display font-semibold leading-[1.05] tracking-tight" data-testid="text-why-join-title">
              Membership that <span className="italic font-light">moves</span> your{" "}
              <span className="gold-mark">business forward.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lead text-foreground/70 leading-relaxed" data-testid="text-why-join-subtitle">
              Founded in Oakland in 1969 by Ray Dones and Joseph Debro, NAMC is the oldest minority construction
              trade association in the United States — built by contractors, for contractors.
            </p>
          </div>
        </div>

        {/* Benefits grid — asymmetric editorial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-y border-border">
          {benefits.map((b, i) => (
            <RevealOnScroll
              key={i}
              delay={(i % 3) * 80}
              className={`p-5 sm:p-6 lg:p-8 ${i >= 3 ? "border-t border-border" : ""}`}
            >
              <div data-testid={`card-benefit-${i}`} className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-numeral text-primary text-2xl leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <b.icon className="h-4 w-4 text-foreground/40" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 leading-tight">{b.title}</h3>
                <p className="text-sm text-foreground/65 leading-relaxed">{b.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Mission block — full-bleed quote */}
        <div className="mt-16 sm:mt-20 relative rounded-2xl overflow-hidden bg-foreground text-background blueprint p-8 sm:p-12 lg:p-16">
          <div className="relative max-w-3xl">
            <span className="eyebrow text-primary mb-4 block">Our mission</span>
            <p className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] leading-[1.2] font-light" data-testid="text-mission">
              To set new standards of <span className="gold-mark text-background">leadership, collaboration, and business excellence</span>
              {" "}— advocating the issues of an ethnically and gender-diverse construction industry across Northern California.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {pillars.map((p, i) => (
            <div key={p.title} className="bg-background p-6 sm:p-7" data-testid={`pillar-${p.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <span className="font-numeral text-primary text-xl">{String(i + 1).padStart(2, "0")}</span>
              <h4 className="font-display text-lg font-semibold mt-2">{p.title}</h4>
              <p className="text-xs text-foreground/60 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
