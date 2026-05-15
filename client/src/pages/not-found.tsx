import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/editorial";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <Eyebrow className="text-primary mb-3">Error · 404</Eyebrow>
        <h1 className="font-display text-7xl sm:text-8xl leading-none tracking-tight mb-4" data-testid="text-404">
          Off the<br />
          <span className="italic font-light">blueprint.</span>
        </h1>
        <p className="text-foreground/70 mb-8">
          We couldn't find the page you were looking for. The link may have moved, expired,
          or never existed.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-7" data-testid="button-home">
            Back to NAMC NorCal
          </Button>
        </Link>
      </div>
    </div>
  );
}
