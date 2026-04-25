import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { UsersRound, ChevronRight, Crown } from "lucide-react";
import type { Committee } from "@shared/schema";

type CommitteeListItem = Committee & {
  memberCount: number;
  chairName: string | null;
  isMember: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  governance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  programs: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  outreach: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function CommitteesPage() {
  const { user } = useAuth();

  const { data: committees, isLoading } = useQuery<CommitteeListItem[]>({
    queryKey: ["/api/portal/committees"],
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
            <Link href="/portal/admin">
              <Badge variant="outline" className="text-xs cursor-pointer hover-elevate" data-testid="link-admin-committees">
                Manage in Admin Panel
              </Badge>
            </Link>
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
              No active committees yet. Check back soon — an admin can set them up.
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
