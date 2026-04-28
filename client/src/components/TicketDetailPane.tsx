/**
 * TicketDetailPane
 *
 * The center column of the ticket workspace. Shows all ticket content:
 *   - Header (ticket number, title, entity chip, action buttons)
 *   - Description (TipTap read-only, inline-editable on dblclick)
 *   - Comment thread (newest first)
 *   - CommentInput (sticky at bottom)
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import {
  Ticket as TicketIcon,
  Building2,
  ChevronDown,
  Edit3,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentBlock } from "@/components/CommentBlock";
import { CommentInput } from "@/components/CommentInput";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { TicketWithRelations, Comment } from "@shared/schema";
import { DURATION, EASING } from "@/lib/tokens";

const STATUS_LABELS: Record<string, string> = {
  open:        "Offen",
  in_progress: "In Bearbeitung",
  waiting:     "Wartend",
  resolved:    "Gelöst",
  closed:      "Geschlossen",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

type CommentWithAuthor = Comment & {
  author?: { id: string; firstName: string; lastName: string; avatar?: string | null; role?: string } | null;
};

interface TicketDetailPaneProps {
  ticketId: string | null;
  isPortal?: boolean;
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function NoTicketSelected() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <EmptyState
        icon={TicketIcon}
        title="Kein Ticket ausgewählt"
        description="Wähle ein Ticket aus der Liste, um Details anzuzeigen."
        className="opacity-60"
      />
    </div>
  );
}

function EntityChip({ ticket }: Readonly<{ ticket: TicketWithRelations }>) {
  if (ticket.customer) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-muted/50 text-2xs text-muted-foreground">
        <Building2 className="w-3 h-3" />
        {ticket.customer.name}
      </span>
    );
  }
  return null;
}

export function TicketDetailPane({
  ticketId,
  isPortal = false,
}: Readonly<TicketDetailPaneProps>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isAgent = !isPortal && (user?.role === "agent" || user?.role === "admin");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { data: ticket, isLoading: ticketLoading } = useQuery<TicketWithRelations>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: Boolean(ticketId),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: [`/api/tickets/${ticketId}/comments`],
    enabled: Boolean(ticketId),
    select: (data) => [...data].sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    ),
  });

  const updateTicketMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/tickets/${ticketId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: () => {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    },
  });

  const startEditTitle = () => {
    if (!ticket || !isAgent) return;
    setTitleDraft(ticket.title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== ticket?.title) {
      updateTicketMutation.mutate({ title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const cancelEditTitle = () => {
    setIsEditingTitle(false);
    setTitleDraft("");
  };

  if (!ticketId) return <NoTicketSelected />;
  if (ticketLoading) return <DetailSkeleton />;
  if (!ticket) return <NoTicketSelected />;

  return (
    <motion.div
      key={ticketId}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.FAST / 1000, ease: EASING.OUT }}
      className="flex flex-col h-full overflow-hidden"
      data-testid="ticket-detail-pane"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <EntityChip ticket={ticket} />
          <span className="font-mono text-2xs text-muted-foreground">
            #{ticket.ticketNumber}
          </span>
        </div>

        <div className="group flex items-start gap-2">
          {isEditingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") cancelEditTitle();
                }}
                className="flex-1 text-ui-xl font-semibold tracking-tight bg-transparent border-b-2 border-primary outline-none py-0.5"
                autoFocus
                data-testid="input-ticket-title"
              />
              <Button size="sm" variant="ghost" onClick={saveTitle} aria-label="Titel speichern">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEditTitle} aria-label="Abbrechen">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h1
              className={cn(
                "flex-1 text-ui-xl font-semibold tracking-tight leading-tight",
                isAgent && "cursor-text"
              )}
              onDoubleClick={startEditTitle}
              data-testid="text-ticket-title"
            >
              {ticket.title}
            </h1>
          )}
          {isAgent && !isEditingTitle && (
            <button
              onClick={startEditTitle}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
              aria-label="Titel bearbeiten"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {isAgent && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  {STATUS_LABELS[ticket.status ?? "open"]}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => updateTicketMutation.mutate({ status: opt.value })}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {isPortal && (
          <div className="flex items-center gap-2 pt-1">
            {ticket.status !== "resolved" && ticket.status !== "closed" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => updateTicketMutation.mutate({ status: "resolved" })}
                data-testid="button-resolve-ticket"
              >
                Als gelöst markieren
              </Button>
            )}
            {ticket.status === "resolved" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => updateTicketMutation.mutate({ status: "closed" })}
                data-testid="button-close-ticket"
              >
                Ticket schließen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {ticket.description && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.description) }}
            />
          )}

          <div className="border-t border-border" />

          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !comments?.length ? (
            <p className="text-ui-xs text-muted-foreground text-center py-4">
              Noch keine Kommentare
            </p>
          ) : (
            <div className="space-y-1">
              {comments.map(comment => (
                <CommentBlock
                  key={comment.id}
                  comment={comment}
                  isAgent={isAgent}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Read-only signature (portal mode only) */}
      {isPortal && ticket.signatureData && (
        <div className="flex-shrink-0 px-5 py-4 border-t border-border">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Unterschrift
          </p>
          <div className="rounded-md border border-border overflow-hidden bg-white inline-block">
            <img
              src={ticket.signatureData}
              alt="Unterschrift"
              className="max-h-[120px] w-auto block"
            />
          </div>
          {ticket.signatureByName && ticket.signatureAt && (
            <p className="text-2xs text-muted-foreground mt-1.5 font-mono">
              {ticket.signatureByName} ·{" "}
              {new Date(ticket.signatureAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* Comment input */}
      <CommentInput
        ticketId={ticketId}
        isAgent={isAgent}
      />
    </motion.div>
  );
}
