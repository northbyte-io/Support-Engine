import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MoreHorizontal, Loader2, FolderKanban, Pencil, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Area } from "@shared/schema";

const areaFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  color: z.string().default("#6B7280"),
});

type AreaFormData = z.infer<typeof areaFormSchema>;

const colorOptions = [
  { value: "#EF4444", label: "Rot" },
  { value: "#F97316", label: "Orange" },
  { value: "#EAB308", label: "Gelb" },
  { value: "#22C55E", label: "Grün" },
  { value: "#3B82F6", label: "Blau" },
  { value: "#8B5CF6", label: "Violett" },
  { value: "#EC4899", label: "Pink" },
  { value: "#6B7280", label: "Grau" },
];

export default function AreasPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const { data: areas, isLoading } = useQuery<Area[]>({
    queryKey: ["/api/areas"],
  });

  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6B7280",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AreaFormData) => {
      return apiRequest("POST", "/api/areas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      toast({ title: "Bereich erstellt" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AreaFormData }) => {
      return apiRequest("PATCH", `/api/areas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      toast({ title: "Bereich aktualisiert" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/areas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      toast({ title: "Bereich gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingArea(null);
    form.reset({ name: "", description: "", color: "#6B7280" });
    setShowDialog(true);
  };

  const openEditDialog = (area: Area) => {
    setEditingArea(area);
    form.reset({
      name: area.name,
      description: area.description || "",
      color: area.color || "#6B7280",
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingArea(null);
    form.reset();
  };

  const onSubmit = (data: AreaFormData) => {
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <MainLayout title="Bereiche">
        <LoadingPage />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Bereiche"
      actions={
        <Button onClick={openCreateDialog} data-testid="button-new-area">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Bereich
        </Button>
      }
    >
      {!areas || areas.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Keine Bereiche vorhanden"
          description="Erstellen Sie Ihren ersten Bereich, um Tickets zu organisieren."
          action={{
            label: "Bereich erstellen",
            onClick: openCreateDialog,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="hover-elevate" data-testid={`area-card-${area.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: area.color || "#6B7280" }}
                  />
                  <CardTitle className="text-lg">{area.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-area-menu-${area.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(area)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(area.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {area.description || "Keine Beschreibung vorhanden"}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingArea ? "Bereich bearbeiten" : "Neuen Bereich erstellen"}
            </DialogTitle>
            <DialogDescription>
              Bereiche helfen Ihnen, Tickets zu organisieren und zuzuweisen.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. IT-Support, Buchhaltung"
                        data-testid="input-area-name"
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
                      <Textarea
                        placeholder="Optionale Beschreibung des Bereichs..."
                        data-testid="input-area-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farbe</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            field.value === color.value
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => field.onChange(color.value)}
                          title={color.label}
                          data-testid={`color-${color.value}`}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingArea ? "Wird gespeichert..." : "Wird erstellt..."}
                    </>
                  ) : editingArea ? (
                    "Speichern"
                  ) : (
                    "Erstellen"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
