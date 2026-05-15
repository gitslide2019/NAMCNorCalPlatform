import { Check, Building, Building2, Landmark, LayoutGrid, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionNumeral } from "@/components/namc/SectionNumeral";
import { cn } from "@/lib/utils";

const tiers = [
  {
    id: "small",
    icon: Building,
    name: "Small",
    sub: "Under $1M revenue",
    price: "$400",
    description: "For emerging minority-owned construction businesses",
    features: ["Full Chapter access", "Networking events", "Member directory", "Industry updates"],
    popular: false,
  },
  {
    id: "medium",
    icon: Building2,
    name: "Medium",
    sub: "$1M – $7M revenue",
    price: "$800",
    description: "For growing contractors expanding capacity",
    features: ["All Small benefits", "Enhanced networking", "Sponsorship access", "Committee participation", "Priority registration"],
    popular: true,
  },
  {
    id: "large",
    icon: LayoutGrid,
    name: "Large",
    sub: "Over $7M revenue",
    price: "$1,200",
    description: "For established contractors leading the industry",
    features: ["All Medium benefits", "Premium visibility", "Leadership tracks", "Mentorship", "Executive events"],
    popular: false,
  },
  {
    id: "government",
    icon: Landmark,
    name: "Government",
    sub: "Public sector",
    price: "$1,800",
    description: "Agencies supporting minority contractors",
    features: ["All member benefits", "Agency representation", "Policy input", "Public-private partnerships", "Workforce development"],
    popular: false,
  },
];

export function MembershipTiersSection() {
  const scrollToApply = () => document.querySelector("#apply")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="membership" className="py-16 sm:py-24 lg:py-28 paper border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 mb-10 lg:mb-14 items-end">
          <div className="lg:col-span-7">
            <SectionNumeral number="03" label="Membership · Annual Dues" />
            <h2 className="font-display text-display-sm sm:text-display font-semibold leading-[1.05]" data-testid="text-membership-title">
              Pick the tier that{" "}
              <span className="italic font-light">fits your shop.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lead text-foreground/70 leading-relaxed">
              Annual membership runs January 1 – December 31. Pay by check, money order, or credit card.
            </p>
          </div>
        </div>

        {/* Mobile: horizontal scroll snap; Desktop: 4-col grid */}
        <div className="-mx-4 sm:mx-0">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-4 px-4 sm:px-0 pb-2 sm:pb-0 scrollbar-thin">
            {tiers.map((tier) => (
              <article
                key={tier.id}
                className={cn(
                  "group relative shrink-0 w-[80%] sm:w-auto snap-start rounded-2xl bg-card edge-card flex flex-col p-6 press",
                  tier.popular && "ring-2 ring-primary",
                )}
                data-testid={`card-tier-${tier.id}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground rounded-full px-3 shadow-md">
                    Most popular
                  </Badge>
                )}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="eyebrow text-muted-foreground">Tier</span>
                    <h3 className="font-display text-2xl font-semibold mt-1">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.sub}</p>
                  </div>
                  <span className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <tier.icon className="h-5 w-5 text-primary" />
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-border">
                  <span className="font-numeral text-5xl text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">/yr</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tier.description}</p>
                <ul className="space-y-2.5 text-sm flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToApply}
                  className={cn(
                    "mt-6 group/btn w-full flex items-center justify-between rounded-full px-5 py-3 text-sm font-semibold press",
                    tier.popular
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-muted text-foreground hover:bg-muted/70",
                  )}
                  data-testid={`button-select-${tier.id}`}
                >
                  Choose {tier.name}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
              </article>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Need invoicing or have questions? Email{" "}
          <a href="mailto:info@namcnorcal.org" className="text-foreground underline underline-offset-4 decoration-primary decoration-2 hover:text-primary">
            info@namcnorcal.org
          </a>
          .
        </p>
      </div>
    </section>
  );
}
