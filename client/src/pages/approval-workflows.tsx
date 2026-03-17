import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, GripVertical, User, ShieldCheck, ChevronUp, ChevronDown } from "lucide-react";
import type { ApprovalWorkflowWithSteps, ApprovalWorkflowStep } from "@shared/schema";
import type { User as UserType } from "@shared/schema";

export default function ApprovalWorkflowsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflowWithSteps | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflowWithSteps | null>(null);
  const [editingStep, setEditingStep] = useState<ApprovalWorkflowStep | null>(null);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<{ id: string; workflowId: string } | null>(null);

  const [wfForm, setWfForm] = useState({ name: "", description: "", isActive: true });
  const [stepForm, setStepForm] = useState({ name: "", approverType: "user", approverId: "", approverRole: "admin", order: 1 });

  const { data: workflows = [], isLoading } = useQuery<ApprovalWorkflowWithSteps[]>({
    queryKey: ["/api/approval-workflows"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const agentUsers = users.filter(u => u.role === "admin" || u.role === "agent");

  const createWorkflow = useMutation({
    mutationFn: (data: typeof wfForm) => apiRequest("POST", "/api/approval-workflows", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflows"] });
      setShowWorkflowDialog(false);
      toast({ title: "Workflow erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateWorkflow = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof wfForm }) => apiRequest("PATCH", `/api/approval-workflows/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflows"] });
      setShowWorkflowDialog(false);
      setEditingWorkflow(null);
      toast({ title: "Workflow aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteWorkflow = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/approval-workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflows"] });
      setDeleteWorkflowId(null);
      if (selectedWorkflow?.id === deleteWorkflowId) setSelectedWorkflow(null);
      toast({ title: "Workflow gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const createStep = useMutation({
    mutationFn: (data: { workflowId: string; step: typeof stepForm }) =>
      apiRequest("POST", `/api/approval-workflows/${data.workflowId}/steps`, {
        ...data.step,
        approverId: data.step.approverType === "user" && data.step.approverId ? data.step.approverId : null,
        approverRole: data.step.approverType === "role" ? data.step.approverRole : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflows"] });
      setShowStepDialog(false);
      setEditingStep(null);
      toast({ title: "Schritt hinzugefügt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateStep = useMutation({
    mutationFn: (data: { workflowId: string; stepId: string; step: typeof stepForm }) =>
      apiRequest("PATCH", `/api/approval-workflows/${data.workflowId}/steps/${data.stepId}`, {
        ...data.step,
        approverId: data.step.approverType === "user" && data.step.approverId ? data.step.approverId : null,
        approverRole: data.step.approverType === "role" ? data.step.approverRole : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflows"] });
      setShowStepDialog(false);
      setEditingStep(null);
      toast({ title: "Schritt aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteStep = useMutation({
    mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) =>
      apiRequest("DELETE", `/api/approval-workflows/${workflowId}/steps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflows"] });
      setDeleteStepId(null);
      toast({ title: "Schritt gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const openCreateWorkflow = () => {
    setEditingWorkflow(null);
    setWfForm({ name: "", description: "", isActive: true });
    setShowWorkflowDialog(true);
  };

  const openEditWorkflow = (wf: ApprovalWorkflowWithSteps) => {
    setEditingWorkflow(wf);
    setWfForm({ name: wf.name, description: wf.description || "", isActive: wf.isActive ?? true });
    setShowWorkflowDialog(true);
  };

  const openCreateStep = (wf: ApprovalWorkflowWithSteps) => {
    setSelectedWorkflow(wf);
    setEditingStep(null);
    const nextOrder = wf.steps.length > 0 ? Math.max(...wf.steps.map(s => s.order)) + 1 : 1;
    setStepForm({ name: "", approverType: "user", approverId: "", approverRole: "admin", order: nextOrder });
    setShowStepDialog(true);
  };

  const openEditStep = (wf: ApprovalWorkflowWithSteps, step: ApprovalWorkflowStep) => {
    setSelectedWorkflow(wf);
    setEditingStep(step);
    setStepForm({
      name: step.name,
      approverType: step.approverType || "user",
      approverId: step.approverId || "",
      approverRole: step.approverRole || "admin",
      order: step.order,
    });
    setShowStepDialog(true);
  };

  const handleWorkflowSubmit = () => {
    if (editingWorkflow) {
      updateWorkflow.mutate({ id: editingWorkflow.id, data: wfForm });
    } else {
      createWorkflow.mutate(wfForm);
    }
  };

  const handleStepSubmit = () => {
    if (!selectedWorkflow) return;
    if (editingStep) {
      updateStep.mutate({ workflowId: selectedWorkflow.id, stepId: editingStep.id, step: stepForm });
    } else {
      createStep.mutate({ workflowId: selectedWorkflow.id, step: stepForm });
    }
  };

  const getApproverLabel = (step: ApprovalWorkflowStep & { approver?: { firstName: string; lastName: string } | null }) => {
    if (step.approverType === "role") {
      return step.approverRole === "admin" ? "Alle Admins" : "Alle Agenten";
    }
    if (step.approver) return `${step.approver.firstName} ${step.approver.lastName}`;
    return "Unbekannt";
  };

  if (user?.role !== "admin") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Nur Administratoren haben Zugriff auf diese Seite.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Genehmigungsworkflows</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Definieren Sie mehrstufige Genehmigungsprozesse für Tickets.
            </p>
          </div>
          <Button onClick={openCreateWorkflow} data-testid="button-create-workflow">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Workflow
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Noch keine Workflows</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Erstellen Sie Ihren ersten Genehmigungsworkflow, um Ticket-Freigaben zu strukturieren.
              </p>
              <Button onClick={openCreateWorkflow}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten Workflow erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <Card key={wf.id} data-testid={`card-workflow-${wf.id}`} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-semibold truncate">{wf.name}</CardTitle>
                        <Badge variant={wf.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                          {wf.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                      {wf.description && (
                        <CardDescription className="mt-1 text-sm line-clamp-2">{wf.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditWorkflow(wf)} data-testid={`button-edit-workflow-${wf.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteWorkflowId(wf.id)} data-testid={`button-delete-workflow-${wf.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {wf.steps.length} {wf.steps.length === 1 ? "Schritt" : "Schritte"}
                  </div>
                  {wf.steps.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Noch keine Schritte definiert.</p>
                  ) : (
                    <div className="space-y-1">
                      {wf.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group" data-testid={`step-${step.id}`}>
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{step.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              {step.approverType === "role" ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {getApproverLabel(step)}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditStep(wf, step)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteStepId({ id: step.id, workflowId: wf.id })}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openCreateStep(wf)} data-testid={`button-add-step-${wf.id}`}>
                    <Plus className="w-3 h-3 mr-1" />
                    Schritt hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Workflow erstellen / bearbeiten */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkflow ? "Workflow bearbeiten" : "Neuer Workflow"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="wf-name">Name *</Label>
              <Input
                id="wf-name"
                value={wfForm.name}
                onChange={e => setWfForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z. B. IT-Freigabe, Einkaufsantrag"
                data-testid="input-workflow-name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wf-desc">Beschreibung</Label>
              <Textarea
                id="wf-desc"
                value={wfForm.description}
                onChange={e => setWfForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optionale Beschreibung des Workflows"
                rows={3}
                data-testid="input-workflow-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="wf-active"
                checked={wfForm.isActive}
                onCheckedChange={v => setWfForm(f => ({ ...f, isActive: v }))}
                data-testid="switch-workflow-active"
              />
              <Label htmlFor="wf-active">Workflow aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>Abbrechen</Button>
            <Button
              onClick={handleWorkflowSubmit}
              disabled={!wfForm.name.trim() || createWorkflow.isPending || updateWorkflow.isPending}
              data-testid="button-submit-workflow"
            >
              {editingWorkflow ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schritt erstellen / bearbeiten */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStep ? "Schritt bearbeiten" : "Neuer Genehmigungsschritt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="step-name">Schritt-Bezeichnung *</Label>
              <Input
                id="step-name"
                value={stepForm.name}
                onChange={e => setStepForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Teamleiter-Freigabe, Budgetgenehmigung"
                data-testid="input-step-name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="step-order">Reihenfolge</Label>
              <Input
                id="step-order"
                type="number"
                min={1}
                value={stepForm.order}
                onChange={e => setStepForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                data-testid="input-step-order"
              />
            </div>
            <div className="space-y-1">
              <Label>Genehmiger-Typ</Label>
              <Select value={stepForm.approverType} onValueChange={v => setStepForm(f => ({ ...f, approverType: v }))}>
                <SelectTrigger data-testid="select-approver-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Bestimmter Benutzer</SelectItem>
                  <SelectItem value="role">Rolle (alle Mitglieder)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {stepForm.approverType === "user" ? (
              <div className="space-y-1">
                <Label>Genehmiger</Label>
                <Select value={stepForm.approverId} onValueChange={v => setStepForm(f => ({ ...f, approverId: v }))}>
                  <SelectTrigger data-testid="select-approver-user">
                    <SelectValue placeholder="Benutzer auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agentUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Rolle</Label>
                <Select value={stepForm.approverRole} onValueChange={v => setStepForm(f => ({ ...f, approverRole: v }))}>
                  <SelectTrigger data-testid="select-approver-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStepDialog(false)}>Abbrechen</Button>
            <Button
              onClick={handleStepSubmit}
              disabled={!stepForm.name.trim() || (stepForm.approverType === "user" && !stepForm.approverId) || createStep.isPending || updateStep.isPending}
              data-testid="button-submit-step"
            >
              {editingStep ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow löschen bestätigen */}
      <AlertDialog open={!!deleteWorkflowId} onOpenChange={open => !open && setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workflow löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Workflow und alle seine Schritte werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWorkflowId && deleteWorkflow.mutate(deleteWorkflowId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schritt löschen bestätigen */}
      <AlertDialog open={!!deleteStepId} onOpenChange={open => !open && setDeleteStepId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schritt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Genehmigungsschritt wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStepId && deleteStep.mutate(deleteStepId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
