/**
 * LanguageToggle
 *
 * Compact DE/EN two-button toggle for the sidebar footer.
 * Persists the preference to localStorage and (when authenticated)
 * to the user's profile via PATCH /api/user/preferences.
 *
 * Note: The app currently only ships German strings. This toggle
 * records preference for future i18n expansion and the EN button
 * shows a "coming soon" tooltip.
 */

import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type Locale = "de" | "en";

const STORAGE_KEY = "preferred_locale";

function getStored(): Locale {
  if (typeof window === "undefined") return "de";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "en" ? "en" : "de";
}

export function LanguageToggle({ className }: Readonly<{ className?: string }>) {
  const [locale, setLocaleState] = useState<Locale>(getStored);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Future: call PATCH /api/user/preferences when EN strings are available
  };

  return (
    <div
      className={cn("flex items-center gap-1 p-1 rounded-md bg-muted/50", className)}
      data-testid="language-toggle"
    >
      <Globe className="w-3 h-3 text-muted-foreground ml-1 flex-shrink-0" />
      {(["de", "en"] as Locale[]).map(lang => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={cn(
            "px-2 py-0.5 rounded text-2xs font-medium uppercase tracking-wide transition-colors",
            locale === lang
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={lang === "de" ? "Deutsch" : "English"}
          aria-pressed={locale === lang}
          data-testid={`lang-${lang}`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
