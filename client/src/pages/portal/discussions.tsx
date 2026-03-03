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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Pin, Clock, Filter, ArrowLeft, Send, Pencil, Trash2, Users } from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";
import type { DiscussionTopic, DiscussionReply } from "@shared/schema";
import discussionBanner from "@assets/generated_images/discussion_banner.png";

type TopicWithCount = DiscussionTopic & { replyCount: number };
type TopicWithReplies = DiscussionTopic & { replies: DiscussionReply[] };
type PortalUser = { id: string; username: string };

const CATEGORIES = ["general", "technical", "business", "networking"] as const;

function categoryColor(cat: string) {
  switch (cat) {
    case "technical":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "business":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "networking":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export default function Discussions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setWouterLocation] = useWouterLocation();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [editTopicDialogOpen, setEditTopicDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editContent, setEditContent] = useState("");

  const { data: users } = useQuery<PortalUser[]>({
    queryKey: ["/api/portal/users"],
  });

  const { data: topics, isLoading: topicsLoading } = useQuery<TopicWithCount[]>({
    queryKey: ["/api/portal/discussions"],
  });

  const { data: topicDetail, isLoading: detailLoading } = useQuery<TopicWithReplies>({
    queryKey: ["/api/portal/discussions", selectedTopicId],
    enabled: !!selectedTopicId,
  });

  const usernameMap = (users || []).reduce<Record<string, string>>((acc, u) => {
    acc[u.id] = u.username;
    return acc;
  }, {});

  const getUsername = (authorId: string) => usernameMap[authorId] || "Unknown";

  const createTopicMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/portal/discussions", {
        title: newTitle,
        category: newCategory,
        content: newContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions"] });
      setDialogOpen(false);
      setNewTitle("");
      setNewCategory("general");
      setNewContent("");
      toast({ title: "Topic created", description: "Your discussion topic has been posted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/portal/discussions/${selectedTopicId}/replies`, {
        content: replyContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions", selectedTopicId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions"] });
      setReplyContent("");
      toast({ title: "Reply posted", description: "Your reply has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editTopicMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/portal/discussions/${selectedTopicId}`, {
        title: editTitle,
        category: editCategory,
        content: editContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions", selectedTopicId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions"] });
      setEditTopicDialogOpen(false);
      toast({ title: "Topic updated", description: "Your topic has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/portal/discussions/${selectedTopicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions"] });
      setSelectedTopicId(null);
      toast({ title: "Topic deleted", description: "The topic has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      await apiRequest("DELETE", `/api/portal/discussions/${selectedTopicId}/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions", selectedTopicId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/discussions"] });
      toast({ title: "Reply deleted", description: "The reply has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEditTopicDialog = () => {
    if (topicDetail) {
      setEditTitle(topicDetail.title);
      setEditCategory(topicDetail.category);
      setEditContent(topicDetail.content);
      setEditTopicDialogOpen(true);
    }
  };

  const filteredTopics = (topics || [])
    .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (selectedTopicId) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTopicId(null);
              setReplyContent("");
            }}
            data-testid="button-back-to-list"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discussions
          </Button>

          {detailLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-6" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : topicDetail ? (
            <>
              <Card className="mb-6" data-testid="card-topic-detail">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-xl" data-testid="text-topic-title">
                        {topicDetail.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={categoryColor(topicDetail.category)} data-testid="badge-topic-category">
                          {topicDetail.category}
                        </Badge>
                        {topicDetail.isPinned && (
                          <Pin className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {(user?.id === topicDetail.authorId || user?.isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px]"
                          onClick={openEditTopicDialog}
                          data-testid="button-edit-topic"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {user?.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px]"
                          onClick={() => deleteTopicMutation.mutate()}
                          disabled={deleteTopicMutation.isPending}
                          data-testid="button-delete-topic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap mb-4" data-testid="text-topic-content">
                    {topicDetail.content}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span data-testid="text-topic-author">{getUsername(topicDetail.authorId)}</span>
                    <span>·</span>
                    <span data-testid="text-topic-date">
                      {new Date(topicDetail.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-lg font-semibold mb-4" data-testid="text-replies-heading">
                Replies ({topicDetail.replies?.length || 0})
              </h3>

              <div className="space-y-4 mb-6">
                {(topicDetail.replies || []).map((reply) => (
                  <Card key={reply.id} data-testid={`card-reply-${reply.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="whitespace-pre-wrap mb-2" data-testid={`text-reply-content-${reply.id}`}>
                            {reply.content}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span data-testid={`text-reply-author-${reply.id}`}>
                              {getUsername(reply.authorId)}
                            </span>
                            <span>·</span>
                            <span data-testid={`text-reply-date-${reply.id}`}>
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {(user?.id === reply.authorId || user?.isAdmin) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => deleteReplyMutation.mutate(reply.id)}
                            disabled={deleteReplyMutation.isPending}
                            data-testid={`button-delete-reply-${reply.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(topicDetail.replies || []).length === 0 && (
                  <p className="text-muted-foreground text-center py-4" data-testid="text-no-replies">
                    No replies yet. Be the first to respond!
                  </p>
                )}
              </div>

              <Card data-testid="card-reply-form">
                <CardContent className="p-4">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="mb-3"
                    data-testid="input-reply-content"
                  />
                  <Button
                    onClick={() => replyMutation.mutate()}
                    disabled={!replyContent.trim() || replyMutation.isPending}
                    className="w-full sm:w-auto"
                    data-testid="button-post-reply"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {replyMutation.isPending ? "Posting..." : "Post Reply"}
                  </Button>
                </CardContent>
              </Card>
              <Dialog open={editTopicDialogOpen} onOpenChange={setEditTopicDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <Input
                      placeholder="Topic title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      data-testid="input-edit-topic-title"
                    />
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger data-testid="select-edit-topic-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} data-testid={`edit-select-item-${cat}`}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Topic content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      data-testid="input-edit-topic-content"
                    />
                    <Button
                      onClick={() => editTopicMutation.mutate()}
                      disabled={!editTitle.trim() || !editContent.trim() || editTopicMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-edit-topic"
                    >
                      {editTopicMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
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

        <div className="relative overflow-hidden rounded-xl mb-6" data-testid="banner-discussions">
          <img
            src={discussionBanner}
            alt="Discussion Board"
            className="w-full h-32 sm:h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between p-6 sm:p-8">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-discussions-title">
                <MessageSquare className="h-7 w-7" />
                Discussion Board
              </h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base max-w-md">
                Connect and share ideas with fellow NAMC members.
              </p>
            </div>
            <div className="shrink-0">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-white/90 text-black hover:bg-white" data-testid="button-new-topic">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">New Topic</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <Input
                      placeholder="Topic title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      data-testid="input-topic-title"
                    />
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger data-testid="select-topic-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} data-testid={`select-item-${cat}`}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="What would you like to discuss?"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={5}
                      data-testid="input-topic-content"
                    />
                    <Button
                      onClick={() => createTopicMutation.mutate()}
                      disabled={!newTitle.trim() || !newContent.trim() || createTopicMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-topic"
                    >
                      {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] sm:w-[180px]" data-testid="select-category-filter">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="filter-item-all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} data-testid={`filter-item-${cat}`}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {topicsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTopics.length === 0 ? (
          <Card data-testid="card-no-topics">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
              <p className="text-muted-foreground">
                Start a conversation by creating a new topic.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedTopicId(topic.id)}
                data-testid={`card-topic-${topic.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {topic.isPinned && (
                          <Pin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <h3 className="font-semibold truncate" data-testid={`text-topic-title-${topic.id}`}>
                          {topic.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <Badge className={categoryColor(topic.category)} data-testid={`badge-category-${topic.id}`}>
                          {topic.category}
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-author-${topic.id}`}>
                          {getUsername(topic.authorId)}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">·</span>
                        <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span data-testid={`text-reply-count-${topic.id}`}>{topic.replyCount}</span>
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">·</span>
                        <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1" data-testid={`text-date-${topic.id}`}>
                          <Clock className="h-3 w-3" />
                          {new Date(topic.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
