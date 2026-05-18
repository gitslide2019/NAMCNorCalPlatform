import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Phone, Mail, Globe, Users, ArrowLeft, Crown, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Stat } from "@/components/editorial";
import { NAMC_GOLD } from "@/lib/brand";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const goldMarkerSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${NAMC_GOLD}"/><circle cx="12.5" cy="12.5" r="6" fill="white"/></svg>`);
const blueMarkerSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#3b82f6"/><circle cx="12.5" cy="12.5" r="6" fill="white"/></svg>`);

const corporateMarkerIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${goldMarkerSvg}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

const standardMarkerIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${blueMarkerSvg}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

const BAY_AREA_COORDS: Record<string, [number, number]> = {
  "oakland": [37.8044, -122.2712],
  "san francisco": [37.7749, -122.4194],
  "san jose": [37.3382, -121.8863],
  "berkeley": [37.8716, -122.2727],
  "richmond": [37.9358, -122.3478],
  "fremont": [37.5485, -121.9886],
  "hayward": [37.6688, -122.0808],
  "sunnyvale": [37.3688, -122.0363],
  "santa clara": [37.3541, -121.9552],
  "concord": [37.9780, -122.0311],
  "vallejo": [38.1041, -122.2566],
  "daly city": [37.6879, -122.4702],
  "san mateo": [37.5630, -122.3255],
  "redwood city": [37.4852, -122.2364],
  "palo alto": [37.4419, -122.1430],
  "mountain view": [37.3861, -122.0839],
  "milpitas": [37.4323, -121.8996],
  "walnut creek": [37.9101, -122.0652],
  "pleasanton": [37.6604, -121.8758],
  "livermore": [37.6819, -121.7680],
  "union city": [37.5934, -122.0438],
  "newark": [37.5296, -122.0402],
  "san leandro": [37.7249, -122.1561],
  "alameda": [37.7652, -122.2416],
  "emeryville": [37.8313, -122.2853],
  "san rafael": [37.9735, -122.5311],
  "south san francisco": [37.6547, -122.4077],
  "pacifica": [37.6138, -122.4869],
  "menlo park": [37.4530, -122.1817],
  "foster city": [37.5585, -122.2711],
  "burlingame": [37.5841, -122.3661],
  "san bruno": [37.6305, -122.4111],
  "antioch": [38.0049, -121.8058],
  "pittsburg": [38.0280, -121.8847],
  "brentwood": [37.9318, -121.6958],
  "dublin": [37.7022, -121.9358],
  "san ramon": [37.7799, -121.9780],
  "danville": [37.8216, -121.9999],
  "martinez": [38.0194, -122.1341],
  "hercules": [38.0172, -122.2887],
  "el cerrito": [37.9161, -122.3111],
  "albany": [37.8869, -122.2978],
  "benicia": [38.0494, -122.1586],
  "fairfield": [38.2494, -122.0400],
  "vacaville": [38.3566, -121.9877],
  "napa": [38.2975, -122.2869],
  "petaluma": [38.2324, -122.6367],
  "santa rosa": [38.4404, -122.7141],
  "stockton": [37.9577, -121.2908],
  "sacramento": [38.5816, -121.4944],
  "campbell": [37.2872, -121.9500],
  "cupertino": [37.3230, -122.0322],
  "los gatos": [37.2358, -121.9624],
  "saratoga": [37.2639, -122.0230],
  "gilroy": [37.0058, -121.5683],
  "morgan hill": [37.1305, -121.6544],
};

const BAY_AREA_CENTER: [number, number] = [37.7749, -122.2194];

function getCityCoords(city: string): [number, number] | null {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  return BAY_AREA_COORDS[key] || null;
}

function offsetCoords(coords: [number, number], index: number, total: number): [number, number] {
  if (total <= 1) return coords;
  const angle = (2 * Math.PI * index) / total;
  const radius = 0.005 + (total > 6 ? 0.003 : 0);
  return [
    coords[0] + radius * Math.cos(angle),
    coords[1] + radius * Math.sin(angle),
  ];
}

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
  bio: string | null;
  membershipCategory: string;
  membershipTier: string | null;
  county: string | null;
  isBoardMember: boolean;
  profileImageUrl: string | null;
  tagline: string | null;
  servicesDescription: string | null;
}

