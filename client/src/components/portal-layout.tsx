import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  User, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  Home,
  Mail,
  MessageSquare,
  Briefcase,
  CalendarDays,
  Newspaper,
  Wrench,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

interface InboxMessage {
  id: number;
  isRead: boolean;
}

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/profile", label: "My Profile", icon: User },
  { href: "/portal/directory", label: "Member Directory", icon: Users },
];

const communityItems = [
  { href: "/portal/messages", label: "Messages", icon: Mail },
  { href: "/portal/discussions", label: "Discussions", icon: MessageSquare },
];

const resourceItems = [
  { href: "/portal/projects", label: "Projects", icon: Briefcase },
  { href: "/portal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/portal/newsletters", label: "Newsletters", icon: Newspaper },
  { href: "/portal/tools", label: "Equipment Sharing", icon: Wrench },
  { href: "/portal/courses", label: "Training", icon: GraduationCap },
];

const adminNavItems = [
  { href: "/portal/admin", label: "Admin Panel", icon: ShieldCheck },
];

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: messages } = useQuery<InboxMessage[]>({
    queryKey: ["/api/portal/messages"],
  });

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;

  const allNavItems = [
    ...navItems,
    ...communityItems,
    ...resourceItems,
    ...(user?.isAdmin ? adminNavItems : []),
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  const renderNavItem = (item: typeof navItems[0], onClick?: () => void) => {
    const isActive = location === item.href || (item.href !== "/portal" && location.startsWith(item.href));
    const isExactActive = location === item.href;
    const active = item.href === "/portal" ? isExactActive : isActive;
    const isMessages = item.href === "/portal/messages";
    return (
      <Link key={item.href} href={item.href}>
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          data-testid={`link-portal-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={onClick}
        >
          <item.icon className="h-4 w-4" />
          <span className="flex-1">{item.label}</span>
          {isMessages && unreadCount > 0 && (
            <Badge
              variant={active ? "outline" : "destructive"}
              className={active ? "border-primary-foreground/30 text-primary-foreground text-[10px]" : "text-[10px]"}
              data-testid="badge-sidebar-unread"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  const renderSection = (label: string, items: typeof navItems, onClick?: () => void) => (
    <div>
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
      {items.map((item) => renderNavItem(item, onClick))}
    </div>
  );

  const sidebarContent = (onClick?: () => void) => (
    <>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => renderNavItem(item, onClick))}
        </div>
        {renderSection("Community", communityItems, onClick)}
        {renderSection("Resources", resourceItems, onClick)}
        {user?.isAdmin && renderSection("Admin", adminNavItems, onClick)}
      </nav>

      <div className="p-3 border-t space-y-1">
        <Link href="/">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            data-testid="link-portal-main-site"
            onClick={onClick}
          >
            <Home className="h-4 w-4" />
            Main Site
          </div>
        </Link>
        <button
          onClick={() => { onClick?.(); handleLogout(); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors w-full"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <div className="px-3 py-2 mt-2">
          <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
        </div>
      </div>
    </>
  );

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
          {sidebarContent()}
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-0.5 border">
            <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
          </div>
          <span className="text-sm font-bold">Member Portal</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Link href="/portal/messages">
              <div className="relative">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="badge-mobile-unread">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </div>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} data-testid="button-portal-mobile-menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white p-1 border">
                <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
              </div>
              <SheetTitle className="text-sm font-bold leading-tight">NAMC NorCal</SheetTitle>
            </div>
          </SheetHeader>
          {sidebarContent(() => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
