import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth.tsx";
import { t } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Send,
  Paperclip,
  Clock,
  User,
  Calendar,
  MessageSquare,
  FileText,
  Loader2,
  Lock,
  Unlock,
  Trash2,
  Folder,
  X,
  Building2,
  Mail,
  Phone,
  Timer,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Plus,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { LoadingPage } from "@/components/LoadingState";
import { NoCommentsEmpty } from "@/components/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketWithRelations, Project, CustomerWithRelations, ApprovalRequestWithDetails, ApprovalWorkflowWithSteps } from "@shared/schema";
import { TicketTimerControl } from "@/components/TicketTimerControl";
import { WorkEntriesList } from "@/components/WorkEntriesList";
import { statusOptions, priorityOptions } from "@/lib/ticket-options";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);

  const { data: ticket, isLoading } = useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets", params.id],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: ticketProjects } = useQuery<{ projectId: string; project: Project }[]>({
    queryKey: [`/api/tickets/${params.id}/projects`],
    enabled: !!params.id,
  });

  const { data: customers } = useQuery<CustomerWithRelations[]>({
    queryKey: ["/api/customers"],
  });

  // Approval Workflow States
  const [showRequestApprovalDialog, setShowRequestApprovalDialog] = useState(false);
  const [approvalForm, setApprovalForm] = useState({ workflowId: "", note: "" });
  const [showDecideDialog, setShowDecideDialog] = useState(false);
  const [decideForm, setDecideForm] = useState({ decision: "" as "approved" | "rejected" | "", comment: "" });

  const { data: approvalWorkflows = [] } = useQuery<ApprovalWorkflowWithSteps[]>({
    queryKey: ["/api/approval-workflows"],
    enabled: user?.role === "admin" || user?.role === "agent",
  });

  const { data: ticketApproval, refetch: refetchApproval } = useQuery<ApprovalRequestWithDetails | null>({
    queryKey: ["/api/approvals", { ticketId: params.id }],
    queryFn: () => fetch(`/api/approvals?ticketId=${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then((arr: ApprovalRequestWithDetails[]) => arr[0] || null),
    enabled: !!params.id,
  });

  const activeWorkflows = approvalWorkflows.filter(w => w.isActive);

  const requestApprovalMutation = useMutation({
    mutationFn: (data: { workflowId: string; ticketId: string; note?: string }) =>
      apiRequest("POST", "/api/approvals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending/count"] });
      setShowRequestApprovalDialog(false);
      setApprovalForm({ workflowId: "", note: "" });
      toast({ title: "Genehmigungsanfrage erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const cancelApprovalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/approvals/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending/count"] });
      toast({ title: "Genehmigungsanfrage abgebrochen" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const decideApprovalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { decision: string; comment?: string } }) =>
      apiRequest("POST", `/api/approvals/${id}/decide`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending/count"] });
      setShowDecideDialog(false);
      setDecideForm({ decision: "", comment: "" });
      toast({ title: decideForm.decision === "approved" ? "Genehmigt ✓" : "Abgelehnt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const isApproverForCurrentStep = ticketApproval?.status === "pending" && ticketApproval?.currentStep && (
    (ticketApproval.currentStep.approverType === "user" && ticketApproval.currentStep.approverId === user?.id) ||
    (ticketApproval.currentStep.approverType === "role" && ticketApproval.currentStep.approverRole === user?.role)
  );

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerId: string | null) => {
      return apiRequest("PATCH", `/api/tickets/${params.id}`, { customerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Kunde aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/tickets/${params.id}`, { status });
    },
    onMutate: async (newStatus: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/tickets", params.id] });
      await queryClient.cancelQueries({ queryKey: ["/api/tickets"] });
      const previousTicket = queryClient.getQueryData<TicketWithRelations>(["/api/tickets", params.id]);
      const previousList = queryClient.getQueryData<TicketWithRelations[]>(["/api/tickets"]);
      const typedStatus = newStatus as TicketWithRelations["status"];
      queryClient.setQueryData<TicketWithRelations>(
        ["/api/tickets", params.id],
        (old) => old ? { ...old, status: typedStatus } : old
      );
      queryClient.setQueryData<TicketWithRelations[]>(
        ["/api/tickets"],
        (old) => old?.map((t) => t.id === params.id ? { ...t, status: typedStatus } : t)
      );
      return { previousTicket, previousList };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previousTicket !== undefined) {
        queryClient.setQueryData(["/api/tickets", params.id], context.previousTicket);
      }
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(["/api/tickets"], context.previousList);
      }
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Status aktualisiert" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      ticketProjects?.forEach((tp) => {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${tp.projectId}/board`] });
      });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      return apiRequest("PATCH", `/api/tickets/${params.id}`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
      toast({ title: "Priorität aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: "internal" | "external" }) => {
      return apiRequest("POST", `/api/tickets/${params.id}/comments`, data);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["/api/tickets", params.id] });
      const previousTicket = queryClient.getQueryData<TicketWithRelations>(["/api/tickets", params.id]);
      const optimisticComment = {
        id: `optimistic-${Date.now()}`,
        ticketId: params.id,
        authorId: user?.id ?? null,
        content: newData.content,
        visibility: newData.visibility,
        isNote: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: user
          ? (({ password: _pw, ...rest }) => rest)(user)
          : undefined,
        attachments: [] as NonNullable<TicketWithRelations["attachments"]>,
      };
      queryClient.setQueryData<TicketWithRelations>(
        ["/api/tickets", params.id],
        (old) => old ? { ...old, comments: [...(old.comments ?? []), optimisticComment] } : old
      );
      setNewComment("");
      return { previousTicket };
    },
    onError: (_err, _data, context) => {
      if (context?.previousTicket !== undefined) {
        queryClient.setQueryData(["/api/tickets", params.id], context.previousTicket);
      }
      toast({ title: "Fehler beim Hinzufügen", variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Kommentar hinzugefügt" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
    },
  });

  const addToProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("POST", `/api/tickets/${params.id}/projects`, { projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${params.id}/projects`] });
      setSelectedProjectId("");
      toast({ title: "Projekt zugeordnet" });
    },
    onError: () => {
      toast({ title: "Fehler beim Zuordnen", variant: "destructive" });
    },
  });

  const removeFromProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("DELETE", `/api/tickets/${params.id}/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${params.id}/projects`] });
      toast({ title: "Projektzuordnung entfernt" });
    },
    onError: () => {
      toast({ title: "Fehler beim Entfernen", variant: "destructive" });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/tickets/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket gelöscht" });
      setLocation("/tickets");
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const handleDeleteTicket = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadAttachment = useCallback(async (attachmentId: string, fileName: string) => {
    if (downloadingAttachmentId) return;
    setDownloadingAttachmentId(attachmentId);
    try {
      const response = await apiRequest("GET", `/api/attachments/${attachmentId}/download`);
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch {
      toast({
        title: t("tickets.downloadFailed"),
        description: t("tickets.downloadFailedDescription"),
        variant: "destructive",
      });
    } finally {
      setDownloadingAttachmentId(null);
    }
  }, [downloadingAttachmentId, toast]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        content: newComment,
        visibility: isInternalComment ? "internal" : "external",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: de });
  };

  const formatRelativeDate = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  if (isLoading) {
    return (
      <MainLayout title="Ticket laden...">
        <LoadingPage />
      </MainLayout>
    );
  }

  if (!ticket) {
    return (
      <MainLayout title="Ticket nicht gefunden">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Dieses Ticket wurde nicht gefunden.</p>
          <Button onClick={() => setLocation("/tickets")} className="mt-4">
            Zurück zur Übersicht
          </Button>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout
      title=""
      actions={
        <div className="flex items-center gap-2">
          <TicketTimerControl
            ticketId={params.id || ""}
            ticketNumber={ticket.ticketNumber}
            ticketTitle={ticket.title}
          />
          <Button
            variant="outline"
            onClick={() => setLocation(`/tickets/${params.id}/edit`)}
            data-testid="button-edit-ticket"
          >
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Ticket-Optionen" data-testid="button-ticket-menu">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="menu-duplicate">
                Ticket duplizieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive" 
                data-testid="menu-delete"
                onClick={handleDeleteTicket}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ticket löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zurück zur Ticketliste"
            onClick={() => setLocation("/tickets")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-mono" data-testid="text-ticket-number">
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status || "open"} />
              <PriorityBadge priority={ticket.priority || "medium"} />
            </div>
            <h1 className="text-2xl font-semibold font-display mt-1" data-testid="text-ticket-title">
              {ticket.title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  if (!ticket.description) return <p className="text-muted-foreground italic">Keine Beschreibung vorhanden</p>;
                  if (ticket.description.includes('<') && ticket.description.includes('>')) return (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert overflow-auto"
                      data-testid="text-description"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(ticket.description, {
                          ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
                            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
                            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span',
                            'hr', 'sup', 'sub'],
                          // 'style' and 'class' are intentionally excluded:
                          //   - style enables CSS-based data exfiltration (background-image requests)
                          //   - class can interact with Tailwind/app CSS in unintended ways
                          // 'img' is excluded to prevent pixel-tracking via arbitrary src URLs.
                          ALLOWED_ATTR: ['href', 'alt', 'title', 'width', 'height',
                            'border', 'cellpadding', 'cellspacing', 'align', 'valign',
                            'target'],
                          ALLOW_DATA_ATTR: false,
                          ADD_ATTR: ['target'],
                        })
                      }}
                    />
                  );
                  return (
                    <p className="whitespace-pre-wrap" data-testid="text-description">
                      {ticket.description}
                    </p>
                  );
                })()}
              </CardContent>
            </Card>

            <Tabs defaultValue="comments" className="w-full">
              <TabsList>
                <TabsTrigger value="comments" data-testid="tab-comments">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Kommentare ({ticket.comments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="work-entries" data-testid="tab-work-entries">
                  <Timer className="w-4 h-4 mr-2" />
                  Arbeitseinträge
                </TabsTrigger>
                <TabsTrigger value="attachments" data-testid="tab-attachments">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Anhänge ({ticket.attachments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">
                  <Clock className="w-4 h-4 mr-2" />
                  Aktivität
                </TabsTrigger>
                {(user?.role === "admin" || user?.role === "agent") && (
                  <TabsTrigger value="approval" data-testid="tab-approval">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Genehmigung
                    {ticketApproval?.status === "pending" && (
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="comments" className="mt-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="internal-toggle" className="flex items-center gap-2 cursor-pointer">
                          {isInternalComment ? (
                            <Lock className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-sm">
                            {isInternalComment ? "Interner Kommentar" : "Externer Kommentar"}
                          </span>
                        </Label>
                        <Switch
                          id="internal-toggle"
                          checked={isInternalComment}
                          onCheckedChange={setIsInternalComment}
                          data-testid="switch-internal"
                        />
                      </div>
                      <Textarea
                        placeholder="Kommentar schreiben..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                        data-testid="input-comment"
                      />
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" data-testid="button-attach-file">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Datei anhängen
                        </Button>
                        <Button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isSubmitting}
                          data-testid="button-submit-comment"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Senden
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {!ticket.comments || ticket.comments.length === 0 ? (
                      <NoCommentsEmpty />
                    ) : (
                      <div className="space-y-4">
                        {ticket.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-4 rounded-lg ${
                              comment.visibility === "internal"
                                ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30"
                                : "bg-muted/50"
                            }`}
                            data-testid={`comment-${comment.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.author?.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(comment.author?.firstName, comment.author?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">
                                    {comment.author?.firstName} {comment.author?.lastName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatRelativeDate(comment.createdAt)}
                                  </span>
                                  {comment.visibility === "internal" && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Intern
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="work-entries" className="mt-4">
                <WorkEntriesList ticketId={params.id || ""} />
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    {!ticket.attachments || ticket.attachments.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Keine Anhänge vorhanden</p>
                        <Button variant="outline" className="mt-4" data-testid="button-upload">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Datei hochladen
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ticket.attachments.map((attachment) => {
                          const isDownloading = downloadingAttachmentId === attachment.id;
                          return (
                            <button
                              key={attachment.id}
                              type="button"
                              className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer ${isDownloading ? "opacity-60 pointer-events-none" : ""}`}
                              data-testid={`attachment-${attachment.id}`}
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                              aria-label={`${attachment.fileName} herunterladen`}
                              aria-busy={isDownloading}
                            >
                              {isDownloading ? (
                                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                              ) : (
                                <FileText className="w-8 h-8 text-muted-foreground" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(attachment.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aktivitätsverlauf wird geladen...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {(user?.role === "admin" || user?.role === "agent") && (
                <TabsContent value="approval" className="mt-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      {!ticketApproval ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <ShieldCheck className="w-12 h-12 text-muted-foreground mb-3" />
                          <h3 className="font-medium mb-1">Keine aktive Genehmigung</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Starten Sie einen Genehmigungsworkflow für dieses Ticket.
                          </p>
                          {activeWorkflows.length > 0 ? (
                            <Button onClick={() => setShowRequestApprovalDialog(true)} data-testid="button-request-approval">
                              <Plus className="w-4 h-4 mr-2" />
                              Genehmigung anfordern
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Es sind keine aktiven Genehmigungsworkflows konfiguriert.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Status-Header */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {ticketApproval.status === "pending" && <span className="flex items-center gap-1 text-sm font-medium text-amber-600"><Clock className="w-4 h-4" /> Ausstehend</span>}
                                {ticketApproval.status === "approved" && <span className="flex items-center gap-1 text-sm font-medium text-green-600"><CheckCircle2 className="w-4 h-4" /> Genehmigt</span>}
                                {ticketApproval.status === "rejected" && <span className="flex items-center gap-1 text-sm font-medium text-red-600"><XCircle className="w-4 h-4" /> Abgelehnt</span>}
                                {ticketApproval.status === "cancelled" && <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground"><Ban className="w-4 h-4" /> Abgebrochen</span>}
                                {ticketApproval.workflow && (
                                  <span className="text-sm text-muted-foreground">— {ticketApproval.workflow.name}</span>
                                )}
                              </div>
                              {ticketApproval.requestedBy && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Angefordert von {ticketApproval.requestedBy.firstName} {ticketApproval.requestedBy.lastName} · {new Date(ticketApproval.createdAt!).toLocaleDateString("de-DE")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {isApproverForCurrentStep && (
                                <Button size="sm" onClick={() => { setShowDecideDialog(true); setDecideForm({ decision: "", comment: "" }); }} data-testid="button-decide-approval">
                                  Entscheiden
                                </Button>
                              )}
                              {ticketApproval.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelApprovalMutation.mutate(ticketApproval.id)}
                                  disabled={cancelApprovalMutation.isPending}
                                  data-testid="button-cancel-approval"
                                >
                                  Abbrechen
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Schritt-Timeline */}
                          {ticketApproval.workflow?.steps && ticketApproval.workflow.steps.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Genehmigungsschritte</p>
                              {ticketApproval.workflow.steps.map((step, idx) => {
                                const decision = ticketApproval.decisions.find(d => d.stepOrder === step.order);
                                const isCurrent = step.order === ticketApproval.currentStepOrder && ticketApproval.status === "pending";
                                return (
                                  <div key={step.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/40" data-testid={`approval-step-${step.id}`}>
                                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      decision?.decision === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                      decision?.decision === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                      isCurrent ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                      "bg-muted text-muted-foreground"
                                    }`}>
                                      {decision?.decision === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                       decision?.decision === "rejected" ? <XCircle className="w-3.5 h-3.5" /> :
                                       idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium">{step.name}</span>
                                        {isCurrent && <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">Aktuell</span>}
                                        {decision?.decision === "approved" && <span className="text-xs text-green-600">✓ Genehmigt</span>}
                                        {decision?.decision === "rejected" && <span className="text-xs text-red-600">✗ Abgelehnt</span>}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {step.approverType === "role"
                                          ? step.approverRole === "admin" ? "Alle Admins" : "Alle Agenten"
                                          : step.approver ? `${step.approver.firstName} ${step.approver.lastName}` : "Bestimmter Benutzer"}
                                      </p>
                                      {decision?.comment && (
                                        <p className="text-xs text-muted-foreground italic mt-1">"{decision.comment}"</p>
                                      )}
                                      {decision?.approver && decision.decidedAt && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          von {decision.approver.firstName} {decision.approver.lastName} · {new Date(decision.decidedAt).toLocaleDateString("de-DE")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Neue Anfrage nach Abschluss */}
                          {(ticketApproval.status === "rejected" || ticketApproval.status === "cancelled") && activeWorkflows.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setShowRequestApprovalDialog(true)} data-testid="button-request-approval-again">
                              <Plus className="w-4 h-4 mr-2" />
                              Neue Anfrage stellen
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={ticket.status || "open"}
                    onValueChange={(value) => updateStatusMutation.mutate(value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Priorität</Label>
                  <Select
                    value={ticket.priority || "medium"}
                    onValueChange={(value) => updatePriorityMutation.mutate(value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {ticket.ticketType && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Typ</Label>
                    <p className="mt-1 text-sm">{ticket.ticketType.name}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Erstellt von
                  </Label>
                  {ticket.createdBy && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.createdBy.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(ticket.createdBy.firstName, ticket.createdBy.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Erstellt am
                  </Label>
                  <p className="mt-1 text-sm">{formatDate(ticket.createdAt)}</p>
                </div>

                {ticket.dueDate && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Fälligkeitsdatum
                    </Label>
                    <p className="mt-1 text-sm">{formatDate(ticket.dueDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Kunde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.customer ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      className="w-full text-left p-3 rounded-lg bg-muted/50 cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/customers/${ticket.customer?.id}`)}
                      data-testid="link-customer-detail"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{ticket.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.customer.customerNumber}</p>
                        </div>
                      </div>
                      {ticket.customer.organization && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.customer.organization.name}
                        </p>
                      )}
                    </button>
                    {ticket.customer.contacts && ticket.customer.contacts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Kontakte</p>
                        {ticket.customer.contacts.slice(0, 2).map((contact) => (
                          <div key={contact.id} className="text-sm space-y-1">
                            <p className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.email && (
                              <a 
                                href={`mailto:${contact.email}`} 
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                              >
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a 
                                href={`tel:${contact.phone}`} 
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => updateCustomerMutation.mutate(null)}
                      data-testid="button-remove-customer"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Kunde entfernen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select onValueChange={(value) => updateCustomerMutation.mutate(value)}>
                      <SelectTrigger data-testid="select-customer">
                        <SelectValue placeholder="Kunde zuweisen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3" />
                              <span>{customer.name}</span>
                              <span className="text-xs text-muted-foreground">({customer.customerNumber})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bearbeiter</CardTitle>
              </CardHeader>
              <CardContent>
                {!ticket.assignees || ticket.assignees.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Keine Bearbeiter zugewiesen</p>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="button-add-assignee">
                      Bearbeiter hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ticket.assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50"
                        data-testid={`assignee-${assignee.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={assignee.user?.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(assignee.user?.firstName, assignee.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {assignee.user?.firstName} {assignee.user?.lastName}
                            </p>
                            {assignee.isPrimary && (
                              <Badge variant="secondary" className="text-xs">Hauptbearbeiter</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Projekte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketProjects && ticketProjects.length > 0 && (
                  <div className="space-y-2">
                    {ticketProjects.map((tp) => (
                      <div
                        key={tp.projectId}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
                        data-testid={`project-${tp.projectId}`}
                      >
                        <button
                          type="button"
                          className="flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => setLocation(`/projects/${tp.projectId}`)}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tp.project?.color || "#3B82F6" }}
                          />
                          <span className="text-sm font-medium">{tp.project?.name}</span>
                          <Badge variant="outline" className="text-xs">{tp.project?.key}</Badge>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          aria-label="Projektzuordnung entfernen"
                          onClick={() => removeFromProjectMutation.mutate(tp.projectId)}
                          data-testid={`button-remove-project-${tp.projectId}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="flex-1" data-testid="select-project">
                      <SelectValue placeholder="Projekt auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        ?.filter((p) => !ticketProjects?.some((tp) => tp.projectId === p.id))
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color || "#3B82F6" }}
                              />
                              <span>{project.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => selectedProjectId && addToProjectMutation.mutate(selectedProjectId)}
                    disabled={!selectedProjectId || addToProjectMutation.isPending}
                    data-testid="button-add-project"
                  >
                    Hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Beobachter</CardTitle>
              </CardHeader>
              <CardContent>
                {!ticket.watchers || ticket.watchers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Keine Beobachter</p>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="button-add-watcher">
                      Beobachter hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ticket.watchers.map((watcher) => (
                      <div
                        key={watcher.id}
                        className="flex items-center gap-1"
                        data-testid={`watcher-${watcher.id}`}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={watcher.user?.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(watcher.user?.firstName, watcher.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog: Genehmigung anfordern */}
      <Dialog open={showRequestApprovalDialog} onOpenChange={setShowRequestApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genehmigung anfordern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="approval-workflow">Workflow auswählen *</Label>
              <Select value={approvalForm.workflowId} onValueChange={v => setApprovalForm(f => ({ ...f, workflowId: v }))}>
                <SelectTrigger id="approval-workflow" data-testid="select-approval-workflow">
                  <SelectValue placeholder="Workflow auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {activeWorkflows.map(wf => (
                    <SelectItem key={wf.id} value={wf.id}>
                      {wf.name} ({wf.steps.length} {wf.steps.length === 1 ? "Schritt" : "Schritte"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {approvalForm.workflowId && (
              <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
                {activeWorkflows.find(w => w.id === approvalForm.workflowId)?.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</span>
                    {step.name}
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="approval-note">Hinweis (optional)</Label>
              <Textarea
                id="approval-note"
                value={approvalForm.note}
                onChange={e => setApprovalForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Begründung oder Hinweis für die Genehmiger..."
                rows={3}
                data-testid="input-approval-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestApprovalDialog(false)}>Abbrechen</Button>
            <Button
              onClick={() => requestApprovalMutation.mutate({ workflowId: approvalForm.workflowId, ticketId: params.id, note: approvalForm.note || undefined })}
              disabled={!approvalForm.workflowId || requestApprovalMutation.isPending}
              data-testid="button-submit-approval-request"
            >
              Anfordern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Genehmigungsentscheidung */}
      <Dialog open={showDecideDialog} onOpenChange={setShowDecideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genehmigungsentscheidung</DialogTitle>
          </DialogHeader>
          {ticketApproval && (
            <div className="space-y-4 py-2">
              {ticketApproval.currentStep && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-0.5">Aktueller Schritt</p>
                  <p className="text-sm font-medium">{ticketApproval.currentStep.name}</p>
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
                  data-testid="button-approve-decision"
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
                  data-testid="button-reject-decision"
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
                  placeholder="Begründung..."
                  rows={3}
                  data-testid="input-ticket-decision-comment"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecideDialog(false)}>Abbrechen</Button>
            <Button
              onClick={() => ticketApproval && decideApprovalMutation.mutate({ id: ticketApproval.id, data: { decision: decideForm.decision, comment: decideForm.comment || undefined } })}
              disabled={!decideForm.decision || decideApprovalMutation.isPending}
              className={decideForm.decision === "rejected" ? "bg-destructive hover:bg-destructive/90" : ""}
              data-testid="button-submit-ticket-decision"
            >
              {decideApprovalMutation.isPending ? "..." : decideForm.decision === "approved" ? "Genehmigen" : decideForm.decision === "rejected" ? "Ablehnen" : "Entscheiden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Ticket löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTicketMutation.mutate()}
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
