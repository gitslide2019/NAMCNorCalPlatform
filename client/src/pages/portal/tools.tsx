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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, Package, ArrowLeftRight, Check, Pencil, Trash2 } from "lucide-react";
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

export default function ToolLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [newToolCategory, setNewToolCategory] = useState("general");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editStatus, setEditStatus] = useState("available");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTool, setDeletingTool] = useState<Tool | null>(null);

  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/portal/tools"],
  });

  const { data: myLoans = [], isLoading: loansLoading } = useQuery<ToolLoan[]>({
    queryKey: ["/api/portal/tools/my-loans"],
  });

  const activeLoanToolIds = new Set(
    myLoans.filter((l) => l.status === "active").map((l) => l.toolId)
  );

  const borrowMutation = useMutation({
    mutationFn: (toolId: string) =>
      apiRequest("POST", `/api/portal/tools/${toolId}/borrow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      toast({ title: "Tool borrowed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to borrow tool", description: error.message, variant: "destructive" });
    },
  });

  const returnMutation = useMutation({
    mutationFn: (toolId: string) =>
      apiRequest("POST", `/api/portal/tools/${toolId}/return`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      toast({ title: "Tool returned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to return tool", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; category: string }) =>
      apiRequest("POST", "/api/portal/tools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      toast({ title: "Tool added successfully" });
      setDialogOpen(false);
      setNewToolName("");
      setNewToolDescription("");
      setNewToolCategory("general");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add tool", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; name: string; description: string; category: string; status: string }) =>
      apiRequest("PATCH", `/api/portal/tools/${data.id}`, { name: data.name, description: data.description, category: data.category, status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      toast({ title: "Tool updated successfully" });
      setEditDialogOpen(false);
      setEditingTool(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update tool", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (toolId: string) =>
      apiRequest("DELETE", `/api/portal/tools/${toolId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tools/my-loans"] });
      toast({ title: "Tool deleted successfully" });
      setDeleteDialogOpen(false);
      setDeletingTool(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete tool", description: error.message, variant: "destructive" });
    },
  });

  function openEditDialog(tool: Tool) {
    setEditingTool(tool);
    setEditName(tool.name);
    setEditDescription(tool.description || "");
    setEditCategory(tool.category);
    setEditStatus(tool.status);
    setEditDialogOpen(true);
  }

  function openDeleteDialog(tool: Tool) {
    setDeletingTool(tool);
    setDeleteDialogOpen(true);
  }

  const canManageTool = (tool: Tool) => {
    return user?.isAdmin || tool.ownerId === user?.id;
  };

  const filteredTools = tools.filter((tool) => {
    if (categoryFilter !== "all" && tool.category !== categoryFilter) return false;
    if (availabilityFilter === "available" && tool.status !== "available") return false;
    if (availabilityFilter === "borrowed" && tool.status !== "borrowed") return false;
    return true;
  });

  const toolsMap = new Map(tools.map((t) => [t.id, t]));

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
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
                Add Tool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New Tool</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Tool name"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  data-testid="input-tool-name"
                />
                <Textarea
                  placeholder="Description"
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
                <Button
                  className="w-full"
                  onClick={() =>
                    createMutation.mutate({
                      name: newToolName,
                      description: newToolDescription,
                      category: newToolCategory,
                    })
                  }
                  disabled={!newToolName.trim() || createMutation.isPending}
                  data-testid="button-submit-tool"
                >
                  {createMutation.isPending ? "Adding..." : "Add Tool"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="catalog" data-testid="tabs-tools">
          <TabsList>
            <TabsTrigger value="catalog" data-testid="tab-catalog">
              <Package className="h-4 w-4 mr-2" />
              Tool Catalog
            </TabsTrigger>
            <TabsTrigger value="my-loans" data-testid="tab-my-loans">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              My Loans
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
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTools.length === 0 ? (
              <Card data-testid="card-no-tools">
                <CardContent className="p-8 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tools found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or add a new tool.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool) => (
                  <Card key={tool.id} data-testid={`card-tool-${tool.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        {getStatusBadge(tool.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {tool.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[tool.category] || tool.category}
                        </Badge>
                        <div className="flex flex-wrap items-center gap-1">
                          {tool.status === "available" && !activeLoanToolIds.has(tool.id) && (
                            <Button
                              size="sm"
                              onClick={() => borrowMutation.mutate(tool.id)}
                              disabled={borrowMutation.isPending}
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
                              onClick={() => returnMutation.mutate(tool.id)}
                              disabled={returnMutation.isPending}
                              data-testid={`button-return-${tool.id}`}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Return
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-loans" className="mt-6">
            {loansLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
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
                    Browse the tool catalog to borrow tools.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myLoans.map((loan) => {
                  const tool = toolsMap.get(loan.toolId);
                  return (
                    <Card key={loan.id} data-testid={`card-loan-${loan.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <CardTitle className="text-base">
                            {tool?.name || "Unknown Tool"}
                          </CardTitle>
                          {loan.status === "active" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Returned</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p data-testid={`text-borrow-date-${loan.id}`}>
                            Borrowed: {new Date(loan.borrowDate).toLocaleDateString()}
                          </p>
                          {loan.returnDate && (
                            <p data-testid={`text-return-date-${loan.id}`}>
                              Returned: {new Date(loan.returnDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {loan.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => returnMutation.mutate(loan.toolId)}
                            disabled={returnMutation.isPending}
                            data-testid={`button-return-loan-${loan.id}`}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Return
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Tool name"
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
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
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
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
