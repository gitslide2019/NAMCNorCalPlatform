import { ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, SectionNumeral, RevealOnScroll } from "@/components/editorial";
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
      "Just one year in, Amir has already secured a $1 million bonding capacity and earned DBE, SBE, and DVBE certifications through agencies including VTA, BART, and DGS. He's actively bidding alongside other small businesses, building relationships with certified firms like Talion, Spectrum, and Patriot.",
      "Partnering with fellow diverse small businesses isn't a strategy — it's in the DNA of his company. Joining NAMC NorCal was a natural next step: a chance to connect with other minority contractors, find new opportunities, and grow with a community that shares his values.",
    ],
    website: "https://5dccs.com",
    certifications: ["DBE", "SBE", "DVBE", "Veteran-Owned"],
  },
];

export function MemberSpotlightSection() {
  return (
    <section id="member-spotlight" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <RevealOnScroll>
            <SectionNumeral number="04" label="Member spotlight" />
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.04] tracking-tight mb-5" data-testid="text-spotlight-title">
              The people building the Bay.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={140}>
            <p className="text-lead text-foreground/75">
              Each issue we feature a NAMC NorCal member whose story — and whose work — moves the chapter forward.
            </p>
          </RevealOnScroll>
        </div>

        <div className="space-y-24">
          {spotlightMembers.map((member) => (
            <article key={member.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start" data-testid={`card-spotlight-${member.id}`}>
              <RevealOnScroll className="lg:col-span-5 lg:sticky lg:top-24">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-editorial">
                  <img
                    src={member.photo}
                    alt={`${member.name}, ${member.title} of ${member.company}`}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    data-testid={`img-spotlight-${member.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <Eyebrow className="text-white/70 mb-1">Spotlight</Eyebrow>
                    <p className="font-display text-xl">{member.location}</p>
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={120} className="lg:col-span-7 pt-2">
                <Eyebrow className="text-primary mb-3">{member.title} · {member.company}</Eyebrow>
                <h3 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] tracking-tight mb-2" data-testid={`text-spotlight-name-${member.id}`}>
                  {member.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70 mb-6">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{member.location}</span>
                  <span className="text-muted-foreground/40">/</span>
                  <span>{member.trade}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-7">
                  {member.certifications.map(cert => (
                    <Badge key={cert} variant="outline" className="rounded-full text-xs font-medium border-gold-hairline" data-testid={`badge-cert-${cert.toLowerCase().replace(/\s+/g, "-")}`}>
                      {cert}
                    </Badge>
                  ))}
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {member.narrative.map((p, i) => (
                    <p
                      key={i}
                      className={`text-foreground/80 leading-relaxed ${i === 0 ? "first-letter:font-display first-letter:text-6xl first-letter:font-extrabold first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:text-primary" : ""}`}
                      data-testid={`text-spotlight-narrative-${member.id}-${i}`}
                    >
                      {p}
                    </p>
                  ))}
                </div>

                <a
                  href={member.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground text-background font-medium px-6 py-3 hover:bg-foreground/90 transition-colors text-sm pressable"
                  data-testid={`link-spotlight-website-${member.id}`}
                >
                  Visit {member.company.split(" ").slice(0, 2).join(" ")}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </RevealOnScroll>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
