import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import type { Tenant } from "@shared/schema";

interface BrandingContextType {
  branding: Tenant | null;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
});

export function useBranding() {
  return useContext(BrandingContext);
}

// Color overrides removed — amber is the global primary (design system decision).
// Branding only controls: favicon, custom CSS, logo, and tenant name.

function applyBrandingStyles(branding: Tenant) {
  if (branding.favicon) {
    const existingFavicon = document.querySelector("link[rel='icon']");
    if (existingFavicon) {
      existingFavicon.setAttribute("href", branding.favicon);
    } else {
      const favicon = document.createElement("link");
      favicon.rel = "icon";
      favicon.href = branding.favicon;
      document.head.appendChild(favicon);
    }
  }

  if (branding.customCss) {
    let styleElement = document.getElementById("tenant-custom-css");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "tenant-custom-css";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = branding.customCss;
  }
}

function removeBrandingStyles() {
  const customCss = document.getElementById("tenant-custom-css");
  if (customCss) {
    customCss.remove();
  }
}

export function BrandingProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const [appliedBranding, setAppliedBranding] = useState<Tenant | null>(null);

  const { data: branding, isLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenant/branding"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (branding && isAuthenticated) {
      removeBrandingStyles();
      applyBrandingStyles(branding);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppliedBranding(branding);
    } else if (!isAuthenticated) {
      removeBrandingStyles();
      setAppliedBranding(null);
    }
  }, [branding, isAuthenticated]);

  const contextValue = useMemo(() => ({ branding: appliedBranding, isLoading }), [appliedBranding, isLoading]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}
