import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

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

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

          {isLogin ? (
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
            />
          ) : (
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
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setIsLogin(!isLogin)}
              data-testid="button-toggle-auth"
            >
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>
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

function LoginForm({ onSubmit, isPending }: { onSubmit: (data: LoginForm) => void; isPending: boolean }) {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-login-title">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access the member portal</CardDescription>
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
                    <Input {...field} data-testid="input-username" />
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
                    <Input type="password" {...field} data-testid="input-password" />
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
