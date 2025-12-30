import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Search, MoreHorizontal, Mail, Phone, Globe, MapPin, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/LoadingState";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Organization } from "@shared/schema";

const organizationFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  legalName: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

function NoOrganizationsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Keine Organisationen vorhanden</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Erstellen Sie Ihre erste Organisation, um loszulegen.
      </p>
    </div>
  );
}

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      legalName: "",
      industry: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Deutschland",
      notes: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      return apiRequest("POST", "/api/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Organisation erstellt" });
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrganizationFormData> }) => {
      return apiRequest("PATCH", `/api/organizations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setEditingOrg(null);
      form.reset();
      toast({ title: "Organisation aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({ title: "Organisation gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const filteredOrganizations = organizations?.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.reset({
      name: org.name,
      legalName: org.legalName || "",
      industry: org.industry || "",
      website: org.website || "",
      email: org.email || "",
      phone: org.phone || "",
      address: org.address || "",
      city: org.city || "",
      postalCode: org.postalCode || "",
      country: org.country || "Deutschland",
      notes: org.notes || "",
      isActive: org.isActive ?? true,
    });
  };

  const handleSubmit = (data: OrganizationFormData) => {
    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    form.reset();
    setEditingOrg(null);
    setShowCreateDialog(false);
  };

  return (
    <MainLayout
      title="Organisationen"
      actions={
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-organization">
          <Plus className="w-4 h-4 mr-2" />
          Neue Organisation
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Organisationen suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-organizations"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : !filteredOrganizations?.length ? (
              <NoOrganizationsEmpty />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Branche</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Standort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id} data-testid={`row-organization-${org.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            {org.legalName && (
                              <div className="text-sm text-muted-foreground">{org.legalName}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.industry ? (
                          <span className="text-sm">{org.industry}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {org.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[180px]">{org.email}</span>
                            </div>
                          )}
                          {org.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{org.phone}</span>
                            </div>
                          )}
                          {!org.email && !org.phone && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.city || org.country ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{[org.city, org.country].filter(Boolean).join(", ")}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-org-${org.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(org)} data-testid={`menu-edit-org-${org.id}`}>
                              Bearbeiten
                            </DropdownMenuItem>
                            {org.website && (
                              <DropdownMenuItem asChild>
                                <a href={org.website} target="_blank" rel="noopener noreferrer">
                                  <Globe className="w-4 h-4 mr-2" />
                                  Website öffnen
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Organisation wirklich löschen?")) {
                                  deleteMutation.mutate(org.id);
                                }
                              }}
                              data-testid={`menu-delete-org-${org.id}`}
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

      <Dialog open={showCreateDialog || !!editingOrg} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? "Organisation bearbeiten" : "Neue Organisation"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Beispiel GmbH" data-testid="input-org-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rechtlicher Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Beispiel GmbH & Co. KG" data-testid="input-org-legal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branche</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="IT, Handel, Produktion..." data-testid="input-org-industry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="info@beispiel.de" data-testid="input-org-email" />
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
                        <Input {...field} placeholder="+49 123 456789" data-testid="input-org-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://beispiel.de" data-testid="input-org-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Musterstraße 1" data-testid="input-org-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" data-testid="input-org-postal" />
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
                        <Input {...field} placeholder="Berlin" data-testid="input-org-city" />
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
                        <Input {...field} placeholder="Deutschland" data-testid="input-org-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Interne Notizen..." data-testid="input-org-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Aktiv</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inaktive Organisationen werden ausgeblendet
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-org-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  data-testid="button-cancel"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-organization"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingOrg ? "Speichern" : "Erstellen"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
