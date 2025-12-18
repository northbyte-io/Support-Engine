import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Filter, SortAsc, SortDesc, X } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge, PriorityDot } from "@/components/PriorityBadge";
import { TicketListSkeleton } from "@/components/LoadingState";
import { NoTicketsEmpty, NoSearchResultsEmpty } from "@/components/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketWithRelations } from "@shared/schema";

type SortField = "createdAt" | "updatedAt" | "priority" | "status";
type SortOrder = "asc" | "desc";

export default function TicketsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: tickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { search: searchQuery, status: statusFilter, priority: priorityFilter, sortField, sortOrder }],
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: string) => {
    setPriorityFilter((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setPriorityFilter([]);
  };

  const hasActiveFilters = searchQuery || statusFilter.length > 0 || priorityFilter.length > 0;

  const filteredTickets = tickets?.filter((ticket) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.title.toLowerCase().includes(query) ||
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter.length > 0 && !statusFilter.includes(ticket.status || "")) {
      return false;
    }
    if (priorityFilter.length > 0 && !priorityFilter.includes(ticket.priority || "")) {
      return false;
    }
    return true;
  });

  const statusOptions = [
    { value: "open", label: "Offen" },
    { value: "in_progress", label: "In Bearbeitung" },
    { value: "waiting", label: "Wartend" },
    { value: "resolved", label: "Gelöst" },
    { value: "closed", label: "Geschlossen" },
  ];

  const priorityOptions = [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
    { value: "urgent", label: "Dringend" },
  ];

  return (
    <MainLayout
      title="Tickets"
      actions={
        <Button onClick={() => setLocation("/tickets/new")} data-testid="button-new-ticket">
          <Plus className="w-4 h-4 mr-2" />
          Neues Ticket
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tickets suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-filter-status">
                  <Filter className="w-4 h-4 mr-2" />
                  Status
                  {statusFilter.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {statusFilter.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Status filtern</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={statusFilter.includes(option.value)}
                    onCheckedChange={() => toggleStatusFilter(option.value)}
                    data-testid={`filter-status-${option.value}`}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-filter-priority">
                  <Filter className="w-4 h-4 mr-2" />
                  Priorität
                  {priorityFilter.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {priorityFilter.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Priorität filtern</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorityOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={priorityFilter.includes(option.value)}
                    onCheckedChange={() => togglePriorityFilter(option.value)}
                    data-testid={`filter-priority-${option.value}`}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-") as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4 mr-2" />
                ) : (
                  <SortDesc className="w-4 h-4 mr-2" />
                )}
                <SelectValue placeholder="Sortierung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Neueste zuerst</SelectItem>
                <SelectItem value="createdAt-asc">Älteste zuerst</SelectItem>
                <SelectItem value="updatedAt-desc">Zuletzt aktualisiert</SelectItem>
                <SelectItem value="priority-desc">Höchste Priorität</SelectItem>
                <SelectItem value="priority-asc">Niedrigste Priorität</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {searchQuery && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-7 gap-1"
              >
                Suche: {searchQuery}
                <X className="w-3 h-3" />
              </Button>
            )}
            {statusFilter.map((status) => (
              <Button
                key={status}
                variant="secondary"
                size="sm"
                onClick={() => toggleStatusFilter(status)}
                className="h-7 gap-1"
              >
                {statusOptions.find((s) => s.value === status)?.label}
                <X className="w-3 h-3" />
              </Button>
            ))}
            {priorityFilter.map((priority) => (
              <Button
                key={priority}
                variant="secondary"
                size="sm"
                onClick={() => togglePriorityFilter(priority)}
                className="h-7 gap-1"
              >
                {priorityOptions.find((p) => p.value === priority)?.label}
                <X className="w-3 h-3" />
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7"
              data-testid="button-clear-filters"
            >
              Alle löschen
            </Button>
          </div>
        )}

        {isLoading ? (
          <TicketListSkeleton count={8} />
        ) : !filteredTickets || filteredTickets.length === 0 ? (
          hasActiveFilters ? (
            <NoSearchResultsEmpty onClear={clearFilters} />
          ) : (
            <NoTicketsEmpty onCreateTicket={() => setLocation("/tickets/new")} />
          )
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => setLocation(`/tickets/${ticket.id}`)}
                data-testid={`ticket-card-${ticket.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <PriorityDot priority={ticket.priority || "medium"} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-mono">
                            {ticket.ticketNumber}
                          </span>
                          {ticket.ticketType && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {ticket.ticketType.name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium truncate">{ticket.title}</h3>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {ticket.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={ticket.status || "open"} />
                      <PriorityBadge priority={ticket.priority || "medium"} showIcon={false} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Erstellt {formatDate(ticket.createdAt)}</span>
                      {ticket.createdBy && (
                        <span>von {ticket.createdBy.firstName} {ticket.createdBy.lastName}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {ticket.assignees?.slice(0, 3).map((assignee, index) => (
                        <Avatar
                          key={assignee.id}
                          className="h-7 w-7 border-2 border-background"
                          style={{ marginLeft: index > 0 ? "-8px" : 0 }}
                        >
                          <AvatarImage src={assignee.user?.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(assignee.user?.firstName, assignee.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {ticket.assignees && ticket.assignees.length > 3 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{ticket.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
