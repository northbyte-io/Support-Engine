import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Timer, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  Filter,
  Calendar,
  User,
  Ticket,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { TimeEntryWithRelations, TicketWithRelations, User as UserType } from "@shared/schema";

const timeEntryFormSchema = z.object({
  description: z.string().optional(),
  minutes: z.coerce.number().min(1, "Zeit muss mindestens 1 Minute sein"),
  date: z.string().min(1, "Datum ist erforderlich"),
  ticketId: z.string().optional(),
  isBillable: z.boolean().default(false),
  hourlyRate: z.coerce.number().optional(),
});

type TimeEntryFormData = z.infer<typeof timeEntryFormSchema>;

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithRelations | null>(null);
  const [filterTicketId, setFilterTicketId] = useState<string>("");
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [filterEndDate, setFilterEndDate] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const isAdmin = user?.role === "admin";

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      description: "",
      minutes: 30,
      date: format(new Date(), "yyyy-MM-dd"),
      ticketId: "",
      isBillable: false,
      hourlyRate: undefined,
    },
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterTicketId && filterTicketId !== "__all__") params.append("ticketId", filterTicketId);
    if (filterUserId && filterUserId !== "__all__") params.append("userId", filterUserId);
    if (filterStartDate) params.append("startDate", filterStartDate);
    if (filterEndDate) params.append("endDate", filterEndDate);
    return params.toString();
  };

  const { data: timeEntries = [], isLoading: entriesLoading } = useQuery<TimeEntryWithRelations[]>({
    queryKey: ["/api/time-entries", filterTicketId, filterUserId, filterStartDate, filterEndDate],
    queryFn: async () => {
      const queryStr = buildQueryParams();
      const response = await fetch(`/api/time-entries?${queryStr}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Fehler beim Laden der Zeiteinträge");
      return response.json();
    },
  });

  const { data: summary } = useQuery<{ totalMinutes: number; billableMinutes: number; totalAmount: number }>({
    queryKey: ["/api/time-entries/summary", filterTicketId, filterUserId, filterStartDate, filterEndDate],
    queryFn: async () => {
      const queryStr = buildQueryParams();
      const response = await fetch(`/api/time-entries/summary?${queryStr}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Fehler beim Laden der Zusammenfassung");
      return response.json();
    },
  });

  const { data: tickets = [] } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: TimeEntryFormData) => {
      return apiRequest("POST", "/api/time-entries", {
        ...data,
        ticketId: data.ticketId && data.ticketId !== "__none__" ? data.ticketId : null,
        hourlyRate: data.hourlyRate ? data.hourlyRate * 100 : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Zeiteintrag erstellt" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimeEntryFormData }) => {
      return apiRequest("PATCH", `/api/time-entries/${id}`, {
        ...data,
        ticketId: data.ticketId && data.ticketId !== "__none__" ? data.ticketId : null,
        hourlyRate: data.hourlyRate ? data.hourlyRate * 100 : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Zeiteintrag aktualisiert" });
      setDialogOpen(false);
      setEditingEntry(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Zeiteintrag gelöscht" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const openDialog = (entry?: TimeEntryWithRelations) => {
    if (entry) {
      setEditingEntry(entry);
      form.reset({
        description: entry.description || "",
        minutes: entry.minutes,
        date: format(new Date(entry.date), "yyyy-MM-dd"),
        ticketId: entry.ticketId || "",
        isBillable: entry.isBillable || false,
        hourlyRate: entry.hourlyRate ? entry.hourlyRate / 100 : undefined,
      });
    } else {
      setEditingEntry(null);
      form.reset({
        description: "",
        minutes: 30,
        date: format(new Date(), "yyyy-MM-dd"),
        ticketId: "",
        isBillable: false,
        hourlyRate: undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: TimeEntryFormData) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <MainLayout
      title="Zeiterfassung"
      actions={
        <Button onClick={() => openDialog()} data-testid="button-new-time-entry">
          <Plus className="w-4 h-4 mr-2" />
          Zeit erfassen
        </Button>
      }
    >
      <div className="flex flex-col h-full">

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Von</label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                data-testid="input-filter-start-date"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Bis</label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                data-testid="input-filter-end-date"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ticket</label>
              <Select value={filterTicketId || "__all__"} onValueChange={(v) => setFilterTicketId(v === "__all__" ? "" : v)}>
                <SelectTrigger data-testid="select-filter-ticket">
                  <SelectValue placeholder="Alle Tickets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Alle Tickets</SelectItem>
                  {tickets.map((ticket) => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      {ticket.ticketNumber} - {ticket.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Benutzer</label>
                <Select value={filterUserId || "__all__"} onValueChange={(v) => setFilterUserId(v === "__all__" ? "" : v)}>
                  <SelectTrigger data-testid="select-filter-user">
                    <SelectValue placeholder="Alle Benutzer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle Benutzer</SelectItem>
                    {users.filter(u => u.role !== "customer").map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {summary && (
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-medium">Zusammenfassung</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Gesamt
                  </span>
                  <span className="font-medium" data-testid="text-total-time">
                    {formatMinutes(summary.totalMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Abrechenbar
                  </span>
                  <span className="font-medium" data-testid="text-billable-time">
                    {formatMinutes(summary.billableMinutes)}
                  </span>
                </div>
                {summary.totalAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Betrag</span>
                    <span className="font-medium" data-testid="text-total-amount">
                      {formatCurrency(summary.totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {entriesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Zeiteinträge werden geladen...
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Zeiteinträge gefunden</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => openDialog()}
                data-testid="button-create-first-entry"
              >
                Ersten Zeiteintrag erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="hover-elevate"
                  data-testid={`card-time-entry-${entry.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" data-testid={`text-time-${entry.id}`}>
                            {formatMinutes(entry.minutes)}
                          </span>
                          {entry.isBillable && (
                            <Badge variant="outline" className="text-xs">
                              Abrechenbar
                            </Badge>
                          )}
                          {entry.ticket && (
                            <Badge variant="secondary" className="text-xs">
                              <Ticket className="w-3 h-3 mr-1" />
                              {entry.ticket.ticketNumber}
                            </Badge>
                          )}
                        </div>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {entry.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(entry.date), "dd.MM.yyyy", { locale: de })}
                          </span>
                          {entry.user && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {entry.user.firstName} {entry.user.lastName}
                            </span>
                          )}
                          {entry.hourlyRate && (
                            <span>
                              {formatCurrency(entry.hourlyRate)}/h
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(entry)}
                          data-testid={`button-edit-entry-${entry.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Zeiteintrag wirklich löschen?")) {
                              deleteMutation.mutate(entry.id);
                            }
                          }}
                          data-testid={`button-delete-entry-${entry.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Zeiteintrag bearbeiten" : "Zeit erfassen"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Bearbeiten Sie den Zeiteintrag."
                : "Erfassen Sie die Zeit für Ihre Arbeit."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zeit (Minuten)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="30"
                          data-testid="input-time-minutes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-time-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ticketId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-time-ticket">
                          <SelectValue placeholder="Kein Ticket zugeordnet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Kein Ticket</SelectItem>
                        {tickets.map((ticket) => (
                          <SelectItem key={ticket.id} value={ticket.id}>
                            {ticket.ticketNumber} - {ticket.title}
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
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Was haben Sie gemacht?"
                        data-testid="input-time-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isBillable"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-4">
                      <FormLabel>Abrechenbar</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-time-billable"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stundensatz (EUR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          placeholder="0.00"
                          data-testid="input-time-hourly-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-time-entry"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-time-entry"
                >
                  {editingEntry ? "Speichern" : "Erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}
