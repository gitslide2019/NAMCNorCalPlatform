import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Plus, Reply, Clock } from "lucide-react";
import type { Message } from "@shared/schema";

interface MessageWithSender extends Message {
  senderUsername?: string;
  recipientUsername?: string;
}

interface PortalUser {
  id: string;
  username: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const searchString = useSearch();
  const [, setLocation] = useLocation();

  const { data: portalUsers } = useQuery<PortalUser[]>({
    queryKey: ["/api/portal/users"],
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const toUserId = params.get("to");
    if (toUserId && portalUsers) {
      const validUser = portalUsers.find(u => String(u.id) === toUserId);
      if (validUser) {
        setRecipientId(toUserId);
        setComposeOpen(true);
      }
      setLocation("/portal/messages", { replace: true });
    }
  }, [searchString, portalUsers, setLocation]);

  const { data: inboxMessages, isLoading: inboxLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/portal/messages"],
  });

  const { data: sentMessages, isLoading: sentLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/portal/messages/sent"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { recipientId: string; subject: string; content: string }) => {
      await apiRequest("POST", "/api/portal/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/messages/sent"] });
      toast({ title: "Message sent" });
      setComposeOpen(false);
      setRecipientId("");
      setSubject("");
      setContent("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!recipientId || !subject.trim() || !content.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    sendMutation.mutate({ recipientId, subject, content });
  };

  const handleViewMessage = async (msg: MessageWithSender) => {
    setSelectedMessage(msg);
    setDetailOpen(true);
    if (!msg.isRead && msg.recipientId === user?.id) {
      try {
        await apiRequest("GET", `/api/portal/messages/${msg.id}`);
        queryClient.invalidateQueries({ queryKey: ["/api/portal/messages"] });
      } catch {}
    }
  };

  const handleReply = (msg: MessageWithSender) => {
    setDetailOpen(false);
    setRecipientId(msg.senderId);
    setSubject(msg.subject.startsWith("Re: ") ? msg.subject : `Re: ${msg.subject}`);
    setContent("");
    setComposeOpen(true);
  };

  const unreadCount = inboxMessages?.filter((m) => !m.isRead).length ?? 0;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <div className="flex flex-row items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-messages-title">
              Messages
            </h1>
            <p className="text-muted-foreground mt-1">Send and receive messages with other members.</p>
          </div>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-compose">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger data-testid="select-recipient">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {portalUsers?.filter((u) => u.id !== user?.id).map((u) => (
                      <SelectItem key={u.id} value={u.id} data-testid={`select-item-user-${u.id}`}>
                        {u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  data-testid="input-subject"
                />
                <Textarea
                  placeholder="Write your message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  data-testid="textarea-content"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendMutation.isPending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="inbox">
          <TabsList data-testid="tabs-messages">
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              <Mail className="h-4 w-4 mr-2" />
              Inbox
              {unreadCount > 0 && (
                <Badge className="ml-2" variant="secondary" data-testid="badge-unread-count">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">
              <Send className="h-4 w-4 mr-2" />
              Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-4">
            {inboxLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : inboxMessages && inboxMessages.length > 0 ? (
              <div className="space-y-2">
                {inboxMessages.map((msg) => (
                  <Card
                    key={msg.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleViewMessage(msg)}
                    data-testid={`card-message-inbox-${msg.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${msg.isRead ? "text-muted-foreground" : "font-bold"}`}
                            data-testid={`text-sender-${msg.id}`}
                          >
                            {msg.senderUsername || "Unknown"}
                          </p>
                          <p
                            className={`truncate ${msg.isRead ? "" : "font-semibold"}`}
                            data-testid={`text-subject-${msg.id}`}
                          >
                            {msg.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!msg.isRead && (
                            <Badge variant="default" className="text-xs" data-testid={`badge-unread-${msg.id}`}>
                              New
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-date-${msg.id}`}>
                            <Clock className="h-3 w-3" />
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground" data-testid="text-inbox-empty">No messages in your inbox.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {sentLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sentMessages && sentMessages.length > 0 ? (
              <div className="space-y-2">
                {sentMessages.map((msg) => (
                  <Card
                    key={msg.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleViewMessage(msg)}
                    data-testid={`card-message-sent-${msg.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-muted-foreground" data-testid={`text-recipient-${msg.id}`}>
                            To: {msg.recipientUsername || "Unknown"}
                          </p>
                          <p className="truncate" data-testid={`text-sent-subject-${msg.id}`}>
                            {msg.subject}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0" data-testid={`text-sent-date-${msg.id}`}>
                          <Clock className="h-3 w-3" />
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground" data-testid="text-sent-empty">No sent messages.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle data-testid="text-detail-subject">{selectedMessage?.subject}</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-muted-foreground" data-testid="text-detail-from">
                      From: <span className="font-medium">{selectedMessage.senderUsername || "Unknown"}</span>
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-detail-to">
                      To: <span className="font-medium">{selectedMessage.recipientUsername || "Unknown"}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid="text-detail-date">
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <p className="whitespace-pre-wrap" data-testid="text-detail-content">
                    {selectedMessage.content}
                  </p>
                </div>
                {selectedMessage.senderId !== user?.id && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleReply(selectedMessage)}
                      data-testid="button-reply"
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
