import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Send, Award, Briefcase,
  User, Crown, Calendar, Users, DollarSign, Shield, FileText, Download,
  ExternalLink, Wrench, ThumbsUp, Trash2, Star, Plus
} from "lucide-react";

interface MemberProject {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  projectValue: string | null;
  completionDate: string | null;
  clientName: string | null;
  role: string | null;
  imageData: string | null;
  imageType: string | null;
  isFeatured: boolean;
}

interface MemberDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number | null;
  fileType: string | null;
  category: string | null;
}

interface MemberDetail {
  id: string;
  companyName: string;
  contactName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string | null;
  primaryServices: string | null;
  certifications: string | null;
  bio: string | null;
  membershipCategory: string;
  membershipTier: string | null;
  county: string | null;
  dateJoined: string | null;
  renewalDate: string | null;
  isBoardMember: boolean;
  userId: string | null;
  yearEstablished: string | null;
  numberOfEmployees: string | null;
  annualRevenue: string | null;
  profileImageUrl: string | null;
  memberProjects: MemberProject[];
  memberDocuments: MemberDocument[];
}

const DOC_CATEGORIES: Record<string, string> = {
  general: "General",
  license: "Licenses & Certifications",
  insurance: "Insurance & Bonding",
  capability: "Capability Statement",
  "project-photo": "Project Photos",
  "company-photo": "Company Photos",
  proposal: "Proposals & Bids",
};

export default function MemberDetailPage() {
  const [, params] = useRoute("/portal/directory/:id");
  const [, setLocation] = useLocation();
  const memberId = params?.id;

  const { data: member, isLoading, error } = useQuery<MemberDetail>({
    queryKey: ["/api/portal/directory", memberId],
    enabled: !!memberId,
  });

  const handleSendMessage = () => {
    if (member?.userId) {
      setLocation(`/portal/messages?to=${member.userId}`);
    }
  };

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-2" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <Button variant="ghost" onClick={() => setLocation("/portal/directory")} className="mb-6" data-testid="button-back-to-directory">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Directory
        </Button>

        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-48 mb-8" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ) : error || !member ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-member-not-found">Member not found or no longer in the directory.</p>
            </CardContent>
          </Card>
        ) : member.membershipCategory === "large" ? (
          <CorporateProfile member={member} onSendMessage={handleSendMessage} />
        ) : (
          <StandardProfile member={member} onSendMessage={handleSendMessage} />
        )}
      </div>
    </PortalLayout>
  );
}

