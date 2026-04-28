/**
 * SettingsNav
 *
 * Horizontal tab strip shared by all settings pages.
 * Highlights the active tab based on the current URL.
 */

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Allgemein",          path: "/settings" },
  { label: "SLA",                path: "/settings/sla" },
  { label: "Branding",           path: "/settings/branding" },
  { label: "Exchange",           path: "/settings/exchange" },
  { label: "TLS-Zertifikate",    path: "/settings/tls" },
  { label: "Logs",               path: "/settings/logs" },
] as const;

export function SettingsNav() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/settings") return location === "/settings" || location === "/settings/";
    return location === path || location.startsWith(path + "/");
  };

  return (
    <div className="flex items-center gap-1 border-b border-border pb-0 mb-6">
      {TABS.map(tab => (
        <button
          key={tab.path}
          type="button"
          onClick={() => setLocation(tab.path)}
          className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            isActive(tab.path)
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
          data-testid={`settings-tab-${tab.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
