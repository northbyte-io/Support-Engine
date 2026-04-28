/**
 * ThreePaneLayout
 *
 * Responsive workspace shell with four horizontal sections:
 *   AppSidebar | ListPane (280px) | DetailPane (flex-1) | MetaPanel (300px)
 *
 * Breakpoints:
 *   ≥ 1280px  — all panes visible, sidebar expanded
 *   1024–1279 — sidebar icon-only, meta panel collapsed by default
 *   768–1023  — list pane hidden, sidebar icon-only, detail full width
 *   < 768px   — single pane; sidebar and meta panel become Sheets
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, PanelLeft, X } from "lucide-react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { DURATION, EASING } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface ThreePaneLayoutProps {
  listPane:      ReactNode;
  detailPane:    ReactNode;
  metaPanel?:    ReactNode;
  isMetaOpen?:   boolean;
  onMetaToggle?: () => void;
  /** Called when mobile back-button (list ← detail) is pressed */
  onBackToList?: () => void;
  /** Whether a ticket is selected (mobile needs this for back nav) */
  hasSelection?: boolean;
  className?:    string;
}

const SIDEBAR_STYLE = {
  "--sidebar-width":      "15rem",
  "--sidebar-width-icon": "3rem",
} as React.CSSProperties;

// ── Breakpoint hook ────────────────────────────────────────────────────────────

type Breakpoint = "mobile" | "tablet" | "laptop" | "desktop";

function useBreakpoint(): Breakpoint {
  const getBreakpoint = (): Breakpoint => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768)  return "mobile";
    if (w < 1024) return "tablet";
    if (w < 1280) return "laptop";
    return "desktop";
  };

  const [bp, setBp] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    const onResize = () => setBp(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}

// ── Inner layout (inside SidebarProvider) ─────────────────────────────────────

