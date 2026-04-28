/**
 * CommandPalette
 *
 * Cmd+K / Ctrl+K global command palette.
 * Navigation shortcuts + ticket search.
 *
 * Usage: render once near the app root (inside Router so useLocation works).
 * The palette listens for the keyboard shortcut globally via a useEffect.
 */

import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Timer,
  BookOpen,
  Users,
  Package,
  Building2,
  Contact,
  Landmark,
  Kanban,
  FolderKanban,
  Settings,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth";
import { useMode } from "@/lib/mode";

interface NavCommand {
  id:       string;
  label:    string;
  icon:     React.ComponentType<{ className?: string }>;
  url:      string;
  shortcut?: string;
}

const coreCommands: NavCommand[] = [
  { id: "dashboard",     label: "Dashboard",        icon: LayoutDashboard, url: "/",               shortcut: "G D" },
  { id: "tickets",       label: "Tickets",           icon: Ticket,          url: "/tickets",        shortcut: "G T" },
  { id: "reports",       label: "Berichte",          icon: BarChart3,       url: "/reports" },
  { id: "time-tracking", label: "Zeiterfassung",     icon: Timer,           url: "/time-tracking" },
  { id: "knowledge",     label: "Wissensdatenbank",  icon: BookOpen,        url: "/knowledge-base" },
];

const resourceCommandsIT: NavCommand[] = [
  { id: "assets",    label: "Assets",    icon: Package,    url: "/assets" },
  { id: "areas",     label: "Bereiche",  icon: FolderKanban, url: "/areas" },
  { id: "projects",  label: "Projekte",  icon: Kanban,     url: "/projects" },
];

const resourceCommandsMSP: NavCommand[] = [
  { id: "customers",      label: "Kunden",         icon: Building2,    url: "/customers" },
  { id: "contacts",       label: "Kontakte",        icon: Contact,      url: "/contacts" },
  { id: "organizations",  label: "Organisationen",  icon: Landmark,     url: "/organizations" },
  { id: "assets",         label: "Assets",          icon: Package,      url: "/assets" },
  { id: "projects",       label: "Projekte",        icon: Kanban,       url: "/projects" },
  { id: "areas",          label: "Bereiche",        icon: FolderKanban, url: "/areas" },
];

const adminCommands: NavCommand[] = [
  { id: "users",    label: "Benutzer",      icon: Users,    url: "/users" },
  { id: "settings", label: "Einstellungen", icon: Settings, url: "/settings" },
];

interface CommandPaletteProps {
  onCreateTicket?: () => void;
}

export function CommandPalette({ onCreateTicket }: Readonly<CommandPaletteProps>) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const mode = useMode();

  const resourceCommands = mode === "msp" ? resourceCommandsMSP : resourceCommandsIT;

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback((url: string) => {
    setOpen(false);
    setLocation(url);
  }, [setLocation]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Navigation oder Suche…" />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Aktionen">
          {onCreateTicket && (
            <CommandItem
              onSelect={() => { setOpen(false); onCreateTicket(); }}
              value="neues ticket erstellen"
            >
              <Plus className="w-4 h-4" />
              <span>Neues Ticket erstellen</span>
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        {/* Core navigation */}
        <CommandGroup heading="Navigation">
          {coreCommands.map(cmd => (
            <CommandItem
              key={cmd.id}
              onSelect={() => navigate(cmd.url)}
              value={cmd.label}
            >
              <cmd.icon className="w-4 h-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Mode-aware resources */}
        <CommandGroup heading="Ressourcen">
          {resourceCommands.map(cmd => (
            <CommandItem
              key={cmd.id}
              onSelect={() => navigate(cmd.url)}
              value={cmd.label}
            >
              <cmd.icon className="w-4 h-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Admin commands */}
        {user?.role === "admin" && (
          <CommandGroup heading="Administration">
            {adminCommands.map(cmd => (
              <CommandItem
                key={cmd.id}
                onSelect={() => navigate(cmd.url)}
                value={cmd.label}
              >
                <cmd.icon className="w-4 h-4" />
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
