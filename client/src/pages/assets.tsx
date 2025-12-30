import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Box,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Monitor,
  HardDrive,
  FileText,
  Shield,
  Filter,
  History,
  Link2,
  User as UserIcon,
  Calendar,
  Tag,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssetWithRelations, AssetCategory, User, AssetHistory, Ticket } from "@shared/schema";

const assetFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  assetType: z.enum(["hardware", "software", "license", "contract"]),
  categoryId: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  warrantyExpiry: z.string().optional(),
  assignedToId: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "maintenance", "disposed", "expired"]).default("active"),
});

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  assetType: z.enum(["hardware", "software", "license", "contract"]),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

function AssetTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "hardware":
      return <Monitor className="h-4 w-4" />;
    case "software":
      return <HardDrive className="h-4 w-4" />;
    case "license":
      return <Shield className="h-4 w-4" />;
    case "contract":
      return <FileText className="h-4 w-4" />;
    default:
      return <Box className="h-4 w-4" />;
  }
}

function AssetTypeLabel({ type }: { type: string }) {
  switch (type) {
    case "hardware":
      return "Hardware";
    case "software":
      return "Software";
    case "license":
      return "Lizenz";
    case "contract":
      return "Vertrag";
    default:
      return type;
  }
}

function AssetStatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Aktiv", variant: "default" },
    inactive: { label: "Inaktiv", variant: "secondary" },
    maintenance: { label: "Wartung", variant: "outline" },
    disposed: { label: "Entsorgt", variant: "destructive" },
    expired: { label: "Abgelaufen", variant: "destructive" },
  };
  const config = statusConfig[status || "active"] || statusConfig.active;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AssetsPage() {
  const { toast } = useToast();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: assets = [], isLoading } = useQuery<AssetWithRelations[]>({
    queryKey: ["/api/assets", filterType, filterStatus, searchTerm],
  });

  const { data: categories = [] } = useQuery<AssetCategory[]>({
    queryKey: ["/api/asset-categories"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const selectedAsset = selectedAssetId
    ? assets.find((a) => a.id === selectedAssetId) || null
    : null;

  const { data: assetHistory = [] } = useQuery<(AssetHistory & { user?: User })[]>({
    queryKey: ["/api/assets", selectedAssetId, "history"],
    enabled: !!selectedAssetId,
  });

  const { data: assetTickets = [] } = useQuery<{ ticket?: Ticket }[]>({
    queryKey: ["/api/assets", selectedAssetId, "tickets"],
    enabled: !!selectedAssetId,
  });

  const assetForm = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      assetType: "hardware",
      status: "active",
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      assetType: "hardware",
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormValues) => {
      const response = await apiRequest("POST", "/api/assets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsAssetDialogOpen(false);
      assetForm.reset();
      toast({ title: "Erfolg", description: "Asset wurde erstellt" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Asset konnte nicht erstellt werden", variant: "destructive" });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AssetFormValues> }) => {
      const response = await apiRequest("PATCH", `/api/assets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsAssetDialogOpen(false);
      setEditingAsset(null);
      assetForm.reset();
      toast({ title: "Erfolg", description: "Asset wurde aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Asset konnte nicht aktualisiert werden", variant: "destructive" });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      if (selectedAssetId) setSelectedAssetId(null);
      toast({ title: "Erfolg", description: "Asset wurde gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Asset konnte nicht gelöscht werden", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/asset-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({ title: "Erfolg", description: "Kategorie wurde erstellt" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Kategorie konnte nicht erstellt werden", variant: "destructive" });
    },
  });

  const handleAssetSubmit = (data: AssetFormValues) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const handleEditAsset = (asset: AssetWithRelations) => {
    setEditingAsset(asset);
    assetForm.reset({
      name: asset.name,
      description: asset.description || "",
      assetType: asset.assetType,
      categoryId: asset.categoryId || undefined,
      manufacturer: asset.manufacturer || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate ? format(new Date(asset.purchaseDate), "yyyy-MM-dd") : "",
      purchasePrice: asset.purchasePrice || undefined,
      warrantyExpiry: asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), "yyyy-MM-dd") : "",
      assignedToId: asset.assignedToId || undefined,
      location: asset.location || "",
      notes: asset.notes || "",
      status: asset.status || "active",
    });
    setIsAssetDialogOpen(true);
  };

  const filteredAssets = assets.filter((asset) => {
    if (filterType && asset.assetType !== filterType) return false;
    if (filterStatus && asset.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        asset.name.toLowerCase().includes(search) ||
        asset.assetNumber.toLowerCase().includes(search) ||
        (asset.serialNumber?.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Asset-Management</h1>
            <p className="text-muted-foreground">Verwalten Sie Hardware, Software, Lizenzen und Verträge</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-category">
                  <Tag className="h-4 w-4 mr-2" />
                  Kategorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Kategorie erstellen</DialogTitle>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-category-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="assetType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset-Typ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category-type">
                                <SelectValue placeholder="Typ wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hardware">Hardware</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="license">Lizenz</SelectItem>
                              <SelectItem value="contract">Vertrag</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beschreibung</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-category-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button type="submit" disabled={createCategoryMutation.isPending} data-testid="button-submit-category">
                        Erstellen
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAssetDialogOpen} onOpenChange={(open) => {
              setIsAssetDialogOpen(open);
              if (!open) {
                setEditingAsset(null);
                assetForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-asset">
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAsset ? "Asset bearbeiten" : "Neues Asset erstellen"}</DialogTitle>
                </DialogHeader>
                <Form {...assetForm}>
                  <form onSubmit={assetForm.handleSubmit(handleAssetSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-asset-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="assetType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Typ *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-asset-type">
                                  <SelectValue placeholder="Typ wählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hardware">Hardware</SelectItem>
                                <SelectItem value="software">Software</SelectItem>
                                <SelectItem value="license">Lizenz</SelectItem>
                                <SelectItem value="contract">Vertrag</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-asset-status">
                                  <SelectValue placeholder="Status wählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Aktiv</SelectItem>
                                <SelectItem value="inactive">Inaktiv</SelectItem>
                                <SelectItem value="maintenance">Wartung</SelectItem>
                                <SelectItem value="disposed">Entsorgt</SelectItem>
                                <SelectItem value="expired">Abgelaufen</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategorie</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-asset-category">
                                  <SelectValue placeholder="Kategorie wählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
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
                      control={assetForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beschreibung</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-asset-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hersteller</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-asset-manufacturer" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modell</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-asset-model" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seriennummer</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-asset-serial" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Standort</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-asset-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kaufdatum</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-asset-purchase-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kaufpreis (EUR)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-asset-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="warrantyExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Garantie bis</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-asset-warranty" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="assignedToId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zugewiesen an</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-asset-assigned">
                                  <SelectValue placeholder="Person wählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users.map((user) => (
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
                      control={assetForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notizen</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-asset-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsAssetDialogOpen(false);
                        setEditingAsset(null);
                        assetForm.reset();
                      }}>
                        Abbrechen
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                        data-testid="button-submit-asset"
                      >
                        {editingAsset ? "Speichern" : "Erstellen"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Assets suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-assets"
            />
          </div>
          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="select-filter-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Alle Typen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="license">Lizenz</SelectItem>
              <SelectItem value="contract">Vertrag</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40" data-testid="select-filter-status">
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
              <SelectItem value="maintenance">Wartung</SelectItem>
              <SelectItem value="disposed">Entsorgt</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset-Nr.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zugewiesen an</TableHead>
                <TableHead>Standort</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Keine Assets gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className={`cursor-pointer hover-elevate ${selectedAssetId === asset.id ? "bg-accent" : ""}`}
                    onClick={() => setSelectedAssetId(asset.id)}
                    data-testid={`asset-row-${asset.id}`}
                  >
                    <TableCell className="font-mono text-sm">{asset.assetNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AssetTypeIcon type={asset.assetType} />
                        <span className="font-medium">{asset.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AssetTypeLabel type={asset.assetType} />
                    </TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell>
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{asset.location || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-asset-menu-${asset.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Möchten Sie dieses Asset wirklich löschen?")) {
                                deleteAssetMutation.mutate(asset.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {selectedAsset && (
        <div className="w-96 border-l bg-background p-6 overflow-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{selectedAsset.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{selectedAsset.assetNumber}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setSelectedAssetId(null)}>
              <span className="sr-only">Schließen</span>
              &times;
            </Button>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Verlauf</TabsTrigger>
              <TabsTrigger value="tickets" className="flex-1">Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Typ</p>
                  <div className="flex items-center gap-2">
                    <AssetTypeIcon type={selectedAsset.assetType} />
                    <AssetTypeLabel type={selectedAsset.assetType} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <AssetStatusBadge status={selectedAsset.status} />
                </div>
              </div>

              {selectedAsset.category && (
                <div>
                  <p className="text-sm text-muted-foreground">Kategorie</p>
                  <p>{selectedAsset.category.name}</p>
                </div>
              )}

              {selectedAsset.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Beschreibung</p>
                  <p>{selectedAsset.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedAsset.manufacturer && (
                  <div>
                    <p className="text-sm text-muted-foreground">Hersteller</p>
                    <p>{selectedAsset.manufacturer}</p>
                  </div>
                )}
                {selectedAsset.model && (
                  <div>
                    <p className="text-sm text-muted-foreground">Modell</p>
                    <p>{selectedAsset.model}</p>
                  </div>
                )}
              </div>

              {selectedAsset.serialNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Seriennummer</p>
                  <p className="font-mono">{selectedAsset.serialNumber}</p>
                </div>
              )}

              {selectedAsset.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Standort</p>
                  <p>{selectedAsset.location}</p>
                </div>
              )}

              {selectedAsset.assignedTo && (
                <div>
                  <p className="text-sm text-muted-foreground">Zugewiesen an</p>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {selectedAsset.assignedTo.firstName} {selectedAsset.assignedTo.lastName}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedAsset.purchaseDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kaufdatum</p>
                    <p>{format(new Date(selectedAsset.purchaseDate), "dd.MM.yyyy", { locale: de })}</p>
                  </div>
                )}
                {selectedAsset.purchasePrice && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kaufpreis</p>
                    <p>{selectedAsset.purchasePrice.toLocaleString("de-DE")} EUR</p>
                  </div>
                )}
              </div>

              {selectedAsset.warrantyExpiry && (
                <div>
                  <p className="text-sm text-muted-foreground">Garantie bis</p>
                  <p>{format(new Date(selectedAsset.warrantyExpiry), "dd.MM.yyyy", { locale: de })}</p>
                </div>
              )}

              {selectedAsset.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notizen</p>
                  <p className="whitespace-pre-wrap">{selectedAsset.notes}</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleEditAsset(selectedAsset)}
                data-testid="button-edit-selected-asset"
              >
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {assetHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Kein Verlauf vorhanden</p>
              ) : (
                <div className="space-y-3">
                  {assetHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                      <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "System"} -{" "}
                          {entry.createdAt && format(new Date(entry.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tickets" className="mt-4">
              {assetTickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Keine verknüpften Tickets</p>
              ) : (
                <div className="space-y-3">
                  {assetTickets.map((link, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                      <Link2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{link.ticket?.title || "Unbekanntes Ticket"}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {link.ticket?.ticketNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
