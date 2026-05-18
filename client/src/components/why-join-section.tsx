import {
  Users,
  Building2,
  Scale,
  GraduationCap,
  Handshake,
  TrendingUp,
  Award,
  Globe,
  Network,
  FileCheck,
} from "lucide-react";
import { Eyebrow, SectionNumeral, RevealOnScroll } from "@/components/editorial";

const benefits = [
  { icon: Users, title: "Full Member Access", description: "Exclusive Chapter services, resources, and programs designed for your success." },
  { icon: Network, title: "Industry Networking", description: "Connect with top suppliers, GCs, architects, engineers, and developers." },
  { icon: Award, title: "Enhanced Reputation", description: "Affiliate with the most respected and oldest minority construction association." },
  { icon: TrendingUp, title: "Marketing Effectiveness", description: "Tap into our broad industry network to amplify your reach." },
  { icon: Handshake, title: "Government Connections", description: "Build relationships with agencies and stay ahead on legislative changes." },
  { icon: GraduationCap, title: "Contractor Development", description: "Access training, capacity building, and growth programs for your business." },
  { icon: Building2, title: "Project Opportunities", description: "Connect with industry pros and access live contract opportunities." },
  { icon: Scale, title: "Advocacy & Representation", description: "A leading voice for minority trade workers, advocating for your interests." },
  { icon: Globe, title: "National Network", description: "Join chapters with strategic and corporate partnerships nationwide." },
  { icon: FileCheck, title: "Tax Deductible Dues", description: "NAMC is a 501(c)(3) organization. Annual dues are tax-deductible." },
];

export function WhyJoinSection() {
  return (
    <section id="why-join" className="py-20 sm:py-28 paper-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <RevealOnScroll>
            <SectionNumeral number="01" label="Why join" />
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <h2
              className="font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.0] tracking-[-0.04em] font-extrabold mb-5"
              data-testid="text-why-join-title"
            >
              Founded in <span className="gold-mark">Oakland, 1969</span>.<br className="hidden sm:block" />
              <span className="font-light italic tracking-[-0.025em]">Still building the bench.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={140}>
            <p className="text-lead text-foreground/75" data-testid="text-why-join-subtitle">
              Ray Dones and Joseph Debro started something that's still standing 55 years
              later: the oldest minority construction trade association in the United States.
              Here's what membership opens up.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {benefits.map((benefit, index) => (
            <RevealOnScroll key={index} delay={Math.min(index * 30, 240)}>
              <article
                className="relative pt-5 group"
                data-testid={`card-benefit-${index}`}
              >
                <span className="absolute top-0 left-0 h-[2px] w-8 bg-primary transition-all duration-300 group-hover:w-16" />
                <div className="flex items-start gap-3 mb-2">
                  <benefit.icon className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <h3 className="font-display text-xl leading-tight font-bold tracking-[-0.02em]">{benefit.title}</h3>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed pl-8">
                  {benefit.description}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <div className="mt-20 rounded-2xl border border-gold-hairline bg-card p-8 sm:p-12 shadow-editorial">
            <Eyebrow className="mb-4">Our mission</Eyebrow>
            <p className="pull-quote text-2xl sm:text-3xl max-w-4xl text-foreground/85" data-testid="text-mission">
              NAMC-NC sets new standards of leadership, collaboration, and business excellence
              to advocate the issues of an ethnically and gender-diverse constituency — increasing
              construction capacity and economic inclusion across Northern California.
            </p>
          </div>
        </RevealOnScroll>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-card-border rounded-xl overflow-hidden border border-card-border">
          {[
            { title: "Deliver Work", sub: "Execute with excellence" },
            { title: "Enhance Communities", sub: "Give back, locally" },
            { title: "Develop People", sub: "Train the next gen" },
            { title: "Win Work", sub: "Grow the business" },
          ].map((p) => (
            <div key={p.title} className="bg-card p-6" data-testid={`pillar-${p.title.toLowerCase().split(" ")[0]}`}>
              <p className="eyebrow text-primary">{p.title}</p>
              <p className="text-sm text-foreground/75 mt-2">{p.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
