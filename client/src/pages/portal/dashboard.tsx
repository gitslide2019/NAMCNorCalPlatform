import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { User, Users, Building2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MembershipApplication } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" data-testid="badge-status-approved"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" data-testid="badge-status-rejected"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" data-testid="badge-status-pending"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: application, isLoading } = useQuery<MembershipApplication | null>({
    queryKey: ["/api/portal/my-application"],
  });

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dashboard-title">
            Welcome back, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your NAMC NorCal membership.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : application ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card data-testid="card-membership-status">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Membership Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {getStatusBadge(application.status)}
                </CardContent>
              </Card>

              <Card data-testid="card-company-info">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{application.companyName}</p>
                  <p className="text-sm text-muted-foreground">{application.city}, {application.state}</p>
                </CardContent>
              </Card>

              <Card data-testid="card-membership-tier">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Membership Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold capitalize">{application.membershipCategory}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.membershipCategory === "small" && "$400/year"}
                    {application.membershipCategory === "medium" && "$800/year"}
                    {application.membershipCategory === "large" && "$1,200/year"}
                    {application.membershipCategory === "government" && "$1,800/year"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/portal/profile">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-profile">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">My Profile</p>
                      <p className="text-sm text-muted-foreground">View & edit your info</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/portal/directory">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-directory">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Member Directory</p>
                      <p className="text-sm text-muted-foreground">Browse NAMC members</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <a href="https://www.namcnorcal.org" target="_blank" rel="noopener noreferrer">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="link-quick-namc">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">NAMC NorCal</p>
                      <p className="text-sm text-muted-foreground">Visit main website</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>
          </>
        ) : (
          <Card data-testid="card-no-application">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Linked Application</h3>
              <p className="text-muted-foreground mb-4">
                Your account isn't linked to a membership application yet. 
                Please contact an administrator to link your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Email: <a href="mailto:info@namcnorcal.org" className="text-primary hover:underline">info@namcnorcal.org</a>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
