import { cn } from "@/lib/utils";
import { type LucideIcon, Inbox, Search, FileText, Users, Ticket, AlertTriangle, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: Readonly<EmptyStateProps>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      data-testid="empty-state"
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} data-testid="button-empty-action">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoTicketsEmpty({ onCreateTicket }: Readonly<{ onCreateTicket: () => void }>) {
  return (
    <EmptyState
      icon={Ticket}
      title="Keine Tickets gefunden"
      description="Erstellen Sie Ihr erstes Ticket, um loszulegen."
      action={{
        label: "Ticket erstellen",
        onClick: onCreateTicket,
      }}
    />
  );
}

export function NoSearchResultsEmpty({ onClear }: Readonly<{ onClear: () => void }>) {
  return (
    <EmptyState
      icon={Search}
      title="Keine Ergebnisse"
      description="Versuchen Sie es mit anderen Suchbegriffen oder Filtern."
      action={{
        label: "Filter zurücksetzen",
        onClick: onClear,
      }}
    />
  );
}

export function NoCommentsEmpty() {
  return (
    <EmptyState
      icon={FileText}
      title="Noch keine Kommentare"
      description="Fügen Sie einen Kommentar hinzu, um die Kommunikation zu starten."
    />
  );
}

export function NoUsersEmpty({ onCreateUser }: Readonly<{ onCreateUser: () => void }>) {
  return (
    <EmptyState
      icon={Users}
      title="Keine Benutzer gefunden"
      description="Erstellen Sie einen neuen Benutzer."
      action={{
        label: "Benutzer erstellen",
        onClick: onCreateUser,
      }}
    />
  );
}

/** Shown in the detail pane when no ticket is selected */
export function NoTicketSelected() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3 text-center p-8"
      data-testid="empty-no-ticket-selected"
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <MousePointerClick className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[200px]">
        Ticket aus der Liste auswählen
      </p>
    </div>
  );
}

/** Shown in SLA warning sections when there are no at-risk tickets */
export function NoSlaWarnings() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Keine SLA-Warnungen"
      description="Alle Tickets liegen im grünen Bereich."
      className="py-6"
    />
  );
}
