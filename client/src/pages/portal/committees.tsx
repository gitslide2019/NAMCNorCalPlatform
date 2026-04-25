import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UsersRound, Plus, ChevronRight, Crown } from "lucide-react";
import type { Committee } from "@shared/schema";

type CommitteeListItem = Committee & {
  memberCount: number;
  chairName: string | null;
  isMember: boolean;
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "governance", label: "Governance" },
  { value: "programs", label: "Programs" },
  { value: "outreach", label: "Outreach" },
  { value: "finance", label: "Finance" },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  governance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  programs: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  outreach: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function CommitteesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  const { data: committees, isLoading } = useQuery<CommitteeListItem[]>({
    queryKey: ["/api/portal/committees"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/portal/committees", {
        name: newName,
        description: newDescription || null,
        category: newCategory,
      });
      return res.json();
    },
    onSuccess: (created: Committee) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/committees"] });
      toast({ title: "Committee created" });
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      setNewCategory("general");
      setLocation(`/portal/committees/${created.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create committee", description: err.message, variant: "destructive" });
    },
  });

  const isAdmin = !!user?.isAdmin;

  return (
    <PortalLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto" data-testid="page-committees">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <UsersRound className="h-7 w-7 text-primary" />
              Committees
            </h1>
            <p className="text-muted-foreground mt-1">
              Working groups that drive NAMC NorCal initiatives. Join one to get involved.
            </p>
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-committee">
                  <Plus className="h-4 w-4 mr-2" />
                  New Committee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Committee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Membership Outreach Committee"
                      data-testid="input-committee-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger data-testid="select-committee-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="What does this committee do?"
                      rows={4}
                      data-testid="input-committee-description"
                    />
                  </div>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-committee"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Committee"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : !committees || committees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-empty-state">
              No committees yet.{" "}
              {isAdmin
                ? "Create the first one above."
                : "Check back soon — an admin can set them up."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {committees.map((c) => (
              <Link key={c.id} href={`/portal/committees/${c.id}`}>
                <Card
                  className="cursor-pointer hover-elevate active-elevate-2 h-full"
                  data-testid={`card-committee-${c.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight" data-testid={`text-committee-name-${c.id}`}>
                        {c.name}
                      </CardTitle>
                      <Badge className={CATEGORY_COLORS[c.category] || CATEGORY_COLORS.general}>
                        {c.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1" data-testid={`text-member-count-${c.id}`}>
                          <UsersRound className="h-4 w-4" />
                          {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
                        </span>
                        {c.chairName && (
                          <span className="flex items-center gap-1">
                            <Crown className="h-4 w-4" />
                            {c.chairName}
                          </span>
                        )}
                      </div>
                      {c.isMember && (
                        <Badge variant="outline" className="text-xs">
                          Joined
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-end text-xs text-primary">
                      View details <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
