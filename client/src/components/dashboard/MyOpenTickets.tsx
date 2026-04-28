/**
 * MyOpenTickets widget
 *
 * Shows the current agent's assigned open and in-progress tickets,
 * sorted by SLA urgency.
 */

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SlaCountdown } from "@/components/SlaCountdown";
import { StatusBadge } from "@/components/StatusBadge";
import type { TicketWithRelations } from "@shared/schema";

export function MyOpenTickets() {
  const [, setLocation] = useLocation();

  const { data: tickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { assignedTo: "me", status: "open,in_progress", sort: "sla_due_asc" }],
    refetchInterval: 120_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-ui-sm font-semibold">
          <Ticket className="w-4 h-4 text-primary" />
          Meine offenen Tickets
          {tickets && tickets.length > 0 && (
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-2xs" variant="outline">
              {tickets.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="flex-1 h-3" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))
        ) : !tickets?.length ? (
          <p className="text-ui-xs text-muted-foreground py-2">
            Keine offenen Tickets zugewiesen
          </p>
        ) : (
          tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setLocation(`/tickets/${ticket.id}`)}
              className="w-full flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors text-left"
              data-testid={`my-ticket-${ticket.id}`}
            >
              <span className="flex-1 text-ui-xs truncate text-foreground">
                {ticket.title}
              </span>
              <StatusBadge status={ticket.status as "open" | "in_progress" | "waiting" | "resolved" | "closed"} />
              {ticket.slaResolutionDueAt && (
                <SlaCountdown dueAt={ticket.slaResolutionDueAt} size="compact" />
              )}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
