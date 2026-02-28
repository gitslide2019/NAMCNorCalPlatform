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
import { Newspaper, Plus, ArrowLeft, Calendar } from "lucide-react";
import type { Newsletter } from "@shared/schema";

export default function Newsletters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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
            <Card data-testid={`card-newsletter-detail-${selectedNewsletter.id}`}>
              <CardHeader>
                <CardTitle className="text-2xl" data-testid="text-newsletter-title">
                  {selectedNewsletter.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-newsletter-date">
                    {formatDate(selectedNewsletter.publishedAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className="whitespace-pre-wrap"
                  data-testid="text-newsletter-content"
                >
                  {selectedNewsletter.content}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-newsletters-heading">
              Newsletters
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay up to date with NAMC NorCal news and updates.
            </p>
          </div>
          {user?.isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-newsletter">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Newsletter
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
        </div>

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
            {newsletters.map((newsletter) => (
              <Card
                key={newsletter.id}
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedNewsletterId(newsletter.id)}
                data-testid={`card-newsletter-${newsletter.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <CardTitle className="text-lg" data-testid={`text-newsletter-title-${newsletter.id}`}>
                      {newsletter.title}
                    </CardTitle>
                    <Badge variant="secondary" className="no-default-active-elevate">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(newsletter.publishedAt)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground" data-testid={`text-newsletter-preview-${newsletter.id}`}>
                    {newsletter.content.length > 200
                      ? newsletter.content.substring(0, 200) + "..."
                      : newsletter.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card data-testid="card-empty-newsletters">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No newsletters published yet</h3>
              <p className="text-muted-foreground">
                Check back later for news and updates from NAMC NorCal.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
