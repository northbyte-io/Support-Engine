import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, MoreHorizontal, Loader2, User, Mail, Phone, Building2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/LoadingState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContactWithRelations, CustomerWithRelations, Organization } from "@shared/schema";

const contactFormSchema = z.object({
  salutation: z.string().optional(),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  customerId: z.string().optional(),
  organizationId: z.string().optional(),
  role: z.enum(["primary", "secondary", "technical", "billing", "decision_maker"]).optional(),
  communicationPreference: z.string().optional(),
  emailConsent: z.boolean().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const roleConfig: Record<string, { label: string; color: string }> = {
  primary: { label: "Hauptkontakt", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  secondary: { label: "Nebenkontakt", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" },
  technical: { label: "Technisch", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  billing: { label: "Buchhaltung", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  decision_maker: { label: "Entscheider", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

function NoContactsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <User className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Keine Kontakte vorhanden</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Erstellen Sie Ihren ersten Kontakt, um loszulegen.
      </p>
    </div>
  );
}

export default function ContactsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithRelations | null>(null);

  const { data: contacts, isLoading } = useQuery<ContactWithRelations[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: customers } = useQuery<CustomerWithRelations[]>({
    queryKey: ["/api/customers"],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      salutation: "",
      firstName: "",
      lastName: "",
      title: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      customerId: "",
      organizationId: "",
      role: "secondary",
      communicationPreference: "email",
      emailConsent: false,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const cleanData = {
        ...data,
        email: data.email || null,
        customerId: data.customerId || null,
        organizationId: data.organizationId || null,
      };
      return apiRequest("POST", "/api/contacts", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Kontakt erstellt" });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContactFormData> }) => {
      const cleanData = {
        ...data,
        email: data.email || null,
        customerId: data.customerId || null,
        organizationId: data.organizationId || null,
      };
      return apiRequest("PATCH", `/api/contacts/${id}`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Kontakt aktualisiert" });
      setEditingContact(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Kontakt gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (contact: ContactWithRelations) => {
    setEditingContact(contact);
    form.reset({
      salutation: contact.salutation || "",
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title || "",
      department: contact.department || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      customerId: contact.customerId || "",
      organizationId: contact.organizationId || "",
      role: contact.role || "secondary",
      communicationPreference: contact.communicationPreference || "email",
      emailConsent: contact.emailConsent || false,
      notes: contact.notes || "",
    });
  };

  const filteredContacts = contacts?.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.customer?.name?.toLowerCase().includes(query) ||
      contact.organization?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout title="Kontakte">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kontakte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-contacts"
            />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-contact">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kontakt
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : !filteredContacts?.length ? (
              <NoContactsEmpty />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {contact.salutation && `${contact.salutation} `}
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.title && (
                            <span className="text-sm text-muted-foreground">{contact.title}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {contact.customer && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {contact.customer.name}
                            </span>
                          )}
                          {contact.organization && !contact.customer && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {contact.organization.name}
                            </span>
                          )}
                          {!contact.customer && !contact.organization && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:underline">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:underline">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </a>
                          )}
                          {!contact.email && !contact.phone && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.role && (
                          <Badge className={roleConfig[contact.role]?.color}>
                            {roleConfig[contact.role]?.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {contact.department || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-contact-actions-${contact.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(contact.id)}
                            >
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog || !!editingContact} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingContact(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Kontakt bearbeiten" : "Neuer Kontakt"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Bearbeiten Sie die Kontaktinformationen." : "Erstellen Sie einen neuen Kontakt."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="salutation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anrede</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-salutation">
                            <SelectValue placeholder="Anrede" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Herr">Herr</SelectItem>
                          <SelectItem value="Frau">Frau</SelectItem>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Vorname *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Max" data-testid="input-contact-firstname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nachname *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mustermann" data-testid="input-contact-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Geschäftsführer" data-testid="input-contact-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abteilung</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="IT" data-testid="input-contact-department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="max@beispiel.de" data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+49 123 456789" data-testid="input-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobil</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+49 171 123456" data-testid="input-contact-mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kunde</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-customer">
                            <SelectValue placeholder="Kunde wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Kein Kunde</SelectItem>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
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
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-organization">
                            <SelectValue placeholder="Organisation wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Keine Organisation</SelectItem>
                          {organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kontaktrolle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contact-role">
                          <SelectValue placeholder="Rolle wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Hauptkontakt</SelectItem>
                        <SelectItem value="secondary">Nebenkontakt</SelectItem>
                        <SelectItem value="technical">Technisch</SelectItem>
                        <SelectItem value="billing">Buchhaltung</SelectItem>
                        <SelectItem value="decision_maker">Entscheider</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-contact-consent"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>E-Mail-Einwilligung</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Der Kontakt hat zugestimmt, E-Mails zu erhalten.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Interne Notizen zum Kontakt..." data-testid="input-contact-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingContact(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-contact"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-contact"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingContact ? "Speichern" : "Erstellen"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
