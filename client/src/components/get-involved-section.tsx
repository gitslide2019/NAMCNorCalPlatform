import { Users, Award, Heart, GraduationCap } from "lucide-react";
import { Eyebrow, SectionNumeral, RevealOnScroll } from "@/components/editorial";

const involvementAreas = [
  {
    title: "Network",
    icon: Users,
    items: [
      "Local NAMC membership meetings",
      "Legislative Day with agencies and A/E/C pros",
      "Members-only programs and Directory access",
      "Regional and National conferences",
    ],
  },
  {
    title: "Recognize & Promote",
    icon: Award,
    items: [
      "Use NAMC marks on job sites and bids",
      "Sponsorship opportunities",
      "Advertise on the Chapter website",
      "Nominate colleagues for Hard Hat Awards",
    ],
  },
  {
    title: "Give Back",
    icon: Heart,
    items: [
      "Mentor a fellow contractor",
      "Share project opportunities",
      "Volunteer on a committee or service project",
      "Teach a class or sit on a panel",
    ],
  },
  {
    title: "Develop Workforce",
    icon: GraduationCap,
    items: [
      "Speak about construction careers at schools",
      "Exhibit or sponsor our job fair",
      "Host job-site field trips",
      "Support iConstruction Pre-apprenticeship",
    ],
  },
];

export function GetInvolvedSection() {
  return (
    <section id="get-involved" className="py-20 sm:py-28 paper-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <RevealOnScroll>
            <SectionNumeral number="03" label="Ways to get involved" />
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <h2 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.0] tracking-[-0.04em] font-extrabold mb-5" data-testid="text-get-involved-title">
              Membership <span className="font-light italic">is a verb.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={140}>
            <p className="text-lead text-foreground/75">
              The members who get the most out of NAMC NorCal show up — at meetings,
              on committees, on job sites with peers. Pick a lane and we'll get you started.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-card-border rounded-2xl overflow-hidden border border-card-border">
          {involvementAreas.map((area, index) => (
            <RevealOnScroll key={index} delay={Math.min(index * 60, 200)}>
              <div className="bg-card p-7 sm:p-9 h-full" data-testid={`card-involvement-${area.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                    <area.icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="font-display text-2xl leading-tight font-extrabold tracking-[-0.025em]">{area.title}</h3>
                </div>
                <ul className="space-y-3">
                  {area.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <span className="mt-2 h-px w-4 bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <div className="mt-12 text-center">
            <Eyebrow className="mb-2">Reach out</Eyebrow>
            <p className="text-foreground/80">
              Want to serve on a committee, task force, or board? Email{" "}
              <a href="mailto:info@namcnorcal.org" className="text-primary font-medium underline-offset-2 hover:underline">
                info@namcnorcal.org
              </a>.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
