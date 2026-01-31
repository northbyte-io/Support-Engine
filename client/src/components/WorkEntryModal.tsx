import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TipTapEditor } from "@/components/TipTapEditor";
import { Clock, Calendar, Timer } from "lucide-react";
import type { ActiveTimerWithTicket } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface WorkEntryModalProps {
  open: boolean;
  onClose: () => void;
  timer: ActiveTimerWithTicket;
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours} Std. ${minutes} Min.`;
  }
  return `${minutes} Min.`;
}

function formatTime(date: Date): string {
  return format(date, "HH:mm", { locale: de });
}

function formatDate(date: Date): string {
  return format(date, "dd.MM.yyyy", { locale: de });
}

export function WorkEntryModal({ open, onClose, timer, durationMs }: WorkEntryModalProps) {
  const [, setLocation] = useLocation();
  const [description, setDescription] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [redirectToTicket, setRedirectToTicket] = useState(true);

  const startTime = new Date(timer.startedAt);
  const endTime = new Date();
  const durationMinutes = Math.round(durationMs / 60000);
  const pausedMinutes = Math.round((timer.totalPausedMs || 0) / 60000);

  const createWorkEntry = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/tickets/${timer.ticketId}/work-entries`, {
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        pausedMinutes,
        isBillable,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${timer.ticketId}/work-entries`] });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
      
      if (redirectToTicket) {
        setLocation(`/tickets/${timer.ticketId}`);
      }
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkEntry.mutate();
  };

  const handleClose = () => {
    if (!createWorkEntry.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Arbeitseintrag erstellen</DialogTitle>
            <DialogDescription>
              Timer gestoppt für: <span className="font-medium">{timer.ticket?.ticketNumber}</span> - {timer.ticket?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4 p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Datum</div>
                  <div className="font-medium">{formatDate(startTime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Zeitraum</div>
                  <div className="font-medium">{formatTime(startTime)} - {formatTime(endTime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Arbeitszeit</div>
                  <div className="font-medium">{formatDuration(durationMs)}</div>
                  {pausedMinutes > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ({pausedMinutes} Min. Pause)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung der Arbeiten</Label>
              <TipTapEditor
                content={description}
                onChange={setDescription}
                placeholder="Beschreiben Sie die durchgeführten Arbeiten..."
                data-testid="input-work-description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBillable"
                checked={isBillable}
                onCheckedChange={(checked) => setIsBillable(checked === true)}
                data-testid="checkbox-billable"
              />
              <Label htmlFor="isBillable" className="text-sm font-normal cursor-pointer">
                Abrechenbar
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="redirectToTicket"
                checked={redirectToTicket}
                onCheckedChange={(checked) => setRedirectToTicket(checked === true)}
                data-testid="checkbox-redirect"
              />
              <Label htmlFor="redirectToTicket" className="text-sm font-normal cursor-pointer">
                Nach dem Speichern zum Ticket wechseln
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createWorkEntry.isPending}
              data-testid="button-cancel-work-entry"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={createWorkEntry.isPending || !description.trim()}
              data-testid="button-save-work-entry"
            >
              {createWorkEntry.isPending ? "Speichern..." : "Arbeitseintrag speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
