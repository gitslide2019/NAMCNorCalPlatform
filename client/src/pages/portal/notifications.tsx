import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Bell, CheckCheck, Megaphone, Mail, Briefcase, CalendarDays } from "lucide-react";
import { useLocation, Link } from "wouter";

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
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-notifications-title">
              <Bell className="h-7 w-7" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} data-testid="button-mark-all-read">
              <CheckCheck className="h-4 w-4 mr-2" />Mark All Read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : !notifications?.length ? (
          <Card><CardContent className="p-8 text-center"><Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No notifications yet.</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <Card key={n.id} className={`transition-colors ${!n.isRead ? "border-primary/30 bg-primary/5" : ""}`} data-testid={`card-notification-${n.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${!n.isRead ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                        </div>
                        {!n.isRead && <Badge variant="default" className="text-[10px] shrink-0">New</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        {n.link && (
                          <Link href={n.link}>
                            <span className="text-xs text-primary hover:underline cursor-pointer" data-testid={`link-notification-${n.id}`}>View</span>
                          </Link>
                        )}
                        {!n.isRead && (
                          <button onClick={() => markReadMutation.mutate(n.id)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer" data-testid={`button-mark-read-${n.id}`}>
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
