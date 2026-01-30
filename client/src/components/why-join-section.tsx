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
  FileCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Users,
    title: "Full Member Access",
    description: "Gain exclusive access to Chapter services, resources, and programs designed for your success."
  },
  {
    icon: Network,
    title: "Industry Networking",
    description: "Network with top suppliers, general contractors, architects, engineers, and developers."
  },
  {
    icon: Award,
    title: "Enhanced Reputation",
    description: "Enhance your firm's stature by affiliating with the most respected and oldest industry association."
  },
  {
    icon: TrendingUp,
    title: "Marketing Effectiveness",
    description: "Increase your marketing effectiveness by tapping into our Association's broad industry network."
  },
  {
    icon: Handshake,
    title: "Government Connections",
    description: "Build relationships with government agencies and stay ahead on legislative changes."
  },
  {
    icon: GraduationCap,
    title: "Contractor Development",
    description: "Access training, capacity building, and growth programs to develop your business."
  },
  {
    icon: Building2,
    title: "Project Opportunities",
    description: "Connect with industry professionals and access contract opportunities."
  },
  {
    icon: Scale,
    title: "Advocacy & Representation",
    description: "Be represented by a leading voice for minority trade workers advocating for your interests."
  },
  {
    icon: Globe,
    title: "National Network",
    description: "Join a network of local chapters with strategic and corporate partnerships nationwide."
  },
  {
    icon: FileCheck,
    title: "Tax Deductible Dues",
    description: "NAMC is a 501(c)(3) organization. Annual dues are tax-deductible."
  }
];

export function WhyJoinSection() {
  return (
    <section id="why-join" className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-why-join-title">
            Why Join NAMC NorCal?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto" data-testid="text-why-join-subtitle">
            Founded in Oakland, California in 1969 by Ray Dones and Joseph Debro, The National Association of 
            Minority Contractors is the oldest minority construction trade association in the United States.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-benefit-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-card rounded-lg border p-8">
          <h3 className="text-xl font-semibold mb-4 text-center">Our Mission</h3>
          <p className="text-muted-foreground text-center max-w-4xl mx-auto" data-testid="text-mission">
            The National Association of Minority Contractors, Northern California Chapter, Inc. (NAMC-NorCal) 
            strives to continually advance its legacy of setting new standards of leadership, collaboration, 
            and business excellence to effectively advocate the issues of an ethnically and gender-diverse 
            constituency. Through training, legislative initiatives, and partnerships, NAMC-NC seeks to increase 
            construction capacity and economic inclusion, serving as a key resource for minority businesses in 
            the construction industry.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-card rounded-lg border" data-testid="pillar-deliver">
            <div className="text-primary font-bold text-lg mb-1">Deliver Work</div>
            <p className="text-sm text-muted-foreground">Execute projects with excellence</p>
          </div>
          <div className="p-6 bg-card rounded-lg border" data-testid="pillar-enhance">
            <div className="text-primary font-bold text-lg mb-1">Enhance Communities</div>
            <p className="text-sm text-muted-foreground">Give back to the community</p>
          </div>
          <div className="p-6 bg-card rounded-lg border" data-testid="pillar-develop">
            <div className="text-primary font-bold text-lg mb-1">Develop People</div>
            <p className="text-sm text-muted-foreground">Train the next generation</p>
          </div>
          <div className="p-6 bg-card rounded-lg border" data-testid="pillar-win">
            <div className="text-primary font-bold text-lg mb-1">Win Work</div>
            <p className="text-sm text-muted-foreground">Grow your business</p>
          </div>
        </div>
      </div>
    </section>
  );
}
