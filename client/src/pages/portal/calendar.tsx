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
} from "lucide-react";
import { useLocation } from "wouter";
import type { CalendarEvent } from "@shared/schema";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/portal/events"],
  });

  const [expandedRsvps, setExpandedRsvps] = useState<Record<string, boolean>>({});

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
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events"] });
      toast({ title: "Event updated successfully" });
      setEditDialogOpen(false);
      setEditingEvent(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditEventDate(event.eventDate);
    setEditEventTime(event.eventTime || "");
    setEditLocation(event.location || "");
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

  const eventsByDate: Record<string, number> = {};
  if (events) {
    for (const ev of events) {
      eventsByDate[ev.eventDate] = (eventsByDate[ev.eventDate] || 0) + 1;
    }
  }

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-calendar-title">
              Calendar & Events
            </h1>
            <p className="text-muted-foreground mt-1">
              View upcoming NAMC NorCal events and meetings.
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

        <Card className="mb-8" data-testid="card-calendar-grid">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <Button size="icon" variant="ghost" onClick={goToPrevMonth} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle data-testid="text-current-month">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={goToNextMonth} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="p-2" />;
                }
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const count = eventsByDate[dateStr] || 0;
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={dateStr}
                    className={`relative p-2 text-center text-sm rounded-md ${
                      isToday ? "bg-primary/10 font-bold" : ""
                    }`}
                    data-testid={`calendar-day-${dateStr}`}
                  >
                    {day}
                    {count > 0 && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary"
                        data-testid={`event-dot-${dateStr}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4" data-testid="text-upcoming-events">
            Upcoming Events
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
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isAdmin={!!user?.isAdmin}
                  userId={user?.id || ""}
                  onEdit={openEditDialog}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  deleteDisabled={deleteMutation.isPending}
                  expanded={!!expandedRsvps[event.id]}
                  onToggleExpand={() => setExpandedRsvps(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
                />
              ))}
            </div>
          ) : (
            <Card data-testid="card-no-events">
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events</h3>
                <p className="text-muted-foreground">
                  There are no upcoming events at this time.
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
  event,
  isAdmin,
  userId,
  onEdit,
  onDelete,
  deleteDisabled,
  expanded,
  onToggleExpand,
}: {
  event: CalendarEvent;
  isAdmin: boolean;
  userId: string;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  deleteDisabled: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { toast } = useToast();

  const { data: rsvps } = useQuery<RsvpData[]>({
    queryKey: ["/api/portal/events", event.id, "rsvps"],
  });

  const myRsvp = rsvps?.find((r) => r.userId === userId);
  const attendeeCount = rsvps?.length || 0;

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/portal/events/${event.id}/rsvp`, { status: "attending" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events", event.id, "rsvps"] });
      toast({ title: "RSVP confirmed!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to RSVP", description: error.message, variant: "destructive" });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/portal/events/${event.id}/rsvp`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/events", event.id, "rsvps"] });
      toast({ title: "RSVP cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to cancel RSVP", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-event-${event.id}`}>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDisplayDate(event.eventDate)}
              </span>
              {event.eventTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(event.eventTime)}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
            {event.description && (
              <p className="mt-3 text-sm text-muted-foreground" data-testid={`text-event-desc-${event.id}`}>
                {event.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge data-testid={`badge-event-date-${event.id}`}>
              {event.eventDate}
            </Badge>
            {isAdmin && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(event)}
                  data-testid={`button-edit-event-${event.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(event.id)}
                  disabled={deleteDisabled}
                  data-testid={`button-delete-event-${event.id}`}
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
              data-testid={`button-cancel-rsvp-${event.id}`}
            >
              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
              {cancelRsvpMutation.isPending ? "Cancelling..." : "Attending ✓"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => rsvpMutation.mutate()}
              disabled={rsvpMutation.isPending}
              data-testid={`button-rsvp-${event.id}`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {rsvpMutation.isPending ? "Confirming..." : "RSVP"}
            </Button>
          )}
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`button-show-attendees-${event.id}`}
          >
            <Users className="h-4 w-4" />
            <span data-testid={`text-attendee-count-${event.id}`}>{attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}</span>
          </button>
        </div>

        {expanded && rsvps && rsvps.length > 0 && (
          <div className="mt-3 pt-3 border-t" data-testid={`list-attendees-${event.id}`}>
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
