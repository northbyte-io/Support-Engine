import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, Play, Pause, Square, ExternalLink } from "lucide-react";
import type { ActiveTimerWithTicket } from "@shared/schema";
import { WorkEntryModal } from "@/components/WorkEntryModal";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function calculateElapsedTime(timer: ActiveTimerWithTicket): number {
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

interface TimerItemProps {
  timer: ActiveTimerWithTicket;
  onOpenTicket: (ticketId: string) => void;
  onStop: (timer: ActiveTimerWithTicket) => void;
}

function TimerItem({ timer, onOpenTicket, onStop }: TimerItemProps) {
  const [elapsed, setElapsed] = useState(calculateElapsedTime(timer));
  const isPaused = !!timer.pausedAt;

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setElapsed(calculateElapsedTime(timer));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer, isPaused]);

  const pauseMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tickets/${timer.ticketId}/timer/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tickets/${timer.ticketId}/timer/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
  });

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-medium ${isPaused ? "text-muted-foreground" : "text-primary"}`}>
            {formatDuration(Math.max(0, elapsed))}
          </span>
          {isPaused && (
            <span className="text-xs text-muted-foreground">(Pausiert)</span>
          )}
        </div>
        <div 
          className="text-xs text-muted-foreground truncate cursor-pointer hover:text-foreground"
          onClick={() => onOpenTicket(timer.ticketId)}
          data-testid={`timer-ticket-${timer.ticketId}`}
        >
          {timer.ticket?.ticketNumber} - {timer.ticket?.title}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isPaused ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => resumeMutation.mutate()}
            disabled={resumeMutation.isPending}
            data-testid={`button-resume-timer-${timer.ticketId}`}
          >
            <Play className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => pauseMutation.mutate()}
            disabled={pauseMutation.isPending}
            data-testid={`button-pause-timer-${timer.ticketId}`}
          >
            <Pause className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          onClick={() => onStop(timer)}
          data-testid={`button-stop-timer-${timer.ticketId}`}
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOpenTicket(timer.ticketId)}
          data-testid={`button-open-ticket-${timer.ticketId}`}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function TimerDisplay() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [stoppingTimer, setStoppingTimer] = useState<ActiveTimerWithTicket | null>(null);
  const [stoppedTimerData, setStoppedTimerData] = useState<{
    timer: ActiveTimerWithTicket;
    durationMs: number;
    stoppedAt: string;
  } | null>(null);

  const { data: timers = [] } = useQuery<ActiveTimerWithTicket[]>({
    queryKey: ["/api/timers"],
    refetchInterval: 30000,
  });

  const stopMutation = useMutation({
    mutationFn: async (timer: ActiveTimerWithTicket) => {
      const response = await apiRequest("POST", `/api/tickets/${timer.ticketId}/timer/stop`);
      const data = await response.json();
      return { timer, data };
    },
    onSuccess: ({ timer: timerParam, data }: { timer: ActiveTimerWithTicket; data: { durationMs: number; stoppedAt: string } }) => {
      setStoppedTimerData({
        timer: timerParam,
        durationMs: data.durationMs,
        stoppedAt: data.stoppedAt,
      });
      setStoppingTimer(null);
      queryClient.invalidateQueries({ queryKey: ["/api/timers"] });
    },
    onError: () => {
      setStoppingTimer(null);
    },
  });

  const handleOpenTicket = (ticketId: string) => {
    setIsOpen(false);
    setLocation(`/tickets/${ticketId}`);
  };

  const handleStopTimer = (timer: ActiveTimerWithTicket) => {
    setStoppingTimer(timer);
    stopMutation.mutate(timer);
  };

  const handleWorkEntryClose = () => {
    setStoppedTimerData(null);
    setStoppingTimer(null);
  };

  const totalActiveTimers = timers.length;
  const hasRunningTimer = timers.some(t => !t.pausedAt);

  if (totalActiveTimers === 0) {
    return null;
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative gap-2"
            data-testid="button-timer-display"
          >
            <Clock className={`h-4 w-4 ${hasRunningTimer ? "text-primary animate-pulse" : ""}`} />
            <span className="font-mono text-sm">
              {totalActiveTimers} Timer
            </span>
            {hasRunningTimer && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="end">
          <div className="space-y-1">
            <h4 className="font-medium text-sm px-2 py-1">Aktive Timer</h4>
            {timers.map((timer) => (
              <TimerItem
                key={timer.id}
                timer={timer}
                onOpenTicket={handleOpenTicket}
                onStop={handleStopTimer}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {stoppedTimerData && (
        <WorkEntryModal
          open={!!stoppedTimerData}
          onClose={handleWorkEntryClose}
          timer={stoppedTimerData.timer}
          durationMs={stoppedTimerData.durationMs}
          stoppedAt={stoppedTimerData.stoppedAt}
        />
      )}
    </>
  );
}
