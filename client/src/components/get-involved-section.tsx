import { Users, Award, Heart, GraduationCap } from "lucide-react";
import { SectionNumeral } from "@/components/namc/SectionNumeral";
import { RevealOnScroll } from "@/components/namc/RevealOnScroll";

const areas = [
  {
    title: "Network",
    icon: Users,
    items: [
      "Local NAMC membership meetings",
      "Meet legislators & A/E/C pros at Legislative Day",
      "Members-only programs",
      "Use the Directory to find project partners",
      "Get acquainted at classes and meetings",
      "Attend National conferences",
    ],
  },
  {
    title: "Recognize & Promote",
    icon: Award,
    items: [
      "Use NAMC logos on jobsites and proposals",
      "Sponsorship opportunities",
      "Advertise on the Chapter website",
      "Nominate colleagues for Hard Hat Awards",
    ],
  },
  {
    title: "Give Back",
    icon: Heart,
    items: [
      "Be a mentor",
      "Share project opportunity info",
      "Volunteer on a Chapter committee",
      "Help with a community service build",
      "Teach a class or serve on a panel",
    ],
  },
  {
    title: "Develop Workforce",
    icon: GraduationCap,
    items: [
      "Speak about construction at local schools",
      "Sponsor or exhibit at our job fair",
      "Host student field trips on jobsites",
      "Support our Student Chapter",
      "Back NAMC's iConstruction Pre-apprenticeship",
    ],
  },
];

export function GetInvolvedSection() {
  return (
    <section id="get-involved" className="py-16 sm:py-24 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 mb-10 lg:mb-14 items-end">
          <div className="lg:col-span-7">
            <SectionNumeral number="05" label="Get Involved" />
            <h2 className="font-display text-display-sm sm:text-display font-semibold leading-[1.05]" data-testid="text-get-involved-title">
              Membership is a verb.{" "}
              <span className="italic font-light">Here's where to start.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lead text-foreground/70 leading-relaxed">
              Once your company joins, the depth of services and programs really opens up. Find multiple ways
              to stay involved — that's how the network compounds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border rounded-2xl overflow-hidden">
          {areas.map((area, i) => (
            <RevealOnScroll
              key={area.title}
              delay={(i % 2) * 80}
              className="bg-background p-6 sm:p-8 lg:p-10"
            >
              <div data-testid={`card-involvement-${area.title.toLowerCase().replace(/[\s&]+/g, "-")}`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-numeral text-primary text-3xl">{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <area.icon className="h-5 w-5 text-foreground/40" />
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-5">{area.title}</h3>
                <ul className="space-y-3">
                  {area.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/75">
                      <span className="mt-2 h-1 w-3 bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Want to serve on a committee or task force? Email{" "}
          <a href="mailto:info@namcnorcal.org" className="text-foreground underline underline-offset-4 decoration-primary decoration-2 hover:text-primary">
            info@namcnorcal.org
          </a>
          .
        </p>
      </div>
    </section>
  );
}
