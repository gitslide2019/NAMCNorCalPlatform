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
  Briefcase,
  Plus,
  MapPin,
  Calendar,
  ArrowLeft,
  XCircle,
  List,
  Map as MapIcon,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  BarChart3,
  Mail,
  HelpCircle,
} from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { ProjectOpportunity, ProjectBid } from "@shared/schema";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const goldMarkerSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#E5A830"/><circle cx="12.5" cy="12.5" r="6" fill="white"/></svg>`);

const openMarkerIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${goldMarkerSvg}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

const CATEGORY_COLORS: Record<string, string> = {
  "Networking": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "RFP": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Bid opportunity": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Training": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Outreach": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Policy": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "RFQ": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "RFQ notice": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Paid study participation": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

function getCategoryColor(category: string | null | undefined): string {
  if (!category) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return CATEGORY_COLORS[category] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

function extractContactLink(contactEmail: string | null | undefined): { href: string; label: string } | null {
  if (!contactEmail) return null;
  const trimmed = contactEmail.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { href: trimmed, label: "Learn More / Register" };
  }
  const emailMatch = trimmed.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    return { href: `mailto:${emailMatch[0]}`, label: `Contact: ${emailMatch[0]}` };
  }
  return null;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDeadlineUrgency(deadline: string | null | undefined): {
  label: string;
  variant: "green" | "amber" | "red";
} | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Deadline passed", variant: "red" };
  if (diffDays === 0) return { label: "Due today", variant: "amber" };
  if (diffDays === 1) return { label: "1 day left", variant: "amber" };
  if (diffDays <= 7) return { label: `${diffDays} days left`, variant: "amber" };
  return { label: `${diffDays} days left`, variant: "green" };
}

