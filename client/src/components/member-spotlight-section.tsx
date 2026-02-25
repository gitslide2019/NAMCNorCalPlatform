import { ExternalLink, MapPin, Award, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      "When military veteran Amir Jenkins launched 5D Construction Containment Services, he brought more than technical expertise to the table — he brought a mission. His company specializes in modular wall systems that keep construction sites clean, quiet, and compliant, reducing dust, noise, and disruption so projects can move forward without compromise.",
      "Just one year into building 5DCCS, Amir has already secured a $1 million bonding capacity and earned DBE, SBE, and DVBE certifications through agencies including VTA, BART, and DGS. He's actively bidding on projects alongside other small businesses as a subcontractor, building relationships with certified firms like Talion Construction, Spectrum Construction, and Patriot Construction.",
      "For Amir, partnering with fellow diverse small businesses isn't just a strategy — it's in the DNA of his company. Though he hasn't yet landed a public project, he's laying the groundwork by networking, bidding, and showing up. Joining NAMC NorCal was a natural next step: a chance to connect with other minority contractors, find new opportunities, and grow alongside a community that shares his values.",
    ],
    website: "https://5dccs.com",
    certifications: ["DBE", "SBE", "DVBE", "Veteran-Owned"],
  },
];

export function MemberSpotlightSection() {
  return (
    <section id="member-spotlight" className="py-24 sm:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 mb-6">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wide text-primary" data-testid="text-spotlight-badge">
              Member Spotlight
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-spotlight-title">
            Meet Our Members
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            NAMC NorCal is proud to highlight the outstanding minority contractors and businesses
            that make our chapter strong. These are the people building the future of construction.
          </p>
        </div>

        <div className="space-y-16">
          {spotlightMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl overflow-hidden border bg-card shadow-sm"
              data-testid={`card-spotlight-${member.id}`}
            >
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-5/12">
                  <div className="relative h-80 sm:h-96 lg:h-full lg:min-h-[560px]">
                    <img
                      src={member.photo}
                      alt={`${member.name}, ${member.title} of ${member.company}`}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      data-testid={`img-spotlight-${member.id}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/10" />
                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 lg:hidden">
                      {member.certifications.map((cert) => (
                        <Badge
                          key={cert}
                          className="bg-white/90 text-foreground text-xs font-medium backdrop-blur-sm"
                          data-testid={`badge-cert-${cert.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:w-7/12 p-8 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center">
                  <div className="hidden lg:flex flex-wrap gap-2 mb-6">
                    {member.certifications.map((cert) => (
                      <Badge
                        key={cert}
                        variant="secondary"
                        className="text-xs font-medium"
                        data-testid={`badge-cert-lg-${cert.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>

                  <h3
                    className="text-3xl sm:text-4xl font-bold mb-2"
                    data-testid={`text-spotlight-name-${member.id}`}
                  >
                    {member.name}
                  </h3>
                  <p className="text-primary text-lg font-semibold mb-1" data-testid={`text-spotlight-title-${member.id}`}>
                    {member.title}
                  </p>
                  <p className="text-xl font-semibold mb-4" data-testid={`text-spotlight-company-${member.id}`}>
                    {member.company}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {member.location}
                    </span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>{member.trade}</span>
                  </div>

                  <div className="relative mb-8">
                    <Quote className="absolute -top-2 -left-1 h-8 w-8 text-primary/15 rotate-180" />
                    <div className="space-y-4 pl-6">
                      {member.narrative.map((paragraph, i) => (
                        <p
                          key={i}
                          className="text-muted-foreground leading-relaxed"
                          data-testid={`text-spotlight-narrative-${member.id}-${i}`}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="pl-6">
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                      data-testid={`link-spotlight-website-${member.id}`}
                    >
                      Visit {member.company.split(" ")[0]} {member.company.split(" ")[1]}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
