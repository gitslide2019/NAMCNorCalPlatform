import { ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionNumeral } from "@/components/namc/SectionNumeral";
import { RevealOnScroll } from "@/components/namc/RevealOnScroll";
import amirPhoto from "@assets/Amir_-_Construction_Containment_Services_-_NAMC_Member_Spotlig_1772032281757.png";

interface SpotlightMember {
  id: string;
  name: string;
  title: string;
  company: string;
  photo: string;
  location: string;
  trade: string;
  narrative: string[];
  website: string;
  certifications: string[];
}

const spotlightMembers: SpotlightMember[] = [
  {
    id: "amir-jenkins",
    name: "Amir Jenkins",
    title: "CEO",
    company: "5D Construction Containment Services",
    photo: amirPhoto,
    location: "San Jose, CA",
    trade: "Modular Wall Systems & Construction Containment",
    narrative: [
      "When military veteran Amir Jenkins launched 5D Construction Containment Services, he brought more than technical expertise to the table — he brought a mission. His company specializes in modular wall systems that keep construction sites clean, quiet, and compliant.",
      "Just one year in, Amir has secured $1M bonding capacity and earned DBE, SBE, and DVBE certifications through VTA, BART, and DGS. He's actively bidding alongside small businesses as a subcontractor — building relationships with Talion, Spectrum, and Patriot Construction.",
      "For Amir, partnering with fellow diverse small businesses isn't just a strategy — it's in the DNA of his company. Joining NAMC NorCal was a natural next step: connecting with other minority contractors and growing alongside a community that shares his values.",
    ],
    website: "https://5dccs.com",
    certifications: ["DBE", "SBE", "DVBE", "Veteran-Owned"],
  },
];

export function MemberSpotlightSection() {
  return (
    <section id="member-spotlight" className="py-16 sm:py-24 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 mb-10 lg:mb-14 items-end">
          <div className="lg:col-span-7">
            <SectionNumeral number="04" label="Member Spotlight" />
            <h2 className="font-display text-display-sm sm:text-display font-semibold leading-[1.05]" data-testid="text-spotlight-title">
              The contractors{" "}
              <span className="italic font-light">building the future.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lead text-foreground/70 leading-relaxed">
              Each month we put a member on the front page. Real businesses, real wins, real backstories from across NorCal.
            </p>
          </div>
        </div>

        <div className="space-y-16 sm:space-y-20">
          {spotlightMembers.map((member) => (
            <RevealOnScroll key={member.id}>
              <article
                className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12"
                data-testid={`card-spotlight-${member.id}`}
              >
                {/* Full-bleed photo column */}
                <div className="lg:col-span-7 relative">
                  <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[640px] rounded-2xl overflow-hidden edge-card group">
                    <img
                      src={member.photo}
                      alt={`${member.name}, ${member.title} of ${member.company}`}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                      data-testid={`img-spotlight-${member.id}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-5 left-5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                      Featured · 2026
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                      <span className="eyebrow text-primary">{member.title} · {member.company.split(" ").slice(0, 2).join(" ")}</span>
                      <h3 className="font-display text-3xl sm:text-5xl font-semibold leading-[1] mt-3" data-testid={`text-spotlight-name-${member.id}`}>
                        {member.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-3">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {member.location}
                        </span>
                        <span className="text-white/40">·</span>
                        <span>{member.trade}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Narrative column */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {member.certifications.map((cert) => (
                      <Badge
                        key={cert}
                        variant="outline"
                        className="rounded-full border-foreground/15 bg-background text-xs px-2.5"
                        data-testid={`badge-cert-${cert.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>

                  <p className="font-display text-xl sm:text-2xl leading-snug font-light italic text-foreground/85 border-l-2 border-primary pl-5 mb-6" data-testid={`text-spotlight-pull-${member.id}`}>
                    "Partnering with fellow diverse small businesses isn't just a strategy — it's in the DNA of my company."
                  </p>

                  <div className="space-y-4">
                    {member.narrative.map((paragraph, i) => (
                      <p key={i} className="text-sm sm:text-base text-foreground/70 leading-relaxed" data-testid={`text-spotlight-narrative-${member.id}-${i}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/lnk inline-flex items-center gap-2 text-sm font-semibold press"
                      data-testid={`link-spotlight-website-${member.id}`}
                    >
                      <span className="border-b-2 border-primary pb-0.5">Visit {member.website.replace("https://", "")}</span>
                      <ExternalLink className="h-4 w-4 text-primary transition-transform group-hover/lnk:translate-x-0.5 group-hover/lnk:-translate-y-0.5" />
                    </a>
                  </div>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
