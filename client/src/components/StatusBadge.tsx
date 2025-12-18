import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: "Offen",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  in_progress: {
    label: "In Bearbeitung",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  waiting: {
    label: "Wartend",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  resolved: {
    label: "Gelöst",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  closed: {
    label: "Geschlossen",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
  },
};

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open;
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
