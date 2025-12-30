import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, MoreHorizontal, Loader2, Building2, MapPin, Users, Phone, Mail, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import type { CustomerWithRelations, Organization, User } from "@shared/schema";
import { Link } from "wouter";

const customerFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  organizationId: z.string().optional(),
  accountManagerId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Niedrig", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300" },
  medium: { label: "Mittel", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  high: { label: "Hoch", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  urgent: { label: "Dringend", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

function NoCustomersEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Keine Kunden vorhanden</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Erstellen Sie Ihren ersten Kunden, um loszulegen.
      </p>
    </div>
  );
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithRelations | null>(null);

  const { data: customers, isLoading } = useQuery<CustomerWithRelations[]>({
    queryKey: ["/api/customers"],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Deutschland",
      organizationId: "",
      accountManagerId: "",
      priority: "medium",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const cleanData = {
        ...data,
        email: data.email || null,
        organizationId: data.organizationId || null,
        accountManagerId: data.accountManagerId || null,
      };
      return apiRequest("POST", "/api/customers", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Kunde erstellt" });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
      const cleanData = {
        ...data,
        email: data.email || null,
        organizationId: data.organizationId || null,
        accountManagerId: data.accountManagerId || null,
      };
      return apiRequest("PATCH", `/api/customers/${id}`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Kunde aktualisiert" });
      setEditingCustomer(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Kunde gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (customer: CustomerWithRelations) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      postalCode: customer.postalCode || "",
      country: customer.country || "Deutschland",
      organizationId: customer.organizationId || "",
      accountManagerId: customer.accountManagerId || "",
      priority: customer.priority || "medium",
      notes: customer.notes || "",
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  const filteredCustomers = customers?.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.customerNumber.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query)
    );
  });

  const agents = users?.filter(u => u.role === "agent" || u.role === "admin");

  return (
    <MainLayout title="Kunden">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kunden suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-customer">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : !filteredCustomers?.length ? (
              <NoCustomersEmpty />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kundennummer</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Priorität</TableHead>
                    <TableHead>Kundenbetreuer</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {customer.customerNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                            {customer.name}
                          </Link>
                          {customer.city && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {customer.city}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.organization ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.organization.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {customer.email && (
                            <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:underline">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </a>
                          )}
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:underline">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </a>
                          )}
                          {!customer.email && !customer.phone && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.priority && (
                          <Badge className={priorityConfig[customer.priority]?.color}>
                            {priorityConfig[customer.priority]?.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.accountManager ? (
                          <span>{customer.accountManager.firstName} {customer.accountManager.lastName}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-customer-actions-${customer.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}`} className="flex items-center gap-2 cursor-pointer">
                                <ExternalLink className="h-4 w-4" />
                                Details anzeigen
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(customer.id)}
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

      <Dialog open={showCreateDialog || !!editingCustomer} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingCustomer(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Bearbeiten Sie die Kundeninformationen." : "Erstellen Sie einen neuen Kunden."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Kundenname" data-testid="input-customer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="kunde@beispiel.de" data-testid="input-customer-email" />
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
                        <Input {...field} placeholder="+49 123 456789" data-testid="input-customer-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Straße und Hausnummer" data-testid="input-customer-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" data-testid="input-customer-postal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stadt</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Berlin" data-testid="input-customer-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Deutschland" data-testid="input-customer-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer-organization">
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

                <FormField
                  control={form.control}
                  name="accountManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kundenbetreuer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer-manager">
                            <SelectValue placeholder="Betreuer wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Kein Betreuer</SelectItem>
                          {agents?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard-Priorität</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-priority">
                          <SelectValue placeholder="Priorität wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="urgent">Dringend</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                      <Textarea {...field} placeholder="Interne Notizen zum Kunden..." data-testid="input-customer-notes" />
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
                    setEditingCustomer(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-customer"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingCustomer ? "Speichern" : "Erstellen"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
