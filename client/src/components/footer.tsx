import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import namcLogo from "@assets/NAMCNorCal_Logo_1769738259736.png";

export function Footer() {
  return (
    <footer className="bg-card border-t" data-testid="footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white dark:bg-neutral-800 p-1">
                <img 
                  src={namcLogo} 
                  alt="NAMC NorCal Logo" 
                  className="h-full w-full object-contain"
                  data-testid="img-footer-logo"
                />
              </div>
              <div>
                <span className="font-bold" data-testid="text-footer-brand">NAMC NorCal</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-footer-description">
              The National Association of Minority Contractors, Northern California Chapter, Inc. 
              The oldest minority construction trade association in the United States.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2" data-testid="text-address">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>977 66th Ave<br />Oakland, CA 94621</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a 
                  href="tel:1-800-340-4436" 
                  className="underline-offset-2 hover:underline"
                  data-testid="link-phone-main"
                >
                  1-800-340-4436
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a 
                  href="mailto:info@namcnorcal.org" 
                  className="underline-offset-2 hover:underline"
                  data-testid="link-email-main"
                >
                  info@namcnorcal.org
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.namcnorcal.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline-offset-2 hover:underline flex items-center gap-1"
                  data-testid="link-main-website"
                >
                  Main Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.namcnorcal.org/member-application" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline-offset-2 hover:underline flex items-center gap-1"
                  data-testid="link-member-application"
                >
                  Member Application
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.namcnorcal.org/member-pay" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline-offset-2 hover:underline flex items-center gap-1"
                  data-testid="link-member-pay"
                >
                  Member Pay
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">President Contact</h3>
            <p className="text-sm text-muted-foreground mb-2" data-testid="text-president-info">
              Bruce Giron<br />
              NAMC-NC President
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a 
                  href="tel:510-912-4206" 
                  className="underline-offset-2 hover:underline"
                  data-testid="link-phone-president"
                >
                  (510) 912-4206
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a 
                  href="mailto:bagiron@gironcms.com" 
                  className="underline-offset-2 hover:underline"
                  data-testid="link-email-president"
                >
                  bagiron@gironcms.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} NAMC Northern California. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-501c3">
              NAMC is a 501(c)(3) organization. Annual dues are tax-deductible.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
