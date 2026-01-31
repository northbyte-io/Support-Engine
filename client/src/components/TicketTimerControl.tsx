import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActiveTimer, ActiveTimerWithTicket } from "@shared/schema";
import { WorkEntryModal } from "@/components/WorkEntryModal";

interface TicketTimerControlProps {
  ticketId: string;
  ticketNumber?: string;
  ticketTitle?: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function calculateElapsedTime(timer: ActiveTimer): number {
  const now = new Date().getTime();
  const startTime = new Date(timer.startedAt).getTime();
  const totalPausedMs = timer.totalPausedMs || 0;
  
  if (timer.pausedAt) {
    const pauseStart = new Date(timer.pausedAt).getTime();
    const currentPauseDuration = now - pauseStart;
    return now - startTime - totalPausedMs - currentPauseDuration;
  }
  
  return now - startTime - totalPausedMs;
}

export function TicketTimerControl({ ticketId, ticketNumber, ticketTitle }: TicketTimerControlProps) {
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState(0);
  const [stoppedTimerData, setStoppedTimerData] = useState<{
    timer: ActiveTimerWithTicket;
    durationMs: number;
  } | null>(null);

  const { data: timer } = useQuery<ActiveTimer | null>({
    queryKey: [`/api/tickets/${ticketId}/timer`],
    refetchInterval: 30000,
  });

  const isPaused = !!timer?.pausedAt;
  const isRunning = !!timer && !isPaused;

  useEffect(() => {
    if (!timer) {
      setElapsed(0);
      return;
    }
    
    setElapsed(calculateElapsedTime(timer));
    
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setElapsed(calculateElapsedTime(timer));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer, isPaused]);

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tickets/${ticketId}/timer/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/timer`] });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
      toast({ title: "Timer gestartet" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Fehler beim Starten", variant: "destructive" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tickets/${ticketId}/timer/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/timer`] });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
      toast({ title: "Timer pausiert" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tickets/${ticketId}/timer/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/timer`] });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
      toast({ title: "Timer fortgesetzt" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tickets/${ticketId}/timer/stop`),
    onSuccess: (data) => {
      if (timer) {
        setStoppedTimerData({
          timer: {
            ...timer,
            ticket: {
              id: ticketId,
              ticketNumber: ticketNumber || "",
              title: ticketTitle || "",
            },
          },
          durationMs: (data as any).durationMs,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/timer`] });
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
  });

  const handleWorkEntryClose = () => {
    setStoppedTimerData(null);
    queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/work-entries`] });
  };

  if (!timer) {
    return (
      <Button
        variant="outline"
        onClick={() => startMutation.mutate()}
        disabled={startMutation.isPending}
        data-testid="button-start-timer"
      >
        <Play className="w-4 h-4 mr-2" />
        Timer starten
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border">
        <Clock className={`w-4 h-4 ${isRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <span className={`font-mono text-sm font-medium ${isPaused ? "text-muted-foreground" : ""}`}>
          {formatDuration(Math.max(0, elapsed))}
        </span>
        {isPaused && (
          <span className="text-xs text-muted-foreground">(Pausiert)</span>
        )}
        <div className="flex items-center gap-1 ml-2">
          {isPaused ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              data-testid="button-resume-timer"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              data-testid="button-pause-timer"
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            data-testid="button-stop-timer"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {stoppedTimerData && (
        <WorkEntryModal
          open={!!stoppedTimerData}
          onClose={handleWorkEntryClose}
          timer={stoppedTimerData.timer}
          durationMs={stoppedTimerData.durationMs}
        />
      )}
    </>
  );
}
