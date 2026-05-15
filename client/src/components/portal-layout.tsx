import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  User,
  Users,
  ShieldCheck,
  LogOut,
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
  ChevronUp,
  Home as HomeIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { BottomTabBar } from "@/components/bottom-tab-bar";
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
  { href: "/portal/directory", label: "Directory", icon: Users },
  { href: "/portal/profile", label: "Profile", icon: User },
];

const communityItems = [
  { href: "/portal/messages", label: "Messages", icon: Mail },
  { href: "/portal/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/portal/committees", label: "Committees", icon: UsersRound },
];

const resourceItems = [
  { href: "/portal/projects", label: "Projects", icon: Briefcase },
  { href: "/portal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/portal/newsletters", label: "Newsletters", icon: Newspaper },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/tools", label: "Equipment", icon: Wrench },
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
          className="pl-9 h-9 w-full lg:w-72 rounded-full bg-muted/40"
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
                    <p className="eyebrow px-2 py-1">Members</p>
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
                    <p className="eyebrow px-2 py-1">Projects</p>
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
                    <p className="eyebrow px-2 py-1">Discussions</p>
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
                    <p className="eyebrow px-2 py-1">Events</p>
                    {results.events.map(e => (
                      <button key={e.id} onClick={() => navigate("/portal/calendar")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-event-${e.id}`}>
                        <span className="font-medium">{e.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.newsletters.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow px-2 py-1">Newsletters</p>
                    {results.newsletters.map(n => (
                      <button key={n.id} onClick={() => navigate("/portal/newsletters")} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-lg cursor-pointer" data-testid={`search-result-newsletter-${n.id}`}>
                        <span className="font-medium">{n.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.committees && results.committees.length > 0 && (
                  <div className="mb-2">
                    <p className="eyebrow px-2 py-1">Committees</p>
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
                    <p className="eyebrow px-2 py-1">Committee Meetings</p>
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
  const [location, setLocation] = useLocation();

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
            "group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer min-h-[40px]",
            "transition-colors",
            active
              ? "bg-primary/8 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
          data-testid={`link-portal-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {active && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" aria-hidden="true" />
          )}
          <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
          <span className="flex-1 truncate">{item.label}</span>
          {isMessages && unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  const renderSection = (label: string, items: typeof navItems) => (
    <div className="space-y-0.5">
      <p className="px-3 pb-2 pt-1 font-display text-[13px] font-medium tracking-tight text-foreground/85">
        {label}
      </p>
      {items.map((item) => renderNavItem(item))}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — narrow, editorial */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 border-r border-card-border bg-sidebar">
        <div className="flex flex-col h-full">
          <Link href="/portal">
            <div className="p-4 border-b border-card-border cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-white p-1 border">
                  <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-base leading-tight">NAMC NorCal</span>
                  <span className="eyebrow">Portal</span>
                </div>
              </div>
            </div>
          </Link>

          <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto">
            <div className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item))}
            </div>
            {renderSection("Community", communityItems)}
            {renderSection("Resources", resourceItems)}
            {(user?.isAdmin || user?.isBoardMember) && renderSection("Admin", adminNavItems)}
          </nav>

          <div className="p-2 border-t border-card-border">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/40"
                  data-testid="button-member-popover"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                    {user?.username?.[0]?.toUpperCase() ?? "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.username}</p>
                    <p className="eyebrow truncate">Member</p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-56 p-1">
                <button
                  type="button"
                  onClick={() => setLocation("/portal/profile")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                  data-testid="popover-link-profile"
                >
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                  data-testid="popover-link-main"
                >
                  <HomeIcon className="h-4 w-4" /> Main site
                </button>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  data-testid="popover-button-logout"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </aside>

      {/* Mobile top header — title + secondary actions only, no hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-background/85 backdrop-blur-md border-b border-card-border px-4 py-3 flex items-center justify-between">
        <Link href="/portal">
          <div className="flex items-center gap-2 min-w-0 cursor-pointer" data-testid="link-mobile-home">
            <div className="grid h-8 w-8 place-items-center rounded bg-white p-0.5 border shrink-0">
              <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-base leading-tight truncate">NAMC NorCal</span>
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/portal/notifications">
            <button
              type="button"
              className="pressable relative grid place-items-center h-10 w-10 rounded-full hover:bg-muted/50"
              data-testid="link-mobile-notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </button>
          </Link>
        </div>
      </div>

      <main className="flex-1 lg:ml-56">
        <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-card-border bg-background/60 backdrop-blur-sm">
          <GlobalSearch />
          <div className="flex items-center gap-4">
            <Link href="/portal/notifications">
              <div className="relative cursor-pointer press" data-testid="link-notifications-bell">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 grid place-items-center" data-testid="badge-notification-count">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </div>
            </Link>
            <span className="text-sm text-muted-foreground font-medium">{user?.username}</span>
          </div>
        </div>
        <div className="pt-14 lg:pt-0 pb-bottom-bar lg:pb-0">
          {children}
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
