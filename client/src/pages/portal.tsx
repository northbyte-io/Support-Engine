import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Ticket,
  Plus,
  Clock,
  CheckCircle,
  ArrowRight,
  Send,
  Loader2,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { LoadingPage, TicketListSkeleton } from "@/components/LoadingState";
import { NoTicketsEmpty } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketWithRelations, TicketType } from "@shared/schema";

const portalTicketSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  ticketTypeId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type PortalTicketForm = z.infer<typeof portalTicketSchema>;

export default function PortalPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets, isLoading: ticketsLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/portal/tickets"],
  });

  const { data: ticketTypes } = useQuery<TicketType[]>({
    queryKey: ["/api/ticket-types"],
  });

  const { data: selectedTicket, isLoading: ticketDetailLoading } = useQuery<TicketWithRelations>({
    queryKey: ["/api/portal/tickets", selectedTicketId],
    enabled: !!selectedTicketId,
  });

  const form = useForm<PortalTicketForm>({
    resolver: zodResolver(portalTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      ticketTypeId: "",
      priority: "medium",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: PortalTicketForm) => {
      return apiRequest("POST", "/api/portal/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tickets"] });
      toast({ title: "Ticket erstellt", description: "Ihr Ticket wurde erfolgreich eingereicht." });
      setShowNewTicketDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fehler", description: "Das Ticket konnte nicht erstellt werden.", variant: "destructive" });
    },
  });

  const onSubmit = (data: PortalTicketForm) => {
    createTicketMutation.mutate(data);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  const openTickets = tickets?.filter((t) => t.status !== "closed" && t.status !== "resolved") || [];
  const closedTickets = tickets?.filter((t) => t.status === "closed" || t.status === "resolved") || [];

  const priorityOptions = [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
    { value: "urgent", label: "Dringend" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Kundenportal</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Willkommen, {user?.firstName}!</h1>
          <p className="text-muted-foreground">
            Hier können Sie Ihre Support-Tickets verwalten und den Status verfolgen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => setShowNewTicketDialog(true)}
            data-testid="card-new-ticket"
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Neues Ticket</h3>
              <p className="text-sm text-muted-foreground mt-1">Erstellen Sie eine neue Anfrage</p>
            </CardContent>
          </Card>

          <Card data-testid="card-open-tickets">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold">Offene Tickets</h3>
              <p className="text-2xl font-bold mt-1">{openTickets.length}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-closed-tickets">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Geschlossen</h3>
              <p className="text-2xl font-bold mt-1">{closedTickets.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" data-testid="tab-open">
              Offene Tickets ({openTickets.length})
            </TabsTrigger>
            <TabsTrigger value="closed" data-testid="tab-closed">
              Geschlossene Tickets ({closedTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-4">
            {ticketsLoading ? (
              <TicketListSkeleton count={3} />
            ) : openTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <NoTicketsEmpty onCreateTicket={() => setShowNewTicketDialog(true)} />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {openTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    data-testid={`ticket-card-${ticket.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {ticket.ticketNumber}
                            </span>
                          </div>
                          <h3 className="font-medium">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Erstellt {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={ticket.status || "open"} />
                          <PriorityBadge priority={ticket.priority || "medium"} showIcon={false} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-4">
            {ticketsLoading ? (
              <TicketListSkeleton count={3} />
            ) : closedTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Keine geschlossenen Tickets</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {closedTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="hover-elevate cursor-pointer opacity-75"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    data-testid={`ticket-card-${ticket.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {ticket.ticketNumber}
                            </span>
                          </div>
                          <h3 className="font-medium">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Geschlossen {formatDate(ticket.closedAt || ticket.resolvedAt)}
                          </p>
                        </div>
                        <StatusBadge status={ticket.status || "closed"} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Neues Ticket erstellen</DialogTitle>
              <DialogDescription>
                Beschreiben Sie Ihr Anliegen und wir melden uns schnellstmöglich bei Ihnen.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betreff *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Kurze Zusammenfassung Ihres Anliegens"
                          data-testid="input-portal-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticketTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-portal-type">
                            <SelectValue placeholder="Kategorie auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ticketTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dringlichkeit</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-portal-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Bitte beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
                          className="min-h-[120px]"
                          data-testid="input-portal-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewTicketDialog(false)}
                    data-testid="button-portal-cancel"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    data-testid="button-portal-submit"
                  >
                    {createTicketMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Ticket einreichen
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            {ticketDetailLoading ? (
              <LoadingPage />
            ) : selectedTicket ? (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedTicket.ticketNumber}
                    </span>
                    <StatusBadge status={selectedTicket.status || "open"} />
                  </div>
                  <DialogTitle>{selectedTicket.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Beschreibung</h4>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedTicket.description || "Keine Beschreibung vorhanden"}
                    </p>
                  </div>

                  {selectedTicket.comments && selectedTicket.comments.filter(c => c.visibility === "external").length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Kommunikation</h4>
                      <div className="space-y-3">
                        {selectedTicket.comments.filter(c => c.visibility === "external").map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">
                                {comment.author?.firstName} {comment.author?.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      Erstellt: {formatDate(selectedTicket.createdAt)}
                    </span>
                    <Button variant="outline" onClick={() => setSelectedTicketId(null)}>
                      Schließen
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
