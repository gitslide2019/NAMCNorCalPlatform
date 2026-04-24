import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, Mail, AlertCircle, KeyRound } from "lucide-react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const emailPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type EmailForm = z.infer<typeof emailSchema>;
type EmailPasswordForm = z.infer<typeof emailPasswordSchema>;
type AdminLoginForm = z.infer<typeof adminLoginSchema>;

type Mode = "magic" | "password" | "forgot" | "admin";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("magic");
  const [linkExpired, setLinkExpired] = useState(false);
  const { user, loginMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "1") {
      setLinkExpired(true);
      window.history.replaceState({}, "", "/auth");
    }
  }, [location]);

  if (user) {
    navigate("/portal");
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-white p-2 mb-4 border">
              <img src={namcLogo} alt="NAMC NorCal" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-auth-title">NAMC NorCal</h1>
            <p className="text-muted-foreground">Member Portal</p>
          </div>

          {linkExpired && mode !== "admin" && (
            <div
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-sm p-3 rounded-md mb-4 flex gap-2"
              data-testid="alert-link-expired"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">That sign-in link has expired or already been used.</p>
                <p className="mt-1">Enter your email below to get a fresh one.</p>
              </div>
            </div>
          )}

          {mode === "magic" && (
            <MagicLinkForm
              onUsePassword={() => setMode("password")}
              onForgotPassword={() => setMode("forgot")}
              onAdminSignIn={() => setMode("admin")}
            />
          )}

          {mode === "password" && (
            <EmailPasswordForm
              onUseMagicLink={() => setMode("magic")}
              onForgotPassword={() => setMode("forgot")}
              onAdminSignIn={() => setMode("admin")}
              onSuccess={() => navigate("/portal")}
            />
          )}

          {mode === "forgot" && (
            <ForgotPasswordForm onBackToMagic={() => setMode("magic")} />
          )}

          {mode === "admin" && (
            <AdminLoginForm
              onSubmit={(data) => {
                loginMutation.mutate(data, {
                  onSuccess: () => navigate("/portal"),
                  onError: (error: Error) => {
                    toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
                  },
                });
              }}
              isPending={loginMutation.isPending}
              onMemberSignIn={() => setMode("magic")}
            />
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-neutral-900 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome to the Member Portal
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-6">
            Access your membership dashboard, connect with fellow NAMC NorCal members,
            and manage your company profile all in one place.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary">50+</p>
              <p className="text-xs text-neutral-400 mt-1">Member Companies</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary">55+</p>
              <p className="text-xs text-neutral-400 mt-1">Years Strong</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-2xl font-bold text-primary">NorCal</p>
              <p className="text-xs text-neutral-400 mt-1">Region</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberFooterLinks({
  onAdminSignIn,
  onForgotPassword,
  onUsePassword,
  onUseMagicLink,
  showPasswordLink,
  showMagicLink,
}: {
  onAdminSignIn: () => void;
  onForgotPassword: () => void;
  onUsePassword?: () => void;
  onUseMagicLink?: () => void;
  showPasswordLink?: boolean;
  showMagicLink?: boolean;
}) {
  return (
    <div className="mt-4 space-y-2 text-center text-sm">
      {showPasswordLink && onUsePassword && (
        <p>
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onUsePassword}
            data-testid="button-use-password"
          >
            Sign in with a password instead
          </button>
        </p>
      )}
      {showMagicLink && onUseMagicLink && (
        <p>
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onUseMagicLink}
            data-testid="button-use-magic-link"
          >
            Email me a sign-in link instead
          </button>
        </p>
      )}
      <p>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:underline"
          onClick={onForgotPassword}
          data-testid="button-forgot-password"
        >
          Forgot password? Set or reset it
        </button>
      </p>
      <p>
        <button
          type="button"
          className="text-muted-foreground text-xs hover:text-foreground hover:underline"
          onClick={onAdminSignIn}
          data-testid="button-admin-signin"
        >
          Admin sign-in (username)
        </button>
      </p>
    </div>
  );
}

function MagicLinkForm({
  onUsePassword,
  onForgotPassword,
  onAdminSignIn,
}: {
  onUsePassword: () => void;
  onForgotPassword: () => void;
  onAdminSignIn: () => void;
}) {
  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const res = await apiRequest("POST", "/api/auth/request-login-link", data);
      return res.json() as Promise<{ message: string; email?: string }>;
    },
  });

  if (requestMutation.isSuccess) {
    const { email, message } = requestMutation.data;
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2" data-testid="text-magic-success">Check your inbox</h2>
          <p className="text-muted-foreground text-sm mb-2" data-testid="text-magic-success-detail">
            {message}
          </p>
          {email && (
            <p className="text-foreground text-sm font-medium mb-2" data-testid="text-magic-success-email">
              {email}
            </p>
          )}
          <p className="text-muted-foreground text-sm mb-6">
            Check your spam folder if you don't see it.
          </p>
          <Button
            variant="outline"
            onClick={() => requestMutation.reset()}
            data-testid="button-send-another"
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-magic-title">Sign in to the Member Portal</CardTitle>
        <CardDescription>
          Enter the email on file with your NAMC NorCal membership and we'll send you a one-time sign-in link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requestMutation.isError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 flex gap-2" data-testid="text-magic-error">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{(requestMutation.error as Error)?.message || "Something went wrong. Please try again."}</span>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => requestMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      {...field}
                      data-testid="input-magic-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={requestMutation.isPending}
              data-testid="button-send-link"
            >
              {requestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send me a sign-in link
            </Button>
          </form>
        </Form>
        <MemberFooterLinks
          onAdminSignIn={onAdminSignIn}
          onForgotPassword={onForgotPassword}
          onUsePassword={onUsePassword}
          showPasswordLink
        />
      </CardContent>
    </Card>
  );
}

