import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ArrowLeft, Plus, MoreHorizontal, Users, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project, BoardColumn, TicketWithRelations } from "@shared/schema";

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

function SortableTicketCard({
  ticket,
  onStatusChange,
}: {
  ticket: TicketWithRelations;
  onStatusChange: (newStatus: string) => void;
}) {
  const [, setLocation] = useLocation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-2 hover-elevate cursor-grab active:cursor-grabbing touch-none"
      data-testid={`card-ticket-${ticket.id}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">
                {ticket.ticketNumber}
              </span>
              <PriorityBadge priority={ticket.priority || "medium"} />
            </div>
            <h4
              className="text-sm font-medium line-clamp-2 hover:underline cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
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
            <DropdownMenuTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer">
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

function TicketCardOverlay({ ticket }: { ticket: TicketWithRelations }) {
  return (
    <Card className="w-64 shadow-lg rotate-3">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-mono">
            {ticket.ticketNumber}
          </span>
          <PriorityBadge priority={ticket.priority || "medium"} />
        </div>
        <h4 className="text-sm font-medium line-clamp-2">{ticket.title}</h4>
      </CardContent>
    </Card>
  );
}

function DroppableColumn({
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
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.status}`,
    data: {
      type: "column",
      status: column.status,
    },
  });

  const ticketCount = tickets.length;
  const isOverWipLimit = column.wipLimit && ticketCount > column.wipLimit;
  const ticketIds = tickets.map((t) => t.id);

  return (
    <div
      className={`flex-shrink-0 w-72 rounded-lg p-3 transition-colors flex flex-col ${
        isOver ? "bg-primary/10 ring-2 ring-primary/20" : "bg-muted/30"
      }`}
      data-testid={`column-${column.id}`}
      data-column-status={column.status}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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
        <Button variant="ghost" size="icon" onClick={onAddTicket}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto min-h-[200px]"
      >
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pr-2 h-full">
            {tickets.map((ticket) => (
              <SortableTicketCard
                key={ticket.id}
                ticket={ticket}
                onStatusChange={(newStatus) => onStatusChange(ticket.id, newStatus)}
              />
            ))}
            {tickets.length === 0 && (
              <div className={`text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg h-full flex items-center justify-center ${
                isOver ? "border-primary/50 bg-primary/5" : "border-muted"
              }`}>
                Tickets hierher ziehen
              </div>
            )}
          </div>
        </SortableContext>
      </div>
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/board`] });
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
  const [activeTicket, setActiveTicket] = useState<TicketWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: boardData, isLoading } = useQuery<BoardData>({
    queryKey: [`/api/projects/${params.id}/board`],
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
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${params.id}/board`] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = allTickets?.find((t) => t.id === active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over || !boardData) return;

    const activeTicketId = active.id as string;
    let targetStatus: string | null = null;

    if (over.data?.current?.type === "column") {
      targetStatus = over.data.current.status as string;
    } else {
      const overTicketId = over.id as string;
      for (const columnData of boardData.board) {
        const ticketInColumn = columnData.tickets.find((t) => t.ticketId === overTicketId);
        if (ticketInColumn) {
          targetStatus = columnData.column.status;
          break;
        }
      }
    }

    const currentTicket = allTickets?.find((t) => t.id === activeTicketId);
    if (targetStatus && currentTicket && currentTicket.status !== targetStatus) {
      updateTicketStatusMutation.mutate({ ticketId: activeTicketId, status: targetStatus });
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {board.map((columnData) => (
              <DroppableColumn
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
        <DragOverlay>
          {activeTicket && <TicketCardOverlay ticket={activeTicket} />}
        </DragOverlay>
      </DndContext>

      <AddTicketDialog
        projectId={params.id!}
        open={addTicketOpen}
        onOpenChange={setAddTicketOpen}
        onAdded={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${params.id}/board`] })}
        existingTicketIds={allProjectTicketIds}
      />
    </MainLayout>
  );
}
