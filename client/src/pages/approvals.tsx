import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ChevronRight,
  User,
  ShieldCheck,
  FileText,
  Inbox,
} from "lucide-react";
import type { ApprovalRequestWithDetails } from "@shared/schema";

const statusConfig = {
  pending: { label: "Ausstehend", icon: Clock, variant: "secondary" as const, color: "text-amber-500" },
  approved: { label: "Genehmigt", icon: CheckCircle2, variant: "default" as const, color: "text-green-500" },
  rejected: { label: "Abgelehnt", icon: XCircle, variant: "destructive" as const, color: "text-red-500" },
  cancelled: { label: "Abgebrochen", icon: Ban, variant: "outline" as const, color: "text-muted-foreground" },
};

function ApprovalStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function StepTimeline({ request }: { request: ApprovalRequestWithDetails }) {
  const steps = request.workflow?.steps || [];
  if (steps.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      {steps.map((step, idx) => {
        const decision = request.decisions.find(d => d.stepOrder === step.order);
        const isCurrent = step.order === request.currentStepOrder && request.status === "pending";
        const isDone = decision && decision.decision !== "pending";
        const Icon = decision?.decision === "approved" ? CheckCircle2
          : decision?.decision === "rejected" ? XCircle
          : isCurrent ? Clock : Clock;

        return (
          <div key={step.id} className="flex items-start gap-2">
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              decision?.decision === "approved" ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
              decision?.decision === "rejected" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
              isCurrent ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
              "bg-muted text-muted-foreground"
            }`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${isCurrent ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground"}`}>
                  Schritt {idx + 1}: {step.name}
                </span>
                {isCurrent && <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">Aktuell</span>}
              </div>
              {decision?.comment && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">"{decision.comment}"</p>
              )}
              {decision?.approver && (
                <p className="text-xs text-muted-foreground">
                  von {decision.approver.firstName} {decision.approver.lastName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalCard({
  request,
  canDecide,
  onDecide,
}: {
  request: ApprovalRequestWithDetails;
  canDecide: boolean;
  onDecide: (request: ApprovalRequestWithDetails) => void;
}) {
  const [, navigate] = useLocation();

  return (
    <Card data-testid={`card-approval-${request.id}`} className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <ApprovalStatusBadge status={request.status || "pending"} />
              {request.ticket && (
                <button
                  onClick={() => navigate(`/tickets/${request.ticket!.id}`)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  data-testid={`link-ticket-${request.ticket.id}`}
                >
                  <FileText className="w-3 h-3" />
                  #{request.ticket.ticketNumber}
                </button>
              )}
            </div>
            {request.ticket && (
              <h3 className="font-medium text-sm line-clamp-1 mb-1">{request.ticket.title}</h3>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {request.workflow && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {request.workflow.name}
                </span>
              )}
              {request.requestedBy && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {request.requestedBy.firstName} {request.requestedBy.lastName}
                </span>
              )}
              <span>{new Date(request.createdAt!).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            </div>
            {request.note && (
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{request.note}"</p>
            )}
            <StepTimeline request={request} />
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {canDecide && request.status === "pending" && (
              <Button size="sm" onClick={() => onDecide(request)} data-testid={`button-decide-${request.id}`}>
                Entscheiden
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [decideRequest, setDecideRequest] = useState<ApprovalRequestWithDetails | null>(null);
  const [decideForm, setDecideForm] = useState({ decision: "" as "approved" | "rejected" | "", comment: "" });

  const { data: pendingForMe = [], isLoading: loadingPending } = useQuery<ApprovalRequestWithDetails[]>({
    queryKey: ["/api/approvals/pending"],
  });

  const { data: myRequests = [], isLoading: loadingMine } = useQuery<ApprovalRequestWithDetails[]>({
    queryKey: ["/api/approvals", { mine: true }],
    queryFn: () => fetch("/api/approvals?mine=true", { credentials: "include" }).then(r => r.json()),
  });

  const decide = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { decision: string; comment?: string } }) =>
      apiRequest("POST", `/api/approvals/${id}/decide`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending/count"] });
      setDecideRequest(null);
      setDecideForm({ decision: "", comment: "" });
      toast({ title: decideForm.decision === "approved" ? "Genehmigt ✓" : "Abgelehnt", description: "Die Entscheidung wurde gespeichert." });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const handleDecideSubmit = () => {
    if (!decideRequest || !decideForm.decision) return;
    decide.mutate({ id: decideRequest.id, data: { decision: decideForm.decision, comment: decideForm.comment || undefined } });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Genehmigungen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwalten Sie Genehmigungsanfragen und treffen Sie Entscheidungen.
          </p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending-approvals">
              Warten auf mich
              {pendingForMe.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingForMe.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mine" data-testid="tab-my-requests">
              Meine Anfragen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {loadingPending ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)
            ) : pendingForMe.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Alles erledigt</h3>
                  <p className="text-sm text-muted-foreground">Keine ausstehenden Genehmigungen für Sie.</p>
                </CardContent>
              </Card>
            ) : (
              pendingForMe.map(r => (
                <ApprovalCard
                  key={r.id}
                  request={r}
                  canDecide={true}
                  onDecide={req => { setDecideRequest(req); setDecideForm({ decision: "", comment: "" }); }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-4 space-y-3">
            {loadingMine ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)
            ) : myRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Keine Anfragen</h3>
                  <p className="text-sm text-muted-foreground">Sie haben noch keine Genehmigungsanfragen gestellt.</p>
                </CardContent>
              </Card>
            ) : (
              myRequests.map(r => (
                <ApprovalCard
                  key={r.id}
                  request={r}
                  canDecide={false}
                  onDecide={() => {}}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Entscheidungs-Dialog */}
      <Dialog open={!!decideRequest} onOpenChange={open => !open && setDecideRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genehmigungsentscheidung</DialogTitle>
          </DialogHeader>
          {decideRequest && (
            <div className="space-y-4 py-2">
              {decideRequest.ticket && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Ticket #{decideRequest.ticket.ticketNumber}</p>
                  <p className="text-sm font-medium">{decideRequest.ticket.title}</p>
                </div>
              )}
              {decideRequest.currentStep && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aktueller Schritt:</p>
                  <p className="text-sm font-medium">{decideRequest.currentStep.name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDecideForm(f => ({ ...f, decision: "approved" }))}
                  className={`p-3 rounded-md border-2 transition-colors flex flex-col items-center gap-1 ${
                    decideForm.decision === "approved"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-muted hover:border-green-300"
                  }`}
                  data-testid="button-approve"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-sm font-medium">Genehmigen</span>
                </button>
                <button
                  onClick={() => setDecideForm(f => ({ ...f, decision: "rejected" }))}
                  className={`p-3 rounded-md border-2 transition-colors flex flex-col items-center gap-1 ${
                    decideForm.decision === "rejected"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "border-muted hover:border-red-300"
                  }`}
                  data-testid="button-reject"
                >
                  <XCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">Ablehnen</span>
                </button>
              </div>
              <div className="space-y-1">
                <Label htmlFor="decide-comment">Kommentar (optional)</Label>
                <Textarea
                  id="decide-comment"
                  value={decideForm.comment}
                  onChange={e => setDecideForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Begründung für Ihre Entscheidung..."
                  rows={3}
                  data-testid="input-decision-comment"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecideRequest(null)}>Abbrechen</Button>
            <Button
              onClick={handleDecideSubmit}
              disabled={!decideForm.decision || decide.isPending}
              className={decideForm.decision === "rejected" ? "bg-destructive hover:bg-destructive/90" : ""}
              data-testid="button-submit-decision"
            >
              {decide.isPending ? "Wird gespeichert..." : decideForm.decision === "approved" ? "Genehmigen" : decideForm.decision === "rejected" ? "Ablehnen" : "Entscheidung wählen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
