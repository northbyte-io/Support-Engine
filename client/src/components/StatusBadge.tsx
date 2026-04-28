import { cn } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: "Offen",
    className: "bg-status-open/10 text-status-open border border-status-open/20",
  },
  in_progress: {
    label: "In Bearbeitung",
    className: "bg-status-active/10 text-status-active border border-status-active/20",
  },
  waiting: {
    label: "Wartend",
    className: "bg-status-waiting/10 text-status-waiting border border-status-waiting/20",
  },
  resolved: {
    label: "Gelöst",
    className: "bg-status-done/10 text-status-done border border-status-done/20",
  },
  closed: {
    label: "Geschlossen",
    className: "bg-status-closed/10 text-status-closed border border-status-closed/20",
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
