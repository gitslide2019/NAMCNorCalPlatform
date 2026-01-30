import { Check, Building, Building2, Landmark, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    id: "small",
    icon: Building,
    name: "Small Business",
    revenue: "Under $1M",
    price: "$400",
    description: "Perfect for emerging minority-owned construction businesses",
    features: [
      "Full member access to Chapter services",
      "Networking opportunities",
      "Member directory listing",
      "Event attendance",
      "Industry updates & newsletters"
    ],
    popular: false
  },
  {
    id: "medium",
    icon: Building2,
    name: "Medium Business",
    revenue: "$1M - $7M",
    price: "$800",
    description: "Ideal for growing contractors expanding their capacity",
    features: [
      "All Small Business benefits",
      "Enhanced networking access",
      "Sponsorship opportunities",
      "Committee participation",
      "Priority event registration"
    ],
    popular: true
  },
  {
    id: "large",
    icon: LayoutGrid,
    name: "Large Business",
    revenue: "Over $7M",
    price: "$1,200",
    description: "For established contractors leading the industry",
    features: [
      "All Medium Business benefits",
      "Premium visibility & recognition",
      "Leadership opportunities",
      "Mentorship program access",
      "Executive networking events"
    ],
    popular: false
  },
  {
    id: "government",
    icon: Landmark,
    name: "Government Agency",
    revenue: "Public Sector",
    price: "$1,800",
    description: "For government agencies supporting minority contractors",
    features: [
      "All member benefits",
      "Agency representation",
      "Policy input opportunities",
      "Public-private partnerships",
      "Workforce development access"
    ],
    popular: false
  }
];

export function MembershipTiersSection() {
  const scrollToApply = () => {
    const element = document.querySelector("#apply");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="membership" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-membership-title">
            Membership Categories & Annual Dues
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the membership tier that fits your business. Annual membership period runs from January 1 to December 31.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative flex flex-col ${tier.popular ? "border-primary shadow-lg" : ""}`}
              data-testid={`card-tier-${tier.id}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <tier.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.revenue}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-6">{tier.description}</p>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                  onClick={scrollToApply}
                  data-testid={`button-select-${tier.id}`}
                >
                  Select {tier.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Payment options: Check, Money Order, or Credit Card. Contact us at{" "}
            <a href="mailto:info@namcnorcal.org" className="text-primary hover:underline">
              info@namcnorcal.org
            </a>{" "}
            for invoicing.
          </p>
        </div>
      </div>
    </section>
  );
}
