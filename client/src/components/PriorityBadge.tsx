import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, AlertCircle, Flame } from "lucide-react";

type TicketPriority = "low" | "medium" | "high" | "urgent";

const priorityConfig: Record<TicketPriority, {
  label: string;
  className: string;
  dotColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  low: {
    label: "Niedrig",
    className: "bg-sla-ok/10 text-sla-ok border border-sla-ok/20",
    dotColor: "bg-sla-ok",
    Icon: ArrowDown,
  },
  medium: {
    label: "Mittel",
    className: "bg-status-active/10 text-status-active border border-status-active/20",
    dotColor: "bg-status-active",
    Icon: AlertCircle,
  },
  high: {
    label: "Hoch",
    className: "bg-sla-warning/10 text-sla-warning border border-sla-warning/20",
    dotColor: "bg-sla-warning",
    Icon: ArrowUp,
  },
  urgent: {
    label: "Dringend",
    className: "bg-sla-danger/10 text-sla-danger border border-sla-danger/20",
    dotColor: "bg-sla-danger",
    Icon: Flame,
  },
};

interface PriorityBadgeProps {
  readonly priority: TicketPriority;
  readonly showIcon?: boolean;
  readonly className?: string;
}

export function PriorityBadge({ priority, showIcon = true, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? priorityConfig.medium;
  const { Icon } = config;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium font-mono",
        config.className,
        className
      )}
      data-testid={`badge-priority-${priority}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}

export function PriorityDot({ priority }: Readonly<{ priority: TicketPriority }>) {
  const config = priorityConfig[priority] ?? priorityConfig.medium;
  return (
    <span
      className={cn("w-2 h-2 rounded-full inline-block flex-shrink-0", config.dotColor)}
      title={config.label}
      data-testid={`dot-priority-${priority}`}
    />
  );
}
