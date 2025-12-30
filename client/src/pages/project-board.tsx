import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, MoreHorizontal, Ticket, GripVertical, Settings, Users, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { Project, BoardColumn, TicketWithRelations, Ticket as TicketType } from "@shared/schema";

interface BoardData {
  project: Project;
  board: {
    column: BoardColumn;
    tickets: { ticketId: string; projectId: string; boardOrder: number }[];
  }[];
}

function PriorityBadge({ priority }: { priority: string }) {
  const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    low: { label: "Niedrig", variant: "outline" },
    medium: { label: "Mittel", variant: "secondary" },
    high: { label: "Hoch", variant: "default" },
    urgent: { label: "Dringend", variant: "destructive" },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
}

function TicketCard({ ticket, onStatusChange }: { ticket: TicketWithRelations; onStatusChange: (newStatus: string) => void }) {
  const [, setLocation] = useLocation();

  return (
    <Card
      className="mb-2 hover-elevate cursor-pointer"
      data-testid={`card-ticket-${ticket.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                {ticket.ticketNumber}
              </span>
              <PriorityBadge priority={ticket.priority || "medium"} />
            </div>
            <h4
              className="text-sm font-medium line-clamp-2 hover:underline"
              onClick={() => setLocation(`/tickets/${ticket.id}`)}
            >
              {ticket.title}
            </h4>
            {ticket.ticketType && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs" style={{ borderColor: ticket.ticketType.color || undefined }}>
                  {ticket.ticketType.name}
                </Badge>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation(`/tickets/${ticket.id}`)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Ticket öffnen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("open")}>
                Auf Offen setzen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("in_progress")}>
                In Bearbeitung
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("resolved")}>
                Gelöst
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("closed")}>
                Geschlossen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {ticket.assignees && ticket.assignees.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {ticket.assignees[0]?.user?.firstName} {ticket.assignees[0]?.user?.lastName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BoardColumnComponent({
  column,
  tickets,
  onAddTicket,
  onStatusChange,
}: {
  column: BoardColumn;
  tickets: TicketWithRelations[];
  onAddTicket: () => void;
  onStatusChange: (ticketId: string, newStatus: string) => void;
}) {
  const ticketCount = tickets.length;
  const isOverWipLimit = column.wipLimit && ticketCount > column.wipLimit;

  return (
    <div
      className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3"
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || "#6B7280" }}
          />
          <h3 className="font-medium text-sm">{column.name}</h3>
          <Badge
            variant={isOverWipLimit ? "destructive" : "secondary"}
            className="text-xs"
          >
            {ticketCount}
            {column.wipLimit && `/${column.wipLimit}`}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTicket}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-2 pr-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onStatusChange={(newStatus) => onStatusChange(ticket.id, newStatus)}
            />
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Keine Tickets
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function AddTicketDialog({
  projectId,
  open,
  onOpenChange,
  onAdded,
  existingTicketIds,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  existingTicketIds: string[];
}) {
  const { toast } = useToast();
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");

  const { data: tickets } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets"],
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return apiRequest("POST", `/api/tickets/${ticketId}/projects`, { projectId });
    },
    onSuccess: () => {
      toast({ title: "Ticket hinzugefügt", description: "Das Ticket wurde dem Projekt hinzugefügt." });
      setSelectedTicketId("");
      onOpenChange(false);
      onAdded();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ticket konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  const availableTickets = tickets?.filter((t) => !existingTicketIds.includes(t.id)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ticket zum Projekt hinzufügen</DialogTitle>
          <DialogDescription>
            Wählen Sie ein Ticket aus, das diesem Projekt zugeordnet werden soll.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select value={selectedTicketId} onValueChange={setSelectedTicketId}>
            <SelectTrigger data-testid="select-ticket">
              <SelectValue placeholder="Ticket auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {availableTickets.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Keine weiteren Tickets verfügbar
                </div>
              ) : (
                availableTickets.map((ticket) => (
                  <SelectItem key={ticket.id} value={ticket.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{ticket.ticketNumber}</span>
                      <span className="truncate">{ticket.title}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => addMutation.mutate(selectedTicketId)}
            disabled={!selectedTicketId || addMutation.isPending}
            data-testid="button-add-ticket"
          >
            {addMutation.isPending ? "Wird hinzugefügt..." : "Hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectBoardPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [addTicketOpen, setAddTicketOpen] = useState(false);

  const { data: boardData, isLoading, refetch } = useQuery<BoardData>({
    queryKey: ["/api/projects", params.id, "board"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${params.id}/board`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch board");
      return response.json();
    },
    enabled: !!params.id,
  });

  const { data: allTickets } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets"],
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status aktualisiert" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <MainLayout title="Projekt laden...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!boardData?.project) {
    return (
      <MainLayout title="Projekt nicht gefunden">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Das angeforderte Projekt wurde nicht gefunden.</p>
          <Button onClick={() => setLocation("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Projekten
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { project, board } = boardData;

  const allProjectTicketIds = board.flatMap((col) => col.tickets.map((t) => t.ticketId));

  const getTicketsForColumn = (columnTickets: { ticketId: string }[]): TicketWithRelations[] => {
    return columnTickets
      .map((ct) => allTickets?.find((t) => t.id === ct.ticketId))
      .filter((t): t is TicketWithRelations => !!t);
  };

  return (
    <MainLayout
      title={project.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/projects")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button size="sm" onClick={() => setAddTicketOpen(true)} data-testid="button-add-ticket-to-project">
            <Plus className="w-4 h-4 mr-2" />
            Ticket hinzufügen
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <p className="text-muted-foreground">{project.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="outline">{project.key}</Badge>
          <span className="text-sm text-muted-foreground">
            {allProjectTicketIds.length} Tickets im Projekt
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {board.map((columnData) => (
            <BoardColumnComponent
              key={columnData.column.id}
              column={columnData.column}
              tickets={getTicketsForColumn(columnData.tickets)}
              onAddTicket={() => setAddTicketOpen(true)}
              onStatusChange={(ticketId, newStatus) =>
                updateTicketStatusMutation.mutate({ ticketId, status: newStatus })
              }
            />
          ))}
        </div>
      </div>

      <AddTicketDialog
        projectId={params.id!}
        open={addTicketOpen}
        onOpenChange={setAddTicketOpen}
        onAdded={() => refetch()}
        existingTicketIds={allProjectTicketIds}
      />
    </MainLayout>
  );
}
