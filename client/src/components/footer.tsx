import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

export function Footer() {
  return (
    <footer className="bg-foreground text-background blueprint relative" data-testid="footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand block */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background p-1">
                <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" data-testid="img-footer-logo" />
              </div>
              <div>
                <span className="font-display text-xl font-semibold leading-none" data-testid="text-footer-brand">NAMC NorCal</span>
                <p className="text-[10px] tracking-[0.2em] uppercase text-background/60 mt-1">Northern California Chapter · 1969</p>
              </div>
            </div>
            <p className="text-sm text-background/70 max-w-md leading-relaxed" data-testid="text-footer-description">
              The National Association of Minority Contractors, Northern California Chapter — the oldest minority
              construction trade association in the United States.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <span className="h-px w-8 bg-primary" />
              501(c)(3) · Dues are tax-deductible
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <p className="eyebrow text-primary mb-4">Chapter</p>
            <ul className="space-y-3.5 text-sm text-background/80">
              <li className="flex items-start gap-2.5" data-testid="text-address">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-background/50" />
                <span>977 66th Ave<br />Oakland, CA 94621</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-background/50" />
                <a
                  href="mailto:info@namcnorcal.org"
                  className="hover:text-primary transition-colors underline-offset-4 decoration-primary/40 hover:decoration-primary hover:underline"
                  data-testid="link-email-main"
                >
                  info@namcnorcal.org
                </a>
              </li>
            </ul>
          </div>

          {/* President */}
          <div className="lg:col-span-2">
            <p className="eyebrow text-primary mb-4">President</p>
            <p className="text-sm text-background mb-3" data-testid="text-president-info">
              Bruce Giron<br />
              <span className="text-background/60">NAMC-NC</span>
            </p>
            <ul className="space-y-2.5 text-sm text-background/80">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-background/50" />
                <a href="tel:510-912-4206" className="hover:text-primary transition-colors" data-testid="link-phone-president">
                  (510) 912-4206
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-background/50" />
                <a href="mailto:bagiron@gironcms.com" className="hover:text-primary transition-colors break-all" data-testid="link-email-president">
                  bagiron@gironcms.com
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <p className="eyebrow text-primary mb-4">Visit</p>
            <ul className="space-y-3 text-sm">
              {[
                { href: "https://www.namcnorcal.org", label: "Main Website", testId: "link-main-website" },
                { href: "https://www.namcnorcal.org/member-application", label: "Member Application", testId: "link-member-application" },
                { href: "https://www.namcnorcal.org/member-pay", label: "Member Pay", testId: "link-member-pay" },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-background/80 hover:text-primary transition-colors"
                    data-testid={l.testId}
                  >
                    {l.label}
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mega wordmark */}
        <div className="mt-16 pt-12 border-t border-background/10 overflow-hidden">
          <p className="font-display text-[18vw] sm:text-[14vw] lg:text-[10vw] font-bold leading-[0.85] text-background/[0.04] select-none -mb-4" aria-hidden>
            NAMC NORCAL
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <p className="text-xs text-background/50" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} NAMC Northern California — built by contractors, for contractors.
            </p>
            <p className="text-xs text-background/50 tracking-wider uppercase" data-testid="text-501c3">
              Oakland · San Francisco · San Jose
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
