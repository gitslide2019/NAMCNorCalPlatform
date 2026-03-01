import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Phone, Mail, Globe, Users, ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DirectoryMember {
  id: string;
  companyName: string;
  contactName: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  website: string | null;
  primaryServices: string | null;
  certifications: string | null;
  membershipCategory: string;
  isBoardMember: boolean;
  profileImageUrl: string | null;
}

export default function Directory() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: members, isLoading } = useQuery<DirectoryMember[]>({
    queryKey: ["/api/portal/directory"],
  });

  const filtered = (members || []).filter((m) => {
    const matchesSearch = !search || 
      m.companyName.toLowerCase().includes(search.toLowerCase()) ||
      m.contactName.toLowerCase().includes(search.toLowerCase()) ||
      (m.primaryServices || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.membershipCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const corporateMembers = filtered.filter(m => m.membershipCategory === "large");
  const otherMembers = filtered.filter(m => m.membershipCategory !== "large");

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/portal")}
          className="mb-4"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-directory-title">Member Directory</h1>
          <p className="text-muted-foreground mt-1">Browse and connect with NAMC NorCal member companies.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, name, or services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-directory-search"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="small">Small Business</SelectItem>
              <SelectItem value="medium">Medium Business</SelectItem>
              <SelectItem value="large">Corporate Partners</SelectItem>
              <SelectItem value="government">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search || categoryFilter !== "all"
                  ? "No members match your search criteria."
                  : "No approved members in the directory yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-directory-count">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
            </p>

            {corporateMembers.length > 0 && categoryFilter !== "all" ? null : corporateMembers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-[#E5A830]" />
                  <h2 className="text-lg font-semibold" data-testid="text-corporate-section">Corporate Partners</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {corporateMembers.map((member) => (
                    <MemberCard key={member.id} member={member} setLocation={setLocation} />
                  ))}
                </div>
              </div>
            )}

            {categoryFilter === "all" && corporateMembers.length > 0 && otherMembers.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">All Members</h2>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {(categoryFilter === "all" ? otherMembers : filtered).map((member) => (
                <MemberCard key={member.id} member={member} setLocation={setLocation} />
              ))}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}

function MemberCard({ member, setLocation }: { member: DirectoryMember; setLocation: (path: string) => void }) {
  const isCorporate = member.membershipCategory === "large";

  return (
    <Card
      className={`hover-elevate cursor-pointer transition-all ${isCorporate ? "border-l-4 border-l-[#E5A830]" : ""}`}
      data-testid={`card-directory-${member.id}`}
      onClick={() => setLocation(`/portal/directory/${member.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-3">
          {member.profileImageUrl ? (
            <img
              src={member.profileImageUrl}
              alt={member.companyName}
              className={`w-10 h-10 rounded-full object-cover border flex-shrink-0 ${isCorporate ? "border-[#E5A830]" : "border-muted"}`}
              data-testid={`img-member-${member.id}`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isCorporate ? "bg-[#E5A830]/10 text-[#E5A830] border border-[#E5A830]/30" : "bg-muted text-muted-foreground"}`}>
              {member.companyName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight">{member.companyName}</h3>
            <p className="text-sm text-muted-foreground">{member.contactName} - {member.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-2">
            {isCorporate && (
              <Badge className="text-xs bg-[#E5A830] hover:bg-[#d4982a] text-white" data-testid={`badge-corporate-${member.id}`}>
                <Crown className="h-3 w-3 mr-1" />Corporate Partner
              </Badge>
            )}
            {member.isBoardMember && (
              <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white" data-testid={`badge-board-member-${member.id}`}>Board Member</Badge>
            )}
            {!isCorporate && (
              <Badge variant="secondary" className="text-xs capitalize">
                {member.membershipCategory}
              </Badge>
            )}
          </div>
        </div>

        {member.primaryServices && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{member.primaryServices}</p>
        )}

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{member.city}, {member.state}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <a href={`tel:${member.phone}`} className="hover:text-primary" onClick={e => e.stopPropagation()}>{member.phone}</a>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <a href={`mailto:${member.email}`} className="hover:text-primary truncate" onClick={e => e.stopPropagation()}>{member.email}</a>
          </div>
          {member.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <a href={member.website.startsWith("http") ? member.website : `https://${member.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate" onClick={e => e.stopPropagation()}>{member.website}</a>
            </div>
          )}
        </div>

        {member.certifications && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
            {member.certifications.split(",").map((cert, i) => (
              <Badge key={i} variant="outline" className="text-xs">{cert.trim()}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
