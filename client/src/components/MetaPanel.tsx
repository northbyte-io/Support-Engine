/**
 * MetaPanel
 *
 * The 300px right panel of the ticket workspace. Shows and edits all
 * ticket metadata: status, priority, assignee, SLA, entity links, tags,
 * attachments, time summary, and linked tickets.
 *
 * Each dropdown/select uses optimistic updates — the UI updates instantly
 * and rolls back on API error.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  User2,
  Tag,
  Paperclip,
  Clock,
  Building2,
  Package,
  Contact,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlaCountdown } from "@/components/SlaCountdown";
import { AttachmentList } from "@/components/AttachmentList";
import { useToast } from "@/hooks/use-toast";
import { useMode } from "@/lib/mode";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { TicketWithRelations, User } from "@shared/schema";

interface MetaPanelProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  low:    "Niedrig",
  medium: "Mittel",
  high:   "Hoch",
  urgent: "Kritisch",
};

const STATUS_LABELS: Record<string, string> = {
  open:        "Offen",
  in_progress: "In Bearbeitung",
  waiting:     "Wartend",
  resolved:    "Gelöst",
  closed:      "Geschlossen",
};

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="text-2xs uppercase tracking-wider text-[var(--meta-panel-label-color,hsl(var(--muted-foreground)))] font-medium mb-1.5">
      {children}
    </p>
  );
}

function SectionDivider() {
  return <div className="border-b border-[var(--meta-panel-section-divider,hsl(var(--border)))] mb-4" />;
}

function formatMinutes(totalMinutes: number): string {
  const h = (totalMinutes / 60).toFixed(1);
  return `${h}h`;
}

export function MetaPanel({ ticketId, isOpen, onClose }: Readonly<MetaPanelProps>) {
  const mode = useMode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ticket } = useQuery<TicketWithRelations>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: Boolean(ticketId),
  });

  const { data: agents } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", { role: "agent" }],
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/tickets/${ticketId}`, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      const prev = queryClient.getQueryData<TicketWithRelations>([`/api/tickets/${ticketId}`]);
      queryClient.setQueryData<TicketWithRelations>([`/api/tickets/${ticketId}`], (old) =>
        old ? { ...old, ...newData } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData([`/api/tickets/${ticketId}`], ctx.prev);
      }
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });

  if (!ticket) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const firstAssignee = ticket.assignees?.[0];

  return (
    <div
      className="flex flex-col h-full bg-[var(--meta-panel-bg,hsl(var(--card)))]"
      data-testid="meta-panel-content"
    >
      {/* Panel header with close chevron */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border h-12">
        <span className="text-ui-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Details
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Meta-Panel schließen"
          data-testid="button-meta-close"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">

          {/* ── Status ── */}
          <div>
            <SectionLabel>Status</SectionLabel>
            <Select
              value={ticket.status ?? "open"}
              onValueChange={val => updateMutation.mutate({ status: val })}
            >
              <SelectTrigger className="h-8 text-xs" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Priorität ── */}
          <div>
            <SectionLabel>Priorität</SectionLabel>
            <Select
              value={ticket.priority ?? "medium"}
              onValueChange={val => updateMutation.mutate({ priority: val })}
            >
              <SelectTrigger className="h-8 text-xs" data-testid="select-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SectionDivider />

          {/* ── Zugewiesen an ── */}
          <div>
            <SectionLabel>
              <User2 className="w-3 h-3 inline mr-1" />
              Zugewiesen an
            </SectionLabel>
            <Select
              value={firstAssignee?.user?.id ?? "unassigned"}
              onValueChange={val => updateMutation.mutate({
                assignedToId: val === "unassigned" ? null : val
              })}
            >
              <SelectTrigger className="h-8 text-xs" data-testid="select-assignee">
                <SelectValue placeholder="Nicht zugewiesen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-xs">
                  Nicht zugewiesen
                </SelectItem>
                {agents?.map(agent => (
                  <SelectItem key={agent.id} value={agent.id} className="text-xs">
                    {agent.firstName} {agent.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SectionDivider />

          {/* ── SLA ── */}
          {(ticket.slaResolutionDueAt || ticket.slaResponseDueAt) && (
            <>
              <div>
                <SectionLabel>
                  <Clock className="w-3 h-3 inline mr-1" />
                  SLA-Fälligkeit
                </SectionLabel>
                <SlaCountdown
                  dueAt={ticket.slaResolutionDueAt ?? ticket.slaResponseDueAt}
                  size="full"
                />
              </div>
              <SectionDivider />
            </>
          )}

          {/* ── Mode-aware entity section ── */}
          {mode === "msp" ? (
            <div>
              <SectionLabel>
                <Building2 className="w-3 h-3 inline mr-1" />
                Kundenfirma
              </SectionLabel>
              {ticket.customer ? (
                <span className="text-ui-xs text-foreground">{ticket.customer.name}</span>
              ) : (
                <span className="text-ui-xs text-muted-foreground">Keine Kundenfirma</span>
              )}
            </div>
          ) : (
            <div>
              <SectionLabel>
                <Package className="w-3 h-3 inline mr-1" />
                Asset / Endnutzer
              </SectionLabel>
              <span className="text-ui-xs text-muted-foreground">–</span>
            </div>
          )}

          <SectionDivider />

          {/* ── Tags placeholder ── */}
          <div>
            <SectionLabel>
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </SectionLabel>
            <span className="text-ui-xs text-muted-foreground">Keine Tags</span>
          </div>

          <SectionDivider />

          {/* ── Attachments ── */}
          <div>
            <SectionLabel>
              <Paperclip className="w-3 h-3 inline mr-1" />
              Anhänge
            </SectionLabel>
            <AttachmentList
              ticketId={ticketId}
              attachments={ticket.attachments ?? []}
            />
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
