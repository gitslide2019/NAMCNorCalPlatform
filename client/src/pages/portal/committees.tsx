import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { UsersRound, ChevronRight, Crown } from "lucide-react";
import { Eyebrow, SectionNumeral, Stat, RevealOnScroll } from "@/components/editorial";
import type { Committee } from "@shared/schema";

type CommitteeListItem = Committee & {
  memberCount: number;
  chairName: string | null;
  isMember: boolean;
};

export default function CommitteesPage() {
  const { user } = useAuth();

  const { data: committees, isLoading } = useQuery<CommitteeListItem[]>({
    queryKey: ["/api/portal/committees"],
  });

  const isAdmin = !!user?.isAdmin;
  const list = committees || [];
  const joined = list.filter((c) => c.isMember).length;

  return (
    <PortalLayout>
      <div className="space-y-10 p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto" data-testid="page-committees">
        <header className="space-y-4 border-b border-foreground/10 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Eyebrow>Working groups</Eyebrow>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[0.95]" data-testid="text-page-title">
                Committees
              </h1>
              <p className="max-w-xl text-muted-foreground">
                Where the chapter's work actually gets done — governance, programs, outreach, finance. Pick one and pull a chair up.
              </p>
            </div>
            {isAdmin && (
              <Link href="/portal/admin">
                <Badge variant="outline" className="text-xs cursor-pointer pressable" data-testid="link-admin-committees">
                  Manage in Admin Panel
                </Badge>
              </Link>
            )}
          </div>
          {!isLoading && list.length > 0 && (
            <div className="flex flex-wrap gap-x-10 gap-y-2 pt-2">
              <Stat value={list.length} label="Active committees" data-testid="stat-committees-count" />
              <Stat value={joined} label="You've joined" data-testid="stat-committees-joined" />
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card className="shadow-editorial">
            <CardContent className="py-14 text-center text-muted-foreground" data-testid="text-empty-state">
              No active committees yet. Check back soon — an admin can set them up.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {list.map((c, idx) => (
              <RevealOnScroll key={c.id} delay={idx * 60}>
                <Link href={`/portal/committees/${c.id}`}>
                  <Card
                    className="group relative h-full cursor-pointer shadow-editorial pressable overflow-hidden"
                    data-testid={`card-committee-${c.id}`}
                  >
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <SectionNumeral number={String(idx + 1).padStart(2, "0")} className="mb-0" />
                          <h3 className="font-display text-2xl leading-tight tracking-tight" data-testid={`text-committee-name-${c.id}`}>
                            {c.name}
                          </h3>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{c.category}</p>
                        </div>
                        {c.isMember && (
                          <Badge variant="outline" className="border-primary/60 text-[10px] uppercase tracking-wider">
                            Joined
                          </Badge>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                      )}
                      <div className="flex items-center justify-between border-t border-foreground/10 pt-3 text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1.5" data-testid={`text-member-count-${c.id}`}>
                            <UsersRound className="h-3.5 w-3.5" />
                            <span className="font-display font-semibold tabular-nums text-foreground">{c.memberCount}</span>
                            <span className="text-xs">{c.memberCount === 1 ? "member" : "members"}</span>
                          </span>
                          {c.chairName && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Crown className="h-3.5 w-3.5 text-primary" />
                              {c.chairName}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                          Open <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
