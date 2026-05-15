import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  CalendarDays,
  Briefcase,
  MessageSquare,
  RotateCcw,
  Megaphone,
  Target,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OnboardingTutorial, useOnboardingReset } from "@/components/onboarding-tutorial";
import { Eyebrow, SectionNumeral, Stat, RevealOnScroll } from "@/components/editorial";
import type { MembershipApplication } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-600/10 text-emerald-700 border border-emerald-600/30 dark:text-emerald-400" data-testid="badge-status-approved"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border border-destructive/30" data-testid="badge-status-rejected"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge className="bg-primary/10 text-foreground border border-primary/40" data-testid="badge-status-pending"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
  }
}

interface DashboardMessage { id: number; isRead: boolean; }
interface FeedItem {
  kind: "event" | "meeting";
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  committeeId?: string;
  committeeName?: string;
}
interface DashboardProject { id: number; title: string; status: string; }
interface DashboardTopic {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  authorUsername?: string;
  replyCount?: number;
}
interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

function getFirstName(contactName: string | undefined, username: string | undefined): string {
  if (contactName) {
    const first = contactName.split(" ")[0];
    if (first) return first;
  }
  return username || "Member";
}

const QUICK_LINKS: { href: string; label: string; sub: string; Icon: typeof Briefcase; testId: string }[] = [
  { href: "/portal/projects", label: "Browse Projects", sub: "Bidding opportunities", Icon: Briefcase, testId: "link-quick-projects" },
  { href: "/portal/messages", label: "Check Messages", sub: "Read & send", Icon: Mail, testId: "link-quick-messages" },
  { href: "/portal/directory", label: "Member Directory", sub: "Find contractors", Icon: Users, testId: "link-quick-directory" },
  { href: "/portal/documents", label: "Documents", sub: "Forms & guides", Icon: FileText, testId: "link-quick-documents" },
  { href: "/portal/campaigns", label: "Fundraising", sub: "Campaigns & pledges", Icon: Target, testId: "link-quick-campaigns" },
  { href: "/portal/profile", label: "Update Profile", sub: "Company info", Icon: Users, testId: "link-quick-profile" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { forceOpen, restartTour, onClose } = useOnboardingReset();

  const { data: application, isLoading } = useQuery<MembershipApplication | null>({
    queryKey: ["/api/portal/my-application"],
  });
  const { data: messages } = useQuery<DashboardMessage[]>({
    queryKey: ["/api/portal/messages"],
  });
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
  const issueDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <PortalLayout>
      <OnboardingTutorial forceOpen={forceOpen} onClose={onClose} />
      <div className="p-4 sm:p-8 lg:p-10 max-w-6xl">
        {/* Editorial masthead */}
        <header className="border-b-2 border-foreground/80 pb-6 mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <span data-testid="text-issue-date">{issueDate}</span>
            <span className="hidden sm:inline">Vol. NAMC NorCal · Members' Edition</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2">
              <Eyebrow>Dispatch</Eyebrow>
              <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-[0.92]" data-testid="text-dashboard-title">
                Welcome back,<br/><span className="italic text-primary">{displayName}.</span>
              </h1>
              <p className="text-muted-foreground max-w-lg text-sm sm:text-base">
                Today's edition: what's on the calendar, in the inbox, and on the worksite.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={restartTour}
              className="text-xs uppercase tracking-wider"
              data-testid="button-restart-tour"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restart tour
            </Button>
          </div>

          {application && (
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 mt-8 pt-6 border-t border-foreground/10">
              <Stat value={unreadCount} label="Unread" data-testid="stat-unread" />
              <Stat value={openProjects.length} label="Open bids" data-testid="stat-open-projects" />
              <Stat value={upcomingEvents.length} label="On the calendar" data-testid="stat-events" />
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : application ? (
          <div className="space-y-14">
            {/* Announcements (if any) — front-page banner */}
            {recentAnnouncements.length > 0 && (
              <section data-testid="section-announcements">
                <div className="flex items-baseline gap-4 border-b border-foreground/15 pb-2 mb-5">
                  <SectionNumeral number="00" className="mb-0" />
                  <h2 className="font-display text-2xl sm:text-3xl tracking-tight flex items-center gap-2" data-testid="text-announcements-heading">
                    <Megaphone className="h-5 w-5 text-primary" strokeWidth={1.6} />
                    From the desk
                  </h2>
                </div>
                <div className="space-y-3">
                  {recentAnnouncements.map((ann, idx) => (
                    <RevealOnScroll key={ann.id} delay={idx * 60}>
                      <Card className={`shadow-editorial ${ann.priority === "urgent" ? "border-l-[3px] border-l-primary" : ""}`} data-testid={`card-announcement-${ann.id}`}>
                        <CardContent className="p-5">
                          <div className="flex items-baseline justify-between gap-3 mb-1">
                            <p className="font-display text-lg leading-tight">{ann.title}</p>
                            {ann.priority === "urgent" && <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider shrink-0">Urgent</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-2 tabular-nums">
                            {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </CardContent>
                      </Card>
                    </RevealOnScroll>
                  ))}
                </div>
              </section>
            )}

            {/* Status — magazine card */}
            <section>
              <div className="flex items-baseline gap-4 border-b border-foreground/15 pb-2 mb-5">
                <SectionNumeral number="01" className="mb-0" />
                <h2 className="font-display text-2xl sm:text-3xl tracking-tight">Your standing</h2>
              </div>
              <Card className="shadow-editorial paper-surface overflow-hidden" data-testid="card-membership-status">
                <CardContent className="p-6 sm:p-8 grid gap-8 sm:grid-cols-3 sm:divide-x sm:divide-foreground/10">
                  <div className="space-y-2 sm:pr-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                    {getStatusBadge(application.status)}
                  </div>
                  <div className="space-y-1 sm:px-6" data-testid="card-company-info">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Company</p>
                    <p className="font-display text-2xl leading-tight tracking-tight">{application.companyName}</p>
                    <p className="text-sm text-muted-foreground">{application.city}, {application.state}</p>
                  </div>
                  <div className="space-y-1 sm:pl-6" data-testid="card-membership-tier">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tier</p>
                    <p className="font-display text-2xl leading-tight tracking-tight capitalize">{application.membershipCategory}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {application.membershipCategory === "small" && "$400 / year"}
                      {application.membershipCategory === "medium" && "$800 / year"}
                      {application.membershipCategory === "large" && "$1,200 / year"}
                      {application.membershipCategory === "government" && "$1,800 / year"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Activity — two columns */}
            <section>
              <div className="flex items-baseline gap-4 border-b border-foreground/15 pb-2 mb-5">
                <SectionNumeral number="02" className="mb-0" />
                <h2 className="font-display text-2xl sm:text-3xl tracking-tight" data-testid="text-activity-heading">In the works</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/portal/messages">
                  <Card className="shadow-editorial pressable cursor-pointer h-full group" data-testid="card-activity-messages">
                    <CardContent className="p-6 flex items-center gap-5">
                      <Mail className="h-7 w-7 text-primary shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Inbox</p>
                        <p className="font-display text-xl leading-tight">
                          {unreadCount > 0
                            ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
                            : "Inbox is clear"}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground tabular-nums" data-testid="badge-unread-count">
                          {unreadCount}
                        </Badge>
                      )}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/portal/projects">
                  <Card className="shadow-editorial pressable cursor-pointer h-full group" data-testid="card-activity-projects">
                    <CardContent className="p-6 flex items-center gap-5">
                      <Briefcase className="h-7 w-7 text-primary shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Bids open</p>
                        <p className="font-display text-xl leading-tight">
                          {openProjects.length > 0
                            ? `${openProjects.length} project${openProjects.length !== 1 ? "s" : ""} accepting bids`
                            : "No open projects"}
                        </p>
                      </div>
                      {openProjects.length > 0 && (
                        <Badge className="bg-primary text-primary-foreground tabular-nums" data-testid="badge-open-projects">
                          {openProjects.length}
                        </Badge>
                      )}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Upcoming events */}
            <section>
              <div className="flex items-end justify-between border-b border-foreground/15 pb-2 mb-5">
                <div className="flex items-baseline gap-4">
                  <SectionNumeral number="03" className="mb-0" />
                  <h2 className="font-display text-2xl sm:text-3xl tracking-tight" data-testid="text-upcoming-events-heading">On the calendar</h2>
                </div>
                <Link href="/portal/calendar">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold hover:underline cursor-pointer" data-testid="link-view-all-events">View all →</span>
                </Link>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingEvents.map((item) => {
                    const isMeeting = item.kind === "meeting";
                    const href = isMeeting && item.committeeId
                      ? `/portal/committees/${item.committeeId}?tab=meetings`
                      : "/portal/calendar";
                    const [y, m, d] = item.date.split("-").map(Number);
                    const dt = new Date(y, (m || 1) - 1, d || 1);
                    const monthLabel = dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                    const dayLabel = dt.getDate();
                    return (
                      <Link key={`${item.kind}-${item.id}`} href={href}>
                        <Card className="shadow-editorial cursor-pointer h-full pressable" data-testid={`card-feed-${item.kind}-${item.id}`}>
                          <CardContent className="p-5 flex items-start gap-5">
                            <div className="flex flex-col items-center justify-center text-center border-r border-foreground/10 pr-4 shrink-0 min-w-[3.5rem]">
                              <span className="text-[10px] uppercase tracking-[0.16em] text-primary font-semibold">{monthLabel}</span>
                              <span className="font-display text-3xl leading-none tabular-nums font-semibold">{dayLabel}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                                {isMeeting ? "Committee meeting" : "Event"}
                                {isMeeting && item.committeeName && ` · ${item.committeeName}`}
                              </p>
                              <p className="font-display text-lg leading-tight truncate">{item.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                                {item.time && `${item.time}`}
                                {item.location && ` · ${item.location}`}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Card className="shadow-editorial" data-testid="card-no-events">
                  <CardContent className="p-6 flex items-center gap-4">
                    <CalendarDays className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.4} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg leading-tight text-muted-foreground">Calendar's quiet</p>
                      <p className="text-xs text-muted-foreground">
                        Visit the <Link href="/portal/calendar"><span className="text-primary hover:underline">full calendar</span></Link> for past events.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Recent discussions */}
            <section>
              <div className="flex items-end justify-between border-b border-foreground/15 pb-2 mb-5">
                <div className="flex items-baseline gap-4">
                  <SectionNumeral number="04" className="mb-0" />
                  <h2 className="font-display text-2xl sm:text-3xl tracking-tight" data-testid="text-recent-discussions-heading">Around the table</h2>
                </div>
                <Link href="/portal/discussions">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold hover:underline cursor-pointer" data-testid="link-view-all-discussions">View all →</span>
                </Link>
              </div>
              {recentTopics.length > 0 ? (
                <div className="divide-y divide-foreground/10 border-y border-foreground/10">
                  {recentTopics.map((topic) => (
                    <Link key={topic.id} href="/portal/discussions">
                      <div className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors cursor-pointer group" data-testid={`card-topic-${topic.id}`}>
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-base leading-tight truncate">{topic.title}</p>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
                            {topic.category} · {topic.authorUsername || "Member"}
                            {topic.replyCount !== undefined && ` · ${topic.replyCount} replies`}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="shadow-editorial" data-testid="card-no-discussions">
                  <CardContent className="p-6 flex items-center gap-4">
                    <MessageSquare className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.4} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg leading-tight text-muted-foreground">No recent discussions</p>
                      <p className="text-xs text-muted-foreground">
                        <Link href="/portal/discussions"><span className="text-primary hover:underline">Start a conversation</span></Link> with fellow members.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Quick links */}
            <section>
              <div className="flex items-baseline gap-4 border-b border-foreground/15 pb-2 mb-5">
                <SectionNumeral number="05" className="mb-0" />
                <h2 className="font-display text-2xl sm:text-3xl tracking-tight" data-testid="text-quick-links-heading">Quick links</h2>
              </div>
              <div className="grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-3 shadow-editorial rounded-xl overflow-hidden">
                {QUICK_LINKS.map((link) => (
                  <Link key={link.testId} href={link.href}>
                    <div className="bg-card p-5 flex items-center gap-4 cursor-pointer h-full hover:bg-primary/5 transition-colors group" data-testid={link.testId}>
                      <link.Icon className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base leading-tight">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.sub}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <Card className="shadow-editorial" data-testid="card-no-application">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" strokeWidth={1.4} />
              <h3 className="font-display text-2xl mb-2">No linked application</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                Your account isn't linked to a membership application yet. Please contact an administrator to link your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Email: <a href="mailto:info@namcnorcal.org" className="text-primary hover:underline">info@namcnorcal.org</a>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
