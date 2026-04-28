/**
 * TicketCreateModal
 *
 * Full-screen dialog for creating a new ticket. Adapts to tenant mode:
 *   IT-Abteilung: radio toggle "Asset | Endnutzer" (both optional)
 *   MSP:          Kundenfirma* (required) + Kontakt (optional, filters by Kundenfirma)
 *   Portal:       Titel + Beschreibung + Anhänge only (minimal mode)
 *
 * On success: calls onCreated(newTicketId) so the workspace can navigate.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipTapEditor } from "@/components/TipTapEditor";
import { useToast } from "@/hooks/use-toast";
import { useMode } from "@/lib/mode";
import { apiRequest } from "@/lib/queryClient";
import type { User, Customer } from "@shared/schema";

// ── Validation schema ─────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  title:       z.string().min(1, "Titel ist erforderlich").max(255),
  priority:    z.enum(["low", "medium", "high", "urgent"]),
  description: z.string().optional(),
  customerId:  z.string().optional(),
  assignedToId:z.string().optional(),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface TicketCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the new ticket's ID after successful creation */
  onCreated: (ticketId: string) => void;
  /** Minimal mode for the customer portal */
  isPortal?: boolean;
  /** Pre-fill the Kundenfirma field (MSP mode) */
  defaultCustomerId?: string;
}

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Niedrig" },
  { value: "medium", label: "Mittel" },
  { value: "high",   label: "Hoch" },
  { value: "urgent", label: "Kritisch" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketCreateModal({
  open,
  onClose,
  onCreated,
  isPortal = false,
  defaultCustomerId,
}: Readonly<TicketCreateModalProps>) {
  const mode = useMode();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [description, setDescription] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: "medium", customerId: defaultCustomerId },
    mode: "onChange",
  });

  // Sync defaultCustomerId when it changes (e.g. different customer opens same modal)
  const prevCustomerId = watch("customerId");
  if (defaultCustomerId && !prevCustomerId) {
    setValue("customerId", defaultCustomerId);
  }

  const selectedCustomerId = watch("customerId");

  // Agent lists
  const { data: agents } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", { role: "agent" }],
    enabled: !isPortal,
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: !isPortal && mode === "msp",
  });

  // ── Create mutation ──────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: CreateTicketForm) => {
      const payload = {
        ...data,
        description: description || undefined,
        assignedToId: data.assignedToId || undefined,
        customerId: data.customerId || undefined,
      };
      const res = await apiRequest("POST", "/api/tickets", payload);
      return (await res.json()) as { id: string };
    },
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket erstellt" });
      reset();
      setDescription("");
      onCreated(newTicket.id);
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateTicketForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-xl max-h-[90vh] overflow-y-auto"
        data-testid="modal-create-ticket"
      >
        <DialogHeader>
          <DialogTitle className="text-ui-lg font-semibold">
            Neues Ticket erstellen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Titel */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">
              Titel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-title"
              {...register("title")}
              autoFocus
              placeholder="Kurze Beschreibung des Problems"
              className={errors.title ? "border-destructive" : ""}
              data-testid="input-ticket-title-modal"
            />
            {errors.title && (
              <p className="text-2xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Beschreibung */}
          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <div className="rounded-md border border-border focus-within:ring-1 focus-within:ring-ring">
              <TipTapEditor
                content={description}
                onChange={setDescription}
                placeholder="Detaillierte Beschreibung des Problems…"
                minHeight="100px"
                data-testid="input-ticket-description-modal"
              />
            </div>
          </div>

          {/* Priorität */}
          {!isPortal && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-priority">
                Priorität <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue="medium"
                onValueChange={val => setValue("priority", val as CreateTicketForm["priority"])}
              >
                <SelectTrigger id="ticket-priority" data-testid="select-ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MSP: Kundenfirma */}
          {!isPortal && mode === "msp" && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-customer">
                Kundenfirma <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={val => setValue("customerId", val)}>
                <SelectTrigger id="ticket-customer" data-testid="select-ticket-customer">
                  <SelectValue placeholder="Kundenfirma auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zuweisen an */}
          {!isPortal && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-assignee">Zuweisen an</Label>
              <Select onValueChange={val => setValue("assignedToId", val)}>
                <SelectTrigger id="ticket-assignee" data-testid="select-ticket-assignee">
                  <SelectValue placeholder="Nicht zugewiesen" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.firstName} {a.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !isValid}
              data-testid="button-submit-create-ticket"
            >
              {createMutation.isPending ? "Erstelle…" : "Ticket erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
