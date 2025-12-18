import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowDown, ArrowUp, Flame } from "lucide-react";

type TicketPriority = "low" | "medium" | "high" | "urgent";

const priorityConfig: Record<TicketPriority, { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  low: {
    label: "Niedrig",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    Icon: ArrowDown,
  },
  medium: {
    label: "Mittel",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Icon: AlertCircle,
  },
  high: {
    label: "Hoch",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    Icon: ArrowUp,
  },
  urgent: {
    label: "Dringend",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Icon: Flame,
  },
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  showIcon?: boolean;
  className?: string;
}

export function PriorityBadge({ priority, showIcon = true, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  const { Icon } = config;
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium border-0 gap-1",
        config.className,
        className
      )}
      data-testid={`badge-priority-${priority}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  const colors: Record<TicketPriority, string> = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <span
      className={cn("w-2 h-2 rounded-full inline-block", colors[priority])}
      title={priorityConfig[priority]?.label}
      data-testid={`dot-priority-${priority}`}
    />
  );
}
