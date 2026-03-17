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
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50",
    dotColor: "bg-slate-400 dark:bg-slate-500",
    Icon: ArrowDown,
  },
  medium: {
    label: "Mittel",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50",
    dotColor: "bg-sky-500",
    Icon: AlertCircle,
  },
  high: {
    label: "Hoch",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50",
    dotColor: "bg-orange-500",
    Icon: ArrowUp,
  },
  urgent: {
    label: "Dringend",
    className: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/50",
    dotColor: "bg-red-500",
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
