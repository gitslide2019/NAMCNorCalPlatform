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
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, Mail, AlertCircle } from "lucide-react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type MagicLinkForm = z.infer<typeof magicLinkSchema>;
type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

type Mode = "magic" | "login" | "register" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("magic");
  const [linkExpired, setLinkExpired] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "1") {
      setLinkExpired(true);
      // Clean the query string so the warning doesn't reappear on reload
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

          {linkExpired && (mode === "magic" || mode === "login") && (
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

          {mode === "magic" ? (
            <MagicLinkForm
              onShowAdminLogin={() => setMode("login")}
            />
          ) : mode === "login" ? (
            <LoginForm
              onSubmit={(data) => {
                loginMutation.mutate(data, {
                  onSuccess: () => navigate("/portal"),
                  onError: (error: Error) => {
                    toast({ title: "Login failed", description: error.message, variant: "destructive" });
                  },
                });
              }}
              isPending={loginMutation.isPending}
              onForgotPassword={() => setMode("forgot")}
              onBackToMagic={() => setMode("magic")}
            />
          ) : mode === "register" ? (
            <RegisterForm
              onSubmit={(data) => {
                registerMutation.mutate({ username: data.username, password: data.password }, {
                  onSuccess: () => navigate("/portal"),
                  onError: (error: Error) => {
                    toast({ title: "Registration failed", description: error.message, variant: "destructive" });
                  },
                });
              }}
              isPending={registerMutation.isPending}
            />
          ) : (
            <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
          )}

          {mode === "login" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setMode("register")}
                data-testid="button-toggle-auth"
              >
                Register
              </button>
            </p>
          )}

          {mode === "register" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setMode("magic")}
                data-testid="button-toggle-auth"
              >
                Sign In
              </button>
            </p>
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

function MagicLinkForm({ onShowAdminLogin }: { onShowAdminLogin: () => void }) {
  const form = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: MagicLinkForm) => {
      const res = await apiRequest("POST", "/api/auth/request-login-link", data);
      return res.json();
    },
  });

  if (requestMutation.isSuccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2" data-testid="text-magic-success">Check your inbox</h2>
          <p className="text-muted-foreground text-sm mb-2">
            If that email is on file, we've sent you a sign-in link.
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            The link expires in 15 minutes. Check your spam folder if you don't see it.
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
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4" data-testid="text-magic-error">
            {(requestMutation.error as Error)?.message || "Something went wrong. Please try again."}
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
        <p className="text-center text-sm text-muted-foreground mt-4">
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onShowAdminLogin}
            data-testid="button-admin-signin"
          >
            Admin sign-in
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

function LoginForm({
  onSubmit,
  isPending,
  onForgotPassword,
  onBackToMagic,
}: {
  onSubmit: (data: LoginForm) => void;
  isPending: boolean;
  onForgotPassword: () => void;
  onBackToMagic: () => void;
}) {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-login-title">Admin Sign In</CardTitle>
        <CardDescription>Use your username and password.</CardDescription>
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <button
                      type="button"
                      className="text-xs text-primary font-medium hover:underline"
                      onClick={onForgotPassword}
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-login">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Member?{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onBackToMagic}
            data-testid="button-back-to-magic"
          >
            Sign in with email link instead
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

function RegisterForm({ onSubmit, isPending }: { onSubmit: (data: RegisterForm) => void; isPending: boolean }) {
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-register-title">Create Account</CardTitle>
        <CardDescription>Register for access to the NAMC NorCal member portal</CardDescription>
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
                    <Input {...field} data-testid="input-reg-username" />
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
                    <Input type="password" {...field} data-testid="input-reg-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} data-testid="input-reg-confirm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-register">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

function ForgotPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const form = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const forgotMutation = useMutation({
    mutationFn: async (data: ForgotForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return res.json();
    },
  });

  if (forgotMutation.isSuccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2" data-testid="text-forgot-success">Check Your Email</h2>
          <p className="text-muted-foreground text-sm mb-6">
            If an account with that email exists, we've sent a password reset link. 
            Please check your inbox and spam folder.
          </p>
          <Button variant="outline" onClick={onBackToLogin} data-testid="button-back-to-login">
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-forgot-title">Forgot Password</CardTitle>
        <CardDescription>
          Enter the email address associated with your membership application and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forgotMutation.isError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4" data-testid="text-forgot-error">
            {(forgotMutation.error as Error)?.message || "Something went wrong. Please try again."}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => forgotMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@company.com" {...field} data-testid="input-forgot-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={forgotMutation.isPending} data-testid="button-send-reset">
              {forgotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={onBackToLogin}
            data-testid="button-back-to-signin"
          >
            Back to Sign In
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
