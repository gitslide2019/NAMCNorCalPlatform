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
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Tool, ToolLoan } from "@shared/schema";

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

const categoryLabels: Record<string, string> = {
  general: "General",
  "power-tools": "Power Tools",
  "hand-tools": "Hand Tools",
  safety: "Safety Equipment",
  measurement: "Measurement",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "available":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Available
        </Badge>
      );
    case "borrowed":
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Borrowed
        </Badge>
      );
    case "maintenance":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Maintenance
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
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
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
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
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
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
          <img
            src={`data:${imageType};base64,${imageData}`}
            alt="Equipment"
            className="w-full h-40 object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={onImageRemove}
            data-testid="button-remove-tool-photo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/50 transition-colors cursor-pointer"
          data-testid="button-upload-tool-photo"
        >
          <Camera className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to add photo</span>
          <span className="text-xs text-muted-foreground">Shows condition to borrowers</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-tool-photo-file"
      />
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
  const [editImageData, setEditImageData] = useState<string | null>(null);
  const [editImageType, setEditImageType] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTool, setDeletingTool] = useState<EnrichedTool | null>(null);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [borrowingTool, setBorrowingTool] = useState<EnrichedTool | null>(null);
  const [borrowReturnDate, setBorrowReturnDate] = useState("");
  const [borrowNotes, setBorrowNotes] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningToolId, setReturningToolId] = useState("");
  const [returningToolName, setReturningToolName] = useState("");
  const [returningLoanInfo, setReturningLoanInfo] = useState<{ borrowDate?: string; expectedReturnDate?: string | null }>({});
  const [returnCondition, setReturnCondition] = useState("good");
  const [returnNotes, setReturnNotes] = useState("");

  const { data: tools = [], isLoading: toolsLoading } = useQuery<EnrichedTool[]>({
    queryKey: ["/api/portal/tools"],
  });

  const { data: myLoans = [], isLoading: loansLoading } = useQuery<EnrichedLoan[]>({
    queryKey: ["/api/portal/tools/my-loans"],
  });

  const { data: myShared = [], isLoading: sharedLoading } = useQuery<EnrichedTool[]>({
    queryKey: ["/api/portal/tools/my-shared"],
  });

  const activeLoanToolIds = new Set(
    myLoans.filter((l) => l.status === "active").map((l) => l.toolId)
  );

  const borrowMutation = useMutation({
    mutationFn: (data: { toolId: string; expectedReturnDate: string; notes?: string }) =>
      apiRequest("POST", `/api/portal/tools/${data.toolId}/borrow`, {
        expectedReturnDate: data.expectedReturnDate,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-shared"] });
      const returnDateStr = borrowReturnDate ? formatDate(borrowReturnDate) : "";
      toast({ title: "Equipment borrowed", description: returnDateStr ? `Return by ${returnDateStr}` : undefined });
      setBorrowDialogOpen(false);
      setBorrowingTool(null);
      setBorrowReturnDate("");
      setBorrowNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to borrow", description: error.message, variant: "destructive" });
    },
  });

  const returnMutation = useMutation({
    mutationFn: (data: { toolId: string; returnNotes?: string; condition?: string }) =>
      apiRequest("POST", `/api/portal/tools/${data.toolId}/return`, {
        returnNotes: data.returnNotes || undefined,
        condition: data.condition || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-shared"] });
      toast({ title: "Equipment returned successfully" });
      setReturnDialogOpen(false);
      setReturningToolId("");
      setReturningToolName("");
      setReturnCondition("good");
      setReturnNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to return", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; category: string; location?: string; condition?: string; imageData?: string | null; imageType?: string | null }) =>
      apiRequest("POST", "/api/portal/tools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-shared"] });
      toast({ title: "Equipment added successfully" });
      setDialogOpen(false);
      setNewToolName("");
      setNewToolDescription("");
      setNewToolCategory("general");
      setNewToolLocation("");
      setNewToolCondition("good");
      setNewToolImageData(null);
      setNewToolImageType(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add equipment", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; name: string; description: string; category: string; status: string; location?: string; condition?: string; imageData?: string | null; imageType?: string | null }) =>
      apiRequest("PATCH", `/api/portal/tools/${data.id}`, {
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
        location: data.location,
        condition: data.condition,
        imageData: data.imageData,
        imageType: data.imageType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-shared"] });
      toast({ title: "Equipment updated successfully" });
      setEditDialogOpen(false);
      setEditingTool(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (toolId: string) =>
      apiRequest("DELETE", `/api/portal/tools/${toolId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-shared"] });
      toast({ title: "Equipment deleted" });
      setDeleteDialogOpen(false);
      setDeletingTool(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  function openBorrowDialog(tool: EnrichedTool) {
    setBorrowingTool(tool);
    setBorrowReturnDate("");
    setBorrowNotes("");
    setBorrowDialogOpen(true);
  }

  function openReturnDialog(toolId: string, toolName: string, loanInfo?: { borrowDate?: string; expectedReturnDate?: string | null }) {
    setReturningToolId(toolId);
    setReturningToolName(toolName);
    setReturningLoanInfo(loanInfo || {});
    setReturnCondition("good");
    setReturnNotes("");
    setReturnDialogOpen(true);
  }

  function openEditDialog(tool: EnrichedTool) {
    setEditingTool(tool);
    setEditName(tool.name);
    setEditDescription(tool.description || "");
    setEditCategory(tool.category);
    setEditStatus(tool.status);
    setEditLocation(tool.location || "");
    setEditCondition(tool.condition || "good");
    setEditImageData(tool.imageData || null);
    setEditImageType(tool.imageType || null);
    setEditDialogOpen(true);
  }

  function openDeleteDialog(tool: EnrichedTool) {
    setDeletingTool(tool);
    setDeleteDialogOpen(true);
  }

  const canManageTool = (tool: EnrichedTool) => {
    return user?.isAdmin || tool.ownerId === user?.id;
  };

  const filteredTools = tools.filter((tool) => {
    if (categoryFilter !== "all" && tool.category !== categoryFilter) return false;
    if (availabilityFilter === "available" && tool.status !== "available") return false;
    if (availabilityFilter === "borrowed" && tool.status !== "borrowed") return false;
    return true;
  });

  const activeLoans = myLoans.filter((l) => l.status === "active");
  const returnedLoans = myLoans.filter((l) => l.status === "returned");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const lentOut = myShared.filter(t => t.status === "borrowed" && t.activeLoan);
  const availableShared = myShared.filter(t => t.status === "available");
  const maintenanceShared = myShared.filter(t => t.status === "maintenance");

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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-tools-title">
              Equipment Sharing
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse, borrow, and share equipment with fellow members.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-tool">
                <Plus className="h-4 w-4 mr-2" />
                Share Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Share Equipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <PhotoUpload
                  imageData={newToolImageData}
                  imageType={newToolImageType}
                  onImageChange={(data, type) => { setNewToolImageData(data); setNewToolImageType(type); }}
                  onImageRemove={() => { setNewToolImageData(null); setNewToolImageType(null); }}
                />
                <Input
                  placeholder="Equipment name (e.g. DeWalt 20V Laser Level)"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  data-testid="input-tool-name"
                />
                <Textarea
                  placeholder="Description — include make, model, accessories included, and what it's best for"
                  value={newToolDescription}
                  onChange={(e) => setNewToolDescription(e.target.value)}
                  data-testid="input-tool-description"
                />
                <Select value={newToolCategory} onValueChange={setNewToolCategory}>
                  <SelectTrigger data-testid="select-tool-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="power-tools">Power Tools</SelectItem>
                    <SelectItem value="hand-tools">Hand Tools</SelectItem>
                    <SelectItem value="safety">Safety Equipment</SelectItem>
                    <SelectItem value="measurement">Measurement</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Pickup location (e.g. NAMC Office — Oakland)"
                  value={newToolLocation}
                  onChange={(e) => setNewToolLocation(e.target.value)}
                  data-testid="input-tool-location"
                />
                <Select value={newToolCondition} onValueChange={setNewToolCondition}>
                  <SelectTrigger data-testid="select-tool-condition">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs-repair">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={() =>
                    createMutation.mutate({
                      name: newToolName,
                      description: newToolDescription,
                      category: newToolCategory,
                      location: newToolLocation || undefined,
                      condition: newToolCondition,
                      imageData: newToolImageData,
                      imageType: newToolImageType,
                    })
                  }
                  disabled={!newToolName.trim() || createMutation.isPending}
                  data-testid="button-submit-tool"
                >
                  {createMutation.isPending ? "Adding..." : "Share Equipment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="catalog" data-testid="tabs-tools">
          <TabsList>
            <TabsTrigger value="catalog" data-testid="tab-catalog">
              <Package className="h-4 w-4 mr-2" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="my-loans" data-testid="tab-my-loans">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              My Loans{activeLoans.length > 0 && ` (${activeLoans.length})`}
            </TabsTrigger>
            <TabsTrigger value="my-shared" data-testid="tab-my-shared">
              <Share2 className="h-4 w-4 mr-2" />
              My Equipment{myShared.length > 0 && ` (${myShared.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
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
                <SelectTrigger className="w-[160px]" data-testid="select-availability-filter">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
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
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="h-40 w-full rounded-t-lg" />
                      <div className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTools.length === 0 ? (
              <Card data-testid="card-no-tools">
                <CardContent className="p-8 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or share some equipment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool) => {
                  const daysRemaining = tool.activeLoan ? getDaysRemaining(tool.activeLoan.expectedReturnDate) : null;
                  return (
                    <Card key={tool.id} className="overflow-hidden" data-testid={`card-tool-${tool.id}`}>
                      {tool.imageData && tool.imageType ? (
                        <div className="relative">
                          <img
                            src={`data:${tool.imageType};base64,${tool.imageData}`}
                            alt={tool.name}
                            className="w-full h-40 object-cover"
                            data-testid={`img-tool-${tool.id}`}
                          />
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(tool.status)}
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 bg-muted/50 flex items-center justify-center relative">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(tool.status)}
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-base" data-testid={`text-tool-name-${tool.id}`}>{tool.name}</h3>
                          {tool.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {tool.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[tool.category] || tool.category}
                          </Badge>
                          {getConditionBadge(tool.condition || "good")}
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          {tool.ownerUsername && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3" />
                              <span>Shared by {tool.ownerUsername}</span>
                            </div>
                          )}
                          {tool.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{tool.location}</span>
                            </div>
                          )}
                          {tool.status === "borrowed" && tool.activeLoan?.expectedReturnDate && (
                            <div className={`flex items-center gap-1.5 ${daysRemaining !== null && daysRemaining < 0 ? "text-red-600 dark:text-red-400 font-medium" : daysRemaining !== null && daysRemaining <= 2 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                              <CalendarDays className="h-3 w-3" />
                              <span>
                                Due back {formatDate(tool.activeLoan.expectedReturnDate)}
                                {daysRemaining !== null && daysRemaining < 0 && " (overdue)"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {tool.status === "available" && !activeLoanToolIds.has(tool.id) && tool.ownerId !== user?.id && (
                            <Button
                              size="sm"
                              onClick={() => openBorrowDialog(tool)}
                              data-testid={`button-borrow-${tool.id}`}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Borrow
                            </Button>
                          )}
                          {activeLoanToolIds.has(tool.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const loan = myLoans.find(l => l.toolId === tool.id && l.status === "active");
                                openReturnDialog(tool.id, tool.name, {
                                  borrowDate: loan?.borrowDate ? String(loan.borrowDate) : undefined,
                                  expectedReturnDate: loan?.expectedReturnDate ? String(loan.expectedReturnDate) : null,
                                });
                              }}
                              data-testid={`button-return-${tool.id}`}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Return
                            </Button>
                          )}
                          {tool.ownerId !== user?.id && tool.status === "borrowed" && !activeLoanToolIds.has(tool.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const ownerUser = tools.find(t => t.ownerId)?.ownerUsername;
                                setLocation(`/portal/messages?to=${tool.ownerId}`);
                              }}
                              data-testid={`button-contact-owner-${tool.id}`}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Contact Owner
                            </Button>
                          )}
                          {canManageTool(tool) && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(tool)}
                                data-testid={`button-edit-tool-${tool.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDeleteDialog(tool)}
                                data-testid={`button-delete-tool-${tool.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          <TabsContent value="my-loans" className="mt-6">
            {loansLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myLoans.length === 0 ? (
              <Card data-testid="card-no-loans">
                <CardContent className="p-8 text-center">
                  <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No loans yet</h3>
                  <p className="text-muted-foreground">
                    Browse the equipment catalog to borrow tools and equipment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {activeLoans.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-active-loans-heading">
                      <Clock className="h-5 w-5 text-primary" />
                      Active Loans ({activeLoans.length})
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
                                <CardTitle className="text-base">
                                  {loan.toolName || "Unknown"}
                                </CardTitle>
                                {isOverdue ? (
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Overdue
                                  </Badge>
                                ) : isDueSoon ? (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Due Soon
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                                <p data-testid={`text-borrow-date-${loan.id}`}>
                                  Borrowed: {formatDate(loan.borrowDate)}
                                </p>
                                {loan.expectedReturnDate && (
                                  <p className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""} data-testid={`text-due-date-${loan.id}`}>
                                    Due: {formatDate(loan.expectedReturnDate)}
                                    {daysRemaining !== null && (
                                      <span className="ml-1">
                                        ({isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`})
                                      </span>
                                    )}
                                  </p>
                                )}
                                {loan.notes && (
                                  <p className="text-xs italic">"{loan.notes}"</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  openReturnDialog(loan.toolId, loan.toolName || "Unknown", {
                                    borrowDate: String(loan.borrowDate),
                                    expectedReturnDate: loan.expectedReturnDate ? String(loan.expectedReturnDate) : null,
                                  })
                                }
                                data-testid={`button-return-loan-${loan.id}`}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Return Equipment
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {returnedLoans.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground" data-testid="text-loan-history-heading">
                      Loan History
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {returnedLoans.map((loan) => (
                        <Card key={loan.id} className="opacity-75" data-testid={`card-loan-${loan.id}`}>
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">
                                {loan.toolName || "Unknown"}
                              </CardTitle>
                              <Badge variant="secondary">Returned</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Borrowed: {formatDate(loan.borrowDate)}</p>
                              {loan.returnDate && (
                                <p>Returned: {formatDate(loan.returnDate)}</p>
                              )}
                              {loan.returnNotes && (
                                <p className="text-xs italic mt-1">"{loan.returnNotes}"</p>
                              )}
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

          <TabsContent value="my-shared" className="mt-6">
            {sharedLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myShared.length === 0 ? (
              <Card data-testid="card-no-shared">
                <CardContent className="p-8 text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No equipment shared yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Share your equipment with fellow NAMC members.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-share-first-tool">
                    <Plus className="h-4 w-4 mr-2" />
                    Share Equipment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {lentOut.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-lent-out-heading">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Currently Lent Out ({lentOut.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {lentOut.map((tool) => {
                        const daysRemaining = tool.activeLoan?.expectedReturnDate ? getDaysRemaining(tool.activeLoan.expectedReturnDate) : null;
                        const isOverdue = daysRemaining !== null && daysRemaining < 0;
                        return (
                          <Card key={tool.id} className={isOverdue ? "border-red-300 dark:border-red-700" : "border-amber-200 dark:border-amber-800"} data-testid={`card-shared-${tool.id}`}>
                            {tool.imageData && tool.imageType && (
                              <img src={`data:${tool.imageType};base64,${tool.imageData}`} alt={tool.name} className="w-full h-32 object-cover rounded-t-lg" />
                            )}
                            <CardHeader className="pb-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <CardTitle className="text-base">{tool.name}</CardTitle>
                                {isOverdue ? (
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertTriangle className="h-3 w-3 mr-1" />Overdue
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Lent Out
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3" />
                                  <span>Borrowed by <span className="font-medium text-foreground">{tool.activeLoan?.borrowerUsername}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <CalendarDays className="h-3 w-3" />
                                  <span>Since {formatDate(tool.activeLoan?.borrowDate || "")}</span>
                                </div>
                                {tool.activeLoan?.expectedReturnDate && (
                                  <div className={`flex items-center gap-1.5 ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      Due back {formatDate(tool.activeLoan.expectedReturnDate)}
                                      {isOverdue && ` (${Math.abs(daysRemaining!)} days overdue)`}
                                    </span>
                                  </div>
                                )}
                                {tool.activeLoan?.notes && (
                                  <p className="text-xs italic mt-1">"{tool.activeLoan.notes}"</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLocation(`/portal/messages?to=${tool.activeLoan?.borrowerId}`)}
                                data-testid={`button-message-borrower-${tool.id}`}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Message Borrower
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
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" data-testid="text-available-shared-heading">
                      <Check className="h-5 w-5 text-green-600" />
                      Available ({availableShared.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {availableShared.map((tool) => (
                        <Card key={tool.id} data-testid={`card-shared-${tool.id}`}>
                          {tool.imageData && tool.imageType && (
                            <img src={`data:${tool.imageType};base64,${tool.imageData}`} alt={tool.name} className="w-full h-32 object-cover rounded-t-lg" />
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <CardTitle className="text-base">{tool.name}</CardTitle>
                              {getConditionBadge(tool.condition || "good")}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1 text-xs text-muted-foreground mb-3">
                              {tool.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3 w-3" /><span>{tool.location}</span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">{categoryLabels[tool.category] || tool.category}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditDialog(tool)} data-testid={`button-edit-shared-${tool.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(tool)} data-testid={`button-delete-shared-${tool.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {maintenanceShared.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground" data-testid="text-maintenance-heading">
                      Under Maintenance ({maintenanceShared.length})
                    </h2>
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
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(tool)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
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

      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrow Equipment</DialogTitle>
          </DialogHeader>
          {borrowingTool && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border overflow-hidden">
                {borrowingTool.imageData && borrowingTool.imageType ? (
                  <img
                    src={`data:${borrowingTool.imageType};base64,${borrowingTool.imageData}`}
                    alt={borrowingTool.name}
                    className="w-full h-40 object-cover"
                    data-testid="img-borrow-tool-photo"
                  />
                ) : null}
                <div className="p-4 bg-muted/50">
                  <p className="font-medium">{borrowingTool.name}</p>
                  {borrowingTool.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{borrowingTool.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getConditionBadge(borrowingTool.condition || "good")}
                    {borrowingTool.ownerUsername && (
                      <span className="text-xs text-muted-foreground">Shared by {borrowingTool.ownerUsername}</span>
                    )}
                  </div>
                  {borrowingTool.location && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Pickup: {borrowingTool.location}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Expected Return Date *</label>
                <Input
                  type="date"
                  value={borrowReturnDate}
                  min={minDate}
                  onChange={(e) => setBorrowReturnDate(e.target.value)}
                  data-testid="input-borrow-return-date"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Pickup Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  placeholder="e.g. I'll pick up Tuesday after 3pm"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  data-testid="input-borrow-notes"
                />
              </div>

              <Button
                className="w-full"
                onClick={() =>
                  borrowMutation.mutate({
                    toolId: borrowingTool.id,
                    expectedReturnDate: borrowReturnDate,
                    notes: borrowNotes,
                  })
                }
                disabled={!borrowReturnDate || borrowMutation.isPending}
                data-testid="button-confirm-borrow"
              >
                {borrowMutation.isPending ? "Processing..." : "Confirm Borrow"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="font-medium">{returningToolName}</p>
              {returningLoanInfo.borrowDate && (
                <p className="text-sm text-muted-foreground">
                  Borrowed: {formatDate(returningLoanInfo.borrowDate)}
                </p>
              )}
              {returningLoanInfo.expectedReturnDate && (
                <p className="text-sm text-muted-foreground">
                  Due: {formatDate(returningLoanInfo.expectedReturnDate)}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Condition</label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger data-testid="select-return-condition">
                  <SelectValue placeholder="How is the equipment?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good — ready for next borrower</SelectItem>
                  <SelectItem value="fair">Fair — minor wear</SelectItem>
                  <SelectItem value="needs-repair">Needs Repair — has an issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Return Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea
                placeholder="e.g. Blade slightly worn, battery at 50%"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                data-testid="input-return-notes"
              />
            </div>

            <Button
              className="w-full"
              onClick={() =>
                returnMutation.mutate({
                  toolId: returningToolId,
                  returnNotes: returnNotes,
                  condition: returnCondition,
                })
              }
              disabled={returnMutation.isPending}
              data-testid="button-confirm-return"
            >
              {returnMutation.isPending ? "Processing..." : "Confirm Return"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <PhotoUpload
              imageData={editImageData}
              imageType={editImageType}
              onImageChange={(data, type) => { setEditImageData(data); setEditImageType(type); }}
              onImageRemove={() => { setEditImageData(null); setEditImageType(null); }}
            />
            <Input
              placeholder="Equipment name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              data-testid="input-edit-tool-name"
            />
            <Textarea
              placeholder="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              data-testid="input-edit-tool-description"
            />
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger data-testid="select-edit-tool-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="power-tools">Power Tools</SelectItem>
                <SelectItem value="hand-tools">Hand Tools</SelectItem>
                <SelectItem value="safety">Safety Equipment</SelectItem>
                <SelectItem value="measurement">Measurement</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Pickup location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              data-testid="input-edit-tool-location"
            />
            <Select value={editCondition} onValueChange={setEditCondition}>
              <SelectTrigger data-testid="select-edit-tool-condition">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="needs-repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger data-testid="select-edit-tool-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={() =>
                editingTool && editMutation.mutate({
                  id: editingTool.id,
                  name: editName,
                  description: editDescription,
                  category: editCategory,
                  status: editStatus,
                  location: editLocation,
                  condition: editCondition,
                  imageData: editImageData,
                  imageType: editImageType,
                })
              }
              disabled={!editName.trim() || editMutation.isPending}
              data-testid="button-submit-edit-tool"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTool?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-tool">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTool && deleteMutation.mutate(deletingTool.id)}
              data-testid="button-confirm-delete-tool"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
