import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { TimerDisplay } from "@/components/TimerDisplay";
import { Scale } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function MainLayout({ children, title, actions }: MainLayoutProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {title && (
                <h1 className="text-lg font-semibold" data-testid="text-page-title">
                  {title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <TimerDisplay />
              <NotificationDropdown />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          <footer className="flex items-center justify-center gap-2 px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <Scale className="h-3 w-3" />
            <span>AGPL-3.0</span>
            <span>|</span>
            <a 
              href="/api/license" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
              data-testid="link-license"
            >
              Lizenz
            </a>
            <span>|</span>
            <a 
              href="/api/source" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
              data-testid="link-source"
            >
              Quellcode
            </a>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
