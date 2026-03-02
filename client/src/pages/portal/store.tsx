import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingBag, Package, Tag, Truck, Star } from "lucide-react";

const STORE_URL = "https://w0kiic-5a.myshopify.com/";

const storeFeatures = [
  {
    icon: ShoppingBag,
    title: "Branded Merchandise",
    description: "Show your NAMC NorCal pride with official branded apparel and accessories.",
  },
  {
    icon: Package,
    title: "Member Exclusives",
    description: "Access gear and products available only to NAMC NorCal members.",
  },
  {
    icon: Tag,
    title: "Special Pricing",
    description: "Enjoy member pricing on select items and seasonal promotions.",
  },
  {
    icon: Truck,
    title: "Direct Shipping",
    description: "All orders ship directly to you with tracking and delivery updates.",
  },
];

export default function Store() {
  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-8 sm:p-12 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E5A830]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E5A830]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E5A830]">
                <ShoppingBag className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-store-title">NAMC NorCal Store</h1>
                <p className="text-white/60 text-sm">Official merchandise and member gear</p>
              </div>
            </div>
            <p className="text-white/80 max-w-2xl mb-6 text-sm sm:text-base leading-relaxed">
              Rep your chapter with official NAMC NorCal merchandise. From branded apparel to professional gear,
              our store has everything you need to show your commitment to the minority contractor community.
            </p>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="link-visit-store">
              <Button size="lg" className="bg-[#E5A830] text-black hover:bg-[#d49a28] font-semibold">
                <ExternalLink className="h-5 w-5 mr-2" />
                Visit the Store
              </Button>
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {storeFeatures.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5A830]/10 mb-3">
                  <feature.icon className="h-5 w-5 text-[#E5A830]" />
                </div>
                <h3 className="font-semibold mb-1" data-testid={`text-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-[#E5A830]/20">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5A830]/10 shrink-0">
              <Star className="h-8 w-8 text-[#E5A830]" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-lg font-semibold mb-1">Support Your Chapter</h3>
              <p className="text-sm text-muted-foreground">
                Every purchase from the NAMC NorCal store supports our mission to advocate for minority contractors
                in the Bay Area. Your support helps fund networking events, training programs, and advocacy efforts.
              </p>
            </div>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="link-visit-store-bottom">
              <Button variant="outline" className="border-[#E5A830] text-[#E5A830] hover:bg-[#E5A830]/10 whitespace-nowrap">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
