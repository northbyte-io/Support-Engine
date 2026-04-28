/**
 * Endnutzer-Portal
 *
 * Simplified workspace for customers (role: "customer").
 * No agent sidebar, no MetaPanel, no time tracking.
 * URL-synced ticket selection: /portal and /portal/:id.
 *
 * Mobile (<640px): single-pane; list XOR detail.
 *   — List view: sticky bottom CTA bar
 *   — Detail view: back button in header
 * Desktop: fixed two-pane side-by-side.
 */

import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ChevronLeft, LogOut, Ticket, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { TicketListPane } from "@/components/TicketListPane";
import { TicketDetailPane } from "@/components/TicketDetailPane";
import { TicketCreateModal } from "@/components/TicketCreateModal";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function PortalPage() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const [, setLocation] = useLocation();
  const [matchTicket, params] = useRoute("/portal/:id");
  const [createOpen, setCreateOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedId = matchTicket && params?.id ? params.id : null;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const tenantName = branding?.name ?? "Support-Portal";
  const logo = branding?.logoLight ?? branding?.logo;

  const portalHeader = (showBack = false) => (
    <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setLocation("/portal")}
            data-testid="button-portal-back"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Tickets
          </Button>
        )}
        {!showBack && (
          <div className="flex items-center gap-2.5">
            {logo ? (
              <img src={logo} alt={tenantName} className="h-6 w-auto max-w-[100px] object-contain" />
            ) : (
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center flex-shrink-0">
                <Ticket className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
            <span className="font-sans font-semibold text-sm leading-tight truncate">{tenantName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {user?.firstName} {user?.lastName}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleLogout}
          data-testid="button-portal-logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          Abmelden
        </Button>
      </div>
    </header>
  );

  const createModal = (
    <TicketCreateModal
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      onCreated={(id) => {
        setCreateOpen(false);
        setLocation(`/portal/${id}`);
      }}
      isPortal
    />
  );

  // ── Mobile: single-pane ──────────────────────────────────────────────────────
  if (isMobile) {
    if (selectedId) {
      return (
        <div className="flex flex-col h-dvh bg-background overflow-hidden">
          {portalHeader(true)}
          <div className="flex-1 overflow-hidden">
            <TicketDetailPane ticketId={selectedId} isPortal />
          </div>
          {createModal}
        </div>
      );
    }

    return (
      <div className="flex flex-col h-dvh bg-background overflow-hidden">
        {portalHeader()}
        <div className="flex-1 overflow-hidden">
          <TicketListPane
            selectedId={null}
            onSelect={(id) => setLocation(`/portal/${id}`)}
            onCreateClick={() => setCreateOpen(true)}
            hideCreate
          />
        </div>
        {/* Sticky bottom CTA */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card">
          <Button
            className="w-full h-12 gap-2"
            onClick={() => setCreateOpen(true)}
            data-testid="button-portal-new-ticket"
          >
            <Plus className="w-4 h-4" />
            Neues Ticket erstellen
          </Button>
        </div>
        {createModal}
      </div>
    );
  }

  // ── Desktop: two-pane ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {portalHeader()}

      <div className="flex flex-1 overflow-hidden">
        {/* List pane */}
        <div className="flex-shrink-0 w-[280px] border-r border-border flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-ui-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Meine Tickets
            </span>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setCreateOpen(true)}
              data-testid="button-portal-new-ticket"
            >
              <Plus className="w-3.5 h-3.5" />
              Neu
            </Button>
          </div>
          <TicketListPane
            selectedId={selectedId}
            onSelect={(id) => setLocation(`/portal/${id}`)}
            onCreateClick={() => setCreateOpen(true)}
            hideCreate
          />
        </div>

        {/* Detail pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedId ? (
            <TicketDetailPane ticketId={selectedId} isPortal />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <Ticket className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Wähle ein Ticket aus der Liste oder erstelle ein neues.
              </p>
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                data-testid="button-portal-create-cta"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Neues Ticket erstellen
              </Button>
            </div>
          )}
        </div>
      </div>

      {createModal}
    </div>
  );
}
