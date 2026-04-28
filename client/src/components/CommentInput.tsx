/**
 * CommentInput
 *
 * Sticky comment composer at the bottom of the TicketDetailPane.
 * Agents see an inline time-tracking row (hours + minutes + billable checkbox).
 * Portal users / customers see only the text input and send button.
 *
 * On submit: POST /api/tickets/:id/comments
 * If timeMinutes > 0 also POST /api/tickets/:id/time-entries
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/TipTapEditor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  ticketId: string;
  isAgent: boolean;
  /** Called after a successful comment submission */
  onSubmit?: () => void;
  className?: string;
}

export function CommentInput({
  ticketId,
  isAgent,
  onSubmit,
  className,
}: Readonly<CommentInputProps>) {
  const [body, setBody] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isBillable, setIsBillable] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const totalMinutes = hours * 60 + minutes;
  const isBodyEmpty = !body || body === "<p></p>" || body.trim() === "";

  const submitMutation = useMutation({
    mutationFn: async () => {
      // 1. Post the comment
      await apiRequest("POST", `/api/tickets/${ticketId}/comments`, {
        content: body,
        visibility: isInternal ? "internal" : "external",
      });

      // 2. Post time entry if agent entered time
      if (isAgent && totalMinutes > 0) {
        await apiRequest("POST", `/api/tickets/${ticketId}/time-entries`, {
          minutes: totalMinutes,
          isBillable,
          date: new Date().toISOString(),
          description: "",
        });
      }
    },
    onSuccess: () => {
      // Reset form
      setBody("");
      setHours(0);
      setMinutes(0);
      setIsBillable(false);
      setIsInternal(false);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/comments`] });
      if (isAgent && totalMinutes > 0) {
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/time-entries`] });
        queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      }

      onSubmit?.();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht gesendet werden.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (isBodyEmpty || submitMutation.isPending) return;
    submitMutation.mutate();
  };

  return (
    <div className={cn("flex-shrink-0 border-t border-border bg-card p-3", className)}>
      {/* TipTap editor */}
      <div className="rounded-md border border-border focus-within:ring-1 focus-within:ring-ring bg-background">
        <TipTapEditor
          content={body}
          onChange={setBody}
          placeholder="Kommentar schreiben…"
          minHeight="80px"
          data-testid="input-comment-body"
        />
      </div>

      {/* Agent-only row */}
      {isAgent && (
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {/* Time tracking */}
          <div className="flex items-center gap-1.5 text-ui-xs text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>Zeit:</span>
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={e => setHours(Math.min(23, Math.max(0, Number(e.target.value))))}
              className="w-12 h-7 text-center font-mono text-ui-xs bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Stunden"
              data-testid="input-time-hours"
            />
            <span>h</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={e => setMinutes(Math.min(59, Math.max(0, Number(e.target.value))))}
              className="w-12 h-7 text-center font-mono text-ui-xs bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Minuten"
              data-testid="input-time-minutes"
            />
            <span>min</span>
          </div>

          {/* Billable checkbox */}
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="billable-check"
              checked={isBillable}
              onCheckedChange={v => setIsBillable(Boolean(v))}
              disabled={totalMinutes === 0}
              data-testid="checkbox-billable"
            />
            <Label
              htmlFor="billable-check"
              className={cn(
                "text-ui-xs cursor-pointer",
                totalMinutes > 0 ? "text-billable" : "text-muted-foreground"
              )}
            >
              Abrechenbar
            </Label>
          </div>

          {/* Internal comment toggle */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Checkbox
              id="internal-check"
              checked={isInternal}
              onCheckedChange={v => setIsInternal(Boolean(v))}
              data-testid="checkbox-internal"
            />
            <Label htmlFor="internal-check" className="text-ui-xs cursor-pointer text-muted-foreground">
              Intern
            </Label>
          </div>
        </div>
      )}

      {/* Submit row */}
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isBodyEmpty || submitMutation.isPending}
          className="gap-1.5"
          data-testid="button-submit-comment"
        >
          <Send className="w-3.5 h-3.5" />
          Senden
        </Button>
      </div>
    </div>
  );
}
