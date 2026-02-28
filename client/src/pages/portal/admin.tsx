import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Loader2, 
  FileText, 
  Eye,
  ShieldCheck
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Redirect } from "wouter";
import { useState } from "react";
import type { MembershipApplication } from "@shared/schema";

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

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);

  const { data: applications, isLoading } = useQuery<MembershipApplication[]>({
    queryKey: ["/api/membership-applications"],
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

  if (!user?.isAdmin) {
    return <Redirect to="/portal" />;
  }

  const pending = (applications || []).filter(a => a.status === "pending" || !a.status).length;
  const approved = (applications || []).filter(a => a.status === "approved").length;
  const rejected = (applications || []).filter(a => a.status === "rejected").length;

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-admin-title">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">Manage membership applications.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open("/api/membership-applications-export/csv", "_blank")}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => statusMutation.mutate({ id: app.id, status: "approved" })}
                                  disabled={statusMutation.isPending}
                                  data-testid={`button-approve-${app.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => statusMutation.mutate({ id: app.id, status: "rejected" })}
                                  disabled={statusMutation.isPending}
                                  data-testid={`button-reject-${app.id}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {app.status === "approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => statusMutation.mutate({ id: app.id, status: "pending" })}
                                disabled={statusMutation.isPending}
                                data-testid={`button-revert-${app.id}`}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                            {app.status === "rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => statusMutation.mutate({ id: app.id, status: "pending" })}
                                disabled={statusMutation.isPending}
                                data-testid={`button-revert-${app.id}`}
                              >
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
    </PortalLayout>
  );
}
