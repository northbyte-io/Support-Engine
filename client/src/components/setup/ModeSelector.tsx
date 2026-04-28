/**
 * Setup Step 1: Modus wählen
 *
 * Two selection cards for IT-Abteilung vs MSP mode.
 */

import { Building2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenantMode } from "@/lib/mode";

const MODES = [
  {
    value: "it-department" as TenantMode,
    label: "IT-Abteilung",
    description: "Für interne IT-Teams, die Mitarbeiter und Assets einer Organisation betreuen.",
    icon: Building2,
  },
  {
    value: "msp" as TenantMode,
    label: "IT-Dienstleister (MSP)",
    description: "Für Managed Service Provider, die mehrere Kundenfirmen mit eigenem Support betreuen.",
    icon: Network,
  },
];

interface ModeSelectorProps {
  value: TenantMode | null;
  onChange: (mode: TenantMode) => void;
}

export function ModeSelector({ value, onChange }: Readonly<ModeSelectorProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MODES.map(mode => {
        const isSelected = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              "text-left p-4 rounded-lg border-2 transition-all",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
            )}
            data-testid={`mode-${mode.value}`}
          >
            <mode.icon
              className={cn(
                "w-6 h-6 mb-3",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p className={cn(
              "text-ui-sm font-semibold mb-1",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {mode.label}
            </p>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
