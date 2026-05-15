import { Check, Building, Building2, Landmark, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, SectionNumeral, RevealOnScroll } from "@/components/editorial";
import { cn } from "@/lib/utils";

const tiers = [
  {
    id: "small",
    icon: Building,
    name: "Small",
    sub: "Under $1M revenue",
    price: "$400",
    description: "Perfect for emerging minority-owned construction businesses",
    features: ["Full Chapter member access", "Networking opportunities", "Member directory listing", "Event attendance", "Industry updates & newsletters"],
    popular: false,
  },
  {
    id: "medium",
    icon: Building2,
    name: "Medium Business",
    revenue: "$1M – $7M",
    price: "$800",
    description: "Ideal for growing contractors expanding their capacity",
    features: ["All Small Business benefits", "Enhanced networking access", "Sponsorship opportunities", "Committee participation", "Priority event registration"],
    popular: true,
  },
  {
    id: "large",
    icon: LayoutGrid,
    name: "Large",
    sub: "Over $7M revenue",
    price: "$1,200",
    description: "For established contractors leading the industry",
    features: ["All Medium Business benefits", "Premium visibility & recognition", "Leadership opportunities", "Mentorship program access", "Executive networking events"],
    popular: false,
  },
  {
    id: "government",
    icon: Landmark,
    name: "Government",
    sub: "Public sector",
    price: "$1,800",
    description: "For government agencies supporting minority contractors",
    features: ["All member benefits", "Agency representation", "Policy input opportunities", "Public-private partnerships", "Workforce development access"],
    popular: false,
  },
];

export function MembershipTiersSection() {
  const scrollToApply = () => {
    document.querySelector("#apply")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="membership" className="py-16 sm:py-24 lg:py-28 paper border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <RevealOnScroll>
            <SectionNumeral number="02" label="Membership" />
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <h2
              className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.04] tracking-tight mb-5"
              data-testid="text-membership-title"
            >
              Pick the tier that fits the firm.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={140}>
            <p className="text-lead text-foreground/75">
              Annual membership runs January 1 – December 31. Pay by check, money order,
              or credit card; invoicing available on request.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {tiers.map((tier, idx) => (
            <RevealOnScroll key={tier.id} delay={Math.min(idx * 70, 240)}>
              <div
                className={cn(
                  "relative flex flex-col h-full rounded-2xl border bg-card p-6 sm:p-7",
                  tier.popular
                    ? "border-gold-hairline shadow-editorial"
                    : "border-card-border shadow-sm"
                )}
                data-testid={`card-tier-${tier.id}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full">
                    Most popular
                  </Badge>
                )}
                <div className="mb-5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 mb-4">
                    <tier.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Eyebrow className="mb-1">{tier.revenue}</Eyebrow>
                  <h3 className="font-display text-2xl leading-tight">{tier.name}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display font-display-tnum text-5xl text-foreground leading-none">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/yr</span>
                </div>
                <p className="text-sm text-foreground/70 mb-5">{tier.description}</p>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full rounded-full",
                    tier.popular ? "" : "border-card-border"
                  )}
                  variant={tier.popular ? "default" : "outline"}
                  onClick={scrollToApply}
                  data-testid={`button-select-${tier.id}`}
                >
                  Select {tier.name}
                </Button>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Questions on payment or invoicing? Email{" "}
          <a href="mailto:info@namcnorcal.org" className="text-primary font-medium underline-offset-2 hover:underline">
            info@namcnorcal.org
          </a>.
        </p>
      </div>
    </section>
  );
}
