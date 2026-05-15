import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  HardHatIcon,
  BlueprintIcon,
  CalendarFlagIcon,
  ChatCornerIcon,
  StackedDotsIcon,
  NamcMonogram,
} from "./NavIcons";
import {
  MessageSquare,
  UsersRound,
  Briefcase,
  Newspaper,
  FileText,
  Wrench,
  GraduationCap,
  Target,
  Bell,
  ShoppingBag,
  User,
  ShieldCheck,
  LogOut,
  Home as HomeIcon,
} from "lucide-react";
import namcLogo from "@assets/NAMCNorCal_Logo_1775483039333.png";

interface InboxMessage {
  id: number;
  isRead: boolean;
}

const TABS = [
  { href: "/portal", label: "Home", icon: HardHatIcon },
  { href: "/portal/directory", label: "Directory", icon: BlueprintIcon },
  { href: "/portal/calendar", label: "Calendar", icon: CalendarFlagIcon },
  { href: "/portal/messages", label: "Messages", icon: ChatCornerIcon, badgeKey: "messages" as const },
];

const MORE_SECTIONS = [
  {
    label: "Community",
    items: [
      { href: "/portal/discussions", label: "Discussions", icon: MessageSquare },
      { href: "/portal/committees", label: "Committees", icon: UsersRound },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/portal/projects", label: "Project Opportunities", icon: Briefcase },
      { href: "/portal/newsletters", label: "Newsletters", icon: Newspaper },
      { href: "/portal/documents", label: "Documents", icon: FileText },
      { href: "/portal/tools", label: "Equipment Sharing", icon: Wrench },
      { href: "/portal/courses", label: "Training", icon: GraduationCap },
      { href: "/portal/campaigns", label: "Fundraising", icon: Target },
      { href: "/portal/store", label: "Store", icon: ShoppingBag },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/portal/profile", label: "My Profile", icon: User },
      { href: "/portal/notifications", label: "Notifications", icon: Bell, badgeKey: "notifs" as const },
    ],
  },
];

export function BottomTabBar() {
  const [location, setLocation] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const { data: messages } = useQuery<InboxMessage[]>({
    queryKey: ["/api/portal/messages"],
  });
  const { data: notifData } = useQuery<{ count: number }>({
    queryKey: ["/api/portal/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const unreadMessages = messages?.filter((m) => !m.isRead).length ?? 0;
  const unreadNotifs = notifData?.count ?? 0;

  // Auto-close the More sheet on any route change (covers keyboard navigation,
  // not just mouse/touch — Link's anchor activation by Enter wouldn't otherwise
  // trigger child onClick handlers).
  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  const isActive = (href: string) =>
    href === "/portal" ? location === href : location.startsWith(href);

  const handleLogout = () => {
    setMoreOpen(false);
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  return (
    <>
      {/* Floating pill bar — mobile only */}
      <nav
        className="lg:hidden fixed bottom-3 left-3 right-3 z-40 pb-safe"
        aria-label="Primary navigation"
        data-testid="bottom-tab-bar"
      >
        <div className="mx-auto max-w-md bg-foreground text-background rounded-full edge-lift backdrop-blur-md flex items-center justify-between px-2 py-1.5 pill-pop">
          {TABS.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.href}
              tab={tab}
              active={isActive(tab.href)}
              badge={tab.badgeKey === "messages" ? unreadMessages : 0}
              onClick={() => setLocation(tab.href)}
            />
          ))}
          {/* Center FAB — More */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="relative -mt-7 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-foreground press"
            aria-label="More menu"
            data-testid="button-bottom-more"
          >
            <NamcMonogram className="h-7 w-7" />
            <span className="sr-only">More</span>
          </button>
          {TABS.slice(2).map((tab) => (
            <TabButton
              key={tab.href}
              tab={tab}
              active={isActive(tab.href)}
              badge={tab.badgeKey === "messages" ? unreadMessages : 0}
              onClick={() => setLocation(tab.href)}
            />
          ))}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl p-0 flex flex-col border-t-2 border-t-primary"
          data-testid="more-sheet"
        >
          <SheetHeader className="p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 p-1.5 flex items-center justify-center">
                <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col text-left">
                <SheetTitle className="font-display text-lg leading-tight">More</SheetTitle>
                <span className="text-xs text-muted-foreground">{user?.username}</span>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {MORE_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="eyebrow text-muted-foreground mb-3 flex items-center gap-2">
                  <span>{section.label}</span>
                  <span className="flex-1 h-px bg-border" aria-hidden />
                </div>
                <div className="space-y-1">
                  {section.items.map((it) => (
                    <Link key={it.href} href={it.href}>
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted press min-h-[52px]"
                        onClick={() => setMoreOpen(false)}
                        data-testid={`more-link-${it.href.split("/").pop()}`}
                      >
                        <span className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                          <it.icon className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <span className="flex-1 text-sm font-medium">{it.label}</span>
                        {it.badgeKey === "notifs" && unreadNotifs > 0 && (
                          <span className="text-[10px] font-semibold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                            {unreadNotifs > 9 ? "9+" : unreadNotifs}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {(user?.isAdmin || user?.isBoardMember) && (
              <div>
                <div className="eyebrow text-muted-foreground mb-3 flex items-center gap-2">
                  <span>Admin</span>
                  <span className="flex-1 h-px bg-border" aria-hidden />
                </div>
                <Link href="/portal/admin">
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/15 press min-h-[52px]"
                    onClick={() => setMoreOpen(false)}
                    data-testid="more-link-admin"
                  >
                    <span className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </span>
                    <span className="flex-1 text-sm font-medium">Admin Panel</span>
                  </div>
                </Link>
              </div>
            )}
            <div className="pt-2 border-t space-y-1">
              <Link href="/">
                <div
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted press min-h-[52px]"
                  onClick={() => setMoreOpen(false)}
                  data-testid="more-link-main-site"
                >
                  <span className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <HomeIcon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="flex-1 text-sm font-medium">Main Site</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 hover:text-destructive press min-h-[52px]"
                data-testid="more-link-logout"
              >
                <span className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-left">Sign Out</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TabButton({
  tab,
  active,
  badge,
  onClick,
}: {
  tab: { href: string; label: string; icon: React.ComponentType<{ active?: boolean; className?: string }> };
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-full press relative min-h-[52px]",
        active ? "text-primary" : "text-background/70 hover:text-background",
      )}
      data-testid={`tab-${tab.label.toLowerCase()}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon active={active} className="h-5 w-5" />
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -right-2 text-[9px] font-bold bg-primary text-primary-foreground rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span className={cn("text-[10px] font-semibold tracking-wide", active && "")}>{tab.label}</span>
      {active && (
        <span className="absolute bottom-0.5 h-0.5 w-6 rounded-full bg-primary" aria-hidden />
      )}
    </button>
  );
}
