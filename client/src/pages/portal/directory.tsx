import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Phone, Mail, Globe, Users } from "lucide-react";
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

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
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
              <SelectItem value="large">Large Business</SelectItem>
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
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((member) => (
                <Card
                  key={member.id}
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-directory-${member.id}`}
                  onClick={() => setLocation(`/portal/directory/${member.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{member.companyName}</h3>
                        <p className="text-sm text-muted-foreground">{member.contactName} - {member.title}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize shrink-0 ml-2">
                        {member.membershipCategory}
                      </Badge>
                    </div>

                    {member.primaryServices && (
                      <p className="text-sm text-muted-foreground mb-3">{member.primaryServices}</p>
                    )}

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{member.city}, {member.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${member.phone}`} className="hover:text-primary">{member.phone}</a>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <a href={`mailto:${member.email}`} className="hover:text-primary truncate">{member.email}</a>
                      </div>
                      {member.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <a href={member.website.startsWith("http") ? member.website : `https://${member.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{member.website}</a>
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
              ))}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
