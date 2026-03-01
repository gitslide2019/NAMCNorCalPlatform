import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, DollarSign, Target, Calendar, Loader2, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: string;
  currentAmount: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdById: string;
  createdAt: string;
}

interface Pledge {
  id: string;
  campaignId: string;
  userId: string;
  amount: string;
  note: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  username: string;
  companyName: string;
}

interface CampaignWithPledges extends Campaign {
  pledges: Pledge[];
}

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", goalAmount: "", startDate: "", endDate: "" });
  const [pledgeData, setPledgeData] = useState({ amount: "", note: "" });
  const isAdmin = user?.isAdmin;
  const isBoardOrAdmin = isAdmin;

  const { data: campaignsList, isLoading } = useQuery<Campaign[]>({ queryKey: ["/api/portal/campaigns"] });
  const { data: selectedCampaign } = useQuery<CampaignWithPledges>({
    queryKey: ["/api/portal/campaigns", selectedId],
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/portal/campaigns", {
        ...formData,
        createdById: user!.id,
        endDate: formData.endDate || null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/campaigns"] });
      toast({ title: "Campaign created" });
      setCreateOpen(false);
      setFormData({ title: "", description: "", goalAmount: "", startDate: "", endDate: "" });
    },
    onError: (error: Error) => toast({ title: "Failed", description: error.message, variant: "destructive" }),
  });

  const pledgeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/portal/campaigns/${selectedId}/pledges`, pledgeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/campaigns", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/campaigns"] });
      toast({ title: "Pledge submitted" });
      setPledgeOpen(false);
      setPledgeData({ amount: "", note: "" });
    },
    onError: (error: Error) => toast({ title: "Failed", description: error.message, variant: "destructive" }),
  });

  const updatePledgeMutation = useMutation({
    mutationFn: async ({ pledgeId, status }: { pledgeId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/portal/campaigns/${selectedId}/pledges/${pledgeId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/campaigns", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/campaigns"] });
      toast({ title: "Pledge updated" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/portal/campaigns/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/campaigns"] });
      setSelectedId(null);
      toast({ title: "Campaign deleted" });
    },
  });

  const fmt = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? "$0" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const pct = (current: string, goal: string) => {
    const c = parseFloat(current);
    const g = parseFloat(goal);
    if (!g) return 0;
    return Math.min(100, Math.round((c / g) * 100));
  };

  if (selectedId && selectedCampaign) {
    const campaign = selectedCampaign;
    const progress = pct(campaign.currentAmount, campaign.goalAmount);
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-5xl">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="mb-4" data-testid="button-back-campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Campaigns
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-campaign-title">{campaign.title}</h1>
              <p className="text-muted-foreground mt-1">{campaign.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>{campaign.status}</Badge>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => deleteCampaignMutation.mutate(campaign.id)} data-testid="button-delete-campaign">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-primary">{fmt(campaign.currentAmount)}</span>
                <span className="text-muted-foreground">of {fmt(campaign.goalAmount)} goal</span>
              </div>
              <Progress value={progress} className="h-3 mb-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{progress}% funded</span>
                <span>{campaign.pledges.length} pledge(s)</span>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Started {campaign.startDate}</span>
                {campaign.endDate && <span>Ends {campaign.endDate}</span>}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pledges</h2>
            {campaign.status === "active" && (
              <Dialog open={pledgeOpen} onOpenChange={setPledgeOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-make-pledge"><DollarSign className="h-4 w-4 mr-2" />Make a Pledge</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Make a Pledge</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input type="number" placeholder="Amount ($)" value={pledgeData.amount} onChange={e => setPledgeData(p => ({ ...p, amount: e.target.value }))} data-testid="input-pledge-amount" />
                    <Textarea placeholder="Note (optional)" value={pledgeData.note} onChange={e => setPledgeData(p => ({ ...p, note: e.target.value }))} data-testid="input-pledge-note" />
                    <Button onClick={() => pledgeMutation.mutate()} disabled={!pledgeData.amount || pledgeMutation.isPending} className="w-full" data-testid="button-submit-pledge">
                      {pledgeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}Submit Pledge
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {campaign.pledges.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No pledges yet. Be the first to contribute!</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {campaign.pledges.map(pledge => (
                <Card key={pledge.id} data-testid={`card-pledge-${pledge.id}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pledge.companyName || pledge.username}</p>
                      <p className="text-sm text-muted-foreground">{fmt(pledge.amount)} — {new Date(pledge.createdAt).toLocaleDateString()}</p>
                      {pledge.note && <p className="text-sm mt-1">{pledge.note}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pledge.status === "received" ? "default" : pledge.status === "pledged" ? "secondary" : "destructive"} className="flex items-center gap-1">
                        {pledge.status === "received" ? <CheckCircle className="h-3 w-3" /> : pledge.status === "pledged" ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {pledge.status}
                      </Badge>
                      {isAdmin && pledge.status === "pledged" && (
                        <Button size="sm" onClick={() => updatePledgeMutation.mutate({ pledgeId: pledge.id, status: "received" })} data-testid={`button-mark-received-${pledge.id}`}>
                          Mark Received
                        </Button>
                      )}
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

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-campaigns-title">Fundraising Campaigns</h1>
            <p className="text-muted-foreground mt-1">Capital campaigns and fundraising initiatives.</p>
          </div>
          {isBoardOrAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-campaign"><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Campaign title" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} data-testid="input-campaign-title" />
                  <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} data-testid="input-campaign-description" />
                  <Input type="number" placeholder="Goal amount ($)" value={formData.goalAmount} onChange={e => setFormData(f => ({ ...f, goalAmount: e.target.value }))} data-testid="input-campaign-goal" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Start Date</label>
                      <Input type="date" value={formData.startDate} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} data-testid="input-campaign-start" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">End Date (optional)</label>
                      <Input type="date" value={formData.endDate} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} data-testid="input-campaign-end" />
                    </div>
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={!formData.title || !formData.goalAmount || !formData.startDate || createMutation.isPending} className="w-full" data-testid="button-submit-campaign">
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : !campaignsList?.length ? (
          <Card><CardContent className="p-8 text-center"><Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">No campaigns yet.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaignsList.map(campaign => {
              const progress = pct(campaign.currentAmount, campaign.goalAmount);
              return (
                <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(campaign.id)} data-testid={`card-campaign-${campaign.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>{campaign.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="font-semibold text-primary">{fmt(campaign.currentAmount)}</span>
                      <span className="text-muted-foreground">of {fmt(campaign.goalAmount)}</span>
                    </div>
                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">{progress}% funded</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
