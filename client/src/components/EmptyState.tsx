import { cn } from "@/lib/utils";
import { LucideIcon, Inbox, Search, FileText, Users, Ticket } from "lucide-react";
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
}: EmptyStateProps) {
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

export function NoTicketsEmpty({ onCreateTicket }: { onCreateTicket: () => void }) {
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

export function NoSearchResultsEmpty({ onClear }: { onClear: () => void }) {
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

export function NoUsersEmpty({ onCreateUser }: { onCreateUser: () => void }) {
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
