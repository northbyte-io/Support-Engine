import { useState, useMemo } from "react";
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
import type { TicketWithRelations, Comment, User as UserType, Project, CustomerWithRelations } from "@shared/schema";
import { TicketTimerControl } from "@/components/TicketTimerControl";
import { WorkEntriesList } from "@/components/WorkEntriesList";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      ticketProjects?.forEach((tp) => {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${tp.projectId}/board`] });
      });
      toast({ title: "Status aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
      setNewComment("");
      toast({ title: "Kommentar hinzugefügt" });
    },
    onError: () => {
      toast({ title: "Fehler beim Hinzufügen", variant: "destructive" });
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
    if (window.confirm("Sind Sie sicher, dass Sie dieses Ticket löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      deleteTicketMutation.mutate();
    }
  };

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

  const statusOptions = [
    { value: "open", label: "Offen" },
    { value: "in_progress", label: "In Bearbeitung" },
    { value: "waiting", label: "Wartend" },
    { value: "resolved", label: "Gelöst" },
    { value: "closed", label: "Geschlossen" },
  ];

  const priorityOptions = [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
    { value: "urgent", label: "Dringend" },
  ];

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
              <Button variant="outline" size="icon" data-testid="button-ticket-menu">
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
            <h1 className="text-2xl font-semibold mt-1" data-testid="text-ticket-title">
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
                {ticket.description ? (
                  ticket.description.includes('<') && ticket.description.includes('>') ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert overflow-auto"
                      data-testid="text-description"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(ticket.description, {
                          ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 
                            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 
                            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'div', 'span', 
                            'hr', 'font', 'center', 'sup', 'sub'],
                          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height', 
                            'border', 'cellpadding', 'cellspacing', 'align', 'valign', 'bgcolor', 
                            'color', 'size', 'face', 'target'],
                          ALLOW_DATA_ATTR: false,
                          ADD_ATTR: ['target'],
                        })
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap" data-testid="text-description">
                      {ticket.description}
                    </p>
                  )
                ) : (
                  <p className="text-muted-foreground italic">Keine Beschreibung vorhanden</p>
                )}
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
                        {ticket.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                            data-testid={`attachment-${attachment.id}`}
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("token");
                                const response = await fetch(`/api/attachments/${attachment.id}/download`, {
                                  headers: {
                                    Authorization: `Bearer ${token}`
                                  }
                                });
                                if (!response.ok) {
                                  throw new Error('Download fehlgeschlagen');
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = attachment.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Download-Fehler:', error);
                                toast({
                                  title: "Download fehlgeschlagen",
                                  description: "Die Datei konnte nicht heruntergeladen werden.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <FileText className="w-8 h-8 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {(attachment.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        ))}
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
                    <div 
                      className="p-3 rounded-lg bg-muted/50 cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/customers/${ticket.customer.id}`)}
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
                    </div>
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
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => setLocation(`/projects/${tp.projectId}`)}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tp.project?.color || "#3B82F6" }}
                          />
                          <span className="text-sm font-medium">{tp.project?.name}</span>
                          <Badge variant="outline" className="text-xs">{tp.project?.key}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
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
    </MainLayout>
  );
}
