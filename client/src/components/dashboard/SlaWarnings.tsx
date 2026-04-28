/**
 * SlaWarnings widget
 *
 * Shows tickets that will breach SLA within 2 hours, sorted by urgency.
 * Click navigates to the ticket in the workspace.
 */

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SlaCountdown } from "@/components/SlaCountdown";
import { cn } from "@/lib/utils";
import type { TicketWithRelations } from "@shared/schema";

export function SlaWarnings() {
  const [, setLocation] = useLocation();

  const { data: tickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { sla_breach_within: 120, sort: "sla_due_asc", status: "open,in_progress,waiting" }],
    refetchInterval: 60_000,
  });

  return (
    <Card className="border-sla-danger/30 bg-[var(--dashboard-sla-alert-bg,hsl(var(--card)))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-ui-sm font-semibold">
          <AlertTriangle className="w-4 h-4 text-sla-danger" />
          SLA-Warnungen
          {tickets && tickets.length > 0 && (
            <Badge className="ml-auto bg-sla-danger text-white text-2xs">
              {tickets.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="flex-1 h-3" />
              <Skeleton className="w-16 h-3" />
            </div>
          ))
        ) : !tickets?.length ? (
          <p className="text-ui-xs text-sla-ok py-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sla-ok" />
            Keine SLA-Warnungen — alles im grünen Bereich
          </p>
        ) : (
          tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setLocation(`/tickets/${ticket.id}`)}
              className="w-full flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors text-left"
              data-testid={`sla-warning-${ticket.id}`}
            >
              <span className="w-2 h-2 rounded-full bg-sla-danger flex-shrink-0 animate-pulse-danger" />
              <span className="flex-1 text-ui-xs truncate text-foreground">
                {ticket.title}
              </span>
              <SlaCountdown dueAt={ticket.slaResolutionDueAt} size="compact" />
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
