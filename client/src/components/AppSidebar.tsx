import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  LogOut,
  FolderKanban,
  CircleUser,
  Timer,
  BookOpen,
  ClipboardList,
  Package,
  Kanban,
  Building2,
  Contact,
  Landmark,
  Scale,
  Mail,
  ShieldCheck,
  FileText,
  BarChart3,
  ClipboardCheck,
  Workflow,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { useTheme } from "@/lib/theme";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const coreNavItems = [
  { title: "Dashboard",        url: "/",               icon: LayoutDashboard },
  { title: "Tickets",          url: "/tickets",        icon: Ticket },
  { title: "Berichte",         url: "/reports",        icon: BarChart3 },
  { title: "Zeiterfassung",    url: "/time-tracking",  icon: Timer },
  { title: "Wissensdatenbank", url: "/knowledge-base", icon: BookOpen },
];

const resourceNavItems = [
  { title: "Kunden",         url: "/customers",      icon: Building2 },
  { title: "Kontakte",       url: "/contacts",       icon: Contact },
  { title: "Organisationen", url: "/organizations",  icon: Landmark },
  { title: "Assets",         url: "/assets",         icon: Package },
  { title: "Projekte",       url: "/projects",       icon: Kanban },
  { title: "Bereiche",       url: "/areas",          icon: FolderKanban },
];

const adminNavItems = [
  { title: "Benutzer",              url: "/users",                    icon: Users },
  { title: "Umfragen",              url: "/surveys",                  icon: ClipboardList },
  { title: "Genehmigungsworkflows", url: "/approvals/workflows",      icon: Workflow },
  { title: "Exchange",              url: "/exchange-integration",     icon: Mail },
  { title: "TLS-Zertifikate",       url: "/tls-certificates",         icon: ShieldCheck },
  { title: "Logs",                  url: "/logs",                     icon: FileText },
  { title: "Einstellungen",         url: "/settings",                 icon: Settings },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const { theme } = useTheme();

  const { data: pendingApprovalData } = useQuery<{ count: number }>({
    queryKey: ["/api/approvals/pending/count"],
    enabled: user?.role === "admin" || user?.role === "agent",
    refetchInterval: 60000,
  });
  const pendingApprovalCount = pendingApprovalData?.count ?? 0;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "U";
  };

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const getLogo = () => {
    if (theme === "dark" && branding?.logoDark) return branding.logoDark;
    return branding?.logoLight ?? branding?.logo;
  };

  const logo = getLogo();
  const tenantName = branding?.name ?? "Support-Engine";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={tenantName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Ticket className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <div className="overflow-hidden">
            <span className="font-display font-semibold text-sm leading-tight block truncate">{tenantName}</span>
            <span className="font-mono text-[10px] text-muted-foreground leading-tight">Helpdesk</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Übersicht</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}
                  >
                    <a href={item.url} onClick={(e) => { e.preventDefault(); setLocation(item.url); }}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {(user?.role === "admin" || user?.role === "agent") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/approvals")}
                    data-testid="nav-approvals"
                  >
                    <a href="/approvals" onClick={(e) => { e.preventDefault(); setLocation("/approvals"); }}>
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Genehmigungen</span>
                      {pendingApprovalCount > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {pendingApprovalCount > 9 ? "9+" : pendingApprovalCount}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Ressourcen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`nav-${item.url.replace("/", "")}`}
                  >
                    <a href={item.url} onClick={(e) => { e.preventDefault(); setLocation(item.url); }}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      data-testid={`nav-${item.url.replace("/", "")}`}
                    >
                      <a href={item.url} onClick={(e) => { e.preventDefault(); setLocation(item.url); }}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2 h-auto py-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-7 w-7 rounded-lg flex-shrink-0">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="text-xs rounded-lg bg-primary text-primary-foreground font-semibold">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left overflow-hidden">
                <span className="text-xs font-medium truncate w-full leading-tight">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full leading-tight font-mono">
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
              <CircleUser className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings">
              <Settings className="mr-2 h-4 w-4" />
              Einstellungen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
              data-testid="menu-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SidebarSeparator />

        <div className="flex items-center justify-center gap-2 px-1 py-1 text-[10px] text-muted-foreground">
          <Scale className="h-3 w-3 flex-shrink-0" />
          <span>AGPL-3.0</span>
          <span>·</span>
          <a href="/api/license" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline transition-colors" data-testid="link-license">
            Lizenz
          </a>
          <span>·</span>
          <a href="/api/source" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline transition-colors" data-testid="link-source">
            Quellcode
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
