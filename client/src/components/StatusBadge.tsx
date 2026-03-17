import { cn } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: "Offen",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50",
  },
  in_progress: {
    label: "In Bearbeitung",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50",
  },
  waiting: {
    label: "Wartend",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50",
  },
  resolved: {
    label: "Gelöst",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50",
  },
  closed: {
    label: "Geschlossen",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50",
  },
};

interface StatusBadgeProps {
  readonly status: TicketStatus;
  readonly className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.open;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-mono",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </span>
  );
}
