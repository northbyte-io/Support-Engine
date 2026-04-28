/**
 * Tenant Mode Context
 *
 * Provides the deployment mode of the current tenant throughout the app
 * without prop drilling. Two modes exist:
 *   - "it-department": Internal IT department — end users, assets, areas
 *   - "msp": Managed Service Provider — customer companies, contacts, organisations
 *
 * Source priority:
 *   1. Tenant `deploymentMode` field from branding API (server-authoritative)
 *   2. `localStorage` key "tenant_mode" as dev fallback
 *   3. "it-department" as safe default
 */

import { createContext, useContext, useMemo } from "react";
import { useBranding } from "./branding";

export type TenantMode = "it-department" | "msp";

interface ModeContextType {
  mode: TenantMode;
}

const ModeContext = createContext<ModeContextType>({ mode: "it-department" });

/** Read the raw deploymentMode string from the branding Tenant object */
function resolveMode(rawValue: string | null | undefined): TenantMode {
  if (rawValue === "msp") return "msp";
  if (rawValue === "it-department") return "it-department";

  // Dev fallback: read from localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("tenant_mode");
    if (stored === "msp") return "msp";
  }

  return "it-department";
}

export function ModeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { branding } = useBranding();

  const mode = useMemo(
    () => resolveMode((branding as Record<string, unknown>)?.deploymentMode as string | undefined),
    [branding]
  );

  return (
    <ModeContext.Provider value={{ mode }}>
      {children}
    </ModeContext.Provider>
  );
}

/** Returns the current tenant deployment mode. */
export function useMode(): TenantMode {
  return useContext(ModeContext).mode;
}
