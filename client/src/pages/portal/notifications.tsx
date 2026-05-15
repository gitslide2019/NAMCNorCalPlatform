import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Bell, CheckCheck, Megaphone, Mail, Briefcase, CalendarDays } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Eyebrow } from "@/components/editorial";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  announcement: Megaphone,
  message: Mail,
  project: Briefcase,
  event: CalendarDays,
};

export default function Notifications() {
  const [, setLocation] = useLocation();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/portal/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/portal/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/portal/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-6 -ml-2" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <header className="border-b border-foreground/10 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <Eyebrow>The wire</Eyebrow>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[0.95]" data-testid="text-notifications-title">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread — fresh off the desk` : "You're all caught up. Nice."}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} data-testid="button-mark-all-read" className="rounded-full pressable">
                <CheckCheck className="h-4 w-4 mr-2" />Mark all read
              </Button>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : !notifications?.length ? (
          <Card className="shadow-editorial">
            <CardContent className="p-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" strokeWidth={1.4} />
              <p className="font-display text-xl text-muted-foreground">Nothing to report.</p>
            </CardContent>
          </Card>
        ) : (
          <ol className="relative border-l border-foreground/10 ml-3 space-y-4">
            {notifications.map(n => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <li key={n.id} className="relative pl-6" data-testid={`card-notification-${n.id}`}>
                  <span className={`absolute -left-[7px] top-3 grid h-3.5 w-3.5 place-items-center rounded-full ${!n.isRead ? "bg-primary ring-4 ring-primary/15" : "bg-muted-foreground/30"}`} aria-hidden="true" />
                  <Card className={`shadow-editorial ${!n.isRead ? "border-primary/30" : ""}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.6} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`font-display text-base leading-tight ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                          </div>
                          {!n.isRead && <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider shrink-0">New</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-2.5 text-xs">
                          <span className="text-muted-foreground tabular-nums">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                          {n.link && (
                            <Link href={n.link}>
                              <span className="text-primary font-semibold uppercase tracking-wider hover:underline cursor-pointer" data-testid={`link-notification-${n.id}`}>View →</span>
                            </Link>
                          )}
                          {!n.isRead && (
                            <button onClick={() => markReadMutation.mutate(n.id)} className="text-muted-foreground hover:text-foreground cursor-pointer ml-auto" data-testid={`button-mark-read-${n.id}`}>
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </PortalLayout>
  );
}
