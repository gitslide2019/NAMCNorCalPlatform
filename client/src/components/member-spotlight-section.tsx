import { ExternalLink, MapPin, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  description: string;
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
    trade: "Modular Wall Systems",
    description:
      "5D Construction Containment Services delivers reliable modular wall system solutions for construction projects, reducing dust, noise, and disruption with efficiency and compliance. As a veteran-owned small business, they are committed to partnering with fellow diverse businesses and maximizing opportunities for minority contractors.",
    website: "https://5dccs.com",
    certifications: ["DBE", "SBE", "DVBE"],
  },
];

export function MemberSpotlightSection() {
  return (
    <section id="member-spotlight" className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary" data-testid="text-spotlight-badge">
              Member Spotlight
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-spotlight-title">
            Meet Our Members
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            NAMC NorCal is proud to highlight the outstanding minority contractors and businesses
            that make our chapter strong. Learn about the companies driving excellence in construction.
          </p>
        </div>

        <div className="space-y-12">
          {spotlightMembers.map((member) => (
            <Card
              key={member.id}
              className="overflow-hidden"
              data-testid={`card-spotlight-${member.id}`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5 lg:w-1/3">
                    <div className="relative h-72 md:h-full min-h-[320px]">
                      <img
                        src={member.photo}
                        alt={`${member.name}, ${member.title} of ${member.company}`}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        data-testid={`img-spotlight-${member.id}`}
                      />
                    </div>
                  </div>

                  <div className="md:w-3/5 lg:w-2/3 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {member.certifications.map((cert) => (
                        <Badge
                          key={cert}
                          variant="secondary"
                          className="text-xs"
                          data-testid={`badge-cert-${cert.toLowerCase()}`}
                        >
                          {cert}
                        </Badge>
                      ))}
                    </div>

                    <h3
                      className="text-2xl sm:text-3xl font-bold mb-1"
                      data-testid={`text-spotlight-name-${member.id}`}
                    >
                      {member.name}
                    </h3>
                    <p className="text-primary font-medium mb-1" data-testid={`text-spotlight-title-${member.id}`}>
                      {member.title}
                    </p>
                    <p className="text-lg font-semibold mb-3" data-testid={`text-spotlight-company-${member.id}`}>
                      {member.company}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {member.location}
                      </span>
                      <span className="hidden sm:inline text-muted-foreground/40">|</span>
                      <span>{member.trade}</span>
                    </div>

                    <p
                      className="text-muted-foreground leading-relaxed mb-6"
                      data-testid={`text-spotlight-desc-${member.id}`}
                    >
                      {member.description}
                    </p>

                    <div>
                      <a
                        href={member.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-2"
                        data-testid={`link-spotlight-website-${member.id}`}
                      >
                        Visit Website
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
