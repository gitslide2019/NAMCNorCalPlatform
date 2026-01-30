import { ArrowRight, Building, Users, Award, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const scrollToApply = () => {
    const element = document.querySelector("#apply");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/20">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Award className="h-4 w-4" />
              <span>Est. 1969 - The Oldest Minority Construction Trade Association</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
              Build Your Future with{" "}
              <span className="text-primary">NAMC NorCal</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl" data-testid="text-hero-subtitle">
              Join the National Association of Minority Contractors, Northern California Chapter. 
              Access opportunities, advocacy, and contractor development training to grow your construction business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={scrollToApply} data-testid="button-hero-apply">
                Apply for Membership
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.querySelector("#why-join")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-hero-learn-more">
                Learn More
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Building}
                value="$1B+"
                label="Annual Project Capacity"
                testId="stat-project-capacity"
              />
              <StatCard
                icon={Users}
                value="50+"
                label="Hall of Fame Members"
                testId="stat-hall-of-fame"
              />
              <StatCard
                icon={Award}
                value="55+"
                label="Years of Excellence"
                testId="stat-years"
              />
              <StatCard
                icon={Briefcase}
                value="25M+"
                label="Minority Workers Represented"
                testId="stat-workers"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}

function StatCard({ 
  icon: Icon, 
  value, 
  label,
  testId 
}: { 
  icon: typeof Building; 
  value: string; 
  label: string;
  testId: string;
}) {
  return (
    <div className="bg-card rounded-lg border p-5 text-center hover-elevate" data-testid={testId}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
