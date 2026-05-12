import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Plus,
  MapPin,
  Clock,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Users,
  UsersRound,
  ExternalLink,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import type { CalendarEvent } from "@shared/schema";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type FeedItem = {
  kind: "event" | "meeting";
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  description: string | null;
  committeeId?: string;
  committeeName?: string;
  rsvpEnabled: boolean;
};

type Scope = "all" | "events" | "my-committees";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [scope, setScope] = useState<Scope>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventTime, setEditEventTime] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const { data: feed, isLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/portal/calendar-feed", { scope }],
    queryFn: async () => {
      const res = await fetch(`/api/portal/calendar-feed?scope=${scope}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load calendar");
      return res.json();
    },
  });

  const [expandedRsvps, setExpandedRsvps] = useState<Record<string, boolean>>({});

  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/portal/calendar-feed"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/events"] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/portal/events", {
        title: newTitle,
        description: newDescription,
        eventDate: newEventDate,
        eventTime: newEventTime,
        location: newLocation,
      });
    },
    onSuccess: () => {
      invalidateFeed();
      toast({ title: "Event created successfully" });
      setDialogOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewEventDate("");
      setNewEventTime("");
      setNewLocation("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portal/events/${id}`);
    },
    onSuccess: () => {
      invalidateFeed();
      toast({ title: "Event deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete event", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingEvent) return;
      await apiRequest("PATCH", `/api/portal/events/${editingEvent.id}`, {
        title: editTitle,
        description: editDescription,
        eventDate: editEventDate,
        eventTime: editEventTime,
        location: editLocation,
      });
    },
    onSuccess: () => {
      invalidateFeed();
      toast({ title: "Event updated successfully" });
      setEditDialogOpen(false);
      setEditingEvent(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (item: FeedItem) => {
    setEditingEvent({
      id: item.id,
      title: item.title,
      description: item.description,
      eventDate: item.date,
      eventTime: item.time,
      location: item.location,
      createdById: "",
      createdAt: new Date(),
    } as CalendarEvent);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditEventDate(item.date);
    setEditEventTime(item.time || "");
    setEditLocation(item.location || "");
    setEditDialogOpen(true);
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const itemsByDate: Record<string, { events: number; meetings: number }> = {};
  if (feed) {
    for (const it of feed) {
      const cell = itemsByDate[it.date] || { events: 0, meetings: 0 };
      if (it.kind === "event") cell.events += 1;
      else cell.meetings += 1;
      itemsByDate[it.date] = cell;
    }
  }

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const upcoming = (feed ?? [])
    .filter((it) => it.date >= todayStr)
    .slice(0, 50);

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/portal")}
          className="mb-4"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-calendar-title">
              Calendar & Events
            </h1>
            <p className="text-muted-foreground mt-1">
              View upcoming NAMC NorCal events and committee meetings.
            </p>
          </div>
          {user?.isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-event">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Event title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    data-testid="input-event-title"
                  />
                  <Textarea
                    placeholder="Event description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    data-testid="input-event-description"
                  />
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    data-testid="input-event-date"
                  />
                  <Input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    data-testid="input-event-time"
                  />
                  <Input
                    placeholder="Location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    data-testid="input-event-location"
                  />
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate()}
                    disabled={!newTitle || !newEventDate || createMutation.isPending}
                    data-testid="button-submit-event"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="inline-flex rounded-lg border bg-muted/30 p-1 mb-6" data-testid="scope-toggle">
          {([
            { value: "all", label: "All" },
            { value: "events", label: "Events" },
            { value: "my-committees", label: "My committees" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScope(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                scope === opt.value
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`scope-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Card className="mb-8" data-testid="card-calendar-grid">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={goToPrevMonth} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base sm:text-lg" data-testid="text-current-month">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </CardTitle>
            <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px]" onClick={goToNextMonth} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="p-2" />;
                }
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const cell = itemsByDate[dateStr];
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={dateStr}
                    className={`relative p-1 sm:p-2 text-center text-xs sm:text-sm rounded-md min-h-[36px] sm:min-h-[40px] flex flex-col items-center justify-center ${
                      isToday ? "bg-primary/10 font-bold" : ""
                    }`}
                    data-testid={`calendar-day-${dateStr}`}
                  >
                    {day}
                    {cell && (cell.events > 0 || cell.meetings > 0) && (
                      <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {cell.events > 0 && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                            data-testid={`event-dot-${dateStr}`}
                          />
                        )}
                        {cell.meetings > 0 && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                            data-testid={`meeting-dot-${dateStr}`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                Event
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                Committee meeting
              </span>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4" data-testid="text-upcoming-events">
            Upcoming
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((item) =>
                item.kind === "event" ? (
                  <EventCard
                    key={`event-${item.id}`}
                    item={item}
                    isAdmin={!!user?.isAdmin}
                    userId={user?.id || ""}
                    onEdit={openEditDialog}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    deleteDisabled={deleteMutation.isPending}
                    expanded={!!expandedRsvps[item.id]}
                    onToggleExpand={() => setExpandedRsvps((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  />
                ) : (
                  <MeetingCard key={`meeting-${item.id}`} item={item} />
                )
              )}
            </div>
          ) : (
            <Card data-testid="card-no-events">
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nothing scheduled</h3>
                <p className="text-muted-foreground">
                  There are no upcoming events or meetings in this view.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Event title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                data-testid="input-edit-event-title"
              />
              <Textarea
                placeholder="Event description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                data-testid="input-edit-event-description"
              />
              <Input
                type="date"
                value={editEventDate}
                onChange={(e) => setEditEventDate(e.target.value)}
                data-testid="input-edit-event-date"
              />
              <Input
                type="time"
                value={editEventTime}
                onChange={(e) => setEditEventTime(e.target.value)}
                data-testid="input-edit-event-time"
              />
              <Input
                placeholder="Location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                data-testid="input-edit-event-location"
              />
              <Button
                className="w-full"
                onClick={() => editMutation.mutate()}
                disabled={!editTitle || !editEventDate || editMutation.isPending}
                data-testid="button-submit-edit-event"
              >
                {editMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </PortalLayout>
  );
}

interface RsvpData {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  username?: string;
}

function EventCard({
  item,
  isAdmin,
  userId,
  onEdit,
  onDelete,
  deleteDisabled,
  expanded,
  onToggleExpand,
}: {
  item: FeedItem;
  isAdmin: boolean;
  userId: string;
  onEdit: (item: FeedItem) => void;
  onDelete: (id: string) => void;
  deleteDisabled: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { toast } = useToast();

  const { data: rsvps } = useQuery<RsvpData[]>({
    queryKey: ["/api/portal/events", item.id, "rsvps"],
  });

  const myRsvp = rsvps?.find((r) => r.userId === userId);
  const attendeeCount = rsvps?.length || 0;

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/portal/events/${item.id}/rsvp`, { status: "attending" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events", item.id, "rsvps"] });
      toast({ title: "RSVP confirmed!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to RSVP", description: error.message, variant: "destructive" });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/portal/events/${item.id}/rsvp`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events", item.id, "rsvps"] });
      toast({ title: "RSVP cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to cancel RSVP", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-event-${item.id}`}>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">Event</Badge>
              <h3 className="font-semibold text-lg" data-testid={`text-event-title-${item.id}`}>
                {item.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDisplayDate(item.date)}
              </span>
              {item.time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(item.time)}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-3 text-sm text-muted-foreground" data-testid={`text-event-desc-${item.id}`}>
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(item)}
                  data-testid={`button-edit-event-${item.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(item.id)}
                  disabled={deleteDisabled}
                  data-testid={`button-delete-event-${item.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t">
          {myRsvp ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelRsvpMutation.mutate()}
              disabled={cancelRsvpMutation.isPending}
              data-testid={`button-cancel-rsvp-${item.id}`}
            >
              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
              {cancelRsvpMutation.isPending ? "Cancelling..." : "Attending ✓"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => rsvpMutation.mutate()}
              disabled={rsvpMutation.isPending}
              data-testid={`button-rsvp-${item.id}`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {rsvpMutation.isPending ? "Confirming..." : "RSVP"}
            </Button>
          )}
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`button-show-attendees-${item.id}`}
          >
            <Users className="h-4 w-4" />
            <span data-testid={`text-attendee-count-${item.id}`}>{attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}</span>
          </button>
        </div>

        {expanded && rsvps && rsvps.length > 0 && (
          <div className="mt-3 pt-3 border-t" data-testid={`list-attendees-${item.id}`}>
            <p className="text-xs font-medium text-muted-foreground mb-2">Attendees:</p>
            <div className="flex flex-wrap gap-2">
              {rsvps.map((r) => (
                <Badge key={r.id} variant="secondary" className="text-xs">
                  {r.username || "Unknown"}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingCard({ item }: { item: FeedItem }) {
  return (
    <Card
      className="border-l-4 border-l-emerald-500"
      data-testid={`card-meeting-${item.id}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs">
                <UsersRound className="h-3 w-3 mr-1" />
                Meeting
              </Badge>
              <h3 className="font-semibold text-lg" data-testid={`text-meeting-title-${item.id}`}>
                {item.title}
              </h3>
            </div>
            {item.committeeName && item.committeeId && (
              <p className="text-sm text-muted-foreground mt-1">
                <Link href={`/portal/committees/${item.committeeId}`}>
                  <span className="hover:underline cursor-pointer" data-testid={`link-committee-${item.committeeId}`}>
                    {item.committeeName}
                  </span>
                </Link>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDisplayDate(item.date)}
              </span>
              {item.time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(item.time)}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-meeting-agenda-${item.id}`}>
                {item.description}
              </p>
            )}
          </div>
          {item.committeeId && (
            <Link href={`/portal/committees/${item.committeeId}`}>
              <Button variant="outline" size="sm" data-testid={`button-open-committee-${item.committeeId}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open committee
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
