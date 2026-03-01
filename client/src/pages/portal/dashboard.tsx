import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OnboardingTutorial, useOnboardingReset } from "@/components/onboarding-tutorial";
import type { MembershipApplication } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" data-testid="badge-status-approved"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" data-testid="badge-status-rejected"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" data-testid="badge-status-pending"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
  }
}

interface DashboardMessage {
  id: number;
  isRead: boolean;
}

interface DashboardEvent {
  id: number;
  title: string;
  eventDate: string;
  eventTime: string | null;
  location: string | null;
}

interface DashboardProject {
  id: number;
  title: string;
  status: string;
}

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

export default function Dashboard() {
  const { user } = useAuth();
  const { forceOpen, restartTour, onClose } = useOnboardingReset();

  const { data: application, isLoading } = useQuery<MembershipApplication | null>({
    queryKey: ["/api/portal/my-application"],
  });

  const { data: messages } = useQuery<DashboardMessage[]>({
    queryKey: ["/api/portal/messages"],
  });

  const { data: events } = useQuery<DashboardEvent[]>({
    queryKey: ["/api/portal/events"],
  });

  const { data: projects } = useQuery<DashboardProject[]>({
    queryKey: ["/api/portal/projects"],
  });

  const { data: discussions } = useQuery<DashboardTopic[]>({
    queryKey: ["/api/portal/discussions"],
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/portal/announcements"],
  });

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;
  const openProjects = projects?.filter((p) => p.status === "open") ?? [];
  const recentAnnouncements = (announcements ?? []).slice(0, 3);

  const now = new Date();
  const upcomingEvents = (events ?? [])
    .filter((e) => new Date(e.eventDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 3);

  const recentTopics = (discussions ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const displayName = getFirstName(application?.contactName, user?.username);

  return (
    <PortalLayout>
      <OnboardingTutorial forceOpen={forceOpen} onClose={onClose} />
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dashboard-title">
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your NAMC NorCal membership.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={restartTour}
            className="text-xs"
            data-testid="button-restart-tour"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Restart Tour
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : application ? (
          <>
            {recentAnnouncements.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" data-testid="text-announcements-heading">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Announcements
                </h2>
                <div className="space-y-2">
                  {recentAnnouncements.map((ann) => (
                    <Card key={ann.id} className={ann.priority === "urgent" ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" : ""} data-testid={`card-announcement-${ann.id}`}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${ann.priority === "urgent" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}`}>
                          <Megaphone className={`h-4 w-4 ${ann.priority === "urgent" ? "text-amber-600" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{ann.title}</p>
                            {ann.priority === "urgent" && <Badge className="bg-amber-500 text-white text-[10px]">Urgent</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{ann.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card data-testid="card-membership-status">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Membership Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {getStatusBadge(application.status)}
                </CardContent>
              </Card>

              <Card data-testid="card-company-info">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{application.companyName}</p>
                  <p className="text-sm text-muted-foreground">{application.city}, {application.state}</p>
                </CardContent>
              </Card>

              <Card data-testid="card-membership-tier">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Membership Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold capitalize">{application.membershipCategory}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.membershipCategory === "small" && "$400/year"}
                    {application.membershipCategory === "medium" && "$800/year"}
                    {application.membershipCategory === "large" && "$1,200/year"}
                    {application.membershipCategory === "government" && "$1,800/year"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-lg font-semibold mb-4" data-testid="text-activity-heading">Activity</h2>
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <Link href="/portal/messages">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-activity-messages">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Messages</p>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount > 0
                          ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
                          : "No unread messages"}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-blue-600 text-white" data-testid="badge-unread-count">
                        {unreadCount}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/projects">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-activity-projects">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Open Projects</p>
                      <p className="text-xs text-muted-foreground">
                        {openProjects.length > 0
                          ? `${openProjects.length} project${openProjects.length !== 1 ? "s" : ""} accepting bids`
                          : "No open projects right now"}
                      </p>
                    </div>
                    {openProjects.length > 0 && (
                      <Badge className="bg-green-600 text-white" data-testid="badge-open-projects">
                        {openProjects.length}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold" data-testid="text-upcoming-events-heading">Upcoming Events</h2>
                <Link href="/portal/calendar">
                  <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-view-all-events">View all</span>
                </Link>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <Link key={event.id} href="/portal/calendar">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-event-${event.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                              <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.eventDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                                {event.eventTime && ` · ${event.eventTime}`}
                              </p>
                              {event.location && (
                                <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card data-testid="card-no-events">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 dark:bg-amber-900/20 shrink-0">
                      <CalendarDays className="h-5 w-5 text-amber-500/60 dark:text-amber-400/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">No upcoming events</p>
                      <p className="text-xs text-muted-foreground">
                        Check the <Link href="/portal/calendar"><span className="text-primary hover:underline">calendar</span></Link> for past events and updates.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold" data-testid="text-recent-discussions-heading">Recent Discussions</h2>
                <Link href="/portal/discussions">
                  <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-view-all-discussions">View all</span>
                </Link>
              </div>
              {recentTopics.length > 0 ? (
                <div className="space-y-2">
                  {recentTopics.map((topic) => (
                    <Link key={topic.id} href="/portal/discussions">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-topic-${topic.id}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{topic.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {topic.category} · {topic.authorUsername || "Member"}
                              {topic.replyCount !== undefined && ` · ${topic.replyCount} replies`}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card data-testid="card-no-discussions">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 shrink-0">
                      <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">No recent discussions</p>
                      <p className="text-xs text-muted-foreground">
                        <Link href="/portal/discussions"><span className="text-primary hover:underline">Start a conversation</span></Link> with fellow NAMC members.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <h2 className="text-lg font-semibold mb-4" data-testid="text-quick-links-heading">Quick Links</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/portal/projects">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-projects">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Browse Projects</p>
                      <p className="text-xs text-muted-foreground">Find bidding opportunities</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/messages">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-messages">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Check Messages</p>
                      <p className="text-xs text-muted-foreground">Read & send messages</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/directory">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-directory">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Member Directory</p>
                      <p className="text-xs text-muted-foreground">Find contractors & partners</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/documents">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-documents">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Documents</p>
                      <p className="text-xs text-muted-foreground">Forms, guides & resources</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/campaigns">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-campaigns">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                      <Target className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fundraising</p>
                      <p className="text-xs text-muted-foreground">Capital campaigns & pledges</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/profile">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-profile">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Update Profile</p>
                      <p className="text-xs text-muted-foreground">Complete your company info</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        ) : (
          <Card data-testid="card-no-application">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Linked Application</h3>
              <p className="text-muted-foreground mb-4">
                Your account isn't linked to a membership application yet. 
                Please contact an administrator to link your account.
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
