import { Menu, X, LogIn, User, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#why-join", label: "Why Join" },
  { href: "#membership", label: "Membership" },
  { href: "#member-spotlight", label: "Members" },
  { href: "#get-involved", label: "Get Involved" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-[9999] w-full transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/60"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-header-logo">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground p-1">
                <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" data-testid="img-logo" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-semibold tracking-tight" data-testid="text-org-name">NAMC NorCal</span>
                <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-0.5 hidden sm:block">Est. 1969</span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors group press"
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
                <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {user ? (
              <Link href="/portal">
                <Button size="sm" className="hidden sm:inline-flex rounded-full bg-foreground text-background hover:bg-foreground/90 press" data-testid="link-my-portal">
                  <User className="h-4 w-4 mr-1.5" />
                  My Portal
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <button
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors press"
                    data-testid="link-member-login"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </button>
                </Link>
                <button
                  onClick={() => scrollToSection("#apply")}
                  className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold press hover:bg-primary/90"
                  data-testid="button-header-apply"
                >
                  Apply
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/60 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link, i) => (
                <button
                  key={link.href}
                  className="flex items-center justify-between px-2 py-3 text-base font-medium text-foreground hover:bg-muted rounded-lg press text-left"
                  onClick={() => scrollToSection(link.href)}
                  data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-numeral text-primary text-sm w-5">{String(i + 1).padStart(2, "0")}</span>
                    {link.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60">
                {user ? (
                  <Link href="/portal">
                    <Button className="w-full rounded-full bg-foreground text-background" data-testid="link-mobile-portal">
                      <User className="h-4 w-4 mr-1.5" /> My Portal
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button variant="outline" className="w-full rounded-full" data-testid="link-mobile-login">
                        <LogIn className="h-4 w-4 mr-1.5" /> Sign in
                      </Button>
                    </Link>
                    <Button
                      onClick={() => scrollToSection("#apply")}
                      className="w-full rounded-full bg-primary text-primary-foreground"
                      data-testid="button-mobile-apply"
                    >
                      Apply
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
