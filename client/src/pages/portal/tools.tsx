import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench,
  Plus,
  Package,
  ArrowLeftRight,
  Check,
  Pencil,
  Trash2,
  MapPin,
  User,
  CalendarDays,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Camera,
  X,
  Send,
  Share2,
  ImageIcon,
  Inbox,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  ClipboardCheck,
  Ban,
  HandshakeIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/editorial";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tool, ToolLoan, ToolBorrowRequest } from "@shared/schema";

interface EnrichedTool extends Tool {
  ownerUsername?: string;
  activeLoan?: {
    id: string;
    borrowerId: string;
    borrowerUsername: string;
    borrowDate: string;
    expectedReturnDate: string | null;
    notes: string | null;
  } | null;
}

interface EnrichedLoan extends ToolLoan {
  toolName?: string;
  toolCategory?: string;
}

interface EnrichedIncomingRequest extends ToolBorrowRequest {
  requesterUsername: string;
  toolName: string;
}

interface EnrichedOutgoingRequest extends ToolBorrowRequest {
  toolName: string;
  toolLendingTerms: string | null;
  toolOwnerId: string | null;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  "power-tools": "Power Tools",
  "hand-tools": "Hand Tools",
  safety: "Safety Equipment",
  measurement: "Measurement",
};

const PILL_BASE = "text-[10px] uppercase tracking-[0.16em] font-semibold border";
function getStatusBadge(status: string) {
  switch (status) {
    case "available":
      return <Badge className={`${PILL_BASE} bg-emerald-600/10 text-emerald-700 border-emerald-600/30 dark:text-emerald-400`}>Available</Badge>;
    case "borrowed":
      return <Badge className={`${PILL_BASE} bg-primary/10 text-foreground border-primary/40`}>Borrowed</Badge>;
    case "maintenance":
      return <Badge className={`${PILL_BASE} bg-destructive/10 text-destructive border-destructive/30`}>Maintenance</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getRequestStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge className={`${PILL_BASE} bg-primary/10 text-foreground border-primary/40`}><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "approved":
      return <Badge className={`${PILL_BASE} bg-emerald-600/10 text-emerald-700 border-emerald-600/30 dark:text-emerald-400`}><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "denied":
      return <Badge className={`${PILL_BASE} bg-destructive/10 text-destructive border-destructive/30`}><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
    case "cancelled":
      return <Badge variant="secondary"><Ban className="h-3 w-3 mr-1" />Cancelled</Badge>;
    case "completed":
      return <Badge className={`${PILL_BASE} bg-emerald-600/10 text-emerald-700 border-emerald-600/30 dark:text-emerald-400`}><Check className="h-3 w-3 mr-1" />Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getConditionBadge(condition: string) {
  switch (condition) {
    case "good":
      return <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">Good</Badge>;
    case "fair":
      return <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">Fair</Badge>;
    case "needs-repair":
      return <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:border-red-700 dark:text-red-400">Needs Repair</Badge>;
    default:
      return null;
  }
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysRemaining(expectedReturnDate: string | null | undefined) {
  if (!expectedReturnDate) return null;
  const now = new Date();
  const due = new Date(expectedReturnDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function PhotoUpload({ imageData, imageType, onImageChange, onImageRemove }: {
  imageData: string | null;
  imageType: string | null;
  onImageChange: (data: string, type: string) => void;
  onImageRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      onImageChange(base64, file.type);
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">Equipment Photo</label>
      {imageData && imageType ? (
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          <img src={`data:${imageType};base64,${imageData}`} alt="Equipment" className="w-full h-40 object-cover" />
          <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={onImageRemove} data-testid="button-remove-tool-photo">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors cursor-pointer" data-testid="button-upload-tool-photo">
          <Camera className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to add photo</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-tool-photo-file" />
    </div>
  );
}

export default function ToolLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [newToolCategory, setNewToolCategory] = useState("general");
  const [newToolLocation, setNewToolLocation] = useState("");
  const [newToolCondition, setNewToolCondition] = useState("good");
  const [newToolLendingTerms, setNewToolLendingTerms] = useState("");
  const [newToolImageData, setNewToolImageData] = useState<string | null>(null);
  const [newToolImageType, setNewToolImageType] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<EnrichedTool | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editStatus, setEditStatus] = useState("available");
  const [editLocation, setEditLocation] = useState("");
  const [editCondition, setEditCondition] = useState("good");
  const [editLendingTerms, setEditLendingTerms] = useState("");
  const [editImageData, setEditImageData] = useState<string | null>(null);
  const [editImageType, setEditImageType] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTool, setDeletingTool] = useState<EnrichedTool | null>(null);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestingTool, setRequestingTool] = useState<EnrichedTool | null>(null);
  const [requestStartDate, setRequestStartDate] = useState("");
  const [requestReturnDate, setRequestReturnDate] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<EnrichedIncomingRequest | null>(null);
  const [approveResponse, setApproveResponse] = useState("");

  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [denyingRequest, setDenyingRequest] = useState<EnrichedIncomingRequest | null>(null);
  const [denyResponse, setDenyResponse] = useState("");

  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState<EnrichedOutgoingRequest | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningToolId, setReturningToolId] = useState("");
  const [returningToolName, setReturningToolName] = useState("");
  const [returningLoanInfo, setReturningLoanInfo] = useState<{ borrowDate?: string; expectedReturnDate?: string | null }>({});
  const [returnCondition, setReturnCondition] = useState("good");
  const [returnNotes, setReturnNotes] = useState("");

  const { data: tools = [], isLoading: toolsLoading } = useQuery<EnrichedTool[]>({ queryKey: ["/api/portal/tools"] });
  const { data: myLoans = [], isLoading: loansLoading } = useQuery<EnrichedLoan[]>({ queryKey: ["/api/portal/tools/my-loans"] });
  const { data: myShared = [], isLoading: sharedLoading } = useQuery<EnrichedTool[]>({ queryKey: ["/api/portal/tools/my-shared"] });
  const { data: incomingRequests = [] } = useQuery<EnrichedIncomingRequest[]>({ queryKey: ["/api/portal/tools/requests/incoming"] });
  const { data: outgoingRequests = [] } = useQuery<EnrichedOutgoingRequest[]>({ queryKey: ["/api/portal/tools/requests/outgoing"] });

  const activeLoanToolIds = new Set(myLoans.filter((l) => l.status === "active").map((l) => l.toolId));
  const pendingIncoming = incomingRequests.filter(r => r.status === "pending");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-shared"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/requests/incoming"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/requests/outgoing"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/portal/tools", data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Equipment shared successfully" });
      setDialogOpen(false);
      setNewToolName(""); setNewToolDescription(""); setNewToolCategory("general"); setNewToolLocation(""); setNewToolCondition("good"); setNewToolLendingTerms(""); setNewToolImageData(null); setNewToolImageType(null);
    },
    onError: (error: Error) => toast({ title: "Failed to add equipment", description: error.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/portal/tools/${data.id}`, data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Equipment updated" });
      setEditDialogOpen(false); setEditingTool(null);
    },
    onError: (error: Error) => toast({ title: "Failed to update", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (toolId: string) => apiRequest("DELETE", `/api/portal/tools/${toolId}`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Equipment deleted" });
      setDeleteDialogOpen(false); setDeletingTool(null);
    },
    onError: (error: Error) => toast({ title: "Failed to delete", description: error.message, variant: "destructive" }),
  });

  const requestMutation = useMutation({
    mutationFn: (data: { toolId: string; message: string; requestedStartDate?: string; requestedReturnDate: string }) =>
      apiRequest("POST", `/api/portal/tools/${data.toolId}/request`, data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Borrow request sent!", description: "The equipment owner will review your request." });
      setRequestDialogOpen(false); setRequestingTool(null); setRequestStartDate(""); setRequestReturnDate(""); setRequestMessage("");
    },
    onError: (error: Error) => toast({ title: "Failed to send request", description: error.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (data: { id: string; ownerResponse?: string }) =>
      apiRequest("POST", `/api/portal/tools/requests/${data.id}/approve`, { ownerResponse: data.ownerResponse }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Request approved" });
      setApproveDialogOpen(false); setApprovingRequest(null); setApproveResponse("");
    },
    onError: (error: Error) => toast({ title: "Failed to approve", description: error.message, variant: "destructive" }),
  });

  const denyMutation = useMutation({
    mutationFn: (data: { id: string; ownerResponse?: string }) =>
      apiRequest("POST", `/api/portal/tools/requests/${data.id}/deny`, { ownerResponse: data.ownerResponse }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Request denied" });
      setDenyDialogOpen(false); setDenyingRequest(null); setDenyResponse("");
    },
    onError: (error: Error) => toast({ title: "Failed to deny", description: error.message, variant: "destructive" }),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/portal/tools/requests/${id}/cancel`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Request cancelled" });
    },
    onError: (error: Error) => toast({ title: "Failed to cancel", description: error.message, variant: "destructive" }),
  });

  const acceptTermsMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/portal/tools/requests/${id}/accept-terms`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Terms accepted — equipment is now yours to use!", description: "Remember to return it on time." });
      setTermsDialogOpen(false); setAcceptingRequest(null); setTermsAccepted(false);
    },
    onError: (error: Error) => toast({ title: "Failed to accept terms", description: error.message, variant: "destructive" }),
  });

  const returnMutation = useMutation({
    mutationFn: (data: { toolId: string; returnNotes?: string; condition?: string }) =>
      apiRequest("POST", `/api/portal/tools/${data.toolId}/return`, data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Equipment returned successfully" });
      setReturnDialogOpen(false); setReturningToolId(""); setReturningToolName(""); setReturnCondition("good"); setReturnNotes("");
    },
    onError: (error: Error) => toast({ title: "Failed to return", description: error.message, variant: "destructive" }),
  });

  function openRequestDialog(tool: EnrichedTool) {
    setRequestingTool(tool);
    setRequestStartDate(""); setRequestReturnDate(""); setRequestMessage("");
    setRequestDialogOpen(true);
  }

  function openReturnDialog(toolId: string, toolName: string, loanInfo?: { borrowDate?: string; expectedReturnDate?: string | null }) {
    setReturningToolId(toolId); setReturningToolName(toolName); setReturningLoanInfo(loanInfo || {});
    setReturnCondition("good"); setReturnNotes("");
    setReturnDialogOpen(true);
  }

  function openEditDialog(tool: EnrichedTool) {
    setEditingTool(tool); setEditName(tool.name); setEditDescription(tool.description || ""); setEditCategory(tool.category);
    setEditStatus(tool.status); setEditLocation(tool.location || ""); setEditCondition(tool.condition || "good");
    setEditLendingTerms(tool.lendingTerms || ""); setEditImageData(tool.imageData || null); setEditImageType(tool.imageType || null);
    setEditDialogOpen(true);
  }

  const canManageTool = (tool: EnrichedTool) => user?.isAdmin || tool.ownerId === user?.id;

  const filteredTools = tools.filter((tool) => {
    if (categoryFilter !== "all" && tool.category !== categoryFilter) return false;
    if (availabilityFilter === "available" && tool.status !== "available") return false;
    if (availabilityFilter === "borrowed" && tool.status !== "borrowed") return false;
    return true;
  });

  const activeLoans = myLoans.filter((l) => l.status === "active");
  const returnedLoans = myLoans.filter((l) => l.status === "returned");
  const activeOutgoing = outgoingRequests.filter(r => ["pending", "approved"].includes(r.status));
  const pastOutgoing = outgoingRequests.filter(r => ["denied", "cancelled", "completed"].includes(r.status));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const lentOut = myShared.filter(t => t.status === "borrowed" && t.activeLoan);
  const availableShared = myShared.filter(t => t.status === "available");
  const maintenanceShared = myShared.filter(t => t.status === "maintenance");

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <PageHeader
          eyebrow="The yard"
          title="Equipment sharing"
          titleTestId="text-tools-title"
          description="Browse, request, and share equipment with fellow members."
          actions={<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-tool"><Plus className="h-4 w-4 mr-2" />Share Equipment</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Share Equipment</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <PhotoUpload imageData={newToolImageData} imageType={newToolImageType}
                  onImageChange={(data, type) => { setNewToolImageData(data); setNewToolImageType(type); }}
                  onImageRemove={() => { setNewToolImageData(null); setNewToolImageType(null); }} />
                <Input placeholder="Equipment name (e.g. DeWalt 20V Laser Level)" value={newToolName} onChange={(e) => setNewToolName(e.target.value)} data-testid="input-tool-name" />
                <Textarea placeholder="Description — include make, model, accessories included" value={newToolDescription} onChange={(e) => setNewToolDescription(e.target.value)} data-testid="input-tool-description" />
                <Select value={newToolCategory} onValueChange={setNewToolCategory}>
                  <SelectTrigger data-testid="select-tool-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="power-tools">Power Tools</SelectItem>
                    <SelectItem value="hand-tools">Hand Tools</SelectItem>
                    <SelectItem value="safety">Safety Equipment</SelectItem>
                    <SelectItem value="measurement">Measurement</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Pickup location (e.g. NAMC Office — Oakland)" value={newToolLocation} onChange={(e) => setNewToolLocation(e.target.value)} data-testid="input-tool-location" />
                <Select value={newToolCondition} onValueChange={setNewToolCondition}>
                  <SelectTrigger data-testid="select-tool-condition"><SelectValue placeholder="Condition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs-repair">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Lending Terms <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Textarea placeholder="Set your lending terms — e.g. return clean and dry, you are responsible for any damage, maximum 2 weeks, pickup at Oakland office M-F 9-5..." value={newToolLendingTerms} onChange={(e) => setNewToolLendingTerms(e.target.value)} data-testid="input-tool-lending-terms" className="min-h-[80px]" />
                  <p className="text-xs text-muted-foreground mt-1">Borrowers must agree to these terms before picking up the equipment.</p>
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate({
                  name: newToolName, description: newToolDescription, category: newToolCategory,
                  location: newToolLocation || undefined, condition: newToolCondition,
                  lendingTerms: newToolLendingTerms || undefined, imageData: newToolImageData, imageType: newToolImageType,
                })} disabled={!newToolName.trim() || createMutation.isPending} data-testid="button-submit-tool">
                  {createMutation.isPending ? "Adding..." : "Share Equipment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>}
        />

        <Tabs defaultValue="catalog" data-testid="tabs-tools">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="catalog" data-testid="tab-catalog"><Package className="h-4 w-4 mr-2" />Catalog</TabsTrigger>
            <TabsTrigger value="my-loans" data-testid="tab-my-loans">
              <ArrowLeftRight className="h-4 w-4 mr-2" />My Loans{activeLoans.length > 0 && ` (${activeLoans.length})`}
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              <Inbox className="h-4 w-4 mr-2" />Requests{pendingIncoming.length > 0 && <Badge className="ml-1.5 h-5 min-w-5 px-1 bg-primary text-primary-foreground text-xs">{pendingIncoming.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="my-shared" data-testid="tab-my-shared"><Share2 className="h-4 w-4 mr-2" />My Equipment{myShared.length > 0 && ` (${myShared.length})`}</TabsTrigger>
          </TabsList>

          {/* ===== CATALOG TAB ===== */}
          <TabsContent value="catalog" className="mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="power-tools">Power Tools</SelectItem>
                  <SelectItem value="hand-tools">Hand Tools</SelectItem>
                  <SelectItem value="safety">Safety Equipment</SelectItem>
                  <SelectItem value="measurement">Measurement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-availability-filter"><SelectValue placeholder="Availability" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {toolsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}><CardContent className="p-0"><Skeleton className="h-40 w-full rounded-t-lg" /><div className="p-4"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-full" /></div></CardContent></Card>
                ))}
              </div>
            ) : filteredTools.length === 0 ? (
              <Card data-testid="card-no-tools">
                <CardContent className="p-8 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or share some equipment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool) => {
                  const daysRemaining = tool.activeLoan ? getDaysRemaining(tool.activeLoan.expectedReturnDate) : null;
                  const hasActiveLoan = activeLoanToolIds.has(tool.id);
                  return (
                    <Card key={tool.id} className="overflow-hidden" data-testid={`card-tool-${tool.id}`}>
                      {tool.imageData && tool.imageType ? (
                        <div className="relative">
                          <img src={`data:${tool.imageType};base64,${tool.imageData}`} alt={tool.name} className="w-full h-40 object-cover" data-testid={`img-tool-${tool.id}`} />
                          <div className="absolute top-2 right-2">{getStatusBadge(tool.status)}</div>
                        </div>
                      ) : (
                        <div className="h-28 bg-muted/50 flex items-center justify-center relative">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                          <div className="absolute top-2 right-2">{getStatusBadge(tool.status)}</div>
                        </div>
                      )}
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-base" data-testid={`text-tool-name-${tool.id}`}>{tool.name}</h3>
                          {tool.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{tool.description}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">{categoryLabels[tool.category] || tool.category}</Badge>
                          {getConditionBadge(tool.condition || "good")}
                          {tool.lendingTerms && <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400"><FileText className="h-3 w-3 mr-1" />Terms</Badge>}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {tool.ownerUsername && <div className="flex items-center gap-1.5"><User className="h-3 w-3" /><span>Shared by {tool.ownerUsername}</span></div>}
                          {tool.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /><span className="truncate">{tool.location}</span></div>}
                          {tool.status === "borrowed" && tool.activeLoan?.expectedReturnDate && (
                            <div className={`flex items-center gap-1.5 ${daysRemaining !== null && daysRemaining < 0 ? "text-red-600 dark:text-red-400 font-medium" : daysRemaining !== null && daysRemaining <= 2 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                              <CalendarDays className="h-3 w-3" />
                              <span>Available ~{formatDate(tool.activeLoan.expectedReturnDate)}{daysRemaining !== null && daysRemaining < 0 && " (overdue)"}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {tool.status === "available" && !hasActiveLoan && tool.ownerId !== user?.id && (
                            <Button size="sm" onClick={() => openRequestDialog(tool)} data-testid={`button-request-borrow-${tool.id}`}>
                              <HandshakeIcon className="h-3 w-3 mr-1" />Request to Borrow
                            </Button>
                          )}
                          {hasActiveLoan && (
                            <Button size="sm" variant="outline" onClick={() => {
                              const loan = myLoans.find(l => l.toolId === tool.id && l.status === "active");
                              openReturnDialog(tool.id, tool.name, { borrowDate: loan?.borrowDate ? String(loan.borrowDate) : undefined, expectedReturnDate: loan?.expectedReturnDate ? String(loan.expectedReturnDate) : null });
                            }} data-testid={`button-return-${tool.id}`}>
                              <Check className="h-3 w-3 mr-1" />Return
                            </Button>
                          )}
                          {tool.ownerId !== user?.id && tool.status === "borrowed" && !hasActiveLoan && (
                            <Button size="sm" variant="ghost" onClick={() => setLocation(`/portal/messages?to=${tool.ownerId}`)} data-testid={`button-contact-owner-${tool.id}`}>
                              <Send className="h-3 w-3 mr-1" />Contact Owner
                            </Button>
                          )}
                          {canManageTool(tool) && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => openEditDialog(tool)} data-testid={`button-edit-tool-${tool.id}`}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => { setDeletingTool(tool); setDeleteDialogOpen(true); }} data-testid={`button-delete-tool-${tool.id}`}><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== MY LOANS TAB ===== */}
          <TabsContent value="my-loans" className="mt-6">
            {/* Active outgoing requests */}
            {activeOutgoing.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-my-requests-heading">
                  <MessageSquare className="h-5 w-5 text-blue-500" />My Borrow Requests ({activeOutgoing.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeOutgoing.map((req) => (
                    <Card key={req.id} data-testid={`card-outgoing-request-${req.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <CardTitle className="text-base">{req.toolName}</CardTitle>
                          {getRequestStatusBadge(req.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                          {req.requestedStartDate && <p>Pickup: {formatDate(req.requestedStartDate)}</p>}
                          <p>Return by: {formatDate(req.requestedReturnDate)}</p>
                          {req.message && <p className="italic text-xs">"{req.message}"</p>}
                          {req.status === "approved" && req.ownerResponse && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                              <p className="font-medium text-green-700 dark:text-green-400">Owner says:</p>
                              <p>{req.ownerResponse}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {req.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => cancelRequestMutation.mutate(req.id)} disabled={cancelRequestMutation.isPending} data-testid={`button-cancel-request-${req.id}`}>
                              <X className="h-3 w-3 mr-1" />Cancel Request
                            </Button>
                          )}
                          {req.status === "approved" && (
                            <Button size="sm" onClick={() => {
                              setAcceptingRequest(req); setTermsAccepted(false); setTermsDialogOpen(true);
                            }} data-testid={`button-accept-terms-${req.id}`}>
                              <ClipboardCheck className="h-3 w-3 mr-1" />Accept Terms & Borrow
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Active Loans */}
            {loansLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
              </div>
            ) : activeLoans.length === 0 && activeOutgoing.length === 0 && pastOutgoing.length === 0 && returnedLoans.length === 0 ? (
              <Card data-testid="card-no-loans">
                <CardContent className="p-8 text-center">
                  <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No loans or requests yet</h3>
                  <p className="text-muted-foreground">Browse the catalog and request to borrow equipment from fellow members.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {activeLoans.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-active-loans-heading">
                      <Clock className="h-5 w-5 text-primary" />Active Loans ({activeLoans.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {activeLoans.map((loan) => {
                        const daysRemaining = getDaysRemaining(loan.expectedReturnDate ? String(loan.expectedReturnDate) : null);
                        const isOverdue = daysRemaining !== null && daysRemaining < 0;
                        const isDueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 2;
                        return (
                          <Card key={loan.id} className={isOverdue ? "border-red-300 dark:border-red-700" : ""} data-testid={`card-loan-${loan.id}`}>
                            <CardHeader className="pb-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <CardTitle className="text-base">{loan.toolName || "Unknown"}</CardTitle>
                                {isOverdue ? <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>
                                  : isDueSoon ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Due Soon</Badge>
                                  : <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                                <p>Borrowed: {formatDate(loan.borrowDate)}</p>
                                {loan.expectedReturnDate && (
                                  <p className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                                    Due: {formatDate(loan.expectedReturnDate)}
                                    {daysRemaining !== null && <span className="ml-1">({isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`})</span>}
                                  </p>
                                )}
                              </div>
                              <Button size="sm" onClick={() => openReturnDialog(loan.toolId, loan.toolName || "Unknown", { borrowDate: String(loan.borrowDate), expectedReturnDate: loan.expectedReturnDate ? String(loan.expectedReturnDate) : null })} data-testid={`button-return-loan-${loan.id}`}>
                                <Check className="h-3 w-3 mr-1" />Return Equipment
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past outgoing requests */}
                {pastOutgoing.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Requests</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pastOutgoing.map((req) => (
                        <Card key={req.id} className="opacity-75" data-testid={`card-past-request-${req.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{req.toolName}</CardTitle>
                              {getRequestStatusBadge(req.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Requested: {formatDate(req.createdAt)}</p>
                              {req.ownerResponse && <p className="text-xs italic">Owner: "{req.ownerResponse}"</p>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {returnedLoans.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Loan History</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {returnedLoans.map((loan) => (
                        <Card key={loan.id} className="opacity-75" data-testid={`card-loan-${loan.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{loan.toolName || "Unknown"}</CardTitle>
                              <Badge variant="secondary">Returned</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Borrowed: {formatDate(loan.borrowDate)}</p>
                              {loan.returnDate && <p>Returned: {formatDate(loan.returnDate)}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ===== REQUESTS TAB (Owner incoming) ===== */}
          <TabsContent value="requests" className="mt-6">
            {incomingRequests.length === 0 ? (
              <Card data-testid="card-no-incoming-requests">
                <CardContent className="p-8 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No borrow requests</h3>
                  <p className="text-muted-foreground">When someone requests to borrow your equipment, it will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {pendingIncoming.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-pending-requests-heading">
                      <Clock className="h-5 w-5 text-blue-500" />Pending Requests ({pendingIncoming.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pendingIncoming.map((req) => (
                        <Card key={req.id} className="border-blue-200 dark:border-blue-800" data-testid={`card-incoming-request-${req.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{req.toolName}</CardTitle>
                              {getRequestStatusBadge("pending")}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1.5"><User className="h-3 w-3" /><span className="font-medium text-foreground">{req.requesterUsername}</span></div>
                              {req.requestedStartDate && <p>Pickup: {formatDate(req.requestedStartDate)}</p>}
                              <p>Return by: {formatDate(req.requestedReturnDate)}</p>
                              {req.message && (
                                <div className="bg-muted/50 p-2 rounded text-xs">
                                  <p className="font-medium mb-0.5">Message:</p>
                                  <p>{req.message}</p>
                                </div>
                              )}
                              <p className="text-xs">Requested: {formatDate(req.createdAt)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => { setApprovingRequest(req); setApproveResponse(""); setApproveDialogOpen(true); }} data-testid={`button-approve-request-${req.id}`}>
                                <CheckCircle className="h-3 w-3 mr-1" />Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setDenyingRequest(req); setDenyResponse(""); setDenyDialogOpen(true); }} data-testid={`button-deny-request-${req.id}`}>
                                <XCircle className="h-3 w-3 mr-1" />Deny
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setLocation(`/portal/messages?to=${req.requesterId}`)} data-testid={`button-message-requester-${req.id}`}>
                                <Send className="h-3 w-3 mr-1" />Message
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {incomingRequests.filter(r => r.status !== "pending").length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past Requests</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {incomingRequests.filter(r => r.status !== "pending").map((req) => (
                        <Card key={req.id} className="opacity-75" data-testid={`card-past-incoming-${req.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{req.toolName}</CardTitle>
                              {getRequestStatusBadge(req.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>From: {req.requesterUsername}</p>
                              <p>{formatDate(req.createdAt)}</p>
                              {req.ownerResponse && <p className="text-xs italic">Your response: "{req.ownerResponse}"</p>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ===== MY EQUIPMENT TAB ===== */}
          <TabsContent value="my-shared" className="mt-6">
            {sharedLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
              </div>
            ) : myShared.length === 0 ? (
              <Card data-testid="card-no-shared">
                <CardContent className="p-8 text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No equipment shared yet</h3>
                  <p className="text-muted-foreground mb-4">Share your equipment with fellow NAMC members.</p>
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-share-first-tool"><Plus className="h-4 w-4 mr-2" />Share Equipment</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {lentOut.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Currently Lent Out ({lentOut.length})</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {lentOut.map((tool) => {
                        const daysRemaining = tool.activeLoan?.expectedReturnDate ? getDaysRemaining(tool.activeLoan.expectedReturnDate) : null;
                        const isOverdue = daysRemaining !== null && daysRemaining < 0;
                        return (
                          <Card key={tool.id} className={isOverdue ? "border-red-300 dark:border-red-700" : "border-amber-200 dark:border-amber-800"} data-testid={`card-shared-${tool.id}`}>
                            {tool.imageData && tool.imageType && <img src={`data:${tool.imageType};base64,${tool.imageData}`} alt={tool.name} className="w-full h-32 object-cover rounded-t-lg" />}
                            <CardHeader className="pb-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <CardTitle className="text-base">{tool.name}</CardTitle>
                                {isOverdue ? <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge> : <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Lent Out</Badge>}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1.5"><User className="h-3 w-3" /><span>Borrowed by <span className="font-medium text-foreground">{tool.activeLoan?.borrowerUsername}</span></span></div>
                                <div className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /><span>Since {formatDate(tool.activeLoan?.borrowDate || "")}</span></div>
                                {tool.activeLoan?.expectedReturnDate && (
                                  <div className={`flex items-center gap-1.5 ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
                                    <Clock className="h-3 w-3" /><span>Due back {formatDate(tool.activeLoan.expectedReturnDate)}{isOverdue && ` (${Math.abs(daysRemaining!)} days overdue)`}</span>
                                  </div>
                                )}
                              </div>
                              <Button size="sm" variant="outline" onClick={() => setLocation(`/portal/messages?to=${tool.activeLoan?.borrowerId}`)} data-testid={`button-message-borrower-${tool.id}`}>
                                <Send className="h-3 w-3 mr-1" />Message Borrower
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableShared.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Check className="h-5 w-5 text-green-600" />Available ({availableShared.length})</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {availableShared.map((tool) => (
                        <Card key={tool.id} data-testid={`card-shared-${tool.id}`}>
                          {tool.imageData && tool.imageType && <img src={`data:${tool.imageType};base64,${tool.imageData}`} alt={tool.name} className="w-full h-32 object-cover rounded-t-lg" />}
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{tool.name}</CardTitle>
                              {getConditionBadge(tool.condition || "good")}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-xs text-muted-foreground mb-3">
                              {tool.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /><span>{tool.location}</span></div>}
                              {tool.lendingTerms && <div className="flex items-center gap-1.5"><FileText className="h-3 w-3" /><span>Lending terms set</span></div>}
                              <Badge variant="outline" className="text-xs">{categoryLabels[tool.category] || tool.category}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditDialog(tool)} data-testid={`button-edit-shared-${tool.id}`}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => { setDeletingTool(tool); setDeleteDialogOpen(true); }} data-testid={`button-delete-shared-${tool.id}`}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {maintenanceShared.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Under Maintenance ({maintenanceShared.length})</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {maintenanceShared.map((tool) => (
                        <Card key={tool.id} className="opacity-75" data-testid={`card-shared-${tool.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{tool.name}</CardTitle>
                              {getStatusBadge("maintenance")}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(tool)}><Pencil className="h-4 w-4" /></Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== REQUEST TO BORROW DIALOG ===== */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Request to Borrow</DialogTitle></DialogHeader>
          {requestingTool && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border overflow-hidden">
                {requestingTool.imageData && requestingTool.imageType && (
                  <img src={`data:${requestingTool.imageType};base64,${requestingTool.imageData}`} alt={requestingTool.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4 bg-muted/50">
                  <p className="font-medium">{requestingTool.name}</p>
                  {requestingTool.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{requestingTool.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getConditionBadge(requestingTool.condition || "good")}
                    {requestingTool.ownerUsername && <span className="text-xs text-muted-foreground">Shared by {requestingTool.ownerUsername}</span>}
                  </div>
                  {requestingTool.location && <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-3 w-3" />Pickup: {requestingTool.location}</p>}
                </div>
              </div>

              {requestingTool.lendingTerms && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300">
                    <FileText className="h-4 w-4" />Lending Terms
                  </h4>
                  <p className="text-sm whitespace-pre-wrap text-blue-700 dark:text-blue-400" data-testid="text-lending-terms-preview">{requestingTool.lendingTerms}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">You will need to accept these terms if the owner approves your request.</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Requested Pickup Date <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input type="date" value={requestStartDate} min={minDate} onChange={(e) => setRequestStartDate(e.target.value)} data-testid="input-request-start-date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Expected Return Date *</label>
                <Input type="date" value={requestReturnDate} min={requestStartDate || minDate} onChange={(e) => setRequestReturnDate(e.target.value)} data-testid="input-request-return-date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message to Owner *</label>
                <Textarea placeholder="Introduce yourself and explain what you need the equipment for, when you'll pick it up, etc." value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} data-testid="input-request-message" className="min-h-[80px]" />
              </div>
              <Button className="w-full" onClick={() => requestMutation.mutate({
                toolId: requestingTool.id, message: requestMessage,
                requestedStartDate: requestStartDate || undefined, requestedReturnDate: requestReturnDate,
              })} disabled={!requestReturnDate || !requestMessage.trim() || requestMutation.isPending} data-testid="button-submit-request">
                {requestMutation.isPending ? "Sending..." : "Send Borrow Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== APPROVE REQUEST DIALOG ===== */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Borrow Request</DialogTitle></DialogHeader>
          {approvingRequest && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="font-medium">{approvingRequest.toolName}</p>
                <p className="text-sm text-muted-foreground">Requested by: <span className="font-medium text-foreground">{approvingRequest.requesterUsername}</span></p>
                {approvingRequest.requestedStartDate && <p className="text-sm text-muted-foreground">Pickup: {formatDate(approvingRequest.requestedStartDate)}</p>}
                <p className="text-sm text-muted-foreground">Return: {formatDate(approvingRequest.requestedReturnDate)}</p>
                {approvingRequest.message && <p className="text-xs italic mt-2">"{approvingRequest.message}"</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Response Message <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea placeholder="e.g. Approved! You can pick it up Tuesday after 3pm. Ask for me at the front desk." value={approveResponse} onChange={(e) => setApproveResponse(e.target.value)} data-testid="input-approve-response" />
              </div>
              <Button className="w-full" onClick={() => approveMutation.mutate({ id: approvingRequest.id, ownerResponse: approveResponse })} disabled={approveMutation.isPending} data-testid="button-confirm-approve">
                {approveMutation.isPending ? "Approving..." : "Approve Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DENY REQUEST DIALOG ===== */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deny Borrow Request</DialogTitle></DialogHeader>
          {denyingRequest && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="font-medium">{denyingRequest.toolName}</p>
                <p className="text-sm text-muted-foreground">Requested by: {denyingRequest.requesterUsername}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Reason <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea placeholder="e.g. Sorry, the equipment is reserved for a job next week. Try again after March 15th." value={denyResponse} onChange={(e) => setDenyResponse(e.target.value)} data-testid="input-deny-response" />
              </div>
              <Button className="w-full" variant="destructive" onClick={() => denyMutation.mutate({ id: denyingRequest.id, ownerResponse: denyResponse })} disabled={denyMutation.isPending} data-testid="button-confirm-deny">
                {denyMutation.isPending ? "Denying..." : "Deny Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== ACCEPT TERMS DIALOG ===== */}
      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Accept Terms & Borrow</DialogTitle></DialogHeader>
          {acceptingRequest && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="font-medium">{acceptingRequest.toolName}</p>
                {acceptingRequest.requestedStartDate && <p className="text-sm text-muted-foreground">Pickup: {formatDate(acceptingRequest.requestedStartDate)}</p>}
                <p className="text-sm text-muted-foreground">Return by: {formatDate(acceptingRequest.requestedReturnDate)}</p>
                {acceptingRequest.ownerResponse && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs mt-2">
                    <p className="font-medium text-green-700 dark:text-green-400">Owner says:</p>
                    <p>{acceptingRequest.ownerResponse}</p>
                  </div>
                )}
              </div>

              {acceptingRequest.toolLendingTerms ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-300">
                      <FileText className="h-4 w-4" />Lending Agreement
                    </h4>
                    <div className="max-h-48 overflow-y-auto text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border" data-testid="text-lending-terms-full">
                      {acceptingRequest.toolLendingTerms}
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="accept-terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked === true)} data-testid="checkbox-accept-terms" />
                    <label htmlFor="accept-terms" className="text-sm leading-tight cursor-pointer">
                      I have read and agree to the lending terms above. I understand my responsibilities as a borrower.
                    </label>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">No specific lending terms for this equipment. By borrowing, you agree to return it on time and in the condition you received it.</p>
                </div>
              )}

              <Button className="w-full" onClick={() => acceptTermsMutation.mutate(acceptingRequest.id)}
                disabled={acceptTermsMutation.isPending || (!!acceptingRequest.toolLendingTerms && !termsAccepted)}
                data-testid="button-confirm-accept-terms">
                {acceptTermsMutation.isPending ? "Processing..." : "Confirm & Borrow Equipment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== RETURN DIALOG ===== */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return Equipment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="font-medium">{returningToolName}</p>
              {returningLoanInfo.borrowDate && <p className="text-sm text-muted-foreground">Borrowed: {formatDate(returningLoanInfo.borrowDate)}</p>}
              {returningLoanInfo.expectedReturnDate && <p className="text-sm text-muted-foreground">Due: {formatDate(returningLoanInfo.expectedReturnDate)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Condition</label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger data-testid="select-return-condition"><SelectValue placeholder="How is the equipment?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good — ready for next borrower</SelectItem>
                  <SelectItem value="fair">Fair — minor wear</SelectItem>
                  <SelectItem value="needs-repair">Needs Repair — has an issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Return Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea placeholder="e.g. Blade slightly worn, battery at 50%" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} data-testid="input-return-notes" />
            </div>
            <Button className="w-full" onClick={() => returnMutation.mutate({ toolId: returningToolId, returnNotes, condition: returnCondition })} disabled={returnMutation.isPending} data-testid="button-confirm-return">
              {returnMutation.isPending ? "Processing..." : "Confirm Return"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <PhotoUpload imageData={editImageData} imageType={editImageType}
              onImageChange={(data, type) => { setEditImageData(data); setEditImageType(type); }}
              onImageRemove={() => { setEditImageData(null); setEditImageType(null); }} />
            <Input placeholder="Equipment name" value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-tool-name" />
            <Textarea placeholder="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} data-testid="input-edit-tool-description" />
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger data-testid="select-edit-tool-category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="power-tools">Power Tools</SelectItem>
                <SelectItem value="hand-tools">Hand Tools</SelectItem>
                <SelectItem value="safety">Safety Equipment</SelectItem>
                <SelectItem value="measurement">Measurement</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Pickup location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} data-testid="input-edit-tool-location" />
            <Select value={editCondition} onValueChange={setEditCondition}>
              <SelectTrigger data-testid="select-edit-tool-condition"><SelectValue placeholder="Condition" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="needs-repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger data-testid="select-edit-tool-status"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lending Terms <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea placeholder="Set your lending terms..." value={editLendingTerms} onChange={(e) => setEditLendingTerms(e.target.value)} data-testid="input-edit-tool-lending-terms" className="min-h-[80px]" />
              <p className="text-xs text-muted-foreground mt-1">Borrowers must agree to these terms before the loan starts.</p>
            </div>
            <Button className="w-full" onClick={() => editingTool && editMutation.mutate({
              id: editingTool.id, name: editName, description: editDescription, category: editCategory, status: editStatus,
              location: editLocation, condition: editCondition, lendingTerms: editLendingTerms, imageData: editImageData, imageType: editImageType,
            })} disabled={!editName.trim() || editMutation.isPending} data-testid="button-submit-edit-tool">
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DIALOG ===== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deletingTool?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-tool">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTool && deleteMutation.mutate(deletingTool.id)} data-testid="button-confirm-delete-tool">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
