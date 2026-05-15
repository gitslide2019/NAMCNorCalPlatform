import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users, Clock, CheckCircle, XCircle, Mail, CalendarDays, Briefcase,
  MessageSquare, RotateCcw, Megaphone, Target, FileText, ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingTutorial, useOnboardingReset } from "@/components/onboarding-tutorial";
import type { MembershipApplication } from "@shared/schema";
import { Eyebrow } from "@/components/namc/Eyebrow";
import { RevealOnScroll } from "@/components/namc/RevealOnScroll";
import { cn } from "@/lib/utils";

function statusPill(status: string) {
  switch (status) {
    case "approved":
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-xs font-semibold" data-testid="badge-status-approved"><CheckCircle className="h-3 w-3" />Approved</span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-semibold" data-testid="badge-status-rejected"><XCircle className="h-3 w-3" />Rejected</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 text-xs font-semibold" data-testid="badge-status-pending"><Clock className="h-3 w-3" />Pending Review</span>;
  }
}

interface DashboardMessage { id: number; isRead: boolean; }
interface FeedItem { kind: "event" | "meeting"; id: string; title: string; date: string; time: string | null; location: string | null; committeeId?: string; committeeName?: string; }
interface DashboardProject { id: number; title: string; status: string; }
interface DashboardTopic { id: number; title: string; category: string; createdAt: string; authorUsername?: string; replyCount?: number; }
interface Announcement { id: string; title: string; content: string; priority: string; createdAt: string; }

function getFirstName(contactName: string | undefined, username: string | undefined): string {
  if (contactName) return contactName.split(" ")[0] || username || "Member";
  return username || "Member";
}

