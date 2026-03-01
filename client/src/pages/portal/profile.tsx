import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Building2, Mail, Wrench, ArrowLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { MembershipApplication } from "@shared/schema";

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
      toast({ title: "Profile updated", description: "Your information has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
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

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
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
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-profile-title">My Profile</h1>
          <p className="text-muted-foreground mt-1">Edit any section below and click "Save Changes" to update your information.</p>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="capitalize" data-testid="text-membership-category">{application.membershipCategory}</Badge>
          {application.isBoardMember && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-board-member">Board Member</Badge>
          )}
        </div>

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
        <CardDescription>Update your company name and job title.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-company" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-title" /></FormControl>
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
        <CardDescription>Keep your services, certifications, and business info up to date.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="primaryServices" render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Services</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-profile-services" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="certifications" render={({ field }) => (
              <FormItem>
                <FormLabel>Certifications</FormLabel>
                <FormControl><Input {...field} data-testid="input-profile-certifications" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField control={form.control} name="yearEstablished" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Established</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-year" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numberOfEmployees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Employees</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-employees" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="annualRevenue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Revenue</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-revenue" /></FormControl>
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
        <CardDescription>Update your contact details so other members can reach you.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="contactName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} data-testid="input-profile-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-website" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl><Input {...field} data-testid="input-profile-city" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input {...field} data-testid="input-profile-state" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="zipCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl><Input {...field} data-testid="input-profile-zip" /></FormControl>
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
