import * as React from "react";
import { useLocation } from "wouter";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  IconHardHat,
  IconBlueprint,
  IconCalendarFlag,
  IconChatCorner,
  IconStackedDots,
  IconNamcMonogram,
} from "@/components/nav-icons";
import {
  MessageSquare,
  UsersRound,
  Briefcase,
  Wrench,
  GraduationCap,
  FileText,
  Newspaper,
  Target,
  Bell,
  ShoppingBag,
  User,
  ShieldCheck,
  LogOut,
  Home as HomeIcon,
} from "lucide-react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

interface InboxMessage {
  id: number;
  isRead: boolean;
}

const moreItems = [
  { href: "/portal/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/portal/committees", label: "Committees", icon: UsersRound },
  { href: "/portal/projects", label: "Projects", icon: Briefcase },
  { href: "/portal/tools", label: "Equipment", icon: Wrench },
  { href: "/portal/courses", label: "Training", icon: GraduationCap },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/newsletters", label: "Newsletters", icon: Newspaper },
  { href: "/portal/campaigns", label: "Fundraising", icon: Target },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/store", label: "Store", icon: ShoppingBag },
  { href: "/portal/profile", label: "Profile", icon: User },
];

interface TabDef {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: (pathname: string) => boolean;
  badgeCount?: number;
  testId: string;
}

export function BottomTabBar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const { data: messages } = useQuery<InboxMessage[]>({
    queryKey: ["/api/portal/messages"],
  });
  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;

  const handleLogout = () => {
    setMoreOpen(false);
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  const tabs: TabDef[] = [
    {
      href: "/portal",
      label: "Home",
      Icon: IconHardHat,
      isActive: (p) => p === "/portal",
      testId: "tab-home",
    },
    {
      href: "/portal/directory",
      label: "Directory",
      Icon: IconBlueprint,
      isActive: (p) => p.startsWith("/portal/directory"),
      testId: "tab-directory",
    },
    {
      href: "/portal/calendar",
      label: "Calendar",
      Icon: IconCalendarFlag,
      isActive: (p) => p.startsWith("/portal/calendar"),
      testId: "tab-calendar",
    },
    {
      href: "/portal/messages",
      label: "Messages",
      Icon: IconChatCorner,
      isActive: (p) => p.startsWith("/portal/messages"),
      badgeCount: unreadCount,
      testId: "tab-messages",
    },
  ];

  // Render order: Home, Directory, [center FAB], Calendar, Messages
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  return (
    <>
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 pb-safe pointer-events-none"
        aria-label="Primary"
      >
        <div className="pointer-events-auto mx-3 mb-2 rounded-full border border-gold-hairline bg-card/95 backdrop-blur-md shadow-editorial">
          <div className="grid grid-cols-5 items-end h-[68px] px-1.5">
            {left.map((t) => (
              <TabButton key={t.href} tab={t} active={t.isActive(location)} />
            ))}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-label="Open more"
                className={cn(
                  "pressable-fab -mt-7 grid h-14 w-14 place-items-center rounded-full",
                  "bg-primary text-primary-foreground",
                  "shadow-[0_8px_18px_-6px_rgba(0,0,0,0.35),0_0_0_4px_hsl(var(--card))]",
                  "transition-transform"
                )}
                data-testid="tab-more"
              >
                <IconNamcMonogram size={28} />
              </button>
            </div>
            {right.map((t) => (
              <TabButton key={t.href} tab={t} active={t.isActive(location)} />
            ))}
          </div>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-0 ease-spring border-t border-gold-hairline"
        >
          <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <div className="px-5 pb-2">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-white p-1 border">
                <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg leading-tight">NAMC NorCal</span>
                <span className="eyebrow">Member Portal</span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-4 pb-2 grid grid-cols-3 gap-2">
            {moreItems.map((it) => (
              <button
                key={it.href}
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  setLocation(it.href);
                }}
                className={cn(
                  "pressable group flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card",
                  "px-2 py-4 text-center min-h-[88px]",
                  "border-card-border hover:border-[hsl(var(--gold-rule)/0.55)] transition-colors"
                )}
                data-testid={`more-${it.label.toLowerCase()}`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <it.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-xs font-medium leading-tight">{it.label}</span>
              </button>
            ))}
          </div>

          {(user?.isAdmin || user?.isBoardMember) && (
            <div className="px-5 pt-2 pb-1">
              <button
                type="button"
                onClick={() => { setMoreOpen(false); setLocation("/portal/admin"); }}
                className="pressable flex w-full items-center gap-3 rounded-xl border border-gold-hairline bg-primary/5 px-4 py-3 text-left"
                data-testid="more-admin"
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="flex-1 text-sm font-semibold">Admin Panel</span>
                <span className="eyebrow text-primary">Open</span>
              </button>
            </div>
          )}

          <div className="px-5 py-4 mt-2 border-t flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setMoreOpen(false); setLocation("/"); }}
              className="pressable flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="more-main-site"
            >
              <HomeIcon className="h-4 w-4" />
              Main site
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="pressable flex items-center gap-2 text-sm font-medium text-destructive"
              data-testid="more-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
          <div className="px-5 pb-6 text-center">
            <span className="eyebrow">{user?.username}</span>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TabButton({ tab, active }: { tab: TabDef; active: boolean }) {
  const [, setLocation] = useLocation();
  return (
    <button
      type="button"
      onClick={() => setLocation(tab.href)}
      className={cn(
        "pressable group relative flex h-full w-full flex-col items-center justify-center gap-1 px-1",
        "transition-colors",
        active ? "text-foreground" : "text-muted-foreground"
      )}
      aria-current={active ? "page" : undefined}
      data-testid={tab.testId}
    >
      <span className="relative">
        <tab.Icon size={22} className={cn(active && "text-foreground")} />
        {!!tab.badgeCount && tab.badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {tab.badgeCount > 9 ? "9+" : tab.badgeCount}
          </span>
        )}
      </span>
      <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
      {active && (
        <span className="absolute bottom-1 h-[3px] w-7 rounded-full bg-primary" aria-hidden="true" />
      )}
    </button>
  );
}