export default function Directory() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const directoryUrl = countyFilter !== "all"
    ? `/api/portal/directory?county=${encodeURIComponent(countyFilter)}`
    : "/api/portal/directory";

  const { data: members, isLoading } = useQuery<DirectoryMember[]>({
    queryKey: [directoryUrl],
  });

  // Always fetch the full list to populate county dropdown options
  const { data: allMembers } = useQuery<DirectoryMember[]>({
    queryKey: ["/api/portal/directory"],
  });

  const availableCounties = Array.from(new Set(
    (allMembers || []).map(m => m.county).filter(Boolean) as string[]
  )).sort();

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
          className="mb-6 -ml-2"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <header className="border-b border-foreground/10 pb-8 mb-8">
          <div className="space-y-3">
            <Eyebrow>The roster</Eyebrow>
            <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-[0.92]" data-testid="text-directory-title">
              Member<br/><span className="italic text-primary">directory.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Every NAMC NorCal company — corporate partners, small shops, government, all under one roof. Search, filter, or pin to the map.
            </p>
          </div>
          {(allMembers?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-x-10 gap-y-2 mt-6">
              <Stat value={allMembers?.length ?? 0} label="Members on file" data-testid="stat-directory-total" />
              <Stat value={(allMembers || []).filter(m => m.membershipCategory === "large").length} label="Corporate partners" data-testid="stat-directory-corp" />
              <Stat value={availableCounties.length} label="Counties served" data-testid="stat-directory-counties" />
            </div>
          )}
        </header>

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
          {availableCounties.length > 0 && (
            <Select value={countyFilter} onValueChange={setCountyFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-county-filter">
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {availableCounties.map(county => (
                  <SelectItem key={county} value={county} data-testid={`county-item-${county.replace(/\s+/g, "-").toLowerCase()}`}>
                    {county} County
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex rounded-lg border overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("list")}
              data-testid="button-list-view"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("map")}
              data-testid="button-map-view"
            >
              <MapIcon className="h-4 w-4 mr-1" />
              Map
            </Button>
          </div>
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
        ) : viewMode === "map" ? (
          <>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-directory-count">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
            </p>
            <DirectoryMap members={filtered} setLocation={setLocation} />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-directory-count">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
            </p>

            {corporateMembers.length > 0 && categoryFilter !== "all" ? null : corporateMembers.length > 0 && (
              <div className="mb-10">
                <div className="flex items-baseline justify-between border-b border-primary/40 pb-2 mb-5">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-2xl tracking-tight" data-testid="text-corporate-section">Corporate Partners</h2>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{corporateMembers.length}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {corporateMembers.map((member) => (
                    <MemberCard key={member.id} member={member} setLocation={setLocation} />
                  ))}
                </div>
              </div>
            )}

            {categoryFilter === "all" && corporateMembers.length > 0 && otherMembers.length > 0 && (
              <div className="flex items-baseline justify-between border-b border-foreground/15 pb-2 mb-5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-display text-2xl tracking-tight">All Members</h2>
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{otherMembers.length}</span>
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

function DirectoryMap({ members, setLocation }: { members: DirectoryMember[]; setLocation: (path: string) => void }) {
  const cityGroups: Record<string, DirectoryMember[]> = {};
  members.forEach((m) => {
    const key = (m.city || "").toLowerCase().trim();
    if (key) {
      if (!cityGroups[key]) cityGroups[key] = [];
      cityGroups[key].push(m);
    }
  });

  const mappableMembers: { member: DirectoryMember; position: [number, number] }[] = [];
  const unmappable: DirectoryMember[] = [];

  Object.entries(cityGroups).forEach(([cityKey, group]) => {
    const coords = getCityCoords(cityKey);
    if (coords) {
      group.forEach((member, idx) => {
        mappableMembers.push({
          member,
          position: offsetCoords(coords, idx, group.length),
        });
      });
    } else {
      unmappable.push(...group);
    }
  });

  members.forEach((m) => {
    const key = (m.city || "").toLowerCase().trim();
    if (!key) unmappable.push(m);
  });

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden" data-testid="map-directory">
        <div className="h-[350px] sm:h-[500px]">
          <MapContainer
            center={BAY_AREA_CENTER}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappableMembers.map(({ member, position }) => (
              <Marker
                key={member.id}
                position={position}
                icon={member.membershipCategory === "large" ? corporateMarkerIcon : standardMarkerIcon}
              >
                <Popup>
                  <div className="min-w-[220px]" data-testid={`popup-member-${member.id}`}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-1">
                      {member.membershipCategory === "large" ? "Corporate partner" : member.isBoardMember ? "Board member" : (member.membershipTier || "Member")}
                    </div>
                    <h4 className="font-display text-lg leading-tight tracking-tight mb-1">{member.companyName}</h4>
                    <div className="h-px w-8 mb-2 bg-primary" />
                    <p className="text-xs text-muted-foreground mb-1">{member.contactName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" />{member.city}, {member.state}
                    </p>
                    {(member.servicesDescription || member.primaryServices) && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{member.servicesDescription || member.primaryServices}</p>
                    )}
                    <button
                      className="text-xs text-primary hover:underline font-medium"
                      onClick={() => setLocation(`/portal/directory/${member.id}`)}
                      data-testid={`link-view-profile-${member.id}`}
                    >
                      View Profile →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
          <span>Members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Corporate Partners</span>
        </div>
        {unmappable.length > 0 && (
          <span className="ml-auto">{unmappable.length} member{unmappable.length !== 1 ? "s" : ""} could not be mapped</span>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, setLocation }: { member: DirectoryMember; setLocation: (path: string) => void }) {
  const isCorporate = member.membershipCategory === "large";
  const eyebrowLabel = member.tagline
    ? member.tagline
    : isCorporate
      ? "Corporate partner"
      : member.membershipCategory === "government"
        ? "Government"
        : member.membershipCategory === "medium"
          ? "Medium business"
          : member.membershipCategory === "small"
            ? "Small business"
            : "Member";

  return (
    <Card
      className={`shadow-editorial cursor-pointer transition-all pressable relative overflow-hidden ${isCorporate ? "border-t-[3px] border-t-primary" : ""}`}
      data-testid={`card-directory-${member.id}`}
      onClick={() => setLocation(`/portal/directory/${member.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p
            className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold truncate"
            data-testid={`text-tagline-${member.id}`}
          >
            {eyebrowLabel}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {isCorporate && (
              <Badge className="text-[10px] uppercase tracking-[0.14em] bg-primary text-primary-foreground hover:bg-primary/90" data-testid={`badge-corporate-${member.id}`}>
                <Crown className="h-3 w-3 mr-1" />Corporate
              </Badge>
            )}
            {member.isBoardMember && (
              <Badge className="text-[10px] uppercase tracking-[0.14em] bg-amber-500 hover:bg-amber-600 text-white" data-testid={`badge-board-member-${member.id}`}>Board</Badge>
            )}
            {!isCorporate && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.14em]" data-testid={`badge-tier-${member.id}`}>
                {member.membershipTier || member.membershipCategory}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl leading-[1.05] tracking-tight">{member.companyName}</h3>
            <div className={`mt-2 h-px bg-primary ${isCorporate ? "w-16" : "w-10"}`} />
            <p className="text-sm text-muted-foreground mt-2">{member.contactName} · {member.title}</p>
          </div>
          {member.profileImageUrl ? (
            <img
              src={member.profileImageUrl}
              alt={member.companyName}
              className={`w-12 h-12 rounded-full object-cover flex-shrink-0 border ${isCorporate ? "border-primary" : "border-muted"}`}
              data-testid={`img-member-${member.id}`}
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-display text-lg ${isCorporate ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-foreground/10"}`}>
              {member.companyName.charAt(0)}
            </div>
          )}
        </div>

        {member.bio && (
          <p className="text-sm text-muted-foreground mb-2 italic border-l-2 border-primary/60 pl-3" data-testid={`text-member-bio-${member.id}`}>{member.bio}</p>
        )}
        {member.servicesDescription ? (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-services-desc-${member.id}`}>{member.servicesDescription}</p>
        ) : member.primaryServices ? (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{member.primaryServices}</p>
        ) : null}

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{member.city}{member.county ? `, ${member.county} County` : member.state ? `, ${member.state}` : ""}</span>
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
