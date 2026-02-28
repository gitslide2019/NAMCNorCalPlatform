import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/portal/dashboard";
import Profile from "@/pages/portal/profile";
import Directory from "@/pages/portal/directory";
import Admin from "@/pages/portal/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/portal">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/portal/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/portal/directory">
        <ProtectedRoute><Directory /></ProtectedRoute>
      </Route>
      <Route path="/portal/admin">
        <ProtectedRoute><Admin /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithAuth() {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      <Toaster />
      <Router />
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="namc-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppWithAuth />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
