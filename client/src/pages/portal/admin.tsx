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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Redirect, useLocation } from "wouter";
import { useState, useRef } from "react";
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
          <TabsList className={`grid w-full max-w-lg ${user?.isAdmin ? "grid-cols-3" : "grid-cols-1"}`}>
            {user?.isAdmin && (
              <TabsTrigger value="applications" data-testid="tab-applications">
                <Users className="h-4 w-4 mr-2" />Applications
              </TabsTrigger>
            )}
            <TabsTrigger value="finance" data-testid="tab-finance">
              <DollarSign className="h-4 w-4 mr-2" />Finance
            </TabsTrigger>
            {user?.isAdmin && (
              <TabsTrigger value="sms" data-testid="tab-sms">
                <MessageSquare className="h-4 w-4 mr-2" />SMS Invites
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
            <TabsContent value="sms">
              <SmsInvitations />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PortalLayout>
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

interface CsvContact {
  name: string;
  phone: string;
  companyName?: string;
  email?: string;
  valid: boolean;
  error?: string;
  selected?: boolean;
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
  twilioSid: string | null;
  sentAt: string | null;
  createdAt: string;
}

function SmsInvitations() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [step, setStep] = useState<"upload" | "compose" | "preview" | "results">("upload");
  const [contacts, setContacts] = useState<CsvContact[]>([]);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {{name}}, you're invited to join NAMC NorCal! As a member, you'll access exclusive networking, project opportunities, and resources for minority contractors. Learn more and apply at https://namcnorcal.org"
  );
  const [sendResults, setSendResults] = useState<{ total: number; sent: number; failed: number; results: any[] } | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: history, isLoading: historyLoading } = useQuery<SmsBatch[]>({
    queryKey: ["/api/portal/admin/sms/history"],
  });

  const { data: batchDetails } = useQuery<SmsInvitationRecord[]>({
    queryKey: ["/api/portal/admin/sms/batch", expandedBatch],
    enabled: !!expandedBatch,
  });

  const parseMutation = useMutation({
    mutationFn: async (csvContent: string) => {
      const res = await apiRequest("POST", "/api/portal/admin/sms/parse-csv", { csvContent });
      return await res.json();
    },
    onSuccess: (data) => {
      const withSelection = data.contacts.map((c: CsvContact) => ({ ...c, selected: c.valid }));
      setContacts(withSelection);
      if (data.validRows > 0) {
        setStep("compose");
        toast({ title: "CSV parsed", description: `Found ${data.validRows} valid contacts out of ${data.totalRows} rows.` });
      } else {
        toast({ title: "No valid contacts", description: "The CSV didn't contain any valid contacts. Make sure each row has a name and phone number.", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Parse failed", description: error.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ recipients, messageTemplate }: { recipients: CsvContact[]; messageTemplate: string }) => {
      const res = await apiRequest("POST", "/api/portal/admin/sms/send", { recipients, messageTemplate });
      return await res.json();
    },
    onSuccess: (data) => {
      setSendResults(data);
      setStep("results");
      queryClient.invalidateQueries({ queryKey: ["/api/portal/admin/sms/history"] });
      toast({
        title: "SMS invitations sent",
        description: `${data.sent} sent, ${data.failed} failed out of ${data.total} total.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseMutation.mutate(content);
    };
    reader.readAsText(file);
  };

  const selectedContacts = contacts.filter(c => c.selected && c.valid);

  const insertVariable = (variable: string) => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = messageTemplate.substring(0, start) + variable + messageTemplate.substring(end);
      setMessageTemplate(newValue);
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + variable.length;
      }, 0);
    } else {
      setMessageTemplate(prev => prev + variable);
    }
  };

  const getPreviewMessage = () => {
    if (selectedContacts.length === 0) return messageTemplate;
    const sample = selectedContacts[0];
    return messageTemplate
      .replace(/\{\{name\}\}/gi, sample.name)
      .replace(/\{\{company\}\}/gi, sample.companyName || "your company");
  };

  const handleSend = () => {
    setShowConfirmDialog(false);
    sendMutation.mutate({ recipients: selectedContacts, messageTemplate });
  };

  const resetFlow = () => {
    setStep("upload");
    setContacts([]);
    setSendResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send SMS Invitations
          </CardTitle>
          <CardDescription>Upload a CSV of prospective members, compose your message, and send SMS invitations.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="csv-upload-area"
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Click to upload CSV file</p>
                <p className="text-sm text-muted-foreground mt-1">Expected columns: Name, Phone, Company (optional), Email (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-csv-file"
                />
              </div>
              {parseMutation.isPending && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Parsing CSV...</span>
                </div>
              )}
              {contacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {contacts.filter(c => c.valid).length} valid / {contacts.length} total contacts
                    </p>
                    <Button size="sm" variant="outline" onClick={resetFlow} data-testid="button-reset-csv">Reset</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "compose" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Recipients ({selectedContacts.length} selected)</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setContacts(prev => prev.map(c => ({ ...c, selected: c.valid })))} data-testid="button-select-all">Select All</Button>
                  <Button size="sm" variant="ghost" onClick={() => setContacts(prev => prev.map(c => ({ ...c, selected: false })))} data-testid="button-deselect-all">Deselect All</Button>
                </div>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-10"></th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">Company</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact, idx) => (
                      <tr key={idx} className={`border-t ${!contact.valid ? "opacity-50 bg-red-50 dark:bg-red-900/10" : ""}`}>
                        <td className="p-2">
                          <Checkbox
                            checked={contact.selected || false}
                            disabled={!contact.valid}
                            onCheckedChange={(checked) => {
                              setContacts(prev => prev.map((c, i) => i === idx ? { ...c, selected: !!checked } : c));
                            }}
                            data-testid={`checkbox-contact-${idx}`}
                          />
                        </td>
                        <td className="p-2" data-testid={`text-contact-name-${idx}`}>{contact.name}</td>
                        <td className="p-2 font-mono text-xs">{contact.phone}</td>
                        <td className="p-2 text-muted-foreground">{contact.companyName || "-"}</td>
                        <td className="p-2 text-muted-foreground text-xs">{contact.email || "-"}</td>
                        <td className="p-2">
                          {contact.valid ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Valid</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{contact.error}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium">Message</label>
                  <span className={`text-xs ${messageTemplate.length > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {messageTemplate.length} / 160 chars {messageTemplate.length > 160 && "(multi-segment SMS)"}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => insertVariable("{{name}}")} data-testid="button-insert-name">
                    <Plus className="h-3 w-3 mr-1" />{"{{name}}"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertVariable("{{company}}")} data-testid="button-insert-company">
                    <Plus className="h-3 w-3 mr-1" />{"{{company}}"}
                  </Button>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={4}
                  placeholder="Type your invitation message..."
                  data-testid="textarea-sms-message"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("upload")} data-testid="button-back-to-upload">
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
                <Button
                  onClick={() => setStep("preview")}
                  disabled={selectedContacts.length === 0 || !messageTemplate.trim()}
                  data-testid="button-preview-sms"
                >
                  Preview & Send
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" data-testid="text-recipient-count">{selectedContacts.length}</p>
                    <p className="text-xs text-muted-foreground">Recipients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{messageTemplate.length}</p>
                    <p className="text-xs text-muted-foreground">Characters</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{Math.ceil(messageTemplate.length / 160)}</p>
                    <p className="text-xs text-muted-foreground">SMS Segments</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message Preview (sample)</label>
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap" data-testid="text-sms-preview">
                  {getPreviewMessage()}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This will send {selectedContacts.length} SMS message{selectedContacts.length !== 1 ? "s" : ""} via Twilio. Standard messaging rates apply.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("compose")} data-testid="button-back-to-compose">
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={sendMutation.isPending}
                  data-testid="button-send-sms"
                >
                  {sendMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Send {selectedContacts.length} SMS</>
                  )}
                </Button>
              </div>

              <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm SMS Send</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to send {selectedContacts.length} SMS invitation{selectedContacts.length !== 1 ? "s" : ""}? This action cannot be undone.
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
          )}

          {step === "results" && sendResults && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Send className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-total-sent">{sendResults.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{sendResults.sent}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{sendResults.failed}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sendResults.results.map((r: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 font-mono text-xs">{r.phone}</td>
                        <td className="p-2">
                          {r.status === "sent" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Sent</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Failed</Badge>
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{r.error || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button onClick={resetFlow} data-testid="button-new-batch">
                <Plus className="h-4 w-4 mr-2" />Send Another Batch
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Invitation History
          </CardTitle>
          <CardDescription>View past SMS invitation batches and their delivery status.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-history">No SMS invitations have been sent yet.</p>
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
                        {batch.failed > 0 && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{batch.failed} failed</Badge>
                        )}
                      </div>
                      {expandedBatch === batch.batchId ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {expandedBatch === batch.batchId && (
                    <div className="border-t px-4 pb-4">
                      {!batchDetails ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <table className="w-full text-sm mt-3">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-2 text-left">Name</th>
                              <th className="p-2 text-left">Phone</th>
                              <th className="p-2 text-left">Company</th>
                              <th className="p-2 text-left">Status</th>
                              <th className="p-2 text-left">Sent At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchDetails.map((inv) => (
                              <tr key={inv.id} className="border-t">
                                <td className="p-2">{inv.name}</td>
                                <td className="p-2 font-mono text-xs">{inv.phone}</td>
                                <td className="p-2 text-muted-foreground">{inv.companyName || "-"}</td>
                                <td className="p-2">
                                  {inv.status === "sent" ? (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Sent</Badge>
                                  ) : inv.status === "failed" ? (
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Failed</Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">{inv.status}</Badge>
                                  )}
                                </td>
                                <td className="p-2 text-xs text-muted-foreground">
                                  {inv.sentAt ? new Date(inv.sentAt).toLocaleString() : "-"}
                                </td>
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
        </CardContent>
      </Card>
    </div>
  );
}
