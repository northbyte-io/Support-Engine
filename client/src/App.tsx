import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BrandingProvider } from "@/lib/branding";
import { LoadingPage } from "@/components/LoadingState";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import TicketsPage from "@/pages/tickets";
import TicketDetailPage from "@/pages/ticket-detail";
import TicketFormPage from "@/pages/ticket-form";
import UsersPage from "@/pages/users";
import AreasPage from "@/pages/areas";
import PortalPage from "@/pages/portal";
import SlaSettingsPage from "@/pages/sla-settings";
import SettingsPage from "@/pages/settings";
import KnowledgeBasePage from "@/pages/knowledge-base";
import TimeTrackingPage from "@/pages/time-tracking";
import SurveysPage from "@/pages/surveys";
import AssetsPage from "@/pages/assets";
import ProjectsPage from "@/pages/projects";
import ProjectBoardPage from "@/pages/project-board";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import ContactsPage from "@/pages/contacts";
import OrganizationsPage from "@/pages/organizations";
import LogsPage from "@/pages/logs";
import BrandingPage from "@/pages/branding";
import TlsCertificatesPage from "@/pages/tls-certificates";
import ExchangeIntegrationPage from "@/pages/exchange-integration";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingPage message="Wird geladen..." />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message="Wird geladen..." />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "customer") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function AgentRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message="Wird geladen..." />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role === "customer") {
    return <Redirect to="/portal" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message="Wird geladen..." />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      <Route path="/portal">
        <CustomerRoute>
          <PortalPage />
        </CustomerRoute>
      </Route>

      <Route path="/">
        <AgentRoute>
          <DashboardPage />
        </AgentRoute>
      </Route>

      <Route path="/tickets">
        <AgentRoute>
          <TicketsPage />
        </AgentRoute>
      </Route>

      <Route path="/tickets/new">
        <AgentRoute>
          <TicketFormPage />
        </AgentRoute>
      </Route>

      <Route path="/tickets/:id/edit">
        <AgentRoute>
          <TicketFormPage />
        </AgentRoute>
      </Route>

      <Route path="/tickets/:id">
        <AgentRoute>
          <TicketDetailPage />
        </AgentRoute>
      </Route>

      <Route path="/areas">
        <AgentRoute>
          <AreasPage />
        </AgentRoute>
      </Route>

      <Route path="/knowledge-base">
        <ProtectedRoute>
          <KnowledgeBasePage />
        </ProtectedRoute>
      </Route>

      <Route path="/time-tracking">
        <AgentRoute>
          <TimeTrackingPage />
        </AgentRoute>
      </Route>

      <Route path="/users">
        <AdminRoute>
          <UsersPage />
        </AdminRoute>
      </Route>

      <Route path="/settings/sla">
        <AdminRoute>
          <SlaSettingsPage />
        </AdminRoute>
      </Route>

      <Route path="/settings">
        <AdminRoute>
          <SettingsPage />
        </AdminRoute>
      </Route>

      <Route path="/surveys">
        <AdminRoute>
          <SurveysPage />
        </AdminRoute>
      </Route>

      <Route path="/assets">
        <AgentRoute>
          <AssetsPage />
        </AgentRoute>
      </Route>

      <Route path="/projects">
        <AgentRoute>
          <ProjectsPage />
        </AgentRoute>
      </Route>

      <Route path="/projects/:id">
        <AgentRoute>
          <ProjectBoardPage />
        </AgentRoute>
      </Route>

      <Route path="/customers">
        <AgentRoute>
          <CustomersPage />
        </AgentRoute>
      </Route>

      <Route path="/customers/:id">
        <AgentRoute>
          <CustomerDetailPage />
        </AgentRoute>
      </Route>

      <Route path="/contacts">
        <AgentRoute>
          <ContactsPage />
        </AgentRoute>
      </Route>

      <Route path="/organizations">
        <AgentRoute>
          <OrganizationsPage />
        </AgentRoute>
      </Route>

      <Route path="/logs">
        <AdminRoute>
          <LogsPage />
        </AdminRoute>
      </Route>

      <Route path="/branding">
        <AdminRoute>
          <BrandingPage />
        </AdminRoute>
      </Route>

      <Route path="/tls-certificates">
        <AdminRoute>
          <TlsCertificatesPage />
        </AdminRoute>
      </Route>

      <Route path="/exchange-integration">
        <AdminRoute>
          <ExchangeIntegrationPage />
        </AdminRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandingProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
