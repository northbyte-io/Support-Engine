import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BrandingProvider } from "@/lib/branding";
import { ModeProvider } from "@/lib/mode";
import { LoadingPage } from "@/components/LoadingState";
import { t } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import ReportsPage from "@/pages/reports";
import SearchPage from "@/pages/search";
import ApprovalsPage from "@/pages/approvals";
import ApprovalWorkflowsPage from "@/pages/approval-workflows";
import SetupPage from "@/pages/setup";
import { CommandPalette } from "@/components/CommandPalette";

function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message={t("loading.generic")} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function CustomerRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message={t("loading.generic")} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "customer") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function AgentRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message={t("loading.generic")} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role === "customer") {
    return <Redirect to="/portal" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage message={t("loading.generic")} />;
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
      <Route path="/setup" component={SetupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      <Route path="/portal/:id">
        <CustomerRoute>
          <PortalPage />
        </CustomerRoute>
      </Route>

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

      {/* /tickets/new → redirect to /tickets (create modal opens inline) */}
      <Route path="/tickets/new">
        <Redirect to="/tickets" />
      </Route>

      {/* /tickets/:id/edit → redirect to /tickets/:id */}
      <Route path="/tickets/:id/edit">
        {(params) => <Redirect to={`/tickets/${params.id}`} />}
      </Route>

      {/* Three-pane workspace — handles both /tickets and /tickets/:id */}
      <Route path="/tickets/:id">
        <AgentRoute>
          <TicketsPage />
        </AgentRoute>
      </Route>

      <Route path="/tickets">
        <AgentRoute>
          <TicketsPage />
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

      {/* Settings sub-pages — canonical routes under /settings/* */}
      <Route path="/settings/logs">
        <AdminRoute>
          <LogsPage />
        </AdminRoute>
      </Route>

      <Route path="/settings/branding">
        <AdminRoute>
          <BrandingPage />
        </AdminRoute>
      </Route>

      <Route path="/settings/tls">
        <AdminRoute>
          <TlsCertificatesPage />
        </AdminRoute>
      </Route>

      <Route path="/settings/exchange">
        <AdminRoute>
          <ExchangeIntegrationPage />
        </AdminRoute>
      </Route>

      {/* Legacy redirects — keep old paths working */}
      <Route path="/logs"><Redirect to="/settings/logs" /></Route>
      <Route path="/branding"><Redirect to="/settings/branding" /></Route>
      <Route path="/tls-certificates"><Redirect to="/settings/tls" /></Route>
      <Route path="/exchange-integration"><Redirect to="/settings/exchange" /></Route>

      <Route path="/reports">
        <AgentRoute>
          <ReportsPage />
        </AgentRoute>
      </Route>

      <Route path="/search">
        <AgentRoute>
          <SearchPage />
        </AgentRoute>
      </Route>

      <Route path="/approvals">
        <AgentRoute>
          <ApprovalsPage />
        </AgentRoute>
      </Route>

      <Route path="/approvals/workflows">
        <AdminRoute>
          <ApprovalWorkflowsPage />
        </AdminRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithPalette() {
  return (
    <>
      <Router />
      <CommandPalette />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandingProvider>
            <ModeProvider>
            <TooltipProvider>
              <Toaster />
              <ErrorBoundary>
                <AppWithPalette />
              </ErrorBoundary>
            </TooltipProvider>
            </ModeProvider>
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
