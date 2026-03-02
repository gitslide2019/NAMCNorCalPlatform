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
  GraduationCap,
  Bell,
  FileText,
  Target,
  Search,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

interface InboxMessage {
  id: number;
  isRead: boolean;
}

interface SearchResults {
  members: { id: string; companyName: string; contactName: string; type: string }[];
  projects: { id: string; title: string; location: string; type: string }[];
  discussions: { id: string; title: string; category: string; type: string }[];
  events: { id: string; title: string; eventDate: string; type: string }[];
  newsletters: { id: string; title: string; type: string }[];
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
  { href: "/portal/projects", label: "Project Opportunities", icon: Briefcase },
  { href: "/portal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/portal/newsletters", label: "Newsletters", icon: Newspaper },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/tools", label: "Equipment Sharing", icon: Wrench },
  { href: "/portal/courses", label: "Training", icon: GraduationCap },
  { href: "/portal/campaigns", label: "Fundraising", icon: Target },
  { href: "/portal/store", label: "Store", icon: ShoppingBag },
];

const adminNavItems = [
  { href: "/portal/admin", label: "Admin Panel", icon: ShieldCheck },
];

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults(null); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiRequest("GET", `/api/portal/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch { setResults(null); }
    }, 300);
  };

  const navigate = (path: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setLocation(path);
  };

  const totalResults = results ? results.members.length + results.projects.length + results.discussions.length + results.events.length + results.newsletters.length : 0;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members, projects..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => { if (results && query) setOpen(true); }}
          className="pl-9 h-9 w-56 lg:w-72"
          data-testid="input-global-search"
        />
      </div>
      {open && results && (
        <Card className="absolute top-full mt-1 left-0 right-0 z-50 shadow-lg max-h-80 overflow-y-auto" data-testid="search-results-dropdown">
          <CardContent className="p-2">
            {totalResults === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
            ) : (
              <>
                {results.members.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">Members</p>
                    {results.members.map(m => (
                      <button key={m.id} onClick={() => navigate(`/portal/directory/${m.id}`)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer" data-testid={`search-result-member-${m.id}`}>
                        <span className="font-medium">{m.companyName}</span>
                        <span className="text-muted-foreground ml-2">{m.contactName}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.projects.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">Projects</p>
                    {results.projects.map(p => (
                      <button key={p.id} onClick={() => navigate("/portal/projects")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer" data-testid={`search-result-project-${p.id}`}>
                        <span className="font-medium">{p.title}</span>
                        <span className="text-muted-foreground ml-2">{p.location}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.discussions.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">Discussions</p>
                    {results.discussions.map(d => (
                      <button key={d.id} onClick={() => navigate("/portal/discussions")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer" data-testid={`search-result-discussion-${d.id}`}>
                        <span className="font-medium">{d.title}</span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">{d.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {results.events.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">Events</p>
                    {results.events.map(e => (
                      <button key={e.id} onClick={() => navigate("/portal/calendar")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer" data-testid={`search-result-event-${e.id}`}>
                        <span className="font-medium">{e.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.newsletters.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">Newsletters</p>
                    {results.newsletters.map(n => (
                      <button key={n.id} onClick={() => navigate("/portal/newsletters")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer" data-testid={`search-result-newsletter-${n.id}`}>
                        <span className="font-medium">{n.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: messages } = useQuery<InboxMessage[]>({
    queryKey: ["/api/portal/messages"],
  });

  const { data: notifCount } = useQuery<{ count: number }>({
    queryKey: ["/api/portal/notifications/unread-count"],
  });

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;
  const unreadNotifs = notifCount?.count ?? 0;

  const allNavItems = [
    ...navItems,
    ...communityItems,
    ...resourceItems,
    ...((user?.isAdmin || user?.isBoardMember) ? adminNavItems : []),
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
        {(user?.isAdmin || user?.isBoardMember) && renderSection("Admin", adminNavItems, onClick)}
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
          <Link href="/portal/notifications">
            <div className="relative" data-testid="link-mobile-notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </div>
          </Link>
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
        <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b bg-card">
          <GlobalSearch />
          <div className="flex items-center gap-3">
            <Link href="/portal/notifications">
              <div className="relative cursor-pointer" data-testid="link-notifications-bell">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center" data-testid="badge-notification-count">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </div>
            </Link>
            <span className="text-sm text-muted-foreground">{user?.username}</span>
          </div>
        </div>
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
