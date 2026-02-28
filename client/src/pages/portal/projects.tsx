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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ProjectOpportunity, ProjectBid } from "@shared/schema";

type ProjectWithBids = ProjectOpportunity & { bids: ProjectBid[] };
type PortalUser = { id: string; username: string };

function ProjectListView({
  onSelectProject,
}: {
  onSelectProject: (id: string) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    location: "",
    budget: "",
    deadline: "",
    contactEmail: "",
  });

  const { data: projects, isLoading } = useQuery<ProjectOpportunity[]>({
    queryKey: ["/api/portal/projects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newProject) => {
      await apiRequest("POST", "/api/portal/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects"] });
      toast({ title: "Project posted successfully" });
      setDialogOpen(false);
      setNewProject({
        title: "",
        description: "",
        location: "",
        budget: "",
        deadline: "",
        contactEmail: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to post project", description: error.message, variant: "destructive" });
    },
  });

  const filtered = projects?.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-projects-title">
            <Briefcase className="h-7 w-7" />
            Project Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and bid on available project opportunities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          {user?.isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-post-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input
                    placeholder="Project Title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    data-testid="input-project-title"
                  />
                  <Textarea
                    placeholder="Description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    data-testid="input-project-description"
                  />
                  <Input
                    placeholder="Location"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    data-testid="input-project-location"
                  />
                  <Input
                    placeholder="Budget"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    data-testid="input-project-budget"
                  />
                  <Input
                    placeholder="Deadline"
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    data-testid="input-project-deadline"
                  />
                  <Input
                    placeholder="Contact Email"
                    type="email"
                    value={newProject.contactEmail}
                    onChange={(e) => setNewProject({ ...newProject, contactEmail: e.target.value })}
                    data-testid="input-project-contact-email"
                  />
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate(newProject)}
                    disabled={createMutation.isPending || !newProject.title || !newProject.description || !newProject.location}
                    data-testid="button-submit-project"
                  >
                    {createMutation.isPending ? "Posting..." : "Post Project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectProject(project.id)}
              data-testid={`card-project-${project.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{project.title}</CardTitle>
                  <Badge
                    className={
                      project.status === "open"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }
                    data-testid={`badge-project-status-${project.id}`}
                  >
                    {project.status === "open" ? "Open" : "Closed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-project-desc-${project.id}`}>
                  {project.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.location}
                  </span>
                  {project.budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {project.budget}
                    </span>
                  )}
                  {project.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {project.deadline}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-projects">No projects found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectDetailView({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState("");
  const [bidProposal, setBidProposal] = useState("");

  const { data: project, isLoading } = useQuery<ProjectWithBids>({
    queryKey: ["/api/portal/projects", projectId],
  });

  const { data: portalUsers } = useQuery<PortalUser[]>({
    queryKey: ["/api/portal/users"],
  });

  const userMap = new Map(portalUsers?.map((u) => [u.id, u.username]) || []);

  const submitBidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/portal/projects/${projectId}/bids`, {
        amount: bidAmount,
        proposal: bidProposal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects", projectId] });
      toast({ title: "Bid submitted successfully" });
      setBidAmount("");
      setBidProposal("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit bid", description: error.message, variant: "destructive" });
    },
  });

  const updateBidMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: string }) => {
      await apiRequest("PATCH", `/api/portal/projects/${projectId}/bids/${bidId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects", projectId] });
      toast({ title: "Bid updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update bid", description: error.message, variant: "destructive" });
    },
  });

  const closeProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/portal/projects/${projectId}/status`, { status: "closed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects"] });
      toast({ title: "Project closed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to close project", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Button variant="ghost" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <p className="mt-4 text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6" data-testid="button-back">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      <Card data-testid="card-project-detail">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-xl sm:text-2xl">{project.title}</CardTitle>
            <Badge
              className={
                project.status === "open"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }
              data-testid="badge-project-detail-status"
            >
              {project.status === "open" ? "Open" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap" data-testid="text-project-full-description">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.location}
            </span>
            {project.budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {project.budget}
              </span>
            )}
            {project.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {project.deadline}
              </span>
            )}
          </div>
          {project.contactEmail && (
            <p className="text-sm text-muted-foreground" data-testid="text-contact-email">
              Contact: {project.contactEmail}
            </p>
          )}

          {user?.isAdmin && project.status === "open" && (
            <Button
              variant="destructive"
              onClick={() => closeProjectMutation.mutate()}
              disabled={closeProjectMutation.isPending}
              data-testid="button-close-project"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {closeProjectMutation.isPending ? "Closing..." : "Close Project"}
            </Button>
          )}
        </CardContent>
      </Card>

      {project.status === "open" && !user?.isAdmin && (
        <Card className="mt-6" data-testid="card-submit-bid">
          <CardHeader>
            <CardTitle className="text-lg">Submit a Bid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Bid Amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              data-testid="input-bid-amount"
            />
            <Textarea
              placeholder="Your proposal..."
              value={bidProposal}
              onChange={(e) => setBidProposal(e.target.value)}
              data-testid="input-bid-proposal"
            />
            <Button
              onClick={() => submitBidMutation.mutate()}
              disabled={submitBidMutation.isPending || !bidAmount || !bidProposal}
              data-testid="button-submit-bid"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitBidMutation.isPending ? "Submitting..." : "Submit Bid"}
            </Button>
          </CardContent>
        </Card>
      )}

      {user?.isAdmin && project.bids && project.bids.length > 0 && (
        <Card className="mt-6" data-testid="card-bids-list">
          <CardHeader>
            <CardTitle className="text-lg">Bids ({project.bids.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.bids.map((bid) => (
              <div
                key={bid.id}
                className="border rounded-md p-4 space-y-2"
                data-testid={`card-bid-${bid.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium" data-testid={`text-bidder-${bid.id}`}>
                      {userMap.get(bid.bidderId) || "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {bid.amount}
                    </p>
                  </div>
                  <Badge
                    className={
                      bid.status === "accepted"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : bid.status === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }
                    data-testid={`badge-bid-status-${bid.id}`}
                  >
                    {bid.status}
                  </Badge>
                </div>
                <p className="text-sm" data-testid={`text-bid-proposal-${bid.id}`}>
                  {bid.proposal}
                </p>
                {bid.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateBidMutation.mutate({ bidId: bid.id, status: "accepted" })}
                      disabled={updateBidMutation.isPending}
                      data-testid={`button-accept-bid-${bid.id}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBidMutation.mutate({ bidId: bid.id, status: "rejected" })}
                      disabled={updateBidMutation.isPending}
                      data-testid={`button-reject-bid-${bid.id}`}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {user?.isAdmin && project.bids && project.bids.length === 0 && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center text-muted-foreground" data-testid="text-no-bids">
            No bids have been submitted yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Projects() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <PortalLayout>
      {selectedProjectId ? (
        <ProjectDetailView
          projectId={selectedProjectId}
          onBack={() => setSelectedProjectId(null)}
        />
      ) : (
        <ProjectListView onSelectProject={setSelectedProjectId} />
      )}
    </PortalLayout>
  );
}
