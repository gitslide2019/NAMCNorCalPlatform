import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Save, Loader2, Building2, Mail, Wrench, ArrowLeft, Pencil, AlertTriangle,
  CheckCircle2, User, Globe, Phone, MapPin, Camera, Upload, FileText, Trash2,
  Download, Plus, FolderOpen, Briefcase, Image, Linkedin, Instagram, Facebook,
  Star, Handshake, Eye, X, Award, Users, DollarSign, Calendar, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { MembershipApplication, MemberDocument, MemberProject } from "@shared/schema";

const PROFILE_FIELDS = [
  { key: "profileImageUrl", label: "Profile Photo", section: "photo" },
  { key: "companyName", label: "Company Name", section: "identity" },
  { key: "tagline", label: "Tagline / Headline", section: "identity" },
  { key: "bio", label: "About / Bio", section: "identity" },
  { key: "title", label: "Job Title", section: "identity" },
  { key: "primaryServices", label: "License Types", section: "business" },
  { key: "servicesDescription", label: "Services Description", section: "business" },
  { key: "certifications", label: "Certifications", section: "business" },
  { key: "specialties", label: "Specialties", section: "business" },
  { key: "yearEstablished", label: "Year Established", section: "business" },
  { key: "numberOfEmployees", label: "Employee Count", section: "business" },
  { key: "partnerOpportunities", label: "Partnership Opportunities", section: "partners" },
  { key: "linkedinUrl", label: "LinkedIn", section: "social" },
  { key: "website", label: "Website", section: "social" },
  { key: "contactName", label: "Contact Name", section: "contact" },
  { key: "email", label: "Email", section: "contact" },
  { key: "phone", label: "Phone", section: "contact" },
  { key: "address", label: "Address", section: "contact" },
  { key: "city", label: "City", section: "contact" },
];

