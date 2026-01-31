import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Timer, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import DOMPurify from "dompurify";
import type { WorkEntry, User } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkEntriesListProps {
  ticketId: string;
}

type WorkEntryWithUser = WorkEntry & { user?: User };

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours} Std. ${mins} Min.`;
  }
  return `${mins} Min.`;
}

function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm", { locale: de });
}

function formatDate(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy", { locale: de });
}

export function WorkEntriesList({ ticketId }: WorkEntriesListProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery<WorkEntryWithUser[]>({
    queryKey: [`/api/tickets/${ticketId}/work-entries`],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/work-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/work-entries`] });
      toast({ title: "Arbeitseintrag gelöscht" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const billableMinutes = entries
    .filter(entry => entry.isBillable)
    .reduce((sum, entry) => sum + entry.durationMinutes, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Arbeitseinträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Lädt...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Arbeitseinträge
              {entries.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {entries.length}
                </Badge>
              )}
            </div>
            {entries.length > 0 && (
              <div className="text-sm font-normal text-muted-foreground">
                Gesamt: {formatDuration(totalMinutes)}
                {billableMinutes !== totalMinutes && (
                  <span className="ml-2">
                    (abrechenbar: {formatDuration(billableMinutes)})
                  </span>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Noch keine Arbeitseinträge vorhanden.
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-4 p-3 rounded-md border bg-muted/20"
                  data-testid={`work-entry-${entry.id}`}
                >
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {entry.user?.firstName?.[0]}
                      {entry.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">
                          {entry.user?.firstName} {entry.user?.lastName}
                        </span>
                        {entry.isBillable && (
                          <Badge variant="outline" className="text-xs">
                            Abrechenbar
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(entry.id)}
                        data-testid={`button-delete-entry-${entry.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.startTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <Timer className="h-3 w-3" />
                        {formatDuration(entry.durationMinutes)}
                      </div>
                    </div>
                    {entry.description && (
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(entry.description) 
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arbeitseintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Arbeitseintrag wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
