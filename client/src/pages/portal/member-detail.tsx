import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Send, Award, Briefcase, User } from "lucide-react";

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
  membershipCategory: string;
  userId: string | null;
}

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
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/portal/directory")}
          className="mb-6"
          data-testid="button-back-to-directory"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
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
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-member-company">{member.companyName}</h1>
                    <p className="text-muted-foreground mt-1" data-testid="text-member-contact">
                      {member.contactName} — {member.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize" data-testid="text-member-category">
                      {member.membershipCategory}
                    </Badge>
                    {member.userId && (
                      <Button onClick={handleSendMessage} data-testid="button-send-message">
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    )}
                  </div>
                </div>

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
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