function ThreePaneInner({
  listPane,
  detailPane,
  metaPanel,
  isMetaOpen = true,
  onMetaToggle,
  onBackToList,
  hasSelection = false,
  className,
}: Readonly<ThreePaneLayoutProps>) {
  const { toggleSidebar, setOpen: setSidebarOpen } = useSidebar();
  const bp = useBreakpoint();

  // Mobile-specific sheet state
  const [mobileListOpen, setMobileListOpen]   = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileMetaOpen, setMobileMetaOpen]   = useState(false);

  // Auto-collapse sidebar on laptop/tablet
  useEffect(() => {
    if (bp === "laptop" || bp === "tablet") {
      setSidebarOpen(false);
    } else if (bp === "desktop") {
      setSidebarOpen(true);
    }
  }, [bp, setSidebarOpen]);

  // Auto-close meta panel on laptop and below
  useEffect(() => {
    if ((bp === "laptop" || bp === "tablet") && isMetaOpen && onMetaToggle) {
      onMetaToggle();
    }
  // Only trigger on breakpoint change, not on every isMetaOpen change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bp]);

  // "[" key toggles sidebar (all sizes)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "[" &&
        !e.ctrlKey && !e.metaKey && !e.altKey &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        if (bp === "mobile") {
          setMobileSidebarOpen(prev => !prev);
        } else {
          toggleSidebar();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar, bp]);

  const showMeta = Boolean(metaPanel) && isMetaOpen;

  // ── Mobile layout (< 768px) ──────────────────────────────────────────────────
  if (bp === "mobile") {
    return (
      <div className={cn("flex flex-col h-screen w-full overflow-hidden bg-background", className)}>
        {/* Mobile top bar */}
        <div className="flex-shrink-0 h-11 flex items-center justify-between px-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            {/* Sidebar sheet trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Navigation öffnen"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            {/* Back button when ticket is selected */}
            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  onBackToList?.();
                  setMobileListOpen(true);
                }}
                aria-label="Zur Liste"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Tickets
              </Button>
            )}
          </div>
          {/* Meta panel trigger (only when ticket selected) */}
          {hasSelection && metaPanel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileMetaOpen(true)}
              aria-label="Details öffnen"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Button>
          )}
        </div>

        {/* Main content — detail pane fills screen */}
        <div className="flex-1 overflow-hidden">
          {hasSelection ? (
            detailPane
          ) : (
            // No selection — show list pane full screen
            <div className="h-full flex flex-col">{listPane}</div>
          )}
        </div>

        {/* Sidebar Sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* List pane Sheet (when navigating back) */}
        <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
          <SheetContent side="left" className="p-0 w-[280px]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tickets</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMobileListOpen(false)}
                  aria-label="Liste schließen"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              {listPane}
            </div>
          </SheetContent>
        </Sheet>

        {/* Meta panel Sheet */}
        {metaPanel && (
          <Sheet open={mobileMetaOpen} onOpenChange={setMobileMetaOpen}>
            <SheetContent side="right" className="p-0 w-[300px]">
              {metaPanel}
            </SheetContent>
          </Sheet>
        )}
      </div>
    );
  }

  // ── Tablet layout (768–1023px): no list pane, sidebar icon-only ───────────────
  if (bp === "tablet") {
    return (
      <div className={cn("flex h-screen w-full overflow-hidden bg-background", className)}>
        <AppSidebar />

        {/* Detail pane full width */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" data-testid="detail-pane">
          {/* Show list pane toggle at top */}
          <div className="flex-shrink-0 h-9 flex items-center gap-2 px-3 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMobileListOpen(true)}
              aria-label="Ticket-Liste öffnen"
            >
              <PanelLeft className="w-3.5 h-3.5" />
              Tickets
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {detailPane}
          </div>
        </div>

        {/* Meta panel — no animation at tablet, just show/hide */}
        {metaPanel && isMetaOpen && (
          <div
            className="flex-shrink-0 border-l border-border bg-card overflow-hidden"
            style={{ width: "var(--layout-meta-panel, 300px)" }}
            data-testid="meta-panel"
          >
            {metaPanel}
          </div>
        )}
        {metaPanel && !isMetaOpen && onMetaToggle && (
          <button
            onClick={onMetaToggle}
            className="flex-shrink-0 w-6 flex items-center justify-center border-l border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Meta-Panel öffnen"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* List pane Sheet */}
        <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
          <SheetContent side="left" className="p-0 w-[280px]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tickets</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMobileListOpen(false)}
                  aria-label="Liste schließen"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              {listPane}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── Laptop (1024–1279px) and Desktop (≥ 1280px): full layout ─────────────────
  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-background", className)}>

      {/* Sidebar */}
      <AppSidebar />

      {/* List pane */}
      <div
        className="flex-shrink-0 flex flex-col border-r border-border bg-card overflow-hidden"
        style={{ width: "var(--layout-list-pane, 280px)" }}
        data-testid="list-pane"
      >
        {listPane}
      </div>

      {/* Detail pane */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        data-testid="detail-pane"
      >
        {detailPane}
      </div>

      {/* Meta panel with collapse animation */}
      {metaPanel && (
        <>
          <AnimatePresence initial={false}>
            {showMeta && (
              <motion.div
                key="meta-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{
                  width: "var(--layout-meta-panel, 300px)",
                  opacity: 1,
                  transition: {
                    width:   { duration: DURATION.NORMAL / 1000,  ease: EASING.OUT },
                    opacity: { duration: DURATION.FAST / 1000,    ease: EASING.OUT, delay: 0.05 },
                  },
                }}
                exit={{
                  width: 0,
                  opacity: 0,
                  transition: {
                    width:   { duration: DURATION.FAST / 1000,    ease: EASING.IN },
                    opacity: { duration: DURATION.INSTANT / 1000 },
                  },
                }}
                className="flex-shrink-0 border-l border-border bg-card overflow-hidden"
                style={{ minWidth: 0 }}
                data-testid="meta-panel"
              >
                <div style={{ width: "var(--layout-meta-panel, 300px)" }}>
                  {metaPanel}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showMeta && onMetaToggle && (
            <button
              onClick={onMetaToggle}
              className="flex-shrink-0 w-6 flex items-center justify-center border-l border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Meta-Panel öffnen"
              data-testid="button-meta-expand"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function ThreePaneLayout(props: Readonly<ThreePaneLayoutProps>) {
  return (
    <SidebarProvider style={SIDEBAR_STYLE}>
      <ThreePaneInner {...props} />
    </SidebarProvider>
  );
}

/** Hook for persisted meta panel open/close state */
export function useMetaPanelState(defaultOpen = true) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    const stored = localStorage.getItem("meta_panel_open");
    return stored === null ? defaultOpen : stored === "true";
  });

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem("meta_panel_open", String(next));
      return next;
    });
  }, []);

  return { isOpen, toggle, setIsOpen };
}