function ProjectMapView({ projects, onSelectProject }: {
  projects: ProjectOpportunity[];
  onSelectProject: (id: string) => void;
}) {
  const mappable = projects.filter(p => p.latitude && p.longitude);
  return (
    <div className="rounded-lg overflow-hidden border h-[300px] sm:h-[420px]" data-testid="map-container">
      <MapContainer
        center={[37.78, -122.38]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((project) => (
          <Marker
            key={project.id}
            position={[parseFloat(project.latitude!), parseFloat(project.longitude!)]}
            icon={openMarkerIcon}
          >
            <Popup>
              <div className="min-w-[180px]" data-testid={`popup-project-${project.id}`}>
                <h3 className="font-semibold text-sm mb-1">{project.title}</h3>
                {project.organization && (
                  <p className="text-xs text-gray-600 mb-1">{project.organization}</p>
                )}
                <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3 inline-block" /> {project.location}
                </p>
                <button
                  onClick={() => onSelectProject(project.id)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  data-testid={`link-view-details-${project.id}`}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function PastOpportunitiesMetrics({ projects }: { projects: ProjectOpportunity[] }) {
  const [expanded, setExpanded] = useState(true);

  const byCategory = projects.reduce<Record<string, number>>((acc, p) => {
    const cat = p.category || "Other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const dates = projects
    .map(p => p.emailSentDate)
    .filter(Boolean)
    .map(d => new Date(d!))
    .filter(d => !isNaN(d.getTime()));
  const earliest = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const latest = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

  const unknownCount = projects.filter(p => p.status === "unknown").length;
  const closedCount = projects.filter(p => p.status === "closed").length;

  return (
    <div className="mt-10 border-t pt-8">
      <button
        className="flex items-center gap-2 w-full text-left group"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-toggle-past"
      >
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          Past & Unconfirmed Opportunities ({projects.length})
        </h2>
        {expanded ? <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" /> : <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />}
      </button>
      <p className="text-sm text-muted-foreground mt-1 mb-2">
        Opportunities from the NAMC email feed that have closed, passed, or could not be confirmed as still open.
      </p>
      {earliest && latest && (
        <p className="text-xs text-muted-foreground mb-4">
          Email feed range: {formatDate(earliest.toISOString().split("T")[0])} – {formatDate(latest.toISOString().split("T")[0])}
        </p>
      )}

      {expanded && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="bg-muted/40 rounded-lg px-4 py-3 text-center min-w-[80px]" data-testid="metric-total">
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total</div>
            </div>
            <div className="bg-muted/40 rounded-lg px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold">{closedCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Closed</div>
            </div>
            {unknownCount > 0 && (
              <div className="bg-muted/40 rounded-lg px-4 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  {unknownCount}
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Status Unknown</div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">By Category</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {sorted.map(([cat, count]) => (
                <div key={cat} className="bg-muted/30 rounded-lg p-3" data-testid={`metric-category-${cat.replace(/[\s/]+/g, "-").toLowerCase()}`}>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{cat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ProjectWithBids = ProjectOpportunity & { bids: ProjectBid[] };

function ProjectListView({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setProjectsLocation] = useWouterLocation();
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showMap, setShowMap] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    location: "",
    deadline: "",
    contactEmail: "",
    category: "",
    organization: "",
    latitude: "",
    longitude: "",
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
      setNewProject({ title: "", description: "", location: "", deadline: "", contactEmail: "", category: "", organization: "", latitude: "", longitude: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to post project", description: error.message, variant: "destructive" });
    },
  });

  const openProjects = projects?.filter(p => p.status === "open") || [];
  const pastProjects = projects?.filter(p => p.status !== "open") || [];

  const allCategories = ["All", ...Array.from(new Set(openProjects.map(p => p.category).filter(Boolean) as string[]))];

  const filteredOpen = openProjects
    .filter(p => categoryFilter === "All" || p.category === categoryFilter)
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setProjectsLocation("/portal")}
        className="mb-4"
        data-testid="button-back-to-dashboard"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-projects-title">
            <Briefcase className="h-7 w-7" />
            Project Opportunities
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real opportunities sourced from the NAMC NorCal email feed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={showMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMap(!showMap)}
            data-testid="button-toggle-map"
          >
            <MapIcon className="h-4 w-4 mr-1" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
          {user?.isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-post-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post New Opportunity</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    data-testid="input-project-title"
                  />
                  <Input
                    placeholder="Organization / Agency"
                    value={newProject.organization}
                    onChange={(e) => setNewProject({ ...newProject, organization: e.target.value })}
                    data-testid="input-project-organization"
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
                    placeholder="Category (e.g. RFP, Networking, Bid opportunity)"
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    data-testid="input-project-category"
                  />
                  <Input
                    placeholder="Deadline / Event Date"
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    data-testid="input-project-deadline"
                  />
                  <Input
                    placeholder="Contact / RSVP"
                    value={newProject.contactEmail}
                    onChange={(e) => setNewProject({ ...newProject, contactEmail: e.target.value })}
                    data-testid="input-project-contact-email"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Latitude (e.g. 37.80)"
                      value={newProject.latitude}
                      onChange={(e) => setNewProject({ ...newProject, latitude: e.target.value })}
                      data-testid="input-project-latitude"
                    />
                    <Input
                      placeholder="Longitude (e.g. -122.27)"
                      value={newProject.longitude}
                      onChange={(e) => setNewProject({ ...newProject, longitude: e.target.value })}
                      data-testid="input-project-longitude"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">Coordinates place the opportunity on the map.</p>
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate(newProject)}
                    disabled={createMutation.isPending || !newProject.title || !newProject.description || !newProject.location}
                    data-testid="button-submit-project"
                  >
                    {createMutation.isPending ? "Posting..." : "Post Opportunity"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-28 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {showMap && filteredOpen.length > 0 && (
            <ProjectMapView projects={filteredOpen} onSelectProject={onSelectProject} />
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2" data-testid="text-current-heading">
                <List className="h-4 w-4" />
                Current Opportunities
                <span className="text-muted-foreground font-normal text-sm">({filteredOpen.length})</span>
              </h2>
            </div>

            {allCategories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4" data-testid="category-filter-chips">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                      categoryFilter === cat
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                    data-testid={`chip-category-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredOpen.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredOpen.map((project) => {
                  const urgency = getDeadlineUrgency(project.deadline);
                  const urgencyClasses = urgency
                    ? urgency.variant === "red"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : urgency.variant === "amber"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "";
                  return (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => onSelectProject(project.id)}
                      data-testid={`card-project-${project.id}`}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base leading-snug flex-1">{project.title}</h3>
                          {project.category && (
                            <Badge className={`${getCategoryColor(project.category)} text-xs shrink-0`} data-testid={`badge-category-${project.id}`}>
                              {project.category}
                            </Badge>
                          )}
                        </div>

                        {project.organization && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid={`text-org-${project.id}`}>
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{project.organization}</span>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-desc-${project.id}`}>
                          {project.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{project.location}</span>
                          </span>
                          {project.deadline && (
                            <span className="flex items-center gap-1 shrink-0" data-testid={`text-deadline-${project.id}`}>
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(project.deadline)}
                            </span>
                          )}
                        </div>

                        {(() => {
                          const contact = extractContactLink(project.contactEmail);
                          return contact ? (
                            <a
                              href={contact.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline truncate max-w-full"
                              data-testid={`link-apply-${project.id}`}
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {contact.label}
                            </a>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              data-testid={`link-apply-${project.id}`}
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              View Details / Apply →
                            </button>
                          );
                        })()}

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-2">
                            {urgency && (
                              <Badge className={`${urgencyClasses} text-xs`} data-testid={`badge-urgency-${project.id}`}>
                                {urgency.label}
                              </Badge>
                            )}
                          </div>
                          {user?.isAdmin && project.gmailLink && (
                            <a
                              href={project.gmailLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`link-gmail-${project.id}`}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Source Email
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-projects">
                    {categoryFilter !== "All" ? `No open opportunities in "${categoryFilter}".` : "No current opportunities."}
                  </p>
                  {categoryFilter !== "All" && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCategoryFilter("All")}>
                      Show all categories
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {pastProjects.length > 0 && (
            <PastOpportunitiesMetrics projects={pastProjects} />
          )}
        </div>
      )}
    </div>
  );
}

function ProjectDetailView({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: project, isLoading } = useQuery<ProjectWithBids>({
    queryKey: ["/api/portal/projects", projectId],
  });

  const closeProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/portal/projects/${projectId}/status`, { status: "closed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/projects"] });
      toast({ title: "Opportunity closed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to close", description: error.message, variant: "destructive" });
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
        <p className="mt-4 text-muted-foreground">Opportunity not found.</p>
      </div>
    );
  }

  const urgency = getDeadlineUrgency(project.deadline);

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6" data-testid="button-back">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Opportunities
      </Button>

      <Card data-testid="card-project-detail">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl leading-snug">{project.title}</CardTitle>
              {project.organization && (
                <p className="flex items-center gap-1.5 text-muted-foreground mt-2 text-sm" data-testid="text-detail-org">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {project.organization}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {project.category && (
                <Badge className={getCategoryColor(project.category)} data-testid="badge-detail-category">
                  <Tag className="h-3 w-3 mr-1" />
                  {project.category}
                </Badge>
              )}
              <Badge
                className={
                  project.status === "open"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : project.status === "unknown"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }
                data-testid="badge-detail-status"
              >
                {project.status === "open" ? "Open" : project.status === "unknown" ? "Status Unknown" : "Closed"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-project-full-description">
            {project.description}
          </p>

          {project.notes && (
            <div className="bg-muted/40 rounded-lg p-4 text-sm" data-testid="text-detail-notes">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Key Dates & Notes</p>
              <p className="leading-relaxed">{project.notes}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span data-testid="text-detail-location">{project.location}</span>
              </div>
              {project.deadline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span data-testid="text-detail-deadline">{formatDate(project.deadline)}</span>
                  {urgency && (
                    <Badge className={
                      urgency.variant === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs" :
                      urgency.variant === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs" :
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs"
                    }>
                      {urgency.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {project.contactEmail && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="break-all" data-testid="text-detail-contact">{project.contactEmail}</span>
                </div>
              )}
              {project.emailSentDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="text-xs">Received {formatDate(project.emailSentDate)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {user?.isAdmin && project.gmailLink && (
              <a
                href={project.gmailLink}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-view-email"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source Email
                </Button>
              </a>
            )}
            {user?.isAdmin && project.status === "open" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => closeProjectMutation.mutate()}
                disabled={closeProjectMutation.isPending}
                data-testid="button-close-project"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {closeProjectMutation.isPending ? "Closing..." : "Mark as Closed"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Projects() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  return (
    <PortalLayout>
      {selectedProjectId ? (
        <ProjectDetailView projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />
      ) : (
        <ProjectListView onSelectProject={setSelectedProjectId} />
      )}
    </PortalLayout>
  );
}
