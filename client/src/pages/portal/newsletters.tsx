import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Newspaper, Plus, ArrowLeft, Calendar, Pencil, Trash2, BookOpen, Mail } from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";
import type { Newsletter } from "@shared/schema";
import { PageHeader } from "@/components/editorial";

const ACCENT_BG_COLORS = [
  "bg-primary/10",
  "bg-blue-500/10",
  "bg-green-500/10",
  "bg-purple-500/10",
  "bg-rose-500/10",
  "bg-cyan-500/10",
];

const ACCENT_ICON_COLORS = [
  "text-primary",
  "text-blue-500",
  "text-green-500",
  "text-purple-500",
  "text-rose-500",
  "text-cyan-500",
];

export default function Newsletters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setWouterLocation] = useWouterLocation();
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: newsletters, isLoading: listLoading } = useQuery<Newsletter[]>({
    queryKey: ["/api/portal/newsletters"],
  });

  const { data: selectedNewsletter, isLoading: detailLoading } = useQuery<Newsletter>({
    queryKey: ["/api/portal/newsletters", selectedNewsletterId],
    enabled: !!selectedNewsletterId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/portal/newsletters", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/newsletters"] });
      setDialogOpen(false);
      setTitle("");
      setContent("");
      toast({ title: "Newsletter created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create newsletter", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/portal/newsletters/${selectedNewsletterId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/newsletters"] });
      setEditDialogOpen(false);
      toast({ title: "Newsletter updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update newsletter", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/portal/newsletters/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/newsletters"] });
      setSelectedNewsletterId(null);
      toast({ title: "Newsletter deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete newsletter", description: error.message, variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/portal/newsletters/${id}/send-email`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Emails sent!", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send emails", description: error.message, variant: "destructive" });
    },
  });

  function openEditDialog(newsletter: Newsletter) {
    setEditTitle(newsletter.title);
    setEditContent(newsletter.content);
    setEditDialogOpen(true);
  }

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (selectedNewsletterId) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => setSelectedNewsletterId(null)}
            className="mb-6"
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletters
          </Button>

          {detailLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-6" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : selectedNewsletter ? (
            <>
              <Card data-testid={`card-newsletter-detail-${selectedNewsletter.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-2xl" data-testid="text-newsletter-title">
                        {selectedNewsletter.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-4 w-4" />
                        <span data-testid="text-newsletter-date">
                          {formatDate(selectedNewsletter.publishedAt)}
                        </span>
                      </div>
                    </div>
                    {user?.isAdmin && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              disabled={sendEmailMutation.isPending}
                              data-testid="button-send-newsletter-email"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {sendEmailMutation.isPending ? "Sending..." : "Send to All Members"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Send Newsletter to All Members</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will email this newsletter to all approved members. Are you sure you want to proceed?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-send-email">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => sendEmailMutation.mutate(selectedNewsletter.id)}
                                data-testid="button-confirm-send-email"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Send Emails
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(selectedNewsletter)}
                          data-testid="button-edit-newsletter"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              data-testid="button-delete-newsletter"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Newsletter</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this newsletter? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(selectedNewsletter.id)}
                                data-testid="button-confirm-delete"
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    data-testid="text-newsletter-content"
                  >
                    <ReactMarkdown>{selectedNewsletter.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Newsletter</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate({ title: editTitle, content: editContent });
                    }}
                    className="space-y-4"
                  >
                    <Input
                      placeholder="Newsletter title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      data-testid="input-edit-newsletter-title"
                    />
                    <Textarea
                      placeholder="Newsletter content..."
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[200px]"
                      required
                      data-testid="input-edit-newsletter-content"
                    />
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-edit-newsletter"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWouterLocation("/portal")}
          className="mb-4"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <PageHeader
          data-testid="banner-newsletters"
          eyebrow="The press"
          title="Newsletters"
          titleTestId="text-newsletters-heading"
          description="Stay up to date with NAMC NorCal news and updates."
          actions={user?.isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-create-newsletter">
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Newsletter</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createMutation.mutate({ title, content });
                    }}
                    className="space-y-4"
                  >
                    <Input
                      placeholder="Newsletter title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      data-testid="input-newsletter-title"
                    />
                    <Textarea
                      placeholder="Newsletter content..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px]"
                      required
                      data-testid="input-newsletter-content"
                    />
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-newsletter"
                    >
                      {createMutation.isPending ? "Publishing..." : "Publish Newsletter"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
          )}
        />

        {listLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : newsletters && newsletters.length > 0 ? (
          <div className="space-y-4">
            {newsletters.map((newsletter, idx) => (
              <Card
                key={newsletter.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedNewsletterId(newsletter.id)}
                data-testid={`card-newsletter-${newsletter.id}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-lg shrink-0 ${ACCENT_BG_COLORS[idx % ACCENT_BG_COLORS.length]}`}>
                      <BookOpen className={`h-6 w-6 ${ACCENT_ICON_COLORS[idx % ACCENT_ICON_COLORS.length]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="font-semibold text-base sm:text-lg" data-testid={`text-newsletter-title-${newsletter.id}`}>
                          {newsletter.title}
                        </h3>
                        <Badge variant="secondary" className="no-default-active-elevate shrink-0">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(newsletter.publishedAt)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2" data-testid={`text-newsletter-preview-${newsletter.id}`}>
                        {newsletter.content.length > 200
                          ? newsletter.content.substring(0, 200) + "..."
                          : newsletter.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card data-testid="card-empty-newsletters">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No newsletters published yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Check back later for news and updates from NAMC NorCal.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
