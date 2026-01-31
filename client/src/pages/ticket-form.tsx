import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Paperclip, X } from "lucide-react";
import { z } from "zod";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipTapEditor } from "@/components/TipTapEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/LoadingState";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketType, TicketWithRelations, User, Area } from "@shared/schema";

const ticketFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200, "Titel darf maximal 200 Zeichen lang sein"),
  description: z.string().optional(),
  ticketTypeId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]).default("open"),
  dueDate: z.date().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  areaIds: z.array(z.string()).optional(),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

export default function TicketFormPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!params.id;

  const { data: existingTicket, isLoading: ticketLoading } = useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets", params.id],
    enabled: isEditing,
  });

  const { data: ticketTypes } = useQuery<TicketType[]>({
    queryKey: ["/api/ticket-types"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: areas } = useQuery<Area[]>({
    queryKey: ["/api/areas"],
  });

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      ticketTypeId: "",
      priority: "medium",
      status: "open",
      dueDate: null,
      assigneeIds: [],
      areaIds: [],
    },
  });

  useEffect(() => {
    if (existingTicket) {
      form.reset({
        title: existingTicket.title,
        description: existingTicket.description || "",
        ticketTypeId: existingTicket.ticketTypeId || "",
        priority: existingTicket.priority || "medium",
        status: existingTicket.status || "open",
        dueDate: existingTicket.dueDate ? new Date(existingTicket.dueDate) : null,
        assigneeIds: existingTicket.assignees?.map((a) => a.userId || "") || [],
        areaIds: existingTicket.areas?.map((a) => a.areaId || "") || [],
      });
    }
  }, [existingTicket, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket erstellt" });
      setLocation("/tickets");
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return apiRequest("PATCH", `/api/tickets/${params.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket aktualisiert" });
      setLocation(`/tickets/${params.id}`);
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && ticketLoading) {
    return (
      <MainLayout title="Ticket laden...">
        <LoadingPage />
      </MainLayout>
    );
  }

  const priorityOptions = [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
    { value: "urgent", label: "Dringend" },
  ];

  const statusOptions = [
    { value: "open", label: "Offen" },
    { value: "in_progress", label: "In Bearbeitung" },
    { value: "waiting", label: "Wartend" },
    { value: "resolved", label: "Gelöst" },
    { value: "closed", label: "Geschlossen" },
  ];

  return (
    <MainLayout title="">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(isEditing ? `/tickets/${params.id}` : "/tickets")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {isEditing ? "Ticket bearbeiten" : "Neues Ticket erstellen"}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grunddaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Kurze Beschreibung des Problems"
                          data-testid="input-title"
                          {...field}
                        />
                      </FormControl>
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
                        <TipTapEditor
                          content={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Detaillierte Beschreibung des Problems oder der Anfrage..."
                          minHeight="200px"
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ticketTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket-Typ</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Typ auswählen" />
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
                        <FormLabel>Priorität</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
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
                </div>

                {isEditing && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((option) => (
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
                )}

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fälligkeitsdatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-due-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: de })
                              ) : (
                                "Datum auswählen"
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            locale={de}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zuweisung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Bereiche</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {areas?.map((area) => {
                      const isSelected = form.watch("areaIds")?.includes(area.id);
                      return (
                        <Button
                          key={area.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const current = form.getValues("areaIds") || [];
                            if (isSelected) {
                              form.setValue("areaIds", current.filter((id) => id !== area.id));
                            } else {
                              form.setValue("areaIds", [...current, area.id]);
                            }
                          }}
                          data-testid={`button-area-${area.id}`}
                        >
                          {area.name}
                        </Button>
                      );
                    })}
                    {!areas?.length && (
                      <p className="text-sm text-muted-foreground">Keine Bereiche verfügbar</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Bearbeiter</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {users?.filter((u) => u.role === "agent" || u.role === "admin").map((user) => {
                      const isSelected = form.watch("assigneeIds")?.includes(user.id);
                      return (
                        <Button
                          key={user.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const current = form.getValues("assigneeIds") || [];
                            if (isSelected) {
                              form.setValue("assigneeIds", current.filter((id) => id !== user.id));
                            } else {
                              form.setValue("assigneeIds", [...current, user.id]);
                            }
                          }}
                          data-testid={`button-assignee-${user.id}`}
                        >
                          {user.firstName} {user.lastName}
                        </Button>
                      );
                    })}
                    {!users?.filter((u) => u.role === "agent" || u.role === "admin").length && (
                      <p className="text-sm text-muted-foreground">Keine Bearbeiter verfügbar</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anhänge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Paperclip className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Dateien hier ablegen oder klicken zum Hochladen
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max. 10 MB pro Datei
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(isEditing ? `/tickets/${params.id}` : "/tickets")}
                data-testid="button-cancel"
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? "Wird gespeichert..." : "Wird erstellt..."}
                  </>
                ) : isEditing ? (
                  "Speichern"
                ) : (
                  "Ticket erstellen"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
