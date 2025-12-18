import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Clock, AlertTriangle, Trash2, Edit, CheckCircle } from "lucide-react";
import type { SlaDefinitionWithEscalations } from "@shared/schema";

function formatMinutes(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `${days} Tag${days !== 1 ? 'e' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} Stunde${hours !== 1 ? 'n' : ''}`;
  }
  return `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
}

export default function SlaSettings() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSla, setEditingSla] = useState<SlaDefinitionWithEscalations | null>(null);

  const { data: slaDefinitions = [], isLoading } = useQuery<SlaDefinitionWithEscalations[]>({
    queryKey: ['/api/sla-definitions'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest('POST', '/api/sla-definitions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla-definitions'] });
      setIsCreateOpen(false);
      toast({ title: "SLA erstellt", description: "Die SLA-Definition wurde erfolgreich erstellt." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Die SLA-Definition konnte nicht erstellt werden.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      return apiRequest('PATCH', `/api/sla-definitions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla-definitions'] });
      setEditingSla(null);
      toast({ title: "SLA aktualisiert", description: "Die SLA-Definition wurde erfolgreich aktualisiert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Die SLA-Definition konnte nicht aktualisiert werden.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/sla-definitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla-definitions'] });
      toast({ title: "SLA gelöscht", description: "Die SLA-Definition wurde erfolgreich gelöscht." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Die SLA-Definition konnte nicht gelöscht werden.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      responseTimeLow: parseInt(formData.get('responseTimeLow') as string) || 480,
      responseTimeMedium: parseInt(formData.get('responseTimeMedium') as string) || 240,
      responseTimeHigh: parseInt(formData.get('responseTimeHigh') as string) || 60,
      responseTimeUrgent: parseInt(formData.get('responseTimeUrgent') as string) || 15,
      resolutionTimeLow: parseInt(formData.get('resolutionTimeLow') as string) || 4320,
      resolutionTimeMedium: parseInt(formData.get('resolutionTimeMedium') as string) || 1440,
      resolutionTimeHigh: parseInt(formData.get('resolutionTimeHigh') as string) || 480,
      resolutionTimeUrgent: parseInt(formData.get('resolutionTimeUrgent') as string) || 120,
      isDefault: formData.get('isDefault') === 'on',
      isActive: true,
    };

    if (editingSla) {
      updateMutation.mutate({ id: editingSla.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">SLA-Verwaltung</h1>
          <p className="text-muted-foreground">Service-Level-Vereinbarungen verwalten</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-sla">
              <Plus className="w-4 h-4 mr-2" />
              Neue SLA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue SLA-Definition erstellen</DialogTitle>
            </DialogHeader>
            <SlaForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {slaDefinitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine SLA-Definitionen</h3>
            <p className="text-muted-foreground mb-4">Erstellen Sie Ihre erste SLA-Definition, um Service-Level zu definieren.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {slaDefinitions.map((sla) => (
            <Card key={sla.id} data-testid={`card-sla-${sla.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">{sla.name}</CardTitle>
                    {sla.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Standard
                      </Badge>
                    )}
                    {!sla.isActive && (
                      <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                    )}
                  </div>
                  {sla.description && (
                    <CardDescription className="mt-1">{sla.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingSla(sla)}
                    data-testid={`button-edit-sla-${sla.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Sind Sie sicher, dass Sie diese SLA-Definition löschen möchten?')) {
                        deleteMutation.mutate(sla.id);
                      }
                    }}
                    data-testid={`button-delete-sla-${sla.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reaktionszeit
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Niedrig:</span> <span>{formatMinutes(sla.responseTimeLow ?? 480)}</span></div>
                      <div className="flex justify-between"><span>Mittel:</span> <span>{formatMinutes(sla.responseTimeMedium ?? 240)}</span></div>
                      <div className="flex justify-between"><span>Hoch:</span> <span>{formatMinutes(sla.responseTimeHigh ?? 60)}</span></div>
                      <div className="flex justify-between"><span>Dringend:</span> <span>{formatMinutes(sla.responseTimeUrgent ?? 15)}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Lösungszeit
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Niedrig:</span> <span>{formatMinutes(sla.resolutionTimeLow ?? 4320)}</span></div>
                      <div className="flex justify-between"><span>Mittel:</span> <span>{formatMinutes(sla.resolutionTimeMedium ?? 1440)}</span></div>
                      <div className="flex justify-between"><span>Hoch:</span> <span>{formatMinutes(sla.resolutionTimeHigh ?? 480)}</span></div>
                      <div className="flex justify-between"><span>Dringend:</span> <span>{formatMinutes(sla.resolutionTimeUrgent ?? 120)}</span></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingSla} onOpenChange={(open) => !open && setEditingSla(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SLA-Definition bearbeiten</DialogTitle>
          </DialogHeader>
          {editingSla && (
            <SlaForm
              defaultValues={editingSla}
              onSubmit={handleSubmit}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SlaFormProps {
  defaultValues?: SlaDefinitionWithEscalations;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
}

function SlaForm({ defaultValues, onSubmit, isLoading }: SlaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name || ''}
              required
              placeholder="z.B. Premium-SLA"
              data-testid="input-sla-name"
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="isDefault"
              name="isDefault"
              defaultChecked={defaultValues?.isDefault || false}
              data-testid="switch-sla-default"
            />
            <Label htmlFor="isDefault">Als Standard festlegen</Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description || ''}
            placeholder="Beschreibung der SLA-Vereinbarung..."
            rows={2}
            data-testid="input-sla-description"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Reaktionszeiten (in Minuten)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="responseTimeLow">Niedrig</Label>
            <Input
              id="responseTimeLow"
              name="responseTimeLow"
              type="number"
              min="1"
              defaultValue={defaultValues?.responseTimeLow ?? 480}
              data-testid="input-response-low"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responseTimeMedium">Mittel</Label>
            <Input
              id="responseTimeMedium"
              name="responseTimeMedium"
              type="number"
              min="1"
              defaultValue={defaultValues?.responseTimeMedium ?? 240}
              data-testid="input-response-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responseTimeHigh">Hoch</Label>
            <Input
              id="responseTimeHigh"
              name="responseTimeHigh"
              type="number"
              min="1"
              defaultValue={defaultValues?.responseTimeHigh ?? 60}
              data-testid="input-response-high"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responseTimeUrgent">Dringend</Label>
            <Input
              id="responseTimeUrgent"
              name="responseTimeUrgent"
              type="number"
              min="1"
              defaultValue={defaultValues?.responseTimeUrgent ?? 15}
              data-testid="input-response-urgent"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Lösungszeiten (in Minuten)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="resolutionTimeLow">Niedrig</Label>
            <Input
              id="resolutionTimeLow"
              name="resolutionTimeLow"
              type="number"
              min="1"
              defaultValue={defaultValues?.resolutionTimeLow ?? 4320}
              data-testid="input-resolution-low"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolutionTimeMedium">Mittel</Label>
            <Input
              id="resolutionTimeMedium"
              name="resolutionTimeMedium"
              type="number"
              min="1"
              defaultValue={defaultValues?.resolutionTimeMedium ?? 1440}
              data-testid="input-resolution-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolutionTimeHigh">Hoch</Label>
            <Input
              id="resolutionTimeHigh"
              name="resolutionTimeHigh"
              type="number"
              min="1"
              defaultValue={defaultValues?.resolutionTimeHigh ?? 480}
              data-testid="input-resolution-high"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolutionTimeUrgent">Dringend</Label>
            <Input
              id="resolutionTimeUrgent"
              name="resolutionTimeUrgent"
              type="number"
              min="1"
              defaultValue={defaultValues?.resolutionTimeUrgent ?? 120}
              data-testid="input-resolution-urgent"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading} data-testid="button-submit-sla">
          {isLoading ? 'Speichern...' : defaultValues ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </DialogFooter>
    </form>
  );
}
