/**
 * TicketListRow
 *
 * A single row in the ticket list pane (280px wide, 68px tall).
 * Renders status dot, ticket number, title, and SLA countdown.
 *
 * Visual states:
 *   default   → transparent background, muted number
 *   hover     → var(--ticket-row-hover-bg)
 *   selected  → var(--ticket-row-selected-bg) + 2px left border (indigo)
 *   unread    → 2px left border (sla-danger color), bold title
 */

import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { SlaCountdown } from "@/components/SlaCountdown";
import { cn } from "@/lib/utils";
import type { TicketWithRelations } from "@shared/schema";

const STATUS_DOT: Record<string, string> = {
  open:        "bg-status-open",
  in_progress: "bg-status-active",
  waiting:     "bg-status-waiting",
  resolved:    "bg-status-done",
  closed:      "bg-status-closed",
};

interface TicketListRowProps {
  ticket: TicketWithRelations;
  isSelected: boolean;
  /** True when there is an unread customer comment on this ticket */
  hasUnread?: boolean;
  onClick: () => void;
}

export function TicketListRow({
  ticket,
  isSelected,
  hasUnread = false,
  onClick,
}: Readonly<TicketListRowProps>) {
  const dotColor = STATUS_DOT[ticket.status ?? "open"] ?? "bg-status-closed";

  const fallbackDate = ticket.updatedAt
    ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: de })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left flex items-stretch px-3 py-2.5 gap-2.5 border-l-2 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-inset focus-visible:ring-primary/70",
        // Left border
        isSelected
          ? "border-[var(--ticket-row-selected-border,hsl(var(--primary)))]"
          : hasUnread
            ? "border-sla-danger"
            : "border-transparent",
        // Background
        isSelected
          ? "bg-[var(--ticket-row-selected-bg,hsl(var(--primary)/0.06))]"
          : "bg-transparent hover:bg-[var(--ticket-row-hover-bg,hsl(var(--muted)/0.5))]",
      )}
      data-testid={`ticket-row-${ticket.id}`}
      aria-pressed={isSelected}
    >
      {/* Status dot */}
      <span className="flex-shrink-0 pt-[3px]">
        <span className={cn("block w-2 h-2 rounded-full", dotColor)} />
      </span>

      {/* Content */}
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        {/* Ticket number */}
        <span className="font-mono text-2xs text-muted-foreground leading-none">
          #{ticket.ticketNumber}
        </span>

        {/* Title */}
        <span
          className={cn(
            "text-ui-sm leading-snug truncate",
            hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
          )}
        >
          {ticket.title}
        </span>

        {/* SLA or fallback timestamp */}
        <span className="flex items-center gap-1 mt-0.5">
          {ticket.slaResolutionDueAt ? (
            <SlaCountdown
              dueAt={ticket.slaResolutionDueAt}
              size="compact"
            />
          ) : fallbackDate ? (
            <span className="text-2xs text-muted-foreground font-mono">{fallbackDate}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