function StatTile({ eyebrow, value, sub, href, testId, accent }: { eyebrow: string; value: React.ReactNode; sub: string; href?: string; testId?: string; accent?: boolean; }) {
  const inner = (
    <div className={cn(
      "p-5 sm:p-6 h-full edge-card rounded-2xl bg-card flex flex-col justify-between min-h-[140px] press group cursor-pointer",
      accent && "ring-1 ring-primary/40",
    )} data-testid={testId}>
      <div className="flex items-start justify-between">
        <Eyebrow>{eyebrow}</Eyebrow>
        {href && <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />}
      </div>
      <div>
        <div className="font-display text-3xl sm:text-4xl font-semibold leading-none mt-3">{value}</div>
        <p className="text-xs text-muted-foreground mt-2">{sub}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function QuickLink({ href, icon: Icon, title, sub, testId }: { href: string; icon: typeof Mail; title: string; sub: string; testId: string; }) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-3 p-4 rounded-xl bg-card edge-card press cursor-pointer h-full" data-testid={testId}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{sub}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { forceOpen, restartTour, onClose } = useOnboardingReset();

  const { data: application, isLoading } = useQuery<MembershipApplication | null>({ queryKey: ["/api/portal/my-application"] });
  const { data: messages } = useQuery<DashboardMessage[]>({ queryKey: ["/api/portal/messages"] });
  const { data: events_ } = useQuery<FeedItem[]>({
    queryKey: ["/api/portal/calendar-feed", { scope: "events" }],
    queryFn: async () => {
      const res = await fetch("/api/portal/calendar-feed?scope=events", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load calendar feed");
      return res.json();
    },
  });
  const { data: myMeetings_ } = useQuery<FeedItem[]>({
    queryKey: ["/api/portal/calendar-feed", { scope: "my-committees" }],
    queryFn: async () => {
      const res = await fetch("/api/portal/calendar-feed?scope=my-committees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load calendar feed");
      return res.json();
    },
  });
  const feed = [...(events_ ?? []), ...(myMeetings_ ?? [])];
  const { data: projects } = useQuery<DashboardProject[]>({ queryKey: ["/api/portal/projects"] });
  const { data: discussions } = useQuery<DashboardTopic[]>({ queryKey: ["/api/portal/discussions"] });
  const { data: announcements } = useQuery<Announcement[]>({ queryKey: ["/api/portal/announcements"] });

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;
  const openProjects = projects?.filter((p) => p.status === "open") ?? [];
  const recentAnnouncements = (announcements ?? []).slice(0, 3);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcomingEvents = (feed ?? [])
    .filter((it) => it.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
    .slice(0, 4);

  const recentTopics = (discussions ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const displayName = getFirstName(application?.contactName, user?.username);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <PortalLayout>
      <OnboardingTutorial forceOpen={forceOpen} onClose={onClose} />
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 max-w-6xl">

        {/* Editorial header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-numeral text-primary text-xl leading-none">№</span>
            <span className="eyebrow text-muted-foreground">{today}</span>
            <span className="h-px flex-1 bg-border max-w-32" aria-hidden />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-display-sm sm:text-display font-semibold leading-[1.05] tracking-tight" data-testid="text-dashboard-title">
                Welcome back, <span className="italic font-light">{displayName}.</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
                Your NAMC NorCal control room — projects, people, meetings, and the network.
              </p>
            </div>
            <button
              onClick={restartTour}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground press"
              data-testid="button-restart-tour"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart tour
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : application ? (
          <>
            {recentAnnouncements.length > 0 && (
              <section className="mb-8 sm:mb-10">
                <Eyebrow className="mb-3"><Megaphone className="h-3 w-3 inline mr-1.5 -mt-0.5" />Announcements</Eyebrow>
                <div className="space-y-2">
                  {recentAnnouncements.map((ann) => (
                    <RevealOnScroll key={ann.id}>
                      <div
                        className={cn(
                          "rounded-xl edge-card bg-card p-4 flex items-start gap-3",
                          ann.priority === "urgent" && "ring-1 ring-amber-400/60 bg-amber-50/30 dark:bg-amber-900/10",
                        )}
                        data-testid={`card-announcement-${ann.id}`}
                      >
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                          ann.priority === "urgent" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10",
                        )}>
                          <Megaphone className={cn("h-4 w-4", ann.priority === "urgent" ? "text-amber-600" : "text-primary")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display font-semibold text-base">{ann.title}</p>
                            {ann.priority === "urgent" && <Badge className="bg-amber-500 text-white text-[10px] rounded-full">Urgent</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{ann.content}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-numeral">
                            {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </section>
            )}

            {/* Stats / status row */}
            <section className="mb-8 sm:mb-10">
              <Eyebrow className="mb-3">Your membership</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-5 sm:p-6 edge-card rounded-2xl bg-card min-h-[140px] flex flex-col justify-between" data-testid="card-membership-status">
                  <Eyebrow>Status</Eyebrow>
                  <div>
                    {statusPill(application.status)}
                    <p className="text-xs text-muted-foreground mt-3 capitalize font-numeral">
                      {application.membershipCategory} tier ·
                      {application.membershipCategory === "small" && " $400/yr"}
                      {application.membershipCategory === "medium" && " $800/yr"}
                      {application.membershipCategory === "large" && " $1,200/yr"}
                      {application.membershipCategory === "government" && " $1,800/yr"}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 edge-card rounded-2xl bg-card min-h-[140px] flex flex-col justify-between" data-testid="card-company-info">
                  <Eyebrow>Company</Eyebrow>
                  <div>
                    <p className="font-display text-xl font-semibold leading-tight truncate">{application.companyName}</p>
                    <p className="text-xs text-muted-foreground mt-2">{application.city}, {application.state}</p>
                  </div>
                </div>

                <StatTile
                  eyebrow="Inbox"
                  value={<span className="font-numeral">{unreadCount}</span>}
                  sub={unreadCount === 1 ? "1 unread message" : `${unreadCount} unread messages`}
                  href="/portal/messages"
                  testId="card-activity-messages"
                  accent={unreadCount > 0}
                />
                <StatTile
                  eyebrow="Open projects"
                  value={<span className="font-numeral">{openProjects.length}</span>}
                  sub={openProjects.length === 1 ? "1 opportunity right now" : `${openProjects.length} opportunities right now`}
                  href="/portal/projects"
                  testId="card-activity-projects"
                  accent={openProjects.length > 0}
                />
              </div>
            </section>

            {/* Upcoming */}
            <section className="mb-8 sm:mb-10">
              <div className="flex items-center justify-between mb-3">
                <Eyebrow><CalendarDays className="h-3 w-3 inline mr-1.5 -mt-0.5" />Upcoming</Eyebrow>
                <Link href="/portal/calendar">
                  <span className="text-xs text-foreground/70 hover:text-primary cursor-pointer flex items-center gap-1 press" data-testid="link-view-all-events">
                    All events <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcomingEvents.map((item) => {
                    const isMeeting = item.kind === "meeting";
                    const href = isMeeting && item.committeeId ? `/portal/committees/${item.committeeId}?tab=meetings` : "/portal/calendar";
                    const [y, m, d] = item.date.split("-").map(Number);
                    const dt = new Date(y, (m || 1) - 1, d || 1);
                    const day = dt.getDate();
                    const monthAbbr = dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                    return (
                      <Link key={`${item.kind}-${item.id}`} href={href}>
                        <div className="group flex items-stretch gap-4 rounded-xl bg-card edge-card p-4 press cursor-pointer h-full" data-testid={`card-feed-${item.kind}-${item.id}`}>
                          <div className="shrink-0 w-14 flex flex-col items-center justify-center bg-muted/50 rounded-lg">
                            <span className="text-[10px] font-semibold tracking-wider text-primary">{monthAbbr}</span>
                            <span className="font-numeral text-2xl leading-none mt-0.5">{day}</span>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className={cn(
                              "inline-block text-[10px] uppercase tracking-wider font-semibold mb-1",
                              isMeeting ? "text-emerald-600 dark:text-emerald-400" : "text-primary",
                            )}>
                              {isMeeting ? "Meeting" : "Event"}
                            </span>
                            <p className="font-display font-semibold text-sm leading-snug truncate">{item.title}</p>
                            {isMeeting && item.committeeName && (
                              <p className="text-[11px] text-muted-foreground truncate">{item.committeeName}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {item.time && <span className="font-numeral">{item.time}</span>}
                              {item.time && item.location && " · "}
                              {item.location && <span className="truncate">{item.location}</span>}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 border border-dashed border-border p-6 text-center" data-testid="card-no-events">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nothing on the calendar yet.</p>
                  <Link href="/portal/calendar">
                    <span className="text-xs text-primary hover:underline cursor-pointer mt-1 inline-block">Browse all events</span>
                  </Link>
                </div>
              )}
            </section>

            {/* Discussions */}
            <section className="mb-8 sm:mb-10">
              <div className="flex items-center justify-between mb-3">
                <Eyebrow><MessageSquare className="h-3 w-3 inline mr-1.5 -mt-0.5" />Recent discussions</Eyebrow>
                <Link href="/portal/discussions">
                  <span className="text-xs text-foreground/70 hover:text-primary cursor-pointer flex items-center gap-1 press" data-testid="link-view-all-discussions">
                    All threads <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
              {recentTopics.length > 0 ? (
                <div className="divide-y divide-border border-y border-border">
                  {recentTopics.map((topic) => (
                    <Link key={topic.id} href="/portal/discussions">
                      <div className="group flex items-center gap-4 py-4 cursor-pointer press" data-testid={`card-topic-${topic.id}`}>
                        <span className="font-numeral text-primary text-lg shrink-0 w-8">{String(topic.id).slice(-2).padStart(2, "0")}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{topic.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="uppercase tracking-wider">{topic.category}</span> · {topic.authorUsername || "Member"}
                            {topic.replyCount !== undefined && ` · ${topic.replyCount} repl${topic.replyCount === 1 ? "y" : "ies"}`}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 border border-dashed border-border p-6 text-center" data-testid="card-no-discussions">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent discussions.</p>
                  <Link href="/portal/discussions">
                    <span className="text-xs text-primary hover:underline cursor-pointer mt-1 inline-block">Start a conversation</span>
                  </Link>
                </div>
              )}
            </section>

            {/* Quick links */}
            <section>
              <Eyebrow className="mb-3">Quick links</Eyebrow>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <QuickLink href="/portal/projects" icon={Briefcase} title="Browse projects" sub="Find bidding opportunities" testId="link-quick-projects" />
                <QuickLink href="/portal/directory" icon={Users} title="Member directory" sub="Find contractors & partners" testId="link-quick-directory" />
                <QuickLink href="/portal/documents" icon={FileText} title="Documents" sub="Forms, guides, resources" testId="link-quick-documents" />
                <QuickLink href="/portal/campaigns" icon={Target} title="Fundraising" sub="Capital campaigns & pledges" testId="link-quick-campaigns" />
                <QuickLink href="/portal/messages" icon={Mail} title="Messages" sub="Read & send messages" testId="link-quick-messages" />
                <QuickLink href="/portal/profile" icon={Users} title="My profile" sub="Edit company details" testId="link-quick-profile" />
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl edge-card bg-card p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display text-xl font-semibold mb-1">No application on file yet</p>
            <p className="text-sm text-muted-foreground">Submit a membership application to unlock the full portal.</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
