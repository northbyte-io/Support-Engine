/**
 * SlaCountdown
 *
 * Displays time remaining until an SLA deadline with color-coded urgency states.
 * Updates every 60 seconds via an interval timer.
 *
 * Urgency thresholds (from design tokens):
 *   > 4h remaining  → sla-ok (green)
 *   1h–4h remaining → sla-warning (amber)
 *   < 1h or overdue → sla-danger (red), pulsing animation
 */

import { useState, useEffect } from "react";
import { formatDistanceToNow, differenceInMinutes, format, isPast } from "date-fns";
import { de } from "date-fns/locale";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlaCountdownProps {
  /** The SLA deadline. Renders nothing if null. */
  dueAt: Date | string | null | undefined;
  /** "compact" = inline colored text + dot (for list rows)
   *  "full"    = badge with label + absolute datetime (for meta panel, dashboard) */
  size?: "compact" | "full";
  className?: string;
}

function getUrgency(dueAt: Date): "ok" | "warning" | "danger" {
  if (isPast(dueAt)) return "danger";
  const minutesLeft = differenceInMinutes(dueAt, new Date());
  if (minutesLeft < 60) return "danger";
  if (minutesLeft <= 240) return "warning";
  return "ok";
}

function formatRemaining(dueAt: Date): string {
  if (isPast(dueAt)) {
    return `überfällig seit ${formatDistanceToNow(dueAt, { locale: de })}`;
  }
  const total = differenceInMinutes(dueAt, new Date());
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function SlaCountdown({ dueAt, size = "compact", className }: Readonly<SlaCountdownProps>) {
  const [, forceUpdate] = useState(0);

  // Re-render every 60 seconds
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!dueAt) return null;

  const date = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  if (isNaN(date.getTime())) return null;

  const urgency = getUrgency(date);
  const remaining = formatRemaining(date);

  const colorClass = {
    ok:      "text-sla-ok",
    warning: "text-sla-warning",
    danger:  "text-sla-danger",
  }[urgency];

  const dotColorClass = {
    ok:      "bg-sla-ok",
    warning: "bg-sla-warning",
    danger:  "bg-sla-danger animate-pulse-danger",
  }[urgency];

  if (size === "compact") {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-2xs font-mono tabular-nums", colorClass, className)}
        aria-live="polite"
        aria-label={`SLA: ${remaining}`}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColorClass)} />
        {remaining}
      </span>
    );
  }

  // Full variant — for MetaPanel and Dashboard widgets
  const Icon = urgency === "ok" ? CheckCircle : urgency === "warning" ? AlertTriangle : Clock;

  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      aria-live="polite"
    >
      <div className={cn("flex items-center gap-1.5 text-ui-sm font-medium", colorClass)}>
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-mono tabular-nums">{remaining}</span>
      </div>
      <span className="text-2xs text-muted-foreground font-mono">
        Fällig: {format(date, "dd.MM.yyyy HH:mm", { locale: de })} Uhr
      </span>
    </div>
  );
}
