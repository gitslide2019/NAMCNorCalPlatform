import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Loader2,
  FileText,
  Eye,
  ShieldCheck,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  BarChart3,
  Pencil,
  Save,
  Users,
  MessageSquare,
  Upload,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  Building2,
  Mail,
  Plus,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Redirect, useLocation } from "wouter";
import { useState, useRef, Fragment } from "react";
import type { MembershipApplication, BudgetCategory, FundingSource, Campaign } from "@shared/schema";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const EXPENSE_COLORS = [
  "#E5A830", "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#0891b2", "#ea580c", "#4f46e5", "#be185d", "#78716c",
];
const REVENUE_COLORS = ["#16a34a", "#2563eb", "#9333ea", "#E5A830", "#0891b2", "#ea580c"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function pct(current: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
}

interface FinancialSummary {
  totalBudgeted: number;
  totalActual: number;
  totalProjected: number;
  totalReceived: number;
  surplus: number;
  campaignTotalGoal: number;
  campaignTotalRaised: number;
  pledgeBreakdown: {
    pledgedCount: number;
    receivedCount: number;
    pledgedAmount: number;
    receivedAmount: number;
  };
  budgetCategories: BudgetCategory[];
  fundingSources: FundingSource[];
  campaigns: Campaign[];
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  const { data: applications, isLoading } = useQuery<MembershipApplication[]>({
    queryKey: ["/api/membership-applications"],
    enabled: !!user?.isAdmin,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/membership-applications/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-applications"] });
      toast({ title: "Status updated", description: "Application status has been changed." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const isAdminOrBoard = user?.isAdmin || user?.isBoardMember;
  if (!isAdminOrBoard) {
    return <Redirect to="/portal" />;
  }

  const pending = (applications || []).filter(a => a.status === "pending" || !a.status).length;
  const approved = (applications || []).filter(a => a.status === "approved").length;
  const rejected = (applications || []).filter(a => a.status === "rejected").length;

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-admin-title">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">{user?.isAdmin ? "Manage membership applications and organizational finances." : "View organizational financial dashboard."}</p>
          </div>
        </div>

        <Tabs defaultValue={user?.isAdmin ? "applications" : "finance"} className="space-y-6">
          <TabsList className={`grid w-full max-w-3xl ${user?.isAdmin ? "grid-cols-5" : "grid-cols-1"}`}>
            {user?.isAdmin && (
              <TabsTrigger value="applications" className="text-xs sm:text-sm" data-testid="tab-applications">
                <Users className="h-4 w-4 mr-1 sm:mr-2 shrink-0" /><span className="truncate">Applications</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="finance" className="text-xs sm:text-sm" data-testid="tab-finance">
              <DollarSign className="h-4 w-4 mr-1 sm:mr-2 shrink-0" /><span className="truncate">Finance</span>
            </TabsTrigger>
            {user?.isAdmin && (
              <TabsTrigger value="renewals" className="text-xs sm:text-sm" data-testid="tab-renewals">
                <CalendarClock className="h-4 w-4 mr-1 sm:mr-2 shrink-0" /><span className="truncate">Renewals</span>
              </TabsTrigger>
            )}
            {user?.isAdmin && (
              <TabsTrigger value="email" className="text-xs sm:text-sm" data-testid="tab-email-members">
                <Mail className="h-4 w-4 mr-1 sm:mr-2 shrink-0" /><span className="truncate">Email</span>
              </TabsTrigger>
            )}
            {user?.isAdmin && (
              <TabsTrigger value="sms" className="text-xs sm:text-sm" data-testid="tab-sms">
                <MessageSquare className="h-4 w-4 mr-1 sm:mr-2 shrink-0" /><span className="truncate">SMS</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="applications">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => window.open("/api/membership-applications-export/csv", "_blank")} data-testid="button-export-csv">
                  <Download className="h-4 w-4 mr-2" />Export CSV
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{approved}</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{rejected}</p>
                      <p className="text-xs text-muted-foreground">Rejected</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isLoading ? (
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
              ) : !applications?.length ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No membership applications yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" data-testid="table-applications">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Company</th>
                            <th className="text-left p-3 font-medium hidden sm:table-cell">Contact</th>
                            <th className="text-left p-3 font-medium hidden md:table-cell">Category</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/30" data-testid={`row-application-${app.id}`}>
                              <td className="p-3">
                                <p className="font-medium">{app.companyName}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">{app.contactName}</p>
                              </td>
                              <td className="p-3 hidden sm:table-cell">
                                <p>{app.contactName}</p>
                                <p className="text-xs text-muted-foreground">{app.email}</p>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                <span className="capitalize">{app.membershipCategory}</span>
                              </td>
                              <td className="p-3">{getStatusBadge(app.status || "pending")}</td>
                              <td className="p-3 hidden lg:table-cell text-muted-foreground">
                                {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)} data-testid={`button-view-${app.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>{selectedApp?.companyName}</DialogTitle>
                                      </DialogHeader>
                                      {selectedApp && (
                                        <div className="space-y-3 text-sm">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{selectedApp.contactName}</p></div>
                                            <div><p className="text-muted-foreground">Title</p><p className="font-medium">{selectedApp.title}</p></div>
                                            <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedApp.email}</p></div>
                                            <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedApp.phone}</p></div>
                                            <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium">{selectedApp.address}, {selectedApp.city}, {selectedApp.state} {selectedApp.zipCode}</p></div>
                                            {selectedApp.website && <div className="col-span-2"><p className="text-muted-foreground">Website</p><p className="font-medium">{selectedApp.website}</p></div>}
                                            <div><p className="text-muted-foreground">Category</p><p className="font-medium capitalize">{selectedApp.membershipCategory}</p></div>
                                            <div><p className="text-muted-foreground">Status</p>{getStatusBadge(selectedApp.status || "pending")}</div>
                                            {selectedApp.primaryServices && <div className="col-span-2"><p className="text-muted-foreground">Services</p><p className="font-medium">{selectedApp.primaryServices}</p></div>}
                                            {selectedApp.certifications && <div className="col-span-2"><p className="text-muted-foreground">Certifications</p><p className="font-medium">{selectedApp.certifications}</p></div>}
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  {(app.status === "pending" || !app.status) && (
                                    <>
                                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => statusMutation.mutate({ id: app.id, status: "approved" })} disabled={statusMutation.isPending} data-testid={`button-approve-${app.id}`}>
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => statusMutation.mutate({ id: app.id, status: "rejected" })} disabled={statusMutation.isPending} data-testid={`button-reject-${app.id}`}>
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {(app.status === "approved" || app.status === "rejected") && (
                                    <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => statusMutation.mutate({ id: app.id, status: "pending" })} disabled={statusMutation.isPending} data-testid={`button-revert-${app.id}`}>
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="finance">
            <FinanceDashboard />
          </TabsContent>

          {user?.isAdmin && (
            <TabsContent value="renewals">
              <RenewalReminders />
            </TabsContent>
          )}

          {user?.isAdmin && (
            <TabsContent value="email">
              <EmailMembers />
            </TabsContent>
          )}

          {user?.isAdmin && (
            <TabsContent value="sms">
              <SmsInvitations />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PortalLayout>
  );
}

function EmailMembers() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/portal/admin/send-member-email", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Emails sent!", description: data.message });
      setSubject("");
      setMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send emails", description: error.message, variant: "destructive" });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    sendMutation.mutate({ subject: subject.trim(), message: message.trim() });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#E5A830]" />
            Compose Email to All Members
          </CardTitle>
          <CardDescription>
            Write a message and send it to every member in the portal. Use this for meeting reminders, announcements, and important updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email-subject">
                Subject
              </label>
              <Input
                id="email-subject"
                placeholder="e.g. NAMC NorCal Monthly Meeting – April 15"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email-message">
                Message
              </label>
              <Textarea
                id="email-message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[220px]"
                required
                data-testid="input-email-message"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={sendMutation.isPending || !subject.trim() || !message.trim()}
                className="bg-[#E5A830] hover:bg-[#d4961f] text-black"
                data-testid="button-send-member-email"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to All Members
                  </>
                )}
              </Button>
              {sendMutation.isSuccess && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1" data-testid="text-email-success">
                  <CheckCircle className="h-4 w-4" /> Sent successfully
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-medium">About member email delivery</p>
              <p>Emails are sent to all users with active member accounts in the portal. Delivery depends on each member having a verified email address on file.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: summary, isLoading } = useQuery<FinancialSummary>({
    queryKey: ["/api/portal/admin/financial-summary"],
  });

  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingFunding, setEditingFunding] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const budgetMutation = useMutation({
    mutationFn: async ({ id, actualAmount }: { id: string; actualAmount: string }) => {
      const res = await apiRequest("PATCH", `/api/portal/admin/budget/${id}`, { actualAmount });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/admin/financial-summary"] });
      setEditingBudget(null);
      toast({ title: "Budget updated", description: "Actual amount has been saved." });
    },
  });

  const fundingMutation = useMutation({
    mutationFn: async ({ id, receivedAmount }: { id: string; receivedAmount: string }) => {
      const res = await apiRequest("PATCH", `/api/portal/admin/funding/${id}`, { receivedAmount });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/admin/financial-summary"] });
      setEditingFunding(null);
      toast({ title: "Funding updated", description: "Received amount has been saved." });
    },
  });

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const expensePieData = summary.budgetCategories.map(c => ({
    name: c.name,
    value: parseFloat(c.budgetedAmount),
  }));

  const revenuePieData = summary.fundingSources.map(s => ({
    name: s.name,
    value: parseFloat(s.projectedAmount),
    received: parseFloat(s.receivedAmount),
  }));

  const budgetVsActualData = summary.budgetCategories.map(c => ({
    name: c.name.length > 14 ? c.name.substring(0, 12) + "…" : c.name,
    fullName: c.name,
    Budgeted: parseFloat(c.budgetedAmount),
    Actual: parseFloat(c.actualAmount),
  }));

  const fundingPipelineData = summary.fundingSources.map(s => ({
    name: s.name.length > 14 ? s.name.substring(0, 12) + "…" : s.name,
    fullName: s.name,
    Projected: parseFloat(s.projectedAmount),
    Received: parseFloat(s.receivedAmount),
  }));

  const pledgePieData = [
    { name: "Received", value: summary.pledgeBreakdown.receivedAmount, count: summary.pledgeBreakdown.receivedCount },
    { name: "Pledged (Pending)", value: summary.pledgeBreakdown.pledgedAmount, count: summary.pledgeBreakdown.pledgedCount },
  ].filter(d => d.value > 0);

  const budgetUsedPct = pct(summary.totalActual, summary.totalBudgeted);
  const revenueCollectedPct = pct(summary.totalReceived, summary.totalProjected);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{data.name || data.payload?.fullName || data.payload?.name}</p>
          <p className="text-muted-foreground">{fmt(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullName = payload[0]?.payload?.fullName || label;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-1">{fullName}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }}>{entry.name}: {fmt(entry.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="finance-overview-cards">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Budget</p>
                <p className="text-xl font-bold" data-testid="text-total-budget">{fmt(summary.totalBudgeted)}</p>
                <p className="text-xs text-muted-foreground">{budgetUsedPct}% spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected Revenue</p>
                <p className="text-xl font-bold" data-testid="text-total-revenue">{fmt(summary.totalProjected)}</p>
                <p className="text-xs text-muted-foreground">{revenueCollectedPct}% collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <PiggyBank className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected Revenue</p>
                <p className="text-xl font-bold" data-testid="text-collected-revenue">{fmt(summary.totalReceived)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${summary.surplus >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                {summary.surplus >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget {summary.surplus >= 0 ? "Surplus" : "Deficit"}</p>
                <p className={`text-xl font-bold ${summary.surplus >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-surplus">
                  {summary.surplus >= 0 ? "+" : ""}{fmt(summary.surplus)}
                </p>
                <p className="text-xs text-muted-foreground">Collected − Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="chart-expense-pie">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>FY 2025-2026 budget allocation by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={false} labelLine={false}>
                  {expensePieData.map((_, idx) => (
                    <Cell key={idx} fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
              {expensePieData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs min-w-0">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }} />
                  <span className="truncate flex-1">{entry.name}</span>
                  <span className="text-muted-foreground flex-shrink-0 tabular-nums">{fmt(entry.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="chart-revenue-pie">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue Sources
            </CardTitle>
            <CardDescription>Projected revenue by funding source</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={revenuePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={false} labelLine={false}>
                  {revenuePieData.map((_, idx) => (
                    <Cell key={idx} fill={REVENUE_COLORS[idx % REVENUE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
              {revenuePieData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs min-w-0">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: REVENUE_COLORS[idx % REVENUE_COLORS.length] }} />
                  <span className="truncate flex-1">{entry.name}</span>
                  <span className="text-muted-foreground flex-shrink-0 tabular-nums">{fmt(entry.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="chart-budget-vs-actual">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Budget vs. Actual Spending
          </CardTitle>
          <CardDescription>Compare budgeted amounts against actual expenditures for each category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={budgetVsActualData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} interval={0} height={80} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip content={<BarTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Budgeted" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#E5A830" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="chart-funding-pipeline">
          <CardHeader>
            <CardTitle className="text-lg">Funding Pipeline</CardTitle>
            <CardDescription>Projected vs. received revenue by source</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fundingPipelineData} margin={{ top: 5, right: 20, left: 10, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} interval={0} height={70} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip content={<BarTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Projected" fill="#9333ea" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Received" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="chart-pledge-status">
          <CardHeader>
            <CardTitle className="text-lg">Pledge Status</CardTitle>
            <CardDescription>Campaign pledge fulfillment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pledgePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={false} labelLine={false}>
                  <Cell fill="#16a34a" />
                  <Cell fill="#E5A830" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-2 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.pledgeBreakdown.receivedCount}</p>
                <p className="text-xs text-muted-foreground">Received ({fmt(summary.pledgeBreakdown.receivedAmount)})</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{summary.pledgeBreakdown.pledgedCount}</p>
                <p className="text-xs text-muted-foreground">Pending ({fmt(summary.pledgeBreakdown.pledgedAmount)})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="section-campaign-progress">
        <CardHeader>
          <CardTitle className="text-lg">Campaign Progress</CardTitle>
          <CardDescription>Active fundraising campaigns and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {summary.campaigns.map(camp => {
              const goal = parseFloat(camp.goalAmount);
              const raised = parseFloat(camp.currentAmount);
              const p = pct(raised, goal);
              return (
                <Card key={camp.id} className="border">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2 line-clamp-2" data-testid={`text-campaign-title-${camp.id}`}>{camp.title}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{fmt(raised)} raised</span>
                      <span>{fmt(goal)} goal</span>
                    </div>
                    <Progress value={p} className="h-2 mb-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{p}% funded</span>
                      <Badge variant={camp.status === "active" ? "default" : "secondary"} className="text-xs">{camp.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Campaign Goal</p>
              <p className="text-xs text-muted-foreground">All active campaigns combined</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{fmt(summary.campaignTotalRaised)} <span className="text-sm text-muted-foreground font-normal">/ {fmt(summary.campaignTotalGoal)}</span></p>
              <p className="text-xs text-primary font-medium">{pct(summary.campaignTotalRaised, summary.campaignTotalGoal)}% overall</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="table-expense-budget">
        <CardHeader>
          <CardTitle className="text-lg">Expense Budget Detail</CardTitle>
          <CardDescription>Click the pencil icon to update actual spending amounts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Budgeted</th>
                  <th className="text-right p-3 font-medium">Actual</th>
                  <th className="text-right p-3 font-medium">Variance</th>
                  <th className="text-right p-3 font-medium">% Used</th>
                  {user?.isAdmin && <th className="text-right p-3 font-medium w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {summary.budgetCategories.map(cat => {
                  const budgeted = parseFloat(cat.budgetedAmount);
                  const actual = parseFloat(cat.actualAmount);
                  const variance = budgeted - actual;
                  const usedPct = pct(actual, budgeted);
                  const isEditing = editingBudget === cat.id;

                  return (
                    <tr key={cat.id} className="border-b last:border-b-0 hover:bg-muted/30" data-testid={`row-budget-${cat.id}`}>
                      <td className="p-3">
                        <p className="font-medium">{cat.name}</p>
                        {cat.notes && <p className="text-xs text-muted-foreground line-clamp-1">{cat.notes}</p>}
                      </td>
                      <td className="p-3 text-right">{fmt(budgeted)}</td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-28 h-8 text-right text-sm" data-testid={`input-budget-actual-${cat.id}`} />
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => budgetMutation.mutate({ id: cat.id, actualAmount: editValue })} disabled={budgetMutation.isPending}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : fmt(actual)}
                      </td>
                      <td className={`p-3 text-right font-medium ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {variance >= 0 ? "+" : ""}{fmt(variance)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={usedPct} className="h-1.5 w-16" />
                          <span className={`text-xs ${usedPct > 100 ? "text-red-600 font-medium" : ""}`}>{usedPct}%</span>
                        </div>
                      </td>
                      {user?.isAdmin && (
                        <td className="p-3 text-right">
                          {!isEditing && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingBudget(cat.id); setEditValue(cat.actualAmount); }} data-testid={`button-edit-budget-${cat.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right">{fmt(summary.totalBudgeted)}</td>
                  <td className="p-3 text-right">{fmt(summary.totalActual)}</td>
                  <td className={`p-3 text-right ${summary.totalBudgeted - summary.totalActual >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {summary.totalBudgeted - summary.totalActual >= 0 ? "+" : ""}{fmt(summary.totalBudgeted - summary.totalActual)}
                  </td>
                  <td className="p-3 text-right text-xs">{budgetUsedPct}%</td>
                  {user?.isAdmin && <td className="p-3"></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="table-revenue-funding">
        <CardHeader>
          <CardTitle className="text-lg">Revenue & Funding Detail</CardTitle>
          <CardDescription>Click the pencil icon to update received amounts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-right p-3 font-medium">Projected</th>
                  <th className="text-right p-3 font-medium">Received</th>
                  <th className="text-right p-3 font-medium">Remaining</th>
                  <th className="text-right p-3 font-medium">% Collected</th>
                  {user?.isAdmin && <th className="text-right p-3 font-medium w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {summary.fundingSources.map(src => {
                  const projected = parseFloat(src.projectedAmount);
                  const received = parseFloat(src.receivedAmount);
                  const remaining = projected - received;
                  const collectedPct = pct(received, projected);
                  const isEditing = editingFunding === src.id;

                  return (
                    <tr key={src.id} className="border-b last:border-b-0 hover:bg-muted/30" data-testid={`row-funding-${src.id}`}>
                      <td className="p-3">
                        <p className="font-medium">{src.name}</p>
                        {src.notes && <p className="text-xs text-muted-foreground line-clamp-1">{src.notes}</p>}
                      </td>
                      <td className="p-3 text-right">{fmt(projected)}</td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-28 h-8 text-right text-sm" data-testid={`input-funding-received-${src.id}`} />
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => fundingMutation.mutate({ id: src.id, receivedAmount: editValue })} disabled={fundingMutation.isPending}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : fmt(received)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{fmt(remaining)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={collectedPct} className="h-1.5 w-16" />
                          <span className="text-xs">{collectedPct}%</span>
                        </div>
                      </td>
                      {user?.isAdmin && (
                        <td className="p-3 text-right">
                          {!isEditing && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingFunding(src.id); setEditValue(src.receivedAmount); }} data-testid={`button-edit-funding-${src.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right">{fmt(summary.totalProjected)}</td>
                  <td className="p-3 text-right">{fmt(summary.totalReceived)}</td>
                  <td className="p-3 text-right text-muted-foreground">{fmt(summary.totalProjected - summary.totalReceived)}</td>
                  <td className="p-3 text-right text-xs">{revenueCollectedPct}%</td>
                  {user?.isAdmin && <td className="p-3"></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SmsContactRecord {
  id: string;
  businessName: string;
  contactName: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  businessType: string | null;
  classifications: string | null;
  website: string | null;
  minorityOwned: string | null;
  googleSearchUrl: string | null;
  specialties: string | null;
  outreachDescription: string | null;
  projectFocus: string | null;
  energyRelevance: string | null;
  whyNamcRelevant: string | null;
  membershipValue: string | null;
  membershipPitch: string | null;
  bestOutreachAngle: string | null;
  smsTemplate: string | null;
  emailTemplate: string | null;
  preferredContactName: string | null;
  professionalSalutation: string | null;
  primaryLicenseTypes: string | null;
  status: string;
}

interface SmsBatch {
  batchId: string;
  sentAt: string | null;
  sentBy: string;
  sentByName: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  messagePreview: string;
}

interface SmsInvitationRecord {
  id: string;
  name: string;
  phone: string;
  companyName: string | null;
  email: string | null;
  message: string;
  status: string;
  channel: string;
  twilioSid: string | null;
  sentAt: string | null;
  createdAt: string;
}

const COUNTIES = ["Alameda", "Contra Costa", "San Francisco", "San Mateo", "Santa Clara", "Solano"];

function SmsInvitations() {
  const { toast } = useToast();
  const [innerTab, setInnerTab] = useState<"contacts" | "history">("contacts");
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [hasEmailFilter, setHasEmailFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [composeMode, setComposeMode] = useState<"sms" | "email" | null>(null);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("Join NAMC NorCal - Membership Invitation");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sendResults, setSendResults] = useState<{ total: number; sent: number; failed: number; results: any[] } | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const businessTypesQuery = useQuery<string[]>({
    queryKey: ["/api/portal/admin/sms/contacts/types"],
    queryFn: async () => {
      const res = await fetch("/api/portal/admin/sms/contacts/types", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch business types");
      return res.json();
    },
  });

  const contactsQuery = useQuery<{ contacts: SmsContactRecord[]; total: number }>({
    queryKey: ["/api/portal/admin/sms/contacts", { search, county: countyFilter, businessType: businessTypeFilter, hasEmail: hasEmailFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (countyFilter) params.set("county", countyFilter);
      if (businessTypeFilter) params.set("businessType", businessTypeFilter);
      if (hasEmailFilter) params.set("hasEmail", "true");
      params.set("page", String(page));
      params.set("limit", "50");
      const res = await fetch(`/api/portal/admin/sms/contacts?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery<SmsBatch[]>({
    queryKey: ["/api/portal/admin/sms/history"],
  });

  const { data: batchDetails } = useQuery<SmsInvitationRecord[]>({
    queryKey: ["/api/portal/admin/sms/batch", expandedBatch],
    enabled: !!expandedBatch,
  });

  const sendSmsMutation = useMutation({
    mutationFn: async ({ recipients, messageTemplate }: { recipients: any[]; messageTemplate: string }) => {
      const res = await apiRequest("POST", "/api/portal/admin/sms/send", { recipients, messageTemplate });
      return await res.json();
    },
    onSuccess: (data) => {
      setSendResults(data);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/portal/admin/sms/history"] });
      toast({ title: "SMS batch complete", description: `${data.sent} sent, ${data.failed} failed.` });
    },
    onError: (error: Error) => {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ recipients, subject, messageTemplate }: { recipients: any[]; subject: string; messageTemplate: string }) => {
      const res = await apiRequest("POST", "/api/portal/admin/sms/send-email", { recipients, subject, messageTemplate });
      return await res.json();
    },
    onSuccess: (data) => {
      setSendResults(data);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/portal/admin/sms/history"] });
      toast({ title: "Email batch complete", description: `${data.sent} sent, ${data.failed} failed.` });
    },
    onError: (error: Error) => {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    },
  });

  const contacts = contactsQuery.data?.contacts || [];
  const totalContacts = contactsQuery.data?.total || 0;
  const totalPages = Math.ceil(totalContacts / 50);

  const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
  const selectedWithEmail = selectedContacts.filter(c => c.email);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      contacts.forEach(c => next.add(c.id));
      return next;
    });
  };

  const deselectAll = () => setSelectedIds(new Set());

  const insertVariable = (variable: string) => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = messageTemplate.substring(0, start) + variable + messageTemplate.substring(end);
      setMessageTemplate(newValue);
      setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + variable.length; }, 0);
    } else {
      setMessageTemplate(prev => prev + variable);
    }
  };

  const getPreviewMessage = () => {
    const sample = selectedContacts[0];
    if (!sample) return messageTemplate;
    return messageTemplate
      .replace(/\{\{name\}\}/gi, sample.contactName || sample.businessName)
      .replace(/\{\{business\}\}/gi, sample.businessName)
      .replace(/\{\{company\}\}/gi, sample.businessName);
  };

  const openCompose = (mode: "sms" | "email") => {
    setComposeMode(mode);
    setSendResults(null);
    if (mode === "sms") {
      setMessageTemplate("Hi {{business}}, you're invited to join NAMC NorCal! As a member, you'll access exclusive networking, project opportunities, and resources for minority contractors. Learn more at https://namcnorcal.org");
    } else {
      setMessageTemplate("Dear {{business}},\n\nWe would like to invite you to join the National Association of Minority Contractors, Northern California Chapter (NAMC NorCal).\n\nAs a member, you'll gain access to:\n- Exclusive networking opportunities\n- Project bidding and partnerships\n- Training and certification resources\n- Industry events and workshops\n\nLearn more and apply at https://namcnorcal.org\n\nBest regards,\nNAMC NorCal");
    }
  };

  const handleSend = () => {
    setShowConfirmDialog(false);
    if (composeMode === "sms") {
      const recipients = selectedContacts.map(c => ({
        name: c.contactName || c.businessName,
        phone: c.phone,
        companyName: c.businessName,
        email: c.email,
      }));
      sendSmsMutation.mutate({ recipients, messageTemplate });
    } else {
      sendEmailMutation.mutate({ recipients: selectedWithEmail, subject: emailSubject, messageTemplate });
    }
  };

  const isSending = sendSmsMutation.isPending || sendEmailMutation.isPending;

  if (composeMode && !sendResults) {
    const recipientList = composeMode === "email" ? selectedWithEmail : selectedContacts;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setComposeMode(null)} data-testid="button-back-to-contacts">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Contacts
          </Button>
          <h3 className="font-semibold text-lg">
            {composeMode === "sms" ? <><Phone className="h-5 w-5 inline mr-2" />Compose SMS</> : <><Mail className="h-5 w-5 inline mr-2" />Compose Email</>}
            <span className="text-sm font-normal text-muted-foreground ml-2">({recipientList.length} recipients)</span>
          </h3>
        </div>

        {composeMode === "email" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Line</label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Email subject..."
              data-testid="input-email-subject"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Message</label>
            {composeMode === "sms" && (
              <span className={`text-xs ${messageTemplate.length > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                {messageTemplate.length} chars {messageTemplate.length > 160 && `(${Math.ceil(messageTemplate.length / 160)} segments)`}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button size="sm" variant="outline" onClick={() => insertVariable("{{name}}")} data-testid="button-insert-name">
              <Plus className="h-3 w-3 mr-1" />{"{{name}}"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => insertVariable("{{business}}")} data-testid="button-insert-business">
              <Plus className="h-3 w-3 mr-1" />{"{{business}}"}
            </Button>
            {composeMode === "sms" && selectedContacts.some(c => c.smsTemplate) && (
              <Button size="sm" variant="secondary" onClick={() => {
                const tpl = selectedContacts.find(c => c.smsTemplate)?.smsTemplate;
                if (tpl) setMessageTemplate(tpl);
              }} data-testid="button-use-sms-template">
                <FileText className="h-3 w-3 mr-1" />Use Pre-Written SMS Template
              </Button>
            )}
            {composeMode === "email" && selectedContacts.some(c => c.emailTemplate) && (
              <Button size="sm" variant="secondary" onClick={() => {
                const contact = selectedContacts.find(c => c.emailTemplate);
                if (contact?.emailTemplate) {
                  const salutation = contact.professionalSalutation || "Dear Contractor,";
                  setMessageTemplate(`${salutation}\n\n${contact.emailTemplate}\n\nAs a member, you'll gain access to:\n- Exclusive networking opportunities\n- Project bidding and partnerships\n- Training and certification resources\n- Industry events and workshops\n\nLearn more and apply at https://namcnorcal.org\n\nBest regards,\nNAMC NorCal`);
                }
              }} data-testid="button-use-email-template">
                <FileText className="h-3 w-3 mr-1" />Use Pre-Written Email Template
              </Button>
            )}
          </div>
          <Textarea
            ref={textareaRef}
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={composeMode === "email" ? 10 : 4}
            placeholder="Type your invitation message..."
            data-testid="textarea-sms-message"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Preview (sample)</label>
          <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap" data-testid="text-sms-preview">
            {getPreviewMessage()}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex gap-2 items-start">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {composeMode === "sms"
              ? `This will send ${recipientList.length} SMS message${recipientList.length !== 1 ? "s" : ""} via Twilio.`
              : `This will send ${recipientList.length} email${recipientList.length !== 1 ? "s" : ""} via Resend.`}
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setShowConfirmDialog(true)} disabled={isSending || recipientList.length === 0 || !messageTemplate.trim()} data-testid="button-send-messages">
            {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send {recipientList.length} {composeMode === "sms" ? "SMS" : "Emails"}</>}
          </Button>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Send</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Send {recipientList.length} {composeMode === "sms" ? "SMS" : "email"} invitation{recipientList.length !== 1 ? "s" : ""}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} data-testid="button-cancel-send">Cancel</Button>
              <Button onClick={handleSend} data-testid="button-confirm-send">
                <Send className="h-4 w-4 mr-2" />Yes, Send All
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (sendResults) {
    return (
      <div className="space-y-5">
        <h3 className="font-semibold text-lg">Send Results</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"><Send className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{sendResults.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{sendResults.sent}</p><p className="text-xs text-muted-foreground">Sent</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{sendResults.failed}</p><p className="text-xs text-muted-foreground">Failed</p></div></CardContent></Card>
        </div>
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Contact</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Error</th></tr></thead>
            <tbody>
              {sendResults.results.map((r: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2 font-mono text-xs">{r.phone || r.email}</td>
                  <td className="p-2">{r.status === "sent" ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Sent</Badge> : <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Failed</Badge>}</td>
                  <td className="p-2 text-xs text-muted-foreground">{r.error || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={() => { setSendResults(null); setComposeMode(null); }} data-testid="button-back-after-send">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={innerTab} onValueChange={(v) => setInnerTab(v as any)}>
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="contacts" data-testid="subtab-contacts">
            <Building2 className="h-4 w-4 mr-2" />Contacts ({totalContacts})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="subtab-history">
            <Clock className="h-4 w-4 mr-2" />History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="space-y-3">
            <Input
              placeholder="Search by business name, contact, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              data-testid="input-contact-search"
            />
            <div className="flex flex-wrap gap-2">
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background min-w-0 flex-1 sm:flex-none"
                value={countyFilter}
                onChange={(e) => { setCountyFilter(e.target.value); setPage(1); }}
                data-testid="select-county-filter"
              >
                <option value="">All Counties</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background min-w-0 flex-1 sm:flex-none"
                value={businessTypeFilter}
                onChange={(e) => { setBusinessTypeFilter(e.target.value); setPage(1); }}
                data-testid="select-business-type-filter"
              >
                <option value="">All Business Types</option>
                {(businessTypesQuery.data || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-md px-3 py-2 whitespace-nowrap">
                <Checkbox checked={hasEmailFilter} onCheckedChange={(c) => { setHasEmailFilter(!!c); setPage(1); }} data-testid="checkbox-has-email" />
                Has Email
              </label>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm font-medium">{selectedIds.size} contact{selectedIds.size !== 1 ? "s" : ""} selected</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => openCompose("sms")} data-testid="button-compose-sms">
                  <Phone className="h-4 w-4 mr-1" />Send SMS
                </Button>
                <Button size="sm" variant="outline" onClick={() => openCompose("email")} disabled={selectedContacts.filter(c => c.email).length === 0} data-testid="button-compose-email">
                  <Mail className="h-4 w-4 mr-1" />Send Email ({selectedContacts.filter(c => c.email).length})
                </Button>
                <Button size="sm" variant="ghost" onClick={deselectAll}>Clear</Button>
              </div>
            </div>
          )}

          {contactsQuery.isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : contactsQuery.isError ? (
            <div className="text-center py-8 space-y-3">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">Failed to load contacts.</p>
              <Button size="sm" variant="outline" onClick={() => contactsQuery.refetch()} data-testid="button-retry-contacts">Retry</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={selectAllOnPage} data-testid="button-select-page">Select Page</Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    try {
                      const params = new URLSearchParams();
                      if (search) params.set("search", search);
                      if (countyFilter) params.set("county", countyFilter);
                      if (businessTypeFilter) params.set("businessType", businessTypeFilter);
                      if (hasEmailFilter) params.set("hasEmail", "true");
                      const res = await fetch(`/api/portal/admin/sms/contacts/ids?${params.toString()}`, { credentials: "include" });
                      if (!res.ok) throw new Error("Failed");
                      const ids: string[] = await res.json();
                      setSelectedIds(new Set(ids));
                      toast({ title: `Selected ${ids.length} contacts` });
                    } catch {
                      toast({ title: "Failed to select all", variant: "destructive" });
                    }
                  }} data-testid="button-select-all-matching">Select All Matching ({totalContacts})</Button>
                  {selectedIds.size > 0 && <Button size="sm" variant="ghost" onClick={deselectAll}>Deselect All</Button>}
                </div>
                <span>Page {page} of {totalPages || 1} ({totalContacts} contacts)</span>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 w-10"></th>
                      <th className="p-2 text-left">Business Name</th>
                      <th className="p-2 text-left">Specialties</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">City</th>
                      <th className="p-2 text-left">Focus</th>
                      <th className="p-2 text-left w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <Fragment key={c.id}>
                        <tr className={`border-t hover:bg-muted/20 cursor-pointer ${selectedIds.has(c.id) ? "bg-primary/5" : ""}`}
                          onClick={() => setExpandedContactId(expandedContactId === c.id ? null : c.id)}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} data-testid={`checkbox-contact-${c.id}`} />
                          </td>
                          <td className="p-2" data-testid={`text-business-${c.id}`}>
                            <div className="font-medium">{c.businessName}</div>
                            {c.outreachDescription && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{c.outreachDescription}</div>}
                          </td>
                          <td className="p-2 text-muted-foreground text-xs max-w-[150px] truncate">{c.specialties || c.classifications || "-"}</td>
                          <td className="p-2 font-mono text-xs">{c.phone}</td>
                          <td className="p-2 text-muted-foreground text-xs">{c.city || "-"}</td>
                          <td className="p-2 text-xs">
                            {c.projectFocus ? (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">{c.projectFocus.replace("Primarily ", "")}</Badge>
                            ) : "-"}
                          </td>
                          <td className="p-2">
                            {expandedContactId === c.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </td>
                        </tr>
                        {expandedContactId === c.id && (
                          <tr className="bg-muted/10">
                            <td colSpan={7} className="p-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-3">
                                  {c.outreachDescription && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                                      <p className="text-sm" data-testid={`text-description-${c.id}`}>{c.outreachDescription}</p>
                                    </div>
                                  )}
                                  {c.bestOutreachAngle && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Best Outreach Angle</p>
                                      <p className="text-sm">{c.bestOutreachAngle}</p>
                                    </div>
                                  )}
                                  {c.whyNamcRelevant && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why NAMC is Relevant</p>
                                      <p className="text-sm">{c.whyNamcRelevant}</p>
                                    </div>
                                  )}
                                  {c.membershipPitch && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Membership Pitch</p>
                                      <p className="text-sm">{c.membershipPitch}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                                      <p>{c.preferredContactName || c.contactName || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Salutation</p>
                                      <p>{c.professionalSalutation || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">County</p>
                                      <p>{c.county || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                                      <p className="truncate">{c.email || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Focus</p>
                                      <p>{c.projectFocus || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Energy Relevance</p>
                                      <p>{c.energyRelevance || "-"}</p>
                                    </div>
                                  </div>
                                  {c.smsTemplate && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pre-Written SMS</p>
                                      <p className="text-xs bg-muted/50 rounded p-2 italic">{c.smsTemplate}</p>
                                    </div>
                                  )}
                                  {c.emailTemplate && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pre-Written Email Opener</p>
                                      <p className="text-xs bg-muted/50 rounded p-2 italic">{c.emailTemplate}</p>
                                    </div>
                                  )}
                                  {c.website && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Website</p>
                                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{c.website}</a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages || 1}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">Next</Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-history">No invitations have been sent yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((batch) => (
                <div key={batch.batchId} className="border rounded-lg">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedBatch(expandedBatch === batch.batchId ? null : batch.batchId)}
                    data-testid={`batch-row-${batch.batchId}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {batch.batchId.startsWith("email_") ? <Mail className="h-4 w-4 text-blue-500" /> : <Phone className="h-4 w-4 text-green-500" />}
                        <p className="font-medium text-sm truncate">{batch.messagePreview}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{batch.sentAt ? new Date(batch.sentAt).toLocaleDateString() : "N/A"}</span>
                        <span>by {batch.sentByName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">{batch.total} total</Badge>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">{batch.sent} sent</Badge>
                        {batch.failed > 0 && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{batch.failed} failed</Badge>}
                      </div>
                      {expandedBatch === batch.batchId ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedBatch === batch.batchId && (
                    <div className="border-t px-4 pb-4">
                      {!batchDetails ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : (
                        <table className="w-full text-sm mt-3">
                          <thead className="bg-muted/50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Company</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Sent At</th></tr></thead>
                          <tbody>
                            {batchDetails.map((inv) => (
                              <tr key={inv.id} className="border-t">
                                <td className="p-2">{inv.name}</td>
                                <td className="p-2 font-mono text-xs">{inv.phone || inv.email}</td>
                                <td className="p-2 text-muted-foreground">{inv.companyName || "-"}</td>
                                <td className="p-2">
                                  {inv.status === "sent" ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Sent</Badge>
                                    : inv.status === "failed" ? <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Failed</Badge>
                                    : <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">{inv.status}</Badge>}
                                </td>
                                <td className="p-2 text-xs text-muted-foreground">{inv.sentAt ? new Date(inv.sentAt).toLocaleString() : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type RenewalMember = {
  id: string;
  contactName: string;
  companyName: string;
  email: string;
  membershipTier: string;
  renewalDate: string | null;
  status: "overdue" | "due-30" | "due-60" | "due-90" | "ok" | "unknown";
  daysUntil: number | null;
};

function renewalStatusBadge(m: RenewalMember) {
  if (m.status === "overdue") {
    const days = m.daysUntil !== null ? Math.abs(m.daysUntil) : null;
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs whitespace-nowrap">{days !== null ? `${days}d overdue` : "Overdue"}</Badge>;
  }
  if (m.status === "due-30") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs whitespace-nowrap">{m.daysUntil !== null ? `${m.daysUntil}d` : "≤30d"}</Badge>;
  if (m.status === "due-60") return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs whitespace-nowrap">{m.daysUntil !== null ? `${m.daysUntil}d` : "≤60d"}</Badge>;
  if (m.status === "due-90") return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs whitespace-nowrap">{m.daysUntil !== null ? `${m.daysUntil}d` : "≤90d"}</Badge>;
  return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">OK</Badge>;
}

type RenewalMemberTableProps = {
  group: RenewalMember[];
  groupKey: string;
  actionable: boolean;
  sendingEmails: Set<string>;
  sendingGroup: string | null;
  onSend: (emails: string[], groupKey?: string) => void;
};

function RenewalMemberTable({ group, groupKey, actionable, sendingEmails, sendingGroup, onSend }: RenewalMemberTableProps) {
  if (group.length === 0) return <p className="text-sm text-muted-foreground py-2">No members in this group.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left p-2 font-medium">Member</th>
            <th className="text-left p-2 font-medium hidden sm:table-cell">Company</th>
            <th className="text-left p-2 font-medium hidden md:table-cell">Tier</th>
            <th className="text-left p-2 font-medium">Renewal</th>
            <th className="text-left p-2 font-medium">Status</th>
            {actionable && <th className="text-right p-2 font-medium">Action</th>}
          </tr>
        </thead>
        <tbody>
          {group.map(m => (
            <tr key={m.id} className="border-b last:border-b-0 hover:bg-muted/30" data-testid={`row-renewal-${m.id}`}>
              <td className="p-2">
                <p className="font-medium">{m.contactName}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
                <p className="text-xs text-muted-foreground sm:hidden">{m.companyName}</p>
              </td>
              <td className="p-2 hidden sm:table-cell text-muted-foreground">{m.companyName}</td>
              <td className="p-2 hidden md:table-cell text-muted-foreground text-xs">{m.membershipTier || "—"}</td>
              <td className="p-2 text-xs text-muted-foreground whitespace-nowrap">{m.renewalDate || "—"}</td>
              <td className="p-2">{renewalStatusBadge(m)}</td>
              {actionable && (
                <td className="p-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={sendingEmails.has(m.email) || sendingGroup === groupKey}
                    onClick={() => onSend([m.email])}
                    data-testid={`button-send-renewal-${m.id}`}
                  >
                    {sendingEmails.has(m.email) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Send
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type RenewalGroupCardProps = {
  title: string;
  icon: React.ReactNode;
  group: RenewalMember[];
  groupKey: string;
  colorClass: string;
  description: string;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  sendingEmails: Set<string>;
  sendingGroup: string | null;
  onSend: (emails: string[], groupKey?: string) => void;
};

function RenewalGroupCard({ title, icon, group, groupKey, colorClass, description, isOpen, onToggle, sendingEmails, sendingGroup, onSend }: RenewalGroupCardProps) {
  const actionable = groupKey !== "ok";
  const validEmails = group.map(m => m.email).filter(Boolean);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
                {icon}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {title}
                  <Badge className="ml-1" variant="secondary">{group.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actionable && validEmails.length > 0 && (
                <Button
                  size="sm"
                  className="bg-[#E5A830] hover:bg-[#d4961f] text-black text-xs"
                  disabled={sendingGroup === groupKey || sendingEmails.size > 0}
                  onClick={() => onSend(validEmails, groupKey)}
                  data-testid={`button-email-all-${groupKey}`}
                >
                  {sendingGroup === groupKey
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sending…</>
                    : <><Send className="h-3 w-3 mr-1" />Email All ({validEmails.length})</>
                  }
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`button-toggle-${groupKey}`}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <RenewalMemberTable group={group} groupKey={groupKey} actionable={actionable} sendingEmails={sendingEmails} sendingGroup={sendingGroup} onSend={onSend} />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function RenewalReminders() {
  const { toast } = useToast();
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const [sendingGroup, setSendingGroup] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overdue: true, "due-30": true, "due-60": true, "due-90": true, ok: true,
  });

  const { data: members = [], isLoading, refetch } = useQuery<RenewalMember[]>({
    queryKey: ["/api/portal/admin/renewals"],
  });

  function toggleGroup(key: string, open: boolean) {
    setOpenGroups(prev => ({ ...prev, [key]: open }));
  }

  async function sendReminders(emails: string[], groupKey?: string) {
    if (groupKey) setSendingGroup(groupKey);
    else setSendingEmails(prev => new Set([...prev, ...emails]));

    try {
      const res = await apiRequest("POST", "/api/portal/admin/renewals/send-reminder", { emails });
      const data = await res.json();
      toast({ title: "Reminders sent!", description: data.message });
    } catch {
      toast({ title: "Failed to send reminders", variant: "destructive" });
    } finally {
      if (groupKey) setSendingGroup(null);
      else setSendingEmails(prev => {
        const next = new Set(prev);
        emails.forEach(e => next.delete(e));
        return next;
      });
    }
  }

  const overdue = members.filter(m => m.status === "overdue");
  const due30 = members.filter(m => m.status === "due-30");
  const due60 = members.filter(m => m.status === "due-60");
  const due90 = members.filter(m => m.status === "due-90");
  const ok = members.filter(m => m.status === "ok" || m.status === "unknown");
  const totalActionable = overdue.length + due30.length + due60.length + due90.length;

  const shared = { sendingEmails, sendingGroup, onSend: sendReminders };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#E5A830]" />
            Membership Dues Renewals
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${totalActionable} member${totalActionable !== 1 ? "s" : ""} need renewal outreach`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-renewals">
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <RenewalGroupCard title="Overdue" icon={<AlertCircle className="h-5 w-5 text-red-600" />} group={overdue} groupKey="overdue" colorClass="bg-red-100 dark:bg-red-900/30" description="Membership has already expired — send a reminder immediately" isOpen={!!openGroups["overdue"]} onToggle={() => toggleGroup("overdue")} {...shared} />
          <RenewalGroupCard title="Due in 30 Days" icon={<CalendarClock className="h-5 w-5 text-amber-600" />} group={due30} groupKey="due-30" colorClass="bg-amber-100 dark:bg-amber-900/30" description="Renewal coming up within the next 30 days" isOpen={!!openGroups["due-30"]} onToggle={() => toggleGroup("due-30")} {...shared} />
          <RenewalGroupCard title="Due in 31-60 Days" icon={<CalendarClock className="h-5 w-5 text-yellow-600" />} group={due60} groupKey="due-60" colorClass="bg-yellow-100 dark:bg-yellow-900/30" description="Renewal coming up in the next 31 to 60 days" isOpen={!!openGroups["due-60"]} onToggle={() => toggleGroup("due-60")} {...shared} />
          <RenewalGroupCard title="Due in 61-90 Days" icon={<CalendarClock className="h-5 w-5 text-blue-600" />} group={due90} groupKey="due-90" colorClass="bg-blue-100 dark:bg-blue-900/30" description="Renewal coming up in the next 61 to 90 days" isOpen={!!openGroups["due-90"]} onToggle={() => toggleGroup("due-90")} {...shared} />
          <RenewalGroupCard title="No Action Needed" icon={<CheckCircle className="h-5 w-5 text-green-600" />} group={ok} groupKey="ok" colorClass="bg-green-100 dark:bg-green-900/30" description="Members renewing in 90+ days or with no renewal date on file" isOpen={!!openGroups["ok"]} onToggle={() => toggleGroup("ok")} {...shared} />
        </div>
      )}
    </div>
  );
}
