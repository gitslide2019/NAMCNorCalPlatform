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
import Messages from "@/pages/portal/messages";
import Discussions from "@/pages/portal/discussions";
import Projects from "@/pages/portal/projects";
import CalendarPage from "@/pages/portal/calendar";
import Newsletters from "@/pages/portal/newsletters";
import ToolLibrary from "@/pages/portal/tools";
import Courses from "@/pages/portal/courses";
import MemberDetail from "@/pages/portal/member-detail";
import ResetPasswordPage from "@/pages/reset-password";
import Documents from "@/pages/portal/documents";
import Campaigns from "@/pages/portal/campaigns";
import Notifications from "@/pages/portal/notifications";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/portal">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/portal/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/portal/directory/:id">
        <ProtectedRoute><MemberDetail /></ProtectedRoute>
      </Route>
      <Route path="/portal/directory">
        <ProtectedRoute><Directory /></ProtectedRoute>
      </Route>
      <Route path="/portal/admin">
        <ProtectedRoute><Admin /></ProtectedRoute>
      </Route>
      <Route path="/portal/messages">
        <ProtectedRoute><Messages /></ProtectedRoute>
      </Route>
      <Route path="/portal/discussions">
        <ProtectedRoute><Discussions /></ProtectedRoute>
      </Route>
      <Route path="/portal/projects">
        <ProtectedRoute><Projects /></ProtectedRoute>
      </Route>
      <Route path="/portal/calendar">
        <ProtectedRoute><CalendarPage /></ProtectedRoute>
      </Route>
      <Route path="/portal/newsletters">
        <ProtectedRoute><Newsletters /></ProtectedRoute>
      </Route>
      <Route path="/portal/tools">
        <ProtectedRoute><ToolLibrary /></ProtectedRoute>
      </Route>
      <Route path="/portal/courses">
        <ProtectedRoute><Courses /></ProtectedRoute>
      </Route>
      <Route path="/portal/documents">
        <ProtectedRoute><Documents /></ProtectedRoute>
      </Route>
      <Route path="/portal/campaigns">
        <ProtectedRoute><Campaigns /></ProtectedRoute>
      </Route>
      <Route path="/portal/notifications">
        <ProtectedRoute><Notifications /></ProtectedRoute>
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
