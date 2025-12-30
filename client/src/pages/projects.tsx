import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Kanban, Users, Ticket, Folder, Trash2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { ProjectWithRelations } from "@shared/schema";

const projectFormSchema = z.object({
  name: z.string().min(1, "Projektname ist erforderlich"),
  key: z.string().min(1, "Kürzel ist erforderlich").max(10, "Kürzel darf max. 10 Zeichen haben"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

function ProjectStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    active: { label: "Aktiv", variant: "default" },
    on_hold: { label: "Pausiert", variant: "secondary" },
    completed: { label: "Abgeschlossen", variant: "outline" },
    archived: { label: "Archiviert", variant: "destructive" },
  };

  const config = statusConfig[status] || statusConfig.active;
  return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
}

function CreateProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      color: "#3B82F6",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      toast({ title: "Projekt erstellt", description: "Das Projekt wurde erfolgreich erstellt." });
      form.reset();
      setOpen(false);
      onCreated();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Projekt konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-project">
          <Plus className="w-4 h-4 mr-2" />
          Neues Projekt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Projekt erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Projekt für Ihre Tickets.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projektname</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Website Relaunch" {...field} data-testid="input-project-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projektkürzel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. WEB"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-project-key"
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
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Projektbeschreibung..." {...field} data-testid="input-project-description" />
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
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        {...field}
                        className="w-12 h-9 p-1 cursor-pointer"
                        data-testid="input-project-color"
                      />
                      <Input value={field.value} onChange={field.onChange} className="flex-1" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-project">
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-project">
                {createMutation.isPending ? "Wird erstellt..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: projects, isLoading, refetch } = useQuery<ProjectWithRelations[]>({
    queryKey: ["/api/projects"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Projekt gelöscht", description: "Das Projekt wurde erfolgreich gelöscht." });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Projekt konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const isAdmin = user?.role === "admin";

  return (
    <MainLayout
      title="Projekte"
      actions={isAdmin ? <CreateProjectDialog onCreated={() => refetch()} /> : undefined}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Projekte vorhanden</h3>
              <p className="text-muted-foreground text-center mb-4">
                Erstellen Sie Ihr erstes Projekt, um Tickets zu organisieren.
              </p>
              {isAdmin && <CreateProjectDialog onCreated={() => refetch()} />}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <Card
                key={project.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => setLocation(`/projects/${project.id}`)}
                data-testid={`card-project-${project.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: project.color || "#3B82F6" }}
                      >
                        <Kanban className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <CardDescription className="text-xs">{project.key}</CardDescription>
                      </div>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" data-testid={`button-project-menu-${project.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/projects/${project.id}`);
                            }}
                            data-testid={`menu-view-${project.id}`}
                          >
                            <Kanban className="w-4 h-4 mr-2" />
                            Board öffnen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Möchten Sie dieses Projekt wirklich löschen?")) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                            data-testid={`menu-delete-${project.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      <span>{project.ticketCount || 0} Tickets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{project.members?.length || 0} Mitglieder</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProjectStatusBadge status={project.status || "active"} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