function CorporateProfile({ member, onSendMessage }: { member: MemberDetail; onSendMessage: () => void }) {
  const certList = member.certifications ? member.certifications.split(",").map(c => c.trim()).filter(Boolean) : [];

  const stats = [
    member.yearEstablished ? { icon: Calendar, label: "Established", value: member.yearEstablished } : null,
    member.numberOfEmployees ? { icon: Users, label: "Employees", value: member.numberOfEmployees } : null,
    member.annualRevenue ? { icon: DollarSign, label: "Annual Revenue", value: member.annualRevenue } : null,
    certList.length > 0 ? { icon: Shield, label: "Certifications", value: `${certList.length}` } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div className="space-y-6" data-testid="corporate-profile">
      <Card className="border-t-4 border-t-[#E5A830] overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {member.profileImageUrl ? (
              <img
                src={member.profileImageUrl}
                alt={member.companyName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[#E5A830]/30 flex-shrink-0"
                data-testid="img-corporate-photo"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E5A830]/10 flex items-center justify-center flex-shrink-0 border-4 border-[#E5A830]/30">
                <span className="text-3xl sm:text-4xl font-bold text-[#E5A830]">{member.companyName.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-corporate-company">{member.companyName}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-[#E5A830] hover:bg-[#d4982a] text-white" data-testid="badge-corporate-partner">
                  <Crown className="h-3 w-3 mr-1" />Corporate Partner
                </Badge>
                {member.membershipTier && (
                  <Badge variant="secondary" data-testid="text-member-tier">{member.membershipTier}</Badge>
                )}
                {member.isBoardMember && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-board-member">Board Member</Badge>
                )}
                {member.county && (
                  <Badge variant="outline" className="text-xs" data-testid="text-member-county">
                    <MapPin className="h-3 w-3 mr-1" />{member.county} County
                  </Badge>
                )}
              </div>
              {(member.dateJoined || member.renewalDate) && (
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {member.dateJoined && (
                    <span data-testid="text-member-joined">Member since {member.dateJoined}</span>
                  )}
                  {member.renewalDate && (
                    <span data-testid="text-member-renewal">Renews {member.renewalDate}</span>
                  )}
                </div>
              )}
              <p className="text-muted-foreground" data-testid="text-corporate-contact">
                {member.contactName} — {member.title}
              </p>
              {member.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed" data-testid="text-member-bio">{member.bio}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {member.userId && (
                <Button onClick={onSendMessage} data-testid="button-send-message">
                  <Send className="h-4 w-4 mr-2" />Contact
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.length > 0 && (
        <div className={`grid gap-4 ${stats.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`} data-testid="corporate-stats">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5A830]/10 flex-shrink-0">
                  <stat.icon className="h-5 w-5 text-[#E5A830]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {member.primaryServices && (
        <Card data-testid="card-corporate-services">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-[#E5A830]" />
              Our Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{member.primaryServices}</p>
          </CardContent>
        </Card>
      )}

      {certList.length > 0 && (
        <Card data-testid="card-corporate-certifications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-[#E5A830]" />
              Certifications & Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {certList.map((cert, i) => (
                <Badge key={i} variant="outline" className="text-sm py-1 px-3" data-testid={`badge-cert-${i}`}>{cert}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-corporate-contact">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-[#E5A830]" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p data-testid="text-corporate-address">{member.address}</p>
                  <p className="text-muted-foreground">{member.city}, {member.state} {member.zipCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${member.phone}`} className="hover:underline" data-testid="text-corporate-phone">{member.phone}</a>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${member.email}`} className="hover:underline truncate" data-testid="text-corporate-email">{member.email}</a>
              </div>
              {member.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={member.website.startsWith("http") ? member.website : `https://${member.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate flex items-center gap-1"
                    data-testid="text-corporate-website"
                  >
                    {member.website}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {member.memberProjects && member.memberProjects.length > 0 && (
        <Card data-testid="card-corporate-portfolio">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-[#E5A830]" />
              Project Portfolio
            </CardTitle>
            <CardDescription>Completed projects showcasing our capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {member.memberProjects.map(project => (
                <div key={project.id} className="rounded-lg border overflow-hidden bg-card" data-testid={`portfolio-project-${project.id}`}>
                  {project.imageData && project.imageType && (
                    <img
                      src={`data:${project.imageType};base64,${project.imageData}`}
                      alt={project.title}
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{project.title}</h4>
                      {project.isFeatured && (
                        <Badge className="bg-[#E5A830] text-white text-[10px] flex-shrink-0">Featured</Badge>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {project.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
                      {project.projectValue && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{project.projectValue}</span>}
                      {project.clientName && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{project.clientName}</span>}
                      {project.role && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{project.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EndorsementsSection applicationId={member.id} isCorporate={true} />

      {member.memberDocuments && member.memberDocuments.length > 0 && (
        <Card data-testid="card-corporate-documents">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-[#E5A830]" />
              Company Documents
            </CardTitle>
            <CardDescription>Capability statements, certifications, and other company documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {member.memberDocuments.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors" data-testid={`doc-item-${doc.id}`}>
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {DOC_CATEGORIES[doc.category || "general"] || doc.category}
                      </Badge>
                      {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/api/portal/my-documents/${doc.id}/download`)} data-testid={`button-download-doc-${doc.id}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StandardProfile({ member, onSendMessage }: { member: MemberDetail; onSendMessage: () => void }) {
  return (
    <div className="space-y-6" data-testid="standard-profile">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              {member.profileImageUrl ? (
                <img
                  src={member.profileImageUrl}
                  alt={member.companyName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-muted flex-shrink-0"
                  data-testid="img-member-photo"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-muted-foreground">{member.companyName.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-member-company">{member.companyName}</h1>
                <p className="text-muted-foreground mt-1" data-testid="text-member-contact">
                  {member.contactName} — {member.title}
                </p>
                {member.bio && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed" data-testid="text-member-bio">{member.bio}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {member.isBoardMember && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-board-member">Board Member</Badge>
              )}
              {member.membershipTier ? (
                <Badge variant="secondary" data-testid="text-member-tier">{member.membershipTier}</Badge>
              ) : (
                <Badge variant="secondary" className="capitalize" data-testid="text-member-category">
                  {member.membershipCategory}
                </Badge>
              )}
              {member.county && (
                <Badge variant="outline" className="text-xs" data-testid="text-member-county">
                  <MapPin className="h-3 w-3 mr-1" />{member.county} County
                </Badge>
              )}
              {member.userId && (
                <Button onClick={onSendMessage} data-testid="button-send-message">
                  <Send className="h-4 w-4 mr-2" />Send Message
                </Button>
              )}
            </div>
          </div>

          {(member.yearEstablished || member.numberOfEmployees || member.annualRevenue || member.dateJoined || member.renewalDate) && (
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b">
              {member.yearEstablished && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Est. {member.yearEstablished}</span>
                </div>
              )}
              {member.numberOfEmployees && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{member.numberOfEmployees} employees</span>
                </div>
              )}
              {member.annualRevenue && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{member.annualRevenue}</span>
                </div>
              )}
              {member.dateJoined && (
                <div className="flex items-center gap-2 text-sm" data-testid="text-member-joined">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Member since {member.dateJoined}</span>
                </div>
              )}
              {member.renewalDate && (
                <div className="flex items-center gap-2 text-sm" data-testid="text-member-renewal">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>Renews {member.renewalDate}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p data-testid="text-member-address">{member.address}</p>
                    <p className="text-muted-foreground" data-testid="text-member-city-state">{member.city}, {member.state} {member.zipCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${member.phone}`} className="hover:underline" data-testid="text-member-phone">{member.phone}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${member.email}`} className="hover:underline truncate" data-testid="text-member-email">{member.email}</a>
                </div>
                {member.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={member.website.startsWith("http") ? member.website : `https://${member.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate"
                      data-testid="text-member-website"
                    >
                      {member.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {member.primaryServices && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Services</h2>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p data-testid="text-member-services">{member.primaryServices}</p>
                  </div>
                </div>
              )}

              {member.certifications && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Certifications</h2>
                  <div className="flex items-start gap-3">
                    <Award className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex flex-wrap gap-1.5" data-testid="text-member-certifications">
                      {member.certifications.split(",").map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{cert.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {member.memberProjects && member.memberProjects.length > 0 && (
        <Card data-testid="card-member-portfolio">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Project Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {member.memberProjects.map(project => (
                <div key={project.id} className="rounded-lg border overflow-hidden bg-card" data-testid={`portfolio-project-${project.id}`}>
                  {project.imageData && project.imageType && (
                    <img src={`data:${project.imageType};base64,${project.imageData}`} alt={project.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm">{project.title}</h4>
                    {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {project.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
                      {project.projectValue && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{project.projectValue}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EndorsementsSection applicationId={member.id} isCorporate={false} />

      {member.memberDocuments && member.memberDocuments.length > 0 && (
        <Card data-testid="card-member-documents">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Company Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {member.memberDocuments.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`doc-item-${doc.id}`}>
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {DOC_CATEGORIES[doc.category || "general"] || doc.category}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/api/portal/my-documents/${doc.id}/download`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface EndorsementData {
  id: string;
  fromUserId: string;
  toApplicationId: string;
  skill: string;
  message: string | null;
  createdAt: string;
  fromUsername?: string;
}

function EndorsementsSection({ applicationId, isCorporate }: { applicationId: string; isCorporate: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skill, setSkill] = useState("");
  const [message, setMessage] = useState("");

  const { data: endorsements } = useQuery<EndorsementData[]>({
    queryKey: ["/api/portal/endorsements", applicationId],
    enabled: !!applicationId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/portal/endorsements", {
        fromUserId: user!.id,
        toApplicationId: applicationId,
        skill,
        message: message || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/endorsements", applicationId] });
      toast({ title: "Endorsement added!" });
      setDialogOpen(false);
      setSkill("");
      setMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to endorse", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portal/endorsements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/endorsements", applicationId] });
      toast({ title: "Endorsement removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove endorsement", description: error.message, variant: "destructive" });
    },
  });

  const alreadyEndorsed = endorsements?.some((e) => e.fromUserId === user?.id);

  return (
    <Card data-testid="card-endorsements">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-lg`}>
            <ThumbsUp className={`h-5 w-5 ${isCorporate ? "text-[#E5A830]" : ""}`} />
            Endorsements
            {endorsements && endorsements.length > 0 && (
              <Badge variant="secondary" className="ml-1">{endorsements.length}</Badge>
            )}
          </CardTitle>
          {!alreadyEndorsed && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-endorse">
                  <Plus className="h-4 w-4 mr-1" />Endorse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Endorse This Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Skill or Specialty</label>
                    <Input
                      placeholder="e.g., Concrete Work, Project Management, Safety"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      data-testid="input-endorsement-skill"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Message (optional)</label>
                    <Textarea
                      placeholder="Share your experience working with this company..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      data-testid="input-endorsement-message"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate()}
                    disabled={!skill.trim() || createMutation.isPending}
                    data-testid="button-submit-endorsement"
                  >
                    {createMutation.isPending ? "Submitting..." : "Submit Endorsement"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!endorsements || endorsements.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-endorsements">
            No endorsements yet. Be the first to endorse this member!
          </p>
        ) : (
          <div className="space-y-3">
            {endorsements.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card" data-testid={`endorsement-${e.id}`}>
                <Star className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{e.skill}</Badge>
                    <span className="text-xs text-muted-foreground">by {e.fromUsername || "Member"}</span>
                  </div>
                  {e.message && (
                    <p className="text-sm text-muted-foreground mt-1">{e.message}</p>
                  )}
                </div>
                {e.fromUserId === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={() => deleteMutation.mutate(e.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-endorsement-${e.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
