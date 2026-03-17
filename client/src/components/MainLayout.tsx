import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Input } from "@/components/ui/input";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function MainLayout({ children, title, actions }: Readonly<MainLayoutProps>) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-3 px-4 py-2.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10">
            <div className="flex items-center gap-3 flex-shrink-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {title && (
                <h1 className="font-display text-base font-semibold text-foreground" data-testid="text-page-title">
                  {title}
                </h1>
              )}
            </div>

            <div className="flex-1 flex justify-center px-2 max-w-md mx-auto w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Suchen… (Enter)"
                  className="pl-9 h-8 text-xs bg-muted/40 border-border/50 w-full cursor-text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const q = search.trim();
                      setLocation(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
                      setSearch("");
                    }
                  }}
                  data-testid="input-global-search-nav"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
              <TimerDisplay />
              <NotificationDropdown />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