function EmailPasswordForm({
  onUseMagicLink,
  onForgotPassword,
  onAdminSignIn,
  onSuccess,
}: {
  onUseMagicLink: () => void;
  onForgotPassword: () => void;
  onAdminSignIn: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<EmailPasswordForm>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: EmailPasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/login-with-email", data);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      onSuccess();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-password-title">Sign in with password</CardTitle>
        <CardDescription>
          Use the email on file with your membership and the password you set.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loginMutation.isError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 flex gap-2" data-testid="text-password-error">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{(loginMutation.error as Error)?.message || "Sign-in failed. Please try again."}</span>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      {...field}
                      data-testid="input-password-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                      data-testid="input-password-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-password-signin"
            >
              {loginMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Sign in
            </Button>
          </form>
        </Form>
        <MemberFooterLinks
          onAdminSignIn={onAdminSignIn}
          onForgotPassword={onForgotPassword}
          onUseMagicLink={onUseMagicLink}
          showMagicLink
        />
      </CardContent>
    </Card>
  );
}

function ForgotPasswordForm({ onBackToMagic }: { onBackToMagic: () => void }) {
  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const forgotMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return res.json() as Promise<{ message: string; email?: string }>;
    },
  });

  if (forgotMutation.isSuccess) {
    const { email, message } = forgotMutation.data;
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2" data-testid="text-forgot-success">Check your inbox</h2>
          <p className="text-muted-foreground text-sm mb-2">{message}</p>
          {email && (
            <p className="text-foreground text-sm font-medium mb-2" data-testid="text-forgot-success-email">
              {email}
            </p>
          )}
          <p className="text-muted-foreground text-sm mb-6">
            Click the link in the email to set a new password.
          </p>
          <Button variant="outline" onClick={onBackToMagic} data-testid="button-back-to-signin">
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-forgot-title">Set or reset your password</CardTitle>
        <CardDescription>
          Enter the email on file with your membership and we'll send you a link to set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forgotMutation.isError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 flex gap-2" data-testid="text-forgot-error">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{(forgotMutation.error as Error)?.message || "Something went wrong. Please try again."}</span>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => forgotMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      {...field}
                      data-testid="input-forgot-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={forgotMutation.isPending} data-testid="button-send-reset">
              {forgotMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send password reset link
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onBackToMagic}
            data-testid="button-back-to-magic-from-forgot"
          >
            Back to sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

function AdminLoginForm({
  onSubmit,
  isPending,
  onMemberSignIn,
}: {
  onSubmit: (data: AdminLoginForm) => void;
  isPending: boolean;
  onMemberSignIn: () => void;
}) {
  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-admin-title">Admin sign-in</CardTitle>
        <CardDescription>Use your admin username and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="username" data-testid="input-username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-login">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign in
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onMemberSignIn}
            data-testid="button-member-signin"
          >
            Member? Sign in with email instead
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