function getProfileCompleteness(app: MembershipApplication & Record<string, any>) {
  const filled = PROFILE_FIELDS.filter(f => {
    const val = app[f.key];
    return val && val.toString().trim() !== "";
  });
  const missing = PROFILE_FIELDS.filter(f => {
    const val = app[f.key];
    return !val || val.toString().trim() === "";
  });
  const percentage = Math.round((filled.length / PROFILE_FIELDS.length) * 100);
  return { total: PROFILE_FIELDS.length, filled: filled.length, missing, percentage };
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function SocialLink({ url, label, icon: Icon, prefix = "" }: { url?: string | null; label: string; icon: any; prefix?: string }) {
  if (!url) return null;
  const href = url.startsWith("http") ? url : `${prefix}${url}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      data-testid={`link-social-${label.toLowerCase()}`}>
      <Icon className="h-4 w-4" />{label}
    </a>
  );
}

function ProfilePreviewDialog({ application }: { application: MembershipApplication & Record<string, any> }) {
  const certList = application.certifications
    ? application.certifications.split(",").map((c: string) => c.trim()).filter(Boolean)
    : [];
  const specialtyList = application.specialties
    ? application.specialties.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-preview-profile">
          <Eye className="h-4 w-4 mr-2" />Preview My Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Other Members See You</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-4">
            {application.profileImageUrl ? (
              <img src={application.profileImageUrl} alt={application.companyName}
                className="w-20 h-20 rounded-full object-cover border-2 border-muted flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-2xl font-bold text-muted-foreground">
                {application.companyName?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{application.companyName}</h2>
              {application.tagline && (
                <p className="text-sm text-[#E5A830] font-medium mt-0.5" data-testid="preview-tagline">{application.tagline}</p>
              )}
              <p className="text-sm text-muted-foreground">{application.contactName} — {application.title}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className="capitalize">{application.membershipCategory} Member</Badge>
                {application.isBoardMember && <Badge className="bg-amber-500 text-white">Board Member</Badge>}
                {application.membershipTier && <Badge variant="outline">{application.membershipTier}</Badge>}
              </div>
            </div>
          </div>

          {application.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3" data-testid="preview-bio">{application.bio}</p>
          )}

          {application.servicesDescription && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Services</p>
              <p className="text-sm" data-testid="preview-services-desc">{application.servicesDescription}</p>
            </div>
          )}

          {(certList.length > 0 || specialtyList.length > 0) && (
            <div className="border-t pt-3 space-y-2">
              {certList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Certifications & Licenses</p>
                  <div className="flex flex-wrap gap-1.5">
                    {certList.map((c: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {specialtyList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {specialtyList.map((s: string, i: number) => (
                      <Badge key={i} className="bg-[#E5A830]/10 text-[#E5A830] border-[#E5A830]/30 text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {application.partnerOpportunities && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Partnership Opportunities</p>
              <p className="text-sm" data-testid="preview-partner-opp">{application.partnerOpportunities}</p>
            </div>
          )}

          <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{application.city}, {application.state}</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{application.phone}</div>
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{application.email}</div>
            {application.website && (
              <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{application.website}</div>
            )}
          </div>

          {(application.linkedinUrl || application.facebookUrl || application.instagramUrl || application.yelpUrl) && (
            <div className="border-t pt-3 flex flex-wrap gap-3">
              <SocialLink url={application.linkedinUrl} label="LinkedIn" icon={Linkedin} prefix="https://" />
              <SocialLink url={application.facebookUrl} label="Facebook" icon={Facebook} prefix="https://" />
              <SocialLink url={application.instagramUrl} label="Instagram" icon={Instagram} prefix="https://" />
              {application.yelpUrl && (
                <a href={application.yelpUrl.startsWith("http") ? application.yelpUrl : `https://${application.yelpUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Star className="h-4 w-4" />Yelp
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: application, isLoading } = useQuery<MembershipApplication | null>({
    queryKey: ["/api/portal/my-application"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("PATCH", "/api/portal/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-application"] });
      toast({ title: "Profile updated", description: "Your changes are now visible in the member directory." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (!application) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">My Profile</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No linked membership application found. Contact an administrator.</p>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  const app = application as MembershipApplication & Record<string, any>;
  const completeness = getProfileCompleteness(app);
  const showBanner = completeness.percentage < 60 && !bannerDismissed;
  const topMissing = completeness.missing.slice(0, 3);

  const onSubmit = (data: Record<string, string>) => updateMutation.mutate(data);

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-profile-title">My Company Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Build a complete profile to get found for projects, partnerships, and opportunities.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ProfilePreviewDialog application={app} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="secondary" className="capitalize" data-testid="text-membership-category">{application.membershipCategory} Member</Badge>
          {application.isBoardMember && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-board-member">Board Member</Badge>
          )}
          {application.membershipTier && (
            <Badge variant="outline" data-testid="text-membership-tier">{application.membershipTier}</Badge>
          )}
        </div>

        {showBanner && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex items-start gap-3" data-testid="banner-completeness">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Your profile is {completeness.percentage}% complete</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Add {topMissing.map(f => f.label).join(", ")} to attract more opportunities and connections.
              </p>
            </div>
            <button onClick={() => setBannerDismissed(true)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400" data-testid="button-dismiss-banner">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Card className="mb-6" data-testid="card-profile-completeness">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {completeness.percentage === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium text-sm">Profile Completeness: {completeness.percentage}%</span>
              </div>
              <span className="text-sm text-muted-foreground">{completeness.filled}/{completeness.total} fields</span>
            </div>
            <Progress value={completeness.percentage} className="h-2 mb-2" />
            {completeness.percentage === 100 ? (
              <p className="text-xs text-green-600">Your profile is complete — members can find your full info in the directory.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Missing: {completeness.missing.slice(0, 5).map(f => f.label).join(", ")}{completeness.missing.length > 5 ? ` +${completeness.missing.length - 5} more` : ""}
              </p>
            )}
          </CardContent>
        </Card>

        {(application.membershipTier || (app as any).county || application.dateJoined || application.renewalDate) && (
          <Card className="mb-6" data-testid="card-membership-info">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#E5A830]" />
                Membership Information
              </CardTitle>
              <CardDescription>Your membership details on file with NAMC NorCal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {application.membershipTier && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tier</p>
                    <Badge variant="secondary" data-testid="text-profile-tier">{application.membershipTier}</Badge>
                  </div>
                )}
                {(app as any).county && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">County</p>
                    <p className="text-sm font-medium" data-testid="text-profile-county">{(app as any).county}</p>
                  </div>
                )}
                {application.dateJoined && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                    <p className="text-sm font-medium" data-testid="text-profile-joined">{application.dateJoined}</p>
                  </div>
                )}
                {application.renewalDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Renewal Date</p>
                    <p className="text-sm font-medium" data-testid="text-profile-renewal">{application.renewalDate}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <ProfilePhotoSection application={application} />
          <CompanyIdentityForm application={app} onSubmit={onSubmit} isPending={updateMutation.isPending} />
          <BusinessDetailsForm application={app} onSubmit={onSubmit} isPending={updateMutation.isPending} />
          <PartnerOpportunitiesForm application={app} onSubmit={onSubmit} isPending={updateMutation.isPending} />
          <SocialPresenceForm application={app} onSubmit={onSubmit} isPending={updateMutation.isPending} />
          <ContactInfoForm application={app} onSubmit={onSubmit} isPending={updateMutation.isPending} />
          <MyDocumentsSection />
          <MyProjectsSection />
        </div>
      </div>
    </PortalLayout>
  );
}

function ProfilePhotoSection({ application }: { application: MembershipApplication }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      const res = await apiRequest("PATCH", "/api/portal/profile/photo", { profileImageUrl });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-application"] });
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => photoMutation.mutate(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Card data-testid="card-profile-photo">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" />Profile Photo</CardTitle>
        <CardDescription>Upload a professional photo or company logo. This appears on your member directory listing.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative group flex-shrink-0">
            {application.profileImageUrl ? (
              <img src={application.profileImageUrl} alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-muted" data-testid="img-profile-photo" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30" data-testid="img-profile-placeholder">
                <User className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              data-testid="button-change-photo">
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-photo-file" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={photoMutation.isPending} data-testid="button-upload-photo">
              {photoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {application.profileImageUrl ? "Change Photo" : "Upload Photo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG, or GIF. Max 5MB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyIdentityForm({ application, onSubmit, isPending }: { application: Record<string, any>; onSubmit: (d: Record<string, string>) => void; isPending: boolean }) {
  const form = useForm({
    defaultValues: {
      companyName: application.companyName || "",
      title: application.title || "",
      tagline: application.tagline || "",
      bio: application.bio || "",
    },
  });

  return (
    <Card id="section-identity" data-testid="card-company-identity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company & Identity<Pencil className="h-4 w-4 text-muted-foreground" /></CardTitle>
        <CardDescription>Your company name, headline, and story — the first thing other members see.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input placeholder="ABC Construction LLC" {...field} data-testid="input-profile-company" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Title / Role</FormLabel>
                  <FormControl><Input placeholder="Owner, President, Project Manager" {...field} data-testid="input-profile-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="tagline" render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline / Headline</FormLabel>
                <FormControl><Input placeholder="e.g. Bay Area's Premier Minority-Owned General Contractor" {...field} data-testid="input-profile-tagline" /></FormControl>
                <FormDescription>A one-line headline shown under your company name in the directory</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem>
                <FormLabel>About Your Company</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell other NAMC members about your company, your history, your mission, and what makes you unique. Share your story — clients, notable projects, community involvement..." rows={5} {...field} data-testid="input-profile-bio" />
                </FormControl>
                <FormDescription>Your company's story — shown on your full member profile. Be detailed and compelling.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-identity">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BusinessDetailsForm({ application, onSubmit, isPending }: { application: Record<string, any>; onSubmit: (d: Record<string, string>) => void; isPending: boolean }) {
  const form = useForm({
    defaultValues: {
      servicesDescription: application.servicesDescription || "",
      primaryServices: application.primaryServices || "",
      certifications: application.certifications || "",
      specialties: application.specialties || "",
      yearEstablished: application.yearEstablished || "",
      numberOfEmployees: application.numberOfEmployees || "",
      annualRevenue: application.annualRevenue || "",
    },
  });

  return (
    <Card id="section-business" data-testid="card-business-details">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Business Details<Pencil className="h-4 w-4 text-muted-foreground" /></CardTitle>
        <CardDescription>Your services, credentials, and business stats — what you do and how big you are.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="servicesDescription" render={({ field }) => (
              <FormItem>
                <FormLabel>Services Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe what your company does in plain language — the types of projects, sectors, and work you specialize in. This is what other members and agencies read to decide if you're the right fit." rows={4} {...field} data-testid="input-profile-services-desc" />
                </FormControl>
                <FormDescription>Write this in plain English for clients and partners to read</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="primaryServices" render={({ field }) => (
              <FormItem>
                <FormLabel>License Types / Trade Codes</FormLabel>
                <FormControl><Input placeholder="e.g. B-GC, C-10, C-39, A-GE" {...field} data-testid="input-profile-services" /></FormControl>
                <FormDescription>Your California contractor license class codes (e.g. B for General Building, C-10 for Electrical)</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="certifications" render={({ field }) => (
              <FormItem>
                <FormLabel>Certifications & Licenses</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g. MBE, DBE, SBE, DVBE, WBE, LBE, SLBE, SDVOSB, SB-PW&#10;CA Contractor License #123456 (Class B-GC)&#10;OSHA 30-Hour Certified" rows={3} {...field} data-testid="input-profile-certifications" />
                </FormControl>
                <FormDescription>List each certification, license number, and bonding on a new line or separated by commas — these display as individual badges on your profile</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="specialties" render={({ field }) => (
              <FormItem>
                <FormLabel>Specialties / Keywords</FormLabel>
                <FormControl><Input placeholder="e.g. Seismic Retrofit, ADA Compliance, LEED Green Building, Solar, Affordable Housing" {...field} data-testid="input-profile-specialties" /></FormControl>
                <FormDescription>Comma-separated specialties — shown as highlighted tags on your profile and helps members find you</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Established</FormLabel>
                  <FormControl><Input placeholder="e.g. 2005" {...field} data-testid="input-profile-year" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employees</FormLabel>
                  <FormControl><Input placeholder="e.g. 25" {...field} data-testid="input-profile-employees" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="annualRevenue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Revenue</FormLabel>
                  <FormControl><Input placeholder="e.g. $2,000,000" {...field} data-testid="input-profile-revenue" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-business-details">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PartnerOpportunitiesForm({ application, onSubmit, isPending }: { application: Record<string, any>; onSubmit: (d: Record<string, string>) => void; isPending: boolean }) {
  const form = useForm({
    defaultValues: { partnerOpportunities: application.partnerOpportunities || "" },
  });

  return (
    <Card id="section-partners" data-testid="card-partner-opportunities">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5" />Partnership Opportunities<Pencil className="h-4 w-4 text-muted-foreground" /></CardTitle>
        <CardDescription>Tell other NAMC members what kinds of partnerships, subcontracting, teaming, or joint ventures you're open to.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="partnerOpportunities" render={({ field }) => (
              <FormItem>
                <FormLabel>What Are You Looking For?</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g. Seeking subcontracting opportunities with general contractors on public works projects over $500K. Open to teaming on Caltrans, BART, and SFPUC bids. Looking for certified DBE prime contractors for upcoming SFUSD work." rows={5} {...field} data-testid="input-partner-opportunities" />
                </FormControl>
                <FormDescription>
                  Be specific: mention project types, dollar amounts, agencies, and what role you want (prime, sub, joint venture partner, etc.)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-partner-opps">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SocialPresenceForm({ application, onSubmit, isPending }: { application: Record<string, any>; onSubmit: (d: Record<string, string>) => void; isPending: boolean }) {
  const form = useForm({
    defaultValues: {
      website: application.website || "",
      linkedinUrl: application.linkedinUrl || "",
      facebookUrl: application.facebookUrl || "",
      instagramUrl: application.instagramUrl || "",
      yelpUrl: application.yelpUrl || "",
    },
  });

  return (
    <Card id="section-social" data-testid="card-social-presence">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Online Presence & Social Media<Pencil className="h-4 w-4 text-muted-foreground" /></CardTitle>
        <CardDescription>Add links so other members can learn more about your company and connect with you online.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Company Website</FormLabel>
                  <FormControl><Input placeholder="https://www.yourcompany.com" {...field} data-testid="input-profile-website" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5 text-[#0077B5]" />LinkedIn</FormLabel>
                  <FormControl><Input placeholder="linkedin.com/company/your-company" {...field} data-testid="input-profile-linkedin" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Facebook className="h-3.5 w-3.5 text-[#1877F2]" />Facebook</FormLabel>
                  <FormControl><Input placeholder="facebook.com/yourcompany" {...field} data-testid="input-profile-facebook" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 text-[#E1306C]" />Instagram</FormLabel>
                  <FormControl><Input placeholder="instagram.com/yourcompany" {...field} data-testid="input-profile-instagram" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="yelpUrl" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-[#D32323]" />Yelp Business Listing</FormLabel>
                  <FormControl><Input placeholder="yelp.com/biz/your-company" {...field} data-testid="input-profile-yelp" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-social">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ContactInfoForm({ application, onSubmit, isPending }: { application: Record<string, any>; onSubmit: (d: Record<string, string>) => void; isPending: boolean }) {
  const form = useForm({
    defaultValues: {
      contactName: application.contactName || "",
      email: application.email || "",
      phone: application.phone || "",
      address: application.address || "",
      city: application.city || "",
      state: application.state || "",
      zipCode: application.zipCode || "",
    },
  });

  return (
    <Card id="section-contact" data-testid="card-contact-edit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Contact Information<Pencil className="h-4 w-4 text-muted-foreground" /></CardTitle>
        <CardDescription>Keep your contact details current so members and agencies can reach you.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="contactName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Contact Name</FormLabel>
                  <FormControl><Input placeholder="Your full name" {...field} data-testid="input-profile-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email</FormLabel>
                  <FormControl><Input type="email" placeholder="you@company.com" {...field} data-testid="input-profile-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone</FormLabel>
                  <FormControl><Input placeholder="(510) 555-0123" {...field} data-testid="input-profile-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Street Address</FormLabel>
                  <FormControl><Input placeholder="123 Main Street" {...field} data-testid="input-profile-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl><Input placeholder="Oakland" {...field} data-testid="input-profile-city" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input placeholder="CA" {...field} data-testid="input-profile-state" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="zipCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl><Input placeholder="94621" {...field} data-testid="input-profile-zip" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-profile">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function MyDocumentsSection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: documents = [], isLoading } = useQuery<Omit<MemberDocument, "fileData">[]>({
    queryKey: ["/api/portal/my-documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; fileName: string; fileSize: number; fileType: string; fileData: string; category: string }) => {
      const res = await apiRequest("POST", "/api/portal/my-documents", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-documents"] });
      toast({ title: "Document uploaded" });
      setDialogOpen(false);
      setPendingFile(null);
      setUploadTitle("");
      setUploadCategory("general");
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/portal/my-documents/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-documents"] });
      toast({ title: "Document deleted" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select a file under 8MB.", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    setDialogOpen(true);
  };

  const handleUpload = () => {
    if (!pendingFile || !uploadTitle.trim()) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({ title: uploadTitle.trim(), fileName: pendingFile.name, fileSize: pendingFile.size, fileType: pendingFile.type, fileData: base64, category: uploadCategory });
    };
    reader.readAsDataURL(pendingFile);
  };

  const categories = [
    { value: "general", label: "General" },
    { value: "license", label: "Licenses & Certifications" },
    { value: "insurance", label: "Insurance & Bonding" },
    { value: "capability", label: "Capability Statement" },
    { value: "project-photo", label: "Project Photos" },
    { value: "company-photo", label: "Company Photos" },
    { value: "proposal", label: "Proposals & Bids" },
  ];

  return (
    <Card data-testid="card-my-documents">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" />My Documents</CardTitle>
            <CardDescription>Upload capability statements, certifications, insurance docs, project photos, and more. Other members can view these on your profile.</CardDescription>
          </div>
          <div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} data-testid="input-document-file" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-document">
              <Plus className="h-4 w-4 mr-1" />Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No documents uploaded yet.</p>
            <p className="text-xs mt-1">Upload capability statements, certifications, project photos, and more.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors" data-testid={`doc-item-${doc.id}`}>
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{categories.find(c => c.value === doc.category)?.label || doc.category}</Badge>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/api/portal/my-documents/${doc.id}/download`)} data-testid={`button-download-doc-${doc.id}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Document title" data-testid="input-doc-title" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} data-testid="select-doc-category">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {pendingFile && <p className="text-xs text-muted-foreground">File: {pendingFile.name} ({formatFileSize(pendingFile.size)})</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending || !uploadTitle.trim()} data-testid="button-confirm-upload">
                  {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MyProjectsSection() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectImage, setProjectImage] = useState<{ data: string; type: string } | null>(null);

  const { data: projects = [], isLoading } = useQuery<MemberProject[]>({
    queryKey: ["/api/portal/my-projects"],
  });

  const form = useForm({
    defaultValues: { title: "", description: "", location: "", projectValue: "", completionDate: "", clientName: "", role: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/portal/my-projects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-projects"] });
      toast({ title: "Project added", description: "Your project has been added to your portfolio." });
      setDialogOpen(false);
      form.reset();
      setProjectImage(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add project", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/portal/my-projects/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-projects"] });
      toast({ title: "Project removed" });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setProjectImage({ data: base64, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (values: any) => {
    createMutation.mutate({ ...values, imageData: projectImage?.data || null, imageType: projectImage?.type || null });
  };

  return (
    <Card data-testid="card-my-projects">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Project Portfolio</CardTitle>
            <CardDescription>Showcase completed projects with photos and details. A strong portfolio helps you win bids and build your reputation with other members and agencies.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-add-project"><Plus className="h-4 w-4 mr-1" />Add Project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add a Project to Your Portfolio</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl><Input placeholder="e.g. Oakland Community Center Renovation" {...field} data-testid="input-project-title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea placeholder="Describe your scope of work, challenges overcome, and results achieved..." rows={3} {...field} data-testid="input-project-description" /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Oakland, CA" {...field} data-testid="input-project-location" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="projectValue" render={({ field }) => (
                      <FormItem><FormLabel>Project Value</FormLabel><FormControl><Input placeholder="$500,000" {...field} data-testid="input-project-value" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="clientName" render={({ field }) => (
                      <FormItem><FormLabel>Client</FormLabel><FormControl><Input placeholder="City of Oakland" {...field} data-testid="input-project-client" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="completionDate" render={({ field }) => (
                      <FormItem><FormLabel>Completion Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-project-date" /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Your Role</FormLabel><FormControl><Input placeholder="e.g. General Contractor, Electrical Sub, Prime" {...field} data-testid="input-project-role" /></FormControl></FormItem>
                  )} />
                  <div>
                    <label className="text-sm font-medium">Project Photo</label>
                    <div className="mt-1">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} data-testid="input-project-image" />
                      {projectImage ? (
                        <div className="relative rounded-lg overflow-hidden border">
                          <img src={`data:${projectImage.type};base64,${projectImage.data}`} alt="Preview" className="w-full h-40 object-cover" />
                          <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setProjectImage(null)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" className="w-full h-20" onClick={() => fileInputRef.current?.click()} data-testid="button-select-project-image">
                          <Image className="h-5 w-5 mr-2" />Add Photo
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-project">
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Project
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No projects in your portfolio yet.</p>
            <p className="text-xs mt-1">Add completed projects to showcase your work and attract new opportunities.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(project => (
              <div key={project.id} className="rounded-lg border overflow-hidden bg-card" data-testid={`project-card-${project.id}`}>
                {project.imageData && project.imageType && (
                  <img src={`data:${project.imageType};base64,${project.imageData}`} alt={project.title} className="w-full h-36 object-cover" />
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm">{project.title}</h4>
                    {project.isFeatured && <Badge className="bg-amber-500 text-white text-[10px] flex-shrink-0">Featured</Badge>}
                  </div>
                  {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {project.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
                    {project.projectValue && <span>💰 {project.projectValue}</span>}
                    {project.clientName && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{project.clientName}</span>}
                    {project.role && <span className="flex items-center gap-1"><User className="h-3 w-3" />{project.role}</span>}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(project.id)} data-testid={`button-delete-project-${project.id}`}>
                      <Trash2 className="h-3 w-3 mr-1" />Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
