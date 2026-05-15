import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingBag, Package, Tag, Truck, Star } from "lucide-react";
import { Eyebrow, SectionNumeral, BlueprintSurface, RevealOnScroll } from "@/components/editorial";
import productPolo from "@assets/Screenshot_2026-03-02_at_7.41.46_PM_1772509575428.png";
import productBackpackGold from "@assets/Screenshot_2026-03-02_at_7.41.41_PM_1772509575428.png";
import productDuffel from "@assets/Screenshot_2026-03-02_at_7.41.22_PM_1772509575429.png";
import productHoodie from "@assets/Screenshot_2026-03-02_at_7.41.13_PM_1772509575429.png";
import productBackpack from "@assets/Screenshot_2026-03-02_at_7.40.56_PM_1772509575430.png";
import productMug from "@assets/Screenshot_2026-03-02_at_7.46.36_PM_1772509627017.png";
import productClogs from "@assets/Screenshot_2026-03-02_at_7.46.32_PM_1772509627018.png";
import productTumbler from "@assets/Screenshot_2026-03-02_at_7.46.23_PM_1772509627019.png";
import storeBanner from "@assets/Screenshot_2026-03-02_at_8.17.04_PM_1772511432870.png";

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

const storeProducts = [
  {
    image: productPolo,
    title: "NAMC Polo Shirt",
    price: "$38.00",
    description: "Classic white polo with logo",
  },
  {
    image: productHoodie,
    title: "NAMC Hoodie",
    price: "$55.00",
    description: "Premium pullover hoodie",
  },
  {
    image: productBackpack,
    title: "NAMC Backpack",
    price: "$48.00",
    description: "Gold branded backpack",
  },
  {
    image: productBackpackGold,
    title: "Flap Backpack",
    price: "$52.00",
    description: "Gold & black rucksack",
  },
  {
    image: productDuffel,
    title: "Duffel Bag",
    price: "$45.00",
    description: "Gold gym & travel bag",
  },
  {
    image: productMug,
    title: "Coffee Mug",
    price: "$18.00",
    description: "Ceramic mug with logo",
  },
  {
    image: productTumbler,
    title: "Travel Tumbler",
    price: "$28.00",
    description: "Insulated straw tumbler",
  },
  {
    image: productClogs,
    title: "NAMC Clogs",
    price: "$35.00",
    description: "Comfort clogs with logo",
  },
];

export default function Store() {
  return (
    <PortalLayout>
      <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-12">
        <BlueprintSurface className="relative overflow-hidden rounded-2xl shadow-editorial" data-testid="banner-store">
          <img
            src={storeBanner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="relative px-6 py-10 sm:px-12 sm:py-16 max-w-2xl">
            <Eyebrow className="text-primary">The Shop</Eyebrow>
            <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-[0.9] text-white mt-3" data-testid="text-store-title">
              Wear the<br/><span className="text-primary italic">chapter.</span>
            </h1>
            <p className="text-white/75 mt-5 text-sm sm:text-base max-w-md">
              Official NAMC NorCal merchandise — branded apparel and professional gear, shipped direct.
            </p>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="link-visit-store" className="inline-block mt-7">
              <Button size="lg" className="rounded-full bg-primary text-primary-foreground font-semibold pressable">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit the Store
              </Button>
            </a>
          </div>
        </BlueprintSurface>

        <section>
          <div className="flex items-end justify-between gap-4 border-b border-foreground/10 pb-3 mb-6">
            <div className="flex items-baseline gap-4">
              <SectionNumeral number="01" className="mb-0" />
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight" data-testid="text-featured-products">Featured</h2>
            </div>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-[0.18em] text-primary font-semibold hover:underline">Browse all →</a>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {storeProducts.map((product, idx) => (
              <RevealOnScroll key={product.title} delay={idx * 40}>
                <a
                  href={STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                  data-testid={`link-product-${product.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Card className="h-full shadow-editorial overflow-hidden pressable">
                    <div className="aspect-square overflow-hidden bg-white border-b border-foreground/10">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                        data-testid={`img-product-${product.title.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-display text-base leading-tight truncate" data-testid={`text-product-title-${product.title.toLowerCase().replace(/\s+/g, "-")}`}>{product.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate" data-testid={`text-product-desc-${product.title.toLowerCase().replace(/\s+/g, "-")}`}>{product.description}</p>
                      <p className="font-display font-bold tabular-nums text-primary mt-2" data-testid={`text-product-price-${product.title.toLowerCase().replace(/\s+/g, "-")}`}>{product.price}</p>
                    </CardContent>
                  </Card>
                </a>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-4 border-b border-foreground/10 pb-3 mb-6">
            <SectionNumeral number="02" className="mb-0" />
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight">Why shop here</h2>
          </div>
          <div className="grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4 shadow-editorial rounded-xl overflow-hidden">
            {storeFeatures.map((feature) => (
              <div key={feature.title} className="bg-card p-6">
                <feature.icon className="h-6 w-6 text-primary mb-4" strokeWidth={1.5} />
                <h3 className="font-display text-lg leading-tight mb-1" data-testid={`text-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="shadow-editorial border-primary/30 overflow-hidden">
          <CardContent className="p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
            <Star className="absolute -top-6 -right-6 h-32 w-32 text-primary/10" strokeWidth={1} />
            <div className="flex-1 relative">
              <Eyebrow className="text-primary">Support the chapter</Eyebrow>
              <h3 className="font-display text-2xl sm:text-3xl tracking-tight mt-2 mb-2">Every order builds the work.</h3>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Proceeds fund networking events, training programs, and advocacy for minority contractors across the Bay Area.
              </p>
            </div>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="link-visit-store-bottom" className="relative">
              <Button variant="outline" className="rounded-full border-primary text-foreground whitespace-nowrap pressable">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop now
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
