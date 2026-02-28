import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  User, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/profile", label: "My Profile", icon: User },
  { href: "/portal/directory", label: "Member Directory", icon: Users },
];

const adminNavItems = [
  { href: "/portal/admin", label: "Admin Panel", icon: ShieldCheck },
];

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNavItems = [
    ...navItems,
    ...(user?.isAdmin ? adminNavItems : []),
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-card">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white p-1 border">
                <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">NAMC NorCal</span>
                <span className="text-xs text-muted-foreground leading-tight">Member Portal</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {allNavItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/portal" && location.startsWith(item.href));
              const isExactActive = location === item.href;
              const active = item.href === "/portal" ? isExactActive : isActive;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    data-testid={`link-portal-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t space-y-1">
            <Link href="/">
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                data-testid="link-portal-main-site"
              >
                <Home className="h-4 w-4" />
                Main Site
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors w-full"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <div className="px-3 py-2 mt-2">
              <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-0.5 border">
            <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
          </div>
          <span className="text-sm font-bold">Member Portal</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-portal-mobile-menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="fixed top-14 left-0 right-0 bg-card border-b p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {allNavItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
            <Link href="/">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground cursor-pointer">
                <Home className="h-4 w-4" />
                Main Site
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive w-full"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
