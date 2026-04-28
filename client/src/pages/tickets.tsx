/**
 * Tickets Page — Three-Pane Workspace
 *
 * The hero screen of the app. Replaces the old full-page ticket list with a
 * three-pane workspace: list pane | detail pane | meta panel.
 *
 * URL structure:
 *   /tickets         → no ticket selected
 *   /tickets/:id     → ticket :id selected
 *
 * Ticket selection updates the URL and the detail pane without page navigation.
 * "Neues Ticket" button opens TicketCreateModal (no dedicated route).
 */

import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ThreePaneLayout, useMetaPanelState } from "@/components/ThreePaneLayout";
import { TicketListPane } from "@/components/TicketListPane";
import { TicketDetailPane } from "@/components/TicketDetailPane";
import { MetaPanel } from "@/components/MetaPanel";
import { TicketCreateModal } from "@/components/TicketCreateModal";

export default function TicketsPage() {
  const [, setLocation] = useLocation();
  const [matchTicket, params] = useRoute("/tickets/:id");

  // Derive selected ticket ID from URL
  const selectedId: string | null = matchTicket && params?.id ? params.id : null;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { isOpen: isMetaOpen, toggle: toggleMeta } = useMetaPanelState(true);

  // Keep selection in URL
  const handleSelect = (id: string) => {
    setLocation(`/tickets/${id}`);
  };

  // When a ticket is created, navigate to it and close modal
  const handleTicketCreated = (newId: string) => {
    setCreateModalOpen(false);
    setLocation(`/tickets/${newId}`);
  };

  return (
    <>
      <ThreePaneLayout
        listPane={
          <TicketListPane
            selectedId={selectedId}
            onSelect={handleSelect}
            onCreateClick={() => setCreateModalOpen(true)}
          />
        }
        detailPane={
          <TicketDetailPane
            ticketId={selectedId}
          />
        }
        metaPanel={
          selectedId ? (
            <MetaPanel
              ticketId={selectedId}
              isOpen={isMetaOpen}
              onClose={toggleMeta}
            />
          ) : undefined
        }
        isMetaOpen={isMetaOpen}
        onMetaToggle={toggleMeta}
      />

      {createModalOpen && (
        <TicketCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </>
  );
}
