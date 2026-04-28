/**
 * TicketListPane
 *
 * The 280px left column of the ticket workspace. Shows the filterable,
 * scrollable list of tickets. Selecting a row updates the detail pane.
 *
 * Handles:
 *   - Search input (URL-synced via ?q=)
 *   - Status filter chip
 *   - "+ Neues Ticket" button (opens TicketCreateModal)
 *   - Loading skeleton / empty state
 *   - Keyboard: ↑/↓ to move selection
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketListRow } from "@/components/TicketListRow";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type { TicketWithRelations } from "@shared/schema";

const STATUS_OPTIONS = [
  { value: "",            label: "Alle" },
  { value: "open",        label: "Offen" },
  { value: "in_progress", label: "In Bearbeitung" },
  { value: "waiting",     label: "Wartend" },
  { value: "resolved",    label: "Gelöst" },
  { value: "closed",      label: "Geschlossen" },
];

interface TicketListPaneProps {
  /** Currently selected ticket ID */
  selectedId: string | null;
  /** Called when a ticket row is clicked */
  onSelect: (id: string) => void;
  /** Called when "+ Neues Ticket" is clicked */
  onCreateClick: () => void;
  /** Hide the create button (portal mode) */
  hideCreate?: boolean;
}

function SkeletonTicketRow() {
  return (
    <div className="flex items-stretch px-3 py-2.5 gap-2.5 border-l-2 border-transparent">
      <span className="flex-shrink-0 pt-[3px]">
        <Skeleton className="w-2 h-2 rounded-full" />
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-2.5 w-16" />
      </span>
    </div>
  );
}

export function TicketListPane({
  selectedId,
  onSelect,
  onCreateClick,
  hideCreate = false,
}: Readonly<TicketListPaneProps>) {
  const [, setLocation] = useLocation();

  // Sync search with URL ?q= param
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [statusFilter, setStatusFilter] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: tickets, isLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { search: searchQuery, status: statusFilter }],
  });

  // Update URL ?q= when search changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    const newSearch = params.toString();
    const base = window.location.pathname;
    const newUrl = newSearch ? `${base}?${newSearch}` : base;
    if (window.location.search !== (newSearch ? `?${newSearch}` : "")) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchQuery]);

  // Keyboard ↑/↓ navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!tickets?.length) return;
    const currentIndex = tickets.findIndex(t => t.id === selectedId);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = tickets[Math.min(currentIndex + 1, tickets.length - 1)];
      if (next) onSelect(next.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = tickets[Math.max(currentIndex - 1, 0)];
      if (prev) onSelect(prev.id);
    }
  }, [tickets, selectedId, onSelect]);

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current?.focus();
  };

  return (
    <div
      className="flex flex-col h-full"
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Ticket-Liste"
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-border h-12">
        <span className="text-ui-sm font-semibold text-foreground">Tickets</span>
        {!hideCreate && (
          <Button
            size="sm"
            className="h-7 px-2.5 text-xs gap-1"
            onClick={onCreateClick}
            data-testid="button-create-ticket"
          >
            <Plus className="w-3.5 h-3.5" />
            Neu
          </Button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="flex-shrink-0 px-2 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            placeholder="Tickets suchen…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-7 pl-7 pr-7 text-xs bg-muted/40 border-border/60"
            data-testid="input-ticket-search"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Suche löschen"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Status filter chips ── */}
      <div className="flex-shrink-0 flex gap-1 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-hide">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              "flex-shrink-0 px-2 py-0.5 rounded-full text-2xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-1",
              statusFilter === opt.value
                ? "bg-primary/10 border border-primary text-primary"
                : "bg-muted/50 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            data-testid={`filter-status-${opt.value || "all"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Ticket list ── */}
      <ScrollArea className="flex-1">
        <div className="py-1" role="list" aria-label="Tickets">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              <SkeletonTicketRow key={i} />
            ))
          ) : !tickets?.length ? (
            <EmptyState
              title={searchQuery || statusFilter ? "Keine Ergebnisse" : "Keine Tickets"}
              description={
                searchQuery || statusFilter
                  ? "Versuchen Sie andere Suchbegriffe oder Filter."
                  : "Erstellen Sie ein neues Ticket."
              }
              className="py-8"
            />
          ) : (
            tickets.map(ticket => (
              <TicketListRow
                key={ticket.id}
                ticket={ticket}
                isSelected={ticket.id === selectedId}
                onClick={() => onSelect(ticket.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Ticket count footer */}
      {tickets && tickets.length > 0 && (
        <div className="flex-shrink-0 border-t border-border px-3 py-1.5">
          <span className="text-2xs text-muted-foreground">
            {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
