import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  Users, 
  DollarSign, 
  Wrench, 
  Award, 
  MessageSquare,
  CheckCircle,
  Loader2,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertMembershipApplicationSchema, type InsertMembershipApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const membershipCategories = [
  { value: "small", label: "Small Business (Under $1M) - $400/year" },
  { value: "medium", label: "Medium Business ($1M - $7M) - $800/year" },
  { value: "large", label: "Large Business (Over $7M) - $1,200/year" },
  { value: "government", label: "Government Agency - $1,800/year" },
];

export function ApplicationFormSection() {
  const { toast } = useToast();
  
  const form = useForm<InsertMembershipApplication>({
    resolver: zodResolver(insertMembershipApplicationSchema),
    defaultValues: {
      membershipCategory: undefined,
      companyName: "",
      contactName: "",
      title: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      website: "",
      yearEstablished: "",
      numberOfEmployees: "",
      annualRevenue: "",
      primaryServices: "",
      certifications: "",
      howDidYouHear: "",
      acceptedTerms: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertMembershipApplication) => {
      const response = await apiRequest("POST", "/api/membership-applications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in NAMC NorCal. We will contact you shortly.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMembershipApplication) => {
    submitMutation.mutate(data);
  };

  if (submitMutation.isSuccess) {
    return (
      <section id="apply" className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="text-center p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4" data-testid="text-success-title">Application Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-8">
              Thank you for your interest in joining NAMC Northern California. 
              Our team will review your application and contact you within 3-5 business days.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Questions? Contact us:</p>
              <p>Email: <a href="mailto:info@namcnorcal.org" className="text-primary hover:underline">info@namcnorcal.org</a></p>
            </div>
            <Button className="mt-8" onClick={() => submitMutation.reset()} data-testid="button-submit-another">
              Submit Another Application
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="apply" className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-application-title">
            Membership Application
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete the form below to apply for membership. All fields marked with * are required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Join NAMC Northern California and start building your future today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="membershipCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-membership-category">
                            <SelectValue placeholder="Select your membership category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membershipCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value} data-testid={`option-${category.value}`}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Company Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} data-testid="input-company-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.example.com" {...field} data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Oakland" {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="94621" {...field} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} data-testid="input-contact-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Owner / CEO" {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@company.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(510) 555-1234" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Business Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="yearEstablished"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Established</FormLabel>
                          <FormControl>
                            <Input placeholder="2010" {...field} data-testid="input-year-established" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numberOfEmployees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Employees</FormLabel>
                          <FormControl>
                            <Input placeholder="25" {...field} data-testid="input-employees" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="annualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Revenue</FormLabel>
                          <FormControl>
                            <Input placeholder="$2.5M" {...field} data-testid="input-revenue" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="primaryServices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Services</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your primary construction services (e.g., General Contracting, Electrical, Plumbing, HVAC, etc.)"
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-services"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any certifications (e.g., MBE, SBE, DBE, WBE, LBE, etc.)"
                            className="min-h-[80px]"
                            {...field}
                            data-testid="textarea-certifications"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="howDidYouHear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about NAMC?</FormLabel>
                        <FormControl>
                          <Input placeholder="Referral, website, event, etc." {...field} data-testid="input-referral" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="acceptedTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the terms and conditions *
                        </FormLabel>
                        <FormDescription>
                          By submitting this application, I agree to abide by the NAMC NorCal bylaws and 
                          understand that membership is subject to approval. Annual dues are tax-deductible 
                          as NAMC is a 501(c)(3) organization.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Need assistance? Contact us:</p>
          <p className="mt-2">
            <a href="mailto:info@namcnorcal.org" className="text-primary hover:underline">info@namcnorcal.org</a>
          </p>
        </div>
      </div>
    </section>
  );
}
