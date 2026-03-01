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
import { Save, Loader2, Building2, Mail, Wrench, ArrowLeft, Pencil, AlertTriangle, CheckCircle2, User, Globe, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { MembershipApplication } from "@shared/schema";

function getProfileCompleteness(app: MembershipApplication) {
  const fields = [
    { key: "companyName", label: "Company Name" },
    { key: "title", label: "Job Title" },
    { key: "contactName", label: "Contact Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zipCode", label: "ZIP Code" },
    { key: "website", label: "Website" },
    { key: "primaryServices", label: "Services" },
    { key: "certifications", label: "Certifications" },
    { key: "yearEstablished", label: "Year Established" },
    { key: "numberOfEmployees", label: "Employee Count" },
    { key: "annualRevenue", label: "Annual Revenue" },
  ];
  const filled = fields.filter(f => {
    const val = (app as any)[f.key];
    return val && val.toString().trim() !== "";
  });
  const missing = fields.filter(f => {
    const val = (app as any)[f.key];
    return !val || val.toString().trim() === "";
  });
  return { total: fields.length, filled: filled.length, missing, percentage: Math.round((filled.length / fields.length) * 100) };
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
      toast({ title: "Profile updated", description: "Your changes have been saved and are now visible in the member directory." });
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

  const completeness = getProfileCompleteness(application);

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-profile-title">My Company Profile</h1>
          <p className="text-muted-foreground mt-1">
            This is how your company appears to other NAMC members. A complete profile helps you get found for projects and build connections.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="capitalize" data-testid="text-membership-category">{application.membershipCategory} Member</Badge>
          {application.isBoardMember && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-board-member">Board Member</Badge>
          )}
        </div>

        <Card className="mb-6" data-testid="card-profile-completeness">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {completeness.percentage === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium text-sm">
                  Profile Completeness: {completeness.percentage}%
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{completeness.filled}/{completeness.total} fields</span>
            </div>
            <Progress value={completeness.percentage} className="h-2 mb-2" />
            {completeness.missing.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Missing: {completeness.missing.map(f => f.label).join(", ")}
              </p>
            )}
            {completeness.percentage === 100 && (
              <p className="text-xs text-green-600">Your profile is complete. Other members can find your full company info in the directory.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <CompanyRoleForm application={application} onSubmit={(data) => updateMutation.mutate(data)} isPending={updateMutation.isPending} />
          <BusinessDetailsForm application={application} onSubmit={(data) => updateMutation.mutate(data)} isPending={updateMutation.isPending} />
          <ContactInfoForm application={application} onSubmit={(data) => updateMutation.mutate(data)} isPending={updateMutation.isPending} />
        </div>
      </div>
    </PortalLayout>
  );
}

function CompanyRoleForm({
  application,
  onSubmit,
  isPending,
}: {
  application: MembershipApplication;
  onSubmit: (data: Record<string, string>) => void;
  isPending: boolean;
}) {
  const form = useForm({
    defaultValues: {
      companyName: application.companyName,
      title: application.title,
    },
  });

  return (
    <Card data-testid="card-company-role">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company & Role
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        <CardDescription>
          Your company name and job title are prominently displayed in the member directory.
          Make sure they're accurate so other contractors and agencies can find you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input placeholder="e.g. ABC Construction LLC" {...field} data-testid="input-profile-company" /></FormControl>
                  <FormDescription>Your registered business name</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title / Role</FormLabel>
                  <FormControl><Input placeholder="e.g. President, CEO, Project Manager" {...field} data-testid="input-profile-title" /></FormControl>
                  <FormDescription>Your role within the company</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-company-role">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BusinessDetailsForm({
  application,
  onSubmit,
  isPending,
}: {
  application: MembershipApplication;
  onSubmit: (data: Record<string, string>) => void;
  isPending: boolean;
}) {
  const form = useForm({
    defaultValues: {
      primaryServices: application.primaryServices || "",
      certifications: application.certifications || "",
      yearEstablished: application.yearEstablished || "",
      numberOfEmployees: application.numberOfEmployees || "",
      annualRevenue: application.annualRevenue || "",
    },
  });

  return (
    <Card data-testid="card-business-details">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Business Details
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        <CardDescription>
          Describe what your company does. Members searching for subcontractors, partners, or specific trades
          will find you based on these details. Be specific about your services and certifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="primaryServices" render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Services</FormLabel>
                <FormControl><Textarea placeholder="e.g. Commercial general contracting, tenant improvements, seismic retrofitting, ADA compliance upgrades, concrete and steel work" rows={3} {...field} data-testid="input-profile-services" /></FormControl>
                <FormDescription>List the main services your company offers — be detailed so other members can find you for the right projects</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="certifications" render={({ field }) => (
              <FormItem>
                <FormLabel>Certifications & Licenses</FormLabel>
                <FormControl><Textarea placeholder="e.g. MBE, DBE, SBE, DVBE, California Contractor License #123456 (Class B), OSHA 30" rows={2} {...field} data-testid="input-profile-certifications" /></FormControl>
                <FormDescription>Include all minority business certifications, contractor licenses, safety certifications, and bonding info</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Established</FormLabel>
                  <FormControl><Input placeholder="e.g. 2005" {...field} data-testid="input-profile-year" /></FormControl>
                  <FormDescription>When your company started</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Employees</FormLabel>
                  <FormControl><Input placeholder="e.g. 25" {...field} data-testid="input-profile-employees" /></FormControl>
                  <FormDescription>Current team size</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="annualRevenue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Revenue</FormLabel>
                  <FormControl><Input placeholder="e.g. $2,000,000" {...field} data-testid="input-profile-revenue" /></FormControl>
                  <FormDescription>Approximate yearly revenue</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-business-details">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ContactInfoForm({ 
  application, 
  onSubmit, 
  isPending 
}: { 
  application: MembershipApplication; 
  onSubmit: (data: Record<string, string>) => void;
  isPending: boolean;
}) {
  const form = useForm({
    defaultValues: {
      contactName: application.contactName,
      email: application.email,
      phone: application.phone,
      address: application.address,
      city: application.city,
      state: application.state,
      zipCode: application.zipCode,
      website: application.website || "",
    },
  });

  return (
    <Card data-testid="card-contact-edit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contact Information
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        <CardDescription>
          This is how other NAMC members will reach you. Keep your contact info current 
          so you don't miss out on project opportunities, referrals, or partnership inquiries.
        </CardDescription>
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
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />Website</FormLabel>
                  <FormControl><Input placeholder="https://www.yourcompany.com" {...field} data-testid="input-profile-website" /></FormControl>
                  <FormDescription>Your company website — helps other members learn about your work</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Street Address</FormLabel>
                  <FormControl><Input placeholder="123 Main Street, Suite 100" {...field} data-testid="input-profile-address" /></FormControl>
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
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
