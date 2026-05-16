import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { PageHeader } from "@/components/editorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  UsersRound,
  Crown,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  ListChecks,
  Info,
  UserMinus,
  UserPlus,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import type { Committee, CommitteeMembership, CommitteeMeeting, CommitteeTask } from "@shared/schema";

type DirectoryEntry = { id: string; companyName: string; contactName: string };

type DetailResponse = {
  committee: Committee;
  members: (CommitteeMembership & { username: string; displayName: string; memberApplicationId: string | null })[];
  meetings: CommitteeMeeting[];
  tasks: (CommitteeTask & { assignedToName: string | null })[];
  isMember: boolean;
  isChair: boolean;
  myMembershipId: string | null;
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "governance", label: "Governance" },
  { value: "programs", label: "Programs" },
  { value: "outreach", label: "Outreach" },
  { value: "finance", label: "Finance" },
];

const TASK_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const TASK_STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommitteeDetail() {
  const params = useParams<{ id: string }>();
  const committeeId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMission, setEditMission] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editChairId, setEditChairId] = useState<string>("");

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberToAddId, setMemberToAddId] = useState<string>("");

  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CommitteeMeeting | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");
  const [mLocation, setMLocation] = useState("");
  const [mAgenda, setMAgenda] = useState("");
  const [mMinutes, setMMinutes] = useState("");

  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CommitteeTask | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDescription, setTDescription] = useState("");
  const [tAssigneeId, setTAssigneeId] = useState<string>("");
  const [tDueDate, setTDueDate] = useState("");
  const [tStatus, setTStatus] = useState("open");

  // Completion note dialog (shown when marking a task "completed")
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [completeNote, setCompleteNote] = useState("");

  const { data, isLoading } = useQuery<DetailResponse>({
    queryKey: ["/api/portal/committees", committeeId],
  });

  const { data: directory } = useQuery<DirectoryEntry[]>({
    queryKey: ["/api/portal/directory"],
  });

  const isAdmin = !!user?.isAdmin;
  const canManage = isAdmin || (data?.isChair ?? false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/portal/committees", committeeId] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/committees"] });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/portal/committees/${committeeId}`, {
        name: editName,
        mission: editMission || null,
        description: editDescription || null,
        category: editCategory,
        chairId: editChairId || null,
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Committee updated" });
      setEditOpen(false);
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/portal/committees/${committeeId}/join`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/portal/committees", committeeId] });
      const previous = queryClient.getQueryData<DetailResponse>(["/api/portal/committees", committeeId]);
      if (previous && user) {
        queryClient.setQueryData<DetailResponse>(["/api/portal/committees", committeeId], {
          ...previous,
          isMember: true,
          myMembershipId: previous.myMembershipId ?? "optimistic",
          members: previous.members.find((m) => m.userId === user.id)
            ? previous.members
            : [
                ...previous.members,
                {
                  id: "optimistic",
                  committeeId: committeeId!,
                  userId: user.id,
                  role: "member",
                  joinedAt: new Date(),
                  username: user.username,
                  displayName: user.username,
                  memberApplicationId: null,
                },
              ],
        });
      }
      return { previous };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/portal/committees", committeeId], ctx.previous);
      toast({ title: "Could not join", description: e.message, variant: "destructive" });
    },
    onSuccess: () => { toast({ title: "Joined committee" }); },
    onSettled: () => { invalidate(); },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/portal/committees/${committeeId}/leave`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/portal/committees", committeeId] });
      const previous = queryClient.getQueryData<DetailResponse>(["/api/portal/committees", committeeId]);
      if (previous && user) {
        queryClient.setQueryData<DetailResponse>(["/api/portal/committees", committeeId], {
          ...previous,
          isMember: false,
          myMembershipId: null,
          members: previous.members.filter((m) => m.userId !== user.id),
        });
      }
      return { previous };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["/api/portal/committees", committeeId], ctx.previous);
      toast({ title: "Could not leave", description: e.message, variant: "destructive" });
    },
    onSuccess: () => { toast({ title: "Left committee" }); },
    onSettled: () => { invalidate(); },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/portal/committees/${committeeId}/members`, { applicationId: memberToAddId });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Member added" });
      setAddMemberOpen(false);
      setMemberToAddId("");
    },
    onError: (e: Error) => toast({ title: "Failed to add member", description: e.message, variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      await apiRequest("DELETE", `/api/portal/committees/${committeeId}/members/${membershipId}`);
    },
    onSuccess: () => { invalidate(); toast({ title: "Member removed" }); },
    onError: (e: Error) => toast({ title: "Failed to remove", description: e.message, variant: "destructive" }),
  });

  const meetingMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: mTitle,
        meetingDate: mDate,
        meetingTime: mTime || null,
        location: mLocation || null,
        agenda: mAgenda || null,
        minutes: mMinutes || null,
      };
      if (editingMeeting) {
        await apiRequest("PATCH", `/api/portal/committees/${committeeId}/meetings/${editingMeeting.id}`, body);
      } else {
        await apiRequest("POST", `/api/portal/committees/${committeeId}/meetings`, body);
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: editingMeeting ? "Meeting updated" : "Meeting added" });
      setMeetingOpen(false);
      setEditingMeeting(null);
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portal/committees/${committeeId}/meetings/${id}`);
    },
    onSuccess: () => { invalidate(); toast({ title: "Meeting deleted" }); },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const taskMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: tTitle,
        description: tDescription || null,
        assignedToId: tAssigneeId || null,
        dueDate: tDueDate || null,
        status: tStatus,
      };
      if (editingTask) {
        await apiRequest("PATCH", `/api/portal/committees/${committeeId}/tasks/${editingTask.id}`, body);
      } else {
        await apiRequest("POST", `/api/portal/committees/${committeeId}/tasks`, body);
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: editingTask ? "Task updated" : "Task added" });
      setTaskOpen(false);
      setEditingTask(null);
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const taskStatusMutation = useMutation({
    mutationFn: async ({ id, status, completionNote }: { id: string; status: string; completionNote?: string }) => {
      const body: { status: string; completionNote?: string | null } = { status };
      if (completionNote !== undefined) body.completionNote = completionNote || null;
      await apiRequest("PATCH", `/api/portal/committees/${committeeId}/tasks/${id}`, body);
    },
    onSuccess: () => {
      invalidate();
      setCompleteTaskId(null);
      setCompleteNote("");
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const handleStatusChange = (taskId: string, currentStatus: string, newStatus: string) => {
    if (newStatus === "completed" && currentStatus !== "completed") {
      setCompleteTaskId(taskId);
      setCompleteNote("");
      return;
    }
    taskStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portal/committees/${committeeId}/tasks/${id}`);
    },
    onSuccess: () => { invalidate(); toast({ title: "Task deleted" }); },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const openEdit = () => {
    if (!data) return;
    setEditName(data.committee.name);
    setEditMission(data.committee.mission || "");
    setEditDescription(data.committee.description || "");
    setEditCategory(data.committee.category);
    setEditChairId(data.committee.chairId || "");
    setEditOpen(true);
  };

  const openCreateMeeting = () => {
    setEditingMeeting(null);
    setMTitle(""); setMDate(""); setMTime(""); setMLocation(""); setMAgenda(""); setMMinutes("");
    setMeetingOpen(true);
  };

  const openEditMeeting = (m: CommitteeMeeting) => {
    setEditingMeeting(m);
    setMTitle(m.title);
    setMDate(m.meetingDate);
    setMTime(m.meetingTime || "");
    setMLocation(m.location || "");
    setMAgenda(m.agenda || "");
    setMMinutes(m.minutes || "");
    setMeetingOpen(true);
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTTitle(""); setTDescription(""); setTAssigneeId(""); setTDueDate(""); setTStatus("open");
    setTaskOpen(true);
  };

  const openEditTask = (t: CommitteeTask) => {
    setEditingTask(t);
    setTTitle(t.title);
    setTDescription(t.description || "");
    setTAssigneeId(t.assignedToId || "");
    setTDueDate(t.dueDate || "");
    setTStatus(t.status);
    setTaskOpen(true);
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!data) {
    return (
      <PortalLayout>
        <div className="p-8 text-center text-muted-foreground">Committee not found.</div>
      </PortalLayout>
    );
  }

  const { committee, members, meetings, tasks } = data;

  // Members eligible to be added: directory members not already on the committee
  const memberIds = new Set(members.map((m) => m.memberApplicationId).filter(Boolean));
  const directoryAvailable = (directory || []).filter((d) => !memberIds.has(d.id));

  // Members with portal accounts (so we can pick chair / assignee)
  const memberOptions = members.map((m) => ({ id: m.userId, label: m.displayName }));

  return (
    <PortalLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto" data-testid="page-committee-detail">
        <Link href="/portal/committees">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All Committees
          </Button>
        </Link>

        <PageHeader
          className="mb-6 gap-3"
          eyebrow="Working group"
          title={
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[0.95]" data-testid="text-committee-name">{committee.name}</h1>
              <Badge variant="outline">{committee.category}</Badge>
              {!committee.isActive && <Badge variant="secondary">Archived</Badge>}
            </div>
          }
          description={
            <span className="inline-flex items-center gap-3">
              <span className="flex items-center gap-1">
                <UsersRound className="h-4 w-4" />
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
              {committee.chairId && (
                <span className="flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Chair: {members.find((m) => m.userId === committee.chairId)?.displayName || "—"}
                </span>
              )}
            </span>
          }
          actions={<>
            {data.isMember ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                data-testid="button-leave-committee"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Leave
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                data-testid="button-join-committee"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </Button>
            )}
            {canManage && (
              <Button variant="outline" size="sm" onClick={openEdit} data-testid="button-edit-committee">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </>}
        />

        <Tabs defaultValue={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "meetings" ? "meetings" : "about"} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="about" data-testid="tab-about"><Info className="h-4 w-4 mr-1" />About</TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members"><UsersRound className="h-4 w-4 mr-1" />Members</TabsTrigger>
            <TabsTrigger value="meetings" data-testid="tab-meetings"><CalendarDays className="h-4 w-4 mr-1" />Meetings</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks"><ListChecks className="h-4 w-4 mr-1" />Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About this committee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Mission</h3>
                  {committee.mission ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-committee-mission">
                      {committee.mission}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No mission statement yet.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Description</h3>
                  {committee.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-committee-description">
                      {committee.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No description provided yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6 space-y-4">
            {canManage && (
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-member">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={memberToAddId} onValueChange={setMemberToAddId}>
                      <SelectTrigger data-testid="select-add-member">
                        <SelectValue placeholder="Choose a member to add" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {directoryAvailable.length === 0 ? (
                          <SelectItem value="none" disabled>All members already on this committee</SelectItem>
                        ) : (
                          directoryAvailable.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.contactName} — {d.companyName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => addMemberMutation.mutate()}
                      disabled={!memberToAddId || addMemberMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-add-member"
                    >
                      {addMemberMutation.isPending ? "Adding..." : "Add to committee"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Card>
              <CardContent className="p-0">
                {members.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No members yet.</div>
                ) : (
                  <ul className="divide-y">
                    {members.map((m) => (
                      <li key={m.id} className="flex items-center justify-between p-4" data-testid={`row-member-${m.id}`}>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {m.displayName}
                            {m.userId === committee.chairId && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                <Crown className="h-3 w-3 mr-1" />
                                Chair
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(m.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {canManage && m.userId !== committee.chairId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove ${m.displayName} from this committee?`)) {
                                removeMemberMutation.mutate(m.id);
                              }
                            }}
                            data-testid={`button-remove-member-${m.id}`}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="mt-6 space-y-6">
            {canManage && (
              <Button size="sm" onClick={openCreateMeeting} data-testid="button-add-meeting">
                <Plus className="h-4 w-4 mr-1" />
                Schedule Meeting
              </Button>
            )}
            {(() => {
              const todayStr = new Date().toISOString().slice(0, 10);
              const upcoming = meetings.filter((m) => m.meetingDate >= todayStr).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
              const past = meetings.filter((m) => m.meetingDate < todayStr).sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
              const renderCard = (m: typeof meetings[number]) => (
                  <Card key={m.id} data-testid={`card-meeting-${m.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base" data-testid={`text-meeting-title-${m.id}`}>{m.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(m.meetingDate)}
                            {m.meetingTime && ` · ${m.meetingTime}`}
                            {m.location && ` · ${m.location}`}
                          </p>
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditMeeting(m)} data-testid={`button-edit-meeting-${m.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { if (confirm("Delete this meeting?")) deleteMeetingMutation.mutate(m.id); }}
                              data-testid={`button-delete-meeting-${m.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {(m.agenda || m.minutes) && (
                      <CardContent className="pt-0 space-y-3 text-sm">
                        {m.agenda && (
                          <div>
                            <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Agenda</div>
                            <p className="whitespace-pre-wrap">{m.agenda}</p>
                          </div>
                        )}
                        {m.minutes && (
                          <div>
                            <div className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Minutes</div>
                            <p className="whitespace-pre-wrap">{m.minutes}</p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
              );
              if (meetings.length === 0) {
                return <Card><CardContent className="py-12 text-center text-muted-foreground">No meetings scheduled.</CardContent></Card>;
              }
              return (
                <>
                  <section data-testid="section-meetings-upcoming">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Upcoming</h3>
                    {upcoming.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
                    ) : (
                      <div className="space-y-3">{upcoming.map(renderCard)}</div>
                    )}
                  </section>
                  <section data-testid="section-meetings-past">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Past</h3>
                    {past.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No past meetings yet.</p>
                    ) : (
                      <div className="space-y-3">{past.map(renderCard)}</div>
                    )}
                  </section>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="tasks" className="mt-6 space-y-4">
            {canManage && (
              <Button size="sm" onClick={openCreateTask} data-testid="button-add-task">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            )}
            {(() => {
              if (tasks.length === 0) {
                return <Card><CardContent className="py-12 text-center text-muted-foreground">No tasks yet.</CardContent></Card>;
              }
              const openTasks = tasks.filter((t) => t.status !== "completed");
              const doneTasks = tasks.filter((t) => t.status === "completed");
              const renderRow = (t: typeof tasks[number]) => {
                      const canEditStatus = canManage || (t.assignedToId && t.assignedToId === user?.id);
                      return (
                        <li key={t.id} className="p-4" data-testid={`row-task-${t.id}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium" data-testid={`text-task-title-${t.id}`}>{t.title}</span>
                                <Badge className={TASK_STATUS_COLORS[t.status] || ""}>
                                  {TASK_STATUSES.find((s) => s.value === t.status)?.label || t.status}
                                </Badge>
                              </div>
                              {t.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{t.description}</p>}
                              <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-3">
                                {t.assignedToName && <span>Assigned to: {t.assignedToName}</span>}
                                {t.dueDate && <span>Due: {formatDate(t.dueDate)}</span>}
                                {t.completedAt && (
                                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed {new Date(t.completedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {t.completionNote && (
                                <div className="mt-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded px-2 py-1.5" data-testid={`text-completion-note-${t.id}`}>
                                  <span className="font-medium">Completion note: </span>
                                  <span className="whitespace-pre-wrap">{t.completionNote}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {canEditStatus && (
                                <Select
                                  value={t.status}
                                  onValueChange={(v) => handleStatusChange(t.id, t.status, v)}
                                >
                                  <SelectTrigger className="w-32" data-testid={`select-task-status-${t.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TASK_STATUSES.map((s) => (
                                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {canManage && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => openEditTask(t)} data-testid={`button-edit-task-${t.id}`}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { if (confirm("Delete this task?")) deleteTaskMutation.mutate(t.id); }}
                                    data-testid={`button-delete-task-${t.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      );
              };
              return (
                <>
                  <section data-testid="section-tasks-open">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Open</h3>
                    {openTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No open tasks.</p>
                    ) : (
                      <Card><CardContent className="p-0"><ul className="divide-y">{openTasks.map(renderRow)}</ul></CardContent></Card>
                    )}
                  </section>
                  <section data-testid="section-tasks-done" className="mt-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Done</h3>
                    {doneTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
                    ) : (
                      <Card><CardContent className="p-0"><ul className="divide-y">{doneTasks.map(renderRow)}</ul></CardContent></Card>
                    )}
                  </section>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Edit committee dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit committee</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger data-testid="select-edit-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Chair (must be a current member)</label>
                <Select value={editChairId || "none"} onValueChange={(v) => setEditChairId(v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="select-edit-chair"><SelectValue placeholder="No chair" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No chair</SelectItem>
                    {memberOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mission</label>
                <Textarea value={editMission} onChange={(e) => setEditMission(e.target.value)} rows={3} placeholder="What is this committee's mission?" data-testid="input-edit-mission" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} data-testid="input-edit-description" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || updateMutation.isPending} data-testid="button-save-committee">
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Meeting dialog */}
        <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingMeeting ? "Edit meeting" : "Schedule meeting"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title" value={mTitle} onChange={(e) => setMTitle(e.target.value)} data-testid="input-meeting-title" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} data-testid="input-meeting-date" />
                <Input type="time" value={mTime} onChange={(e) => setMTime(e.target.value)} data-testid="input-meeting-time" />
              </div>
              <Input placeholder="Location (optional)" value={mLocation} onChange={(e) => setMLocation(e.target.value)} data-testid="input-meeting-location" />
              <Textarea placeholder="Agenda (optional)" value={mAgenda} onChange={(e) => setMAgenda(e.target.value)} rows={3} data-testid="input-meeting-agenda" />
              <Textarea placeholder="Minutes (optional)" value={mMinutes} onChange={(e) => setMMinutes(e.target.value)} rows={4} data-testid="input-meeting-minutes" />
            </div>
            <DialogFooter>
              <Button onClick={() => meetingMutation.mutate()} disabled={!mTitle.trim() || !mDate || meetingMutation.isPending} data-testid="button-save-meeting">
                {meetingMutation.isPending ? "Saving..." : "Save meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Completion note dialog */}
        <Dialog open={completeTaskId !== null} onOpenChange={(o) => { if (!o) { setCompleteTaskId(null); setCompleteNote(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Mark task complete
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add a short note about what was done (optional).
              </p>
              <Textarea
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                placeholder="e.g. Spoke with three vendors, picked Acme Catering. Contract signed."
                rows={4}
                data-testid="input-completion-note"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => { setCompleteTaskId(null); setCompleteNote(""); }}
                data-testid="button-cancel-complete"
              >
                Cancel
              </Button>
              <Button
                onClick={() => completeTaskId && taskStatusMutation.mutate({ id: completeTaskId, status: "completed", completionNote: completeNote })}
                disabled={taskStatusMutation.isPending}
                data-testid="button-confirm-complete"
              >
                {taskStatusMutation.isPending ? "Saving..." : "Mark complete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task dialog */}
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTask ? "Edit task" : "Add task"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title" value={tTitle} onChange={(e) => setTTitle(e.target.value)} data-testid="input-task-title" />
              <Textarea placeholder="Description (optional)" value={tDescription} onChange={(e) => setTDescription(e.target.value)} rows={3} data-testid="input-task-description" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={tAssigneeId || "none"} onValueChange={(v) => setTAssigneeId(v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="select-task-assignee"><SelectValue placeholder="Assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {memberOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={tDueDate} onChange={(e) => setTDueDate(e.target.value)} data-testid="input-task-due-date" />
              </div>
              <Select value={tStatus} onValueChange={setTStatus}>
                <SelectTrigger data-testid="select-task-status-edit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={() => taskMutation.mutate()} disabled={!tTitle.trim() || taskMutation.isPending} data-testid="button-save-task">
                {taskMutation.isPending ? "Saving..." : "Save task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
