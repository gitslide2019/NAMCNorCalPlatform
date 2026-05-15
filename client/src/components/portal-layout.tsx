import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  User,
  Users,
  ShieldCheck,
  LogOut,
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
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { BottomTabBar } from "@/components/namc/BottomTabBar";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";
import { cn } from "@/lib/utils";

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
  committees: { id: string; title: string; category: string; type: string }[];
  meetings: { id: string; title: string; committeeId: string; committeeName: string; meetingDate: string; type: string }[];
}

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/profile", label: "My Profile", icon: User },
  { href: "/portal/directory", label: "Member Directory", icon: Users },
];

const communityItems = [
  { href: "/portal/messages", label: "Messages", icon: Mail },
  { href: "/portal/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/portal/committees", label: "Committees", icon: UsersRound },
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

  const totalResults = results ? results.members.length + results.projects.length + results.discussions.length + results.events.length + results.newsletters.length + (results.committees?.length || 0) + (results.meetings?.length || 0) : 0;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members, projects, events..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => { if (results && query) setOpen(true); }}
          className="pl-9 h-9 w-full lg:w-80 rounded-full bg-muted/40 border-border/60 focus-visible:bg-card"
          data-testid="input-global-search"
        />
      </div>
      {open && results && (
        <Card className="absolute top-full mt-2 left-0 right-0 z-50 edge-lift max-h-80 overflow-y-auto rounded-2xl" data-testid="search-results-dropdown">
          <CardContent className="p-2">
            {totalResults === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
            ) : (
              <>
                {results.members.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Members</p>
                    {results.members.map(m => (
                      <button key={m.id} onClick={() => navigate(`/portal/directory/${m.id}`)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-member-${m.id}`}>
                        <span className="font-medium">{m.companyName}</span>
                        <span className="text-muted-foreground ml-2">{m.contactName}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.projects.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Projects</p>
                    {results.projects.map(p => (
                      <button key={p.id} onClick={() => navigate("/portal/projects")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-project-${p.id}`}>
                        <span className="font-medium">{p.title}</span>
                        <span className="text-muted-foreground ml-2">{p.location}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.discussions.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Discussions</p>
                    {results.discussions.map(d => (
                      <button key={d.id} onClick={() => navigate("/portal/discussions")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-discussion-${d.id}`}>
                        <span className="font-medium">{d.title}</span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">{d.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {results.events.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Events</p>
                    {results.events.map(e => (
                      <button key={e.id} onClick={() => navigate("/portal/calendar")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-event-${e.id}`}>
                        <span className="font-medium">{e.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.newsletters.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Newsletters</p>
                    {results.newsletters.map(n => (
                      <button key={n.id} onClick={() => navigate("/portal/newsletters")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-newsletter-${n.id}`}>
                        <span className="font-medium">{n.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.committees && results.committees.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Committees</p>
                    {results.committees.map(c => (
                      <button key={c.id} onClick={() => navigate(`/portal/committees/${c.id}`)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-committee-${c.id}`}>
                        <span className="font-medium">{c.title}</span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">{c.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {results.meetings && results.meetings.length > 0 && (
                  <div>
                    <p className="eyebrow text-muted-foreground/80 px-2 py-1.5">Committee Meetings</p>
                    {results.meetings.map(m => (
                      <button key={m.id} onClick={() => navigate(`/portal/committees/${m.committeeId}`)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-meeting-${m.id}`}>
                        <span className="font-medium">{m.title}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{m.committeeName}</span>
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

  const { data: messages } = useQuery<InboxMessage[]>({
    queryKey: ["/api/portal/messages"],
  });

  const { data: notifCount } = useQuery<{ count: number }>({
    queryKey: ["/api/portal/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;
  const unreadNotifs = notifCount?.count ?? 0;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = location === item.href || (item.href !== "/portal" && location.startsWith(item.href));
    const isExactActive = location === item.href;
    const active = item.href === "/portal" ? isExactActive : isActive;
    const isMessages = item.href === "/portal/messages";
    return (
      <Link key={item.href} href={item.href}>
        <div
          className={cn(
            "group relative flex items-center gap-3 pl-4 pr-3 py-2 text-sm cursor-pointer transition-colors min-h-[40px]",
            active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          data-testid={`link-portal-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <span
            className={cn(
              "absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r transition-all",
              active ? "bg-primary" : "bg-transparent group-hover:bg-border",
            )}
            aria-hidden
          />
          <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
          <span className={cn("flex-1 font-medium", active && "text-foreground")}>{item.label}</span>
          {isMessages && unreadCount > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] h-5 min-w-[20px] px-1.5" data-testid="badge-sidebar-unread">
              {unreadCount}
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  const renderSection = (label: string, items: typeof navItems) => (
    <div className="space-y-0.5">
      <p className="eyebrow text-muted-foreground/60 px-4 pt-4 pb-2">{label}</p>
      {items.map((item) => renderNavItem(item))}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — narrow, editorial */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
        <div className="flex flex-col h-full">
          <div className="px-4 py-5 border-b border-border">
            <Link href="/portal">
              <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-sidebar-logo">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground p-1">
                  <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-base font-semibold tracking-tight">NAMC</span>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">NorCal Portal</span>
                </div>
              </div>
            </Link>
          </div>
          <nav className="flex-1 py-2 overflow-y-auto">
            <div className="space-y-0.5 pt-2">
              {navItems.map((item) => renderNavItem(item))}
            </div>
            {renderSection("Community", communityItems)}
            {renderSection("Resources", resourceItems)}
            {(user?.isAdmin || user?.isBoardMember) && renderSection("Admin", adminNavItems)}
          </nav>

          <div className="px-2 py-3 border-t border-border space-y-0.5">
            <Link href="/">
              <div
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                data-testid="link-portal-main-site"
              >
                <Home className="h-4 w-4" />
                <span className="font-medium">Main Site</span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-destructive cursor-pointer transition-colors w-full"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </button>
            <div className="px-4 pt-2 mt-1 border-t border-border/60">
              <p className="text-[11px] text-muted-foreground/80 truncate">{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top header — compact */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60 px-4 py-2.5 flex items-center justify-between">
        <Link href="/portal">
          <div className="flex items-center gap-2 min-w-0 cursor-pointer" data-testid="link-mobile-logo">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground p-0.5 shrink-0">
              <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold">NAMC</span>
              <span className="text-[9px] text-muted-foreground tracking-wider uppercase mt-0.5">Portal</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/portal/notifications">
            <div className="relative flex items-center justify-center h-10 w-10 press" data-testid="link-mobile-notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 min-w-0">
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <GlobalSearch />
          <div className="flex items-center gap-4">
            <Link href="/portal/notifications">
              <div className="relative cursor-pointer press" data-testid="link-notifications-bell">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center" data-testid="badge-notification-count">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </div>
            </Link>
            <span className="text-sm text-muted-foreground font-medium">{user?.username}</span>
          </div>
        </div>
        <div className="pt-14 lg:pt-0 has-bottom-bar">
          {children}
        </div>
      </main>

      {/* Floating bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
