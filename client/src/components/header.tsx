import { Menu, X, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

const navLinks = [
  { href: "#why-join", label: "Why Join" },
  { href: "#membership", label: "Membership" },
  { href: "#get-involved", label: "Get Involved" },
  { href: "#apply", label: "Apply Now" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-[9999] w-full border-b bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white p-1">
              <img 
                src={namcLogo} 
                alt="NAMC NorCal Logo" 
                className="h-full w-full object-contain"
                data-testid="img-logo"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-neutral-900 dark:text-white" data-testid="text-org-name">NAMC NorCal</span>
              <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-tight hidden sm:block">General Membership</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                className="text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => scrollToSection(link.href)}
                data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/portal">
                <Button variant="default" size="sm" className="hidden sm:inline-flex" data-testid="link-my-portal">
                  <User className="h-4 w-4 mr-1.5" />
                  My Portal
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex" data-testid="link-member-login">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Member Login
                </Button>
              </Link>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className="justify-start text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => scrollToSection(link.href)}
                  data-testid={`link-mobile-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Button>
              ))}
              {user ? (
                <Link href="/portal">
                  <Button variant="default" className="justify-start w-full mt-2" data-testid="link-mobile-portal">
                    <User className="h-4 w-4 mr-1.5" />
                    My Portal
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button variant="outline" className="justify-start w-full mt-2" data-testid="link-mobile-login">
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Member Login
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
