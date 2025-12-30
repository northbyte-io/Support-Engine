import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  LogOut,
  FolderKanban,
  CircleUser,
  Clock,
  Timer,
  BookOpen,
  ClipboardList,
  Package,
  Kanban,
  Building2,
  Contact,
  Landmark,
  ScrollText,
  Palette,
} from "lucide-react";
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

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Tickets",
    url: "/tickets",
    icon: Ticket,
  },
  {
    title: "Zeiterfassung",
    url: "/time-tracking",
    icon: Timer,
  },
  {
    title: "Wissensdatenbank",
    url: "/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "Bereiche",
    url: "/areas",
    icon: FolderKanban,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: Package,
  },
  {
    title: "Projekte",
    url: "/projects",
    icon: Kanban,
  },
  {
    title: "Kunden",
    url: "/customers",
    icon: Building2,
  },
  {
    title: "Kontakte",
    url: "/contacts",
    icon: Contact,
  },
  {
    title: "Organisationen",
    url: "/organizations",
    icon: Landmark,
  },
];

const adminNavItems = [
  {
    title: "Benutzer",
    url: "/users",
    icon: Users,
  },
  {
    title: "Umfragen",
    url: "/surveys",
    icon: ClipboardList,
  },
  {
    title: "System-Logs",
    url: "/logs",
    icon: ScrollText,
  },
  {
    title: "Branding",
    url: "/branding",
    icon: Palette,
  },
  {
    title: "SLA-Verwaltung",
    url: "/settings/sla",
    icon: Clock,
  },
  {
    title: "Einstellungen",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const { theme } = useTheme();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const getLogo = () => {
    if (theme === "dark" && branding?.logoDark) {
      return branding.logoDark;
    }
    return branding?.logoLight || branding?.logoUrl;
  };

  const logo = getLogo();
  const tenantName = branding?.name || "Ticket-System";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={tenantName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <div>
            <span className="font-semibold text-sm">{tenantName}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left overflow-hidden">
                <span className="text-sm font-medium truncate w-full">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => setLocation("/profile")}
              data-testid="menu-profile"
            >
              <CircleUser className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocation("/settings")}
              data-testid="menu-settings"
            >
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
      </SidebarFooter>
    </Sidebar>
  );
}
