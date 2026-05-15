import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { BlueprintSurface, Eyebrow } from "@/components/editorial";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

export function Footer() {
  return (
    <BlueprintSurface as="footer" data-testid="footer" className="border-t border-gold-hairline">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-white">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-white p-1">
                <img src={namcLogo} alt="NAMC NorCal Logo" className="h-full w-full object-contain" data-testid="img-footer-logo" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg" data-testid="text-footer-brand">NAMC NorCal</span>
                <span className="eyebrow text-white/55">Est. 1969</span>
              </div>
            </div>
            <p className="text-sm text-white/65 leading-relaxed" data-testid="text-footer-description">
              The National Association of Minority Contractors, Northern California Chapter — the oldest minority construction trade association in the United States.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <span className="h-px w-8 bg-primary" />
              501(c)(3) · Dues are tax-deductible
            </div>
          </div>

          <div>
            <Eyebrow className="text-white/60 mb-4">Contact</Eyebrow>
            <ul className="space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-2" data-testid="text-address">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/90" />
                <span>977 66th Ave<br />Oakland, CA 94621</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary/90" />
                <a href="mailto:info@namcnorcal.org" className="underline-offset-2 hover:underline hover:text-white" data-testid="link-email-main">
                  info@namcnorcal.org
                </a>
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow className="text-white/60 mb-4">Quick links</Eyebrow>
            <ul className="space-y-2.5 text-sm text-white/75">
              {[
                { href: "https://www.namcnorcal.org", label: "Main Website", testId: "link-main-website" },
                { href: "https://www.namcnorcal.org/member-application", label: "Member Application", testId: "link-member-application" },
                { href: "https://www.namcnorcal.org/member-pay", label: "Member Pay", testId: "link-member-pay" },
              ].map(l => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline hover:text-white inline-flex items-center gap-1" data-testid={l.testId}>
                    {l.label}<ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Eyebrow className="text-white/60 mb-4">President</Eyebrow>
            <p className="text-sm text-white/85 mb-3 font-medium" data-testid="text-president-info">
              Bruce Giron<br />
              <span className="text-white/60 text-xs uppercase tracking-wide">NAMC-NC President</span>
            </p>
            <ul className="space-y-2 text-sm text-white/75">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary/90" />
                <a href="tel:510-912-4206" className="underline-offset-2 hover:underline hover:text-white" data-testid="link-phone-president">(510) 912-4206</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary/90" />
                <a href="mailto:bagiron@gironcms.com" className="underline-offset-2 hover:underline hover:text-white" data-testid="link-email-president">bagiron@gironcms.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="eyebrow text-white/55" data-testid="text-copyright">
              © {new Date().getFullYear()} NAMC Northern California
            </p>
            <p className="eyebrow text-white/55" data-testid="text-501c3">
              501(c)(3) · Dues are tax-deductible
            </p>
          </div>
        </div>
      </div>
    </BlueprintSurface>
  );
}
