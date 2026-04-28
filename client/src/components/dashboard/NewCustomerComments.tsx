/**
 * NewCustomerComments widget
 *
 * Shows tickets with unread customer replies since last agent activity.
 */

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketWithRelations } from "@shared/schema";

export function NewCustomerComments() {
  const [, setLocation] = useLocation();

  const { data: tickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { has_unread_customer_comment: true, sort: "updated_desc" }],
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-ui-sm font-semibold">
          <MessageSquare className="w-4 h-4 text-status-open" />
          Neue Kommentare von Endnutzern
          {tickets && tickets.length > 0 && (
            <Badge className="ml-auto bg-status-open text-white text-2xs">
              {tickets.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))
        ) : !tickets?.length ? (
          <p className="text-ui-xs text-muted-foreground py-2">
            Keine neuen Nachrichten
          </p>
        ) : (
          tickets.map(ticket => {
            const lastComment = ticket.comments?.[ticket.comments.length - 1];
            const author = lastComment?.author;
            const initials = ((author?.firstName?.[0] ?? "") + (author?.lastName?.[0] ?? "")).toUpperCase();

            return (
              <button
                key={ticket.id}
                onClick={() => setLocation(`/tickets/${ticket.id}`)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors text-left"
                data-testid={`unread-ticket-${ticket.id}`}
              >
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-ui-xs font-medium text-foreground truncate">
                    {ticket.title}
                  </p>
                  {author && (
                    <p className="text-2xs text-muted-foreground">
                      {author.firstName} {author.lastName}
                    </p>
                  )}
                </div>
                {ticket.updatedAt && (
                  <span className="text-2xs text-muted-foreground font-mono flex-shrink-0">
                    {formatDistanceToNow(new Date(ticket.updatedAt), { locale: de, addSuffix: false })}
                  </span>
                )}
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
