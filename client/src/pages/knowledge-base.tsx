import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  BookOpen,
  FolderOpen,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  User,
} from "lucide-react";
import type { KbCategory, KbArticle, KbArticleWithRelations } from "@shared/schema";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  slug: z.string().min(1, "Slug ist erforderlich"),
  isPublic: z.boolean().default(true),
  order: z.number().default(0),
});

const articleFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  content: z.string().min(1, "Inhalt ist erforderlich"),
  summary: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;
type ArticleFormData = z.infer<typeof articleFormSchema>;

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    draft: { label: "Entwurf", variant: "secondary" },
    published: { label: "Veröffentlicht", variant: "default" },
    archived: { label: "Archiviert", variant: "outline" },
  };
  const config = statusMap[status] || statusMap.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function KnowledgeBase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KbCategory | null>(null);
  const [editingArticle, setEditingArticle] = useState<KbArticleWithRelations | null>(null);
  const [viewingArticle, setViewingArticle] = useState<KbArticleWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState("articles");
  
  const isAgent = user?.role === "agent" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<KbCategory[]>({
    queryKey: ["/api/kb/categories"],
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery<KbArticleWithRelations[]>({
    queryKey: ["/api/kb/articles", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      const response = await fetch(`/api/kb/articles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Fehler beim Laden der Artikel");
      return response.json();
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      isPublic: true,
      order: 0,
    },
  });

  const articleForm = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      categoryId: "",
      status: "draft",
      isPublic: true,
      tags: [],
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return apiRequest("POST", "/api/kb/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kb/categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({ title: "Kategorie erstellt", description: "Die Kategorie wurde erfolgreich erstellt." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Kategorie konnte nicht erstellt werden.", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      return apiRequest("PATCH", `/api/kb/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kb/categories"] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({ title: "Kategorie aktualisiert", description: "Die Kategorie wurde erfolgreich aktualisiert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Kategorie konnte nicht aktualisiert werden.", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/kb/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kb/categories"] });
      toast({ title: "Kategorie gelöscht", description: "Die Kategorie wurde erfolgreich gelöscht." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Kategorie konnte nicht gelöscht werden.", variant: "destructive" });
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      return apiRequest("POST", "/api/kb/articles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kb/articles"] });
      setArticleDialogOpen(false);
      setEditingArticle(null);
      articleForm.reset();
      toast({ title: "Artikel erstellt", description: "Der Artikel wurde erfolgreich erstellt." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Artikel konnte nicht erstellt werden.", variant: "destructive" });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ArticleFormData> }) => {
      return apiRequest("PATCH", `/api/kb/articles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kb/articles"] });
      setArticleDialogOpen(false);
      setEditingArticle(null);
      articleForm.reset();
      toast({ title: "Artikel aktualisiert", description: "Der Artikel wurde erfolgreich aktualisiert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Artikel konnte nicht aktualisiert werden.", variant: "destructive" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/kb/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kb/articles"] });
      toast({ title: "Artikel gelöscht", description: "Der Artikel wurde erfolgreich gelöscht." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Artikel konnte nicht gelöscht werden.", variant: "destructive" });
    },
  });

  const handleCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleArticleSubmit = (data: ArticleFormData) => {
    if (editingArticle) {
      updateArticleMutation.mutate({ id: editingArticle.id, data });
    } else {
      createArticleMutation.mutate(data);
    }
  };

  const openCategoryDialog = (category?: KbCategory) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        description: category.description || "",
        slug: category.slug,
        isPublic: category.isPublic ?? true,
        order: category.order || 0,
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset({
        name: "",
        description: "",
        slug: "",
        isPublic: true,
        order: 0,
      });
    }
    setCategoryDialogOpen(true);
  };

  const openArticleDialog = (article?: KbArticleWithRelations) => {
    if (article) {
      setEditingArticle(article);
      articleForm.reset({
        title: article.title,
        content: article.content,
        summary: article.summary || "",
        categoryId: article.categoryId || "",
        status: (article.status as "draft" | "published" | "archived") || "draft",
        isPublic: article.isPublic ?? true,
        tags: article.tags || [],
      });
    } else {
      setEditingArticle(null);
      articleForm.reset({
        title: "",
        content: "",
        summary: "",
        categoryId: selectedCategory || "",
        status: "draft",
        isPublic: true,
        tags: [],
      });
    }
    setArticleDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äÄ]/g, "ae")
      .replace(/[öÖ]/g, "oe")
      .replace(/[üÜ]/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Wissensdatenbank</h1>
          <p className="text-muted-foreground">
            Artikel und Dokumentation verwalten
          </p>
        </div>
        {isAgent && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => openCategoryDialog()}
              data-testid="button-new-category"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Neue Kategorie
            </Button>
            <Button
              onClick={() => openArticleDialog()}
              data-testid="button-new-article"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neuer Artikel
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r p-4 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Artikel suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-articles"
            />
          </div>
          
          <div className="flex-1 overflow-auto">
            <h3 className="text-sm font-medium mb-2">Kategorien</h3>
            <div className="space-y-1">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
                data-testid="button-category-all"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Alle Artikel
              </Button>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-1">
                  <Button
                    variant={selectedCategory === category.id ? "secondary" : "ghost"}
                    className="flex-1 justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                    data-testid={`button-category-${category.id}`}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {category.name}
                  </Button>
                  {isAgent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCategoryDialog(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {articlesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Artikel werden geladen...
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Artikel gefunden</p>
              {isAgent && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => openArticleDialog()}
                  data-testid="button-create-first-article"
                >
                  Ersten Artikel erstellen
                </Button>
              )}
            </div>
          ) : viewingArticle ? (
            <div className="max-w-3xl mx-auto">
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setViewingArticle(null)}
                data-testid="button-back-to-list"
              >
                Zurück zur Liste
              </Button>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{viewingArticle.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {viewingArticle.summary}
                      </CardDescription>
                    </div>
                    <StatusBadge status={viewingArticle.status || "draft"} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {viewingArticle.author?.firstName} {viewingArticle.author?.lastName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(viewingArticle.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {viewingArticle.viewCount} Aufrufe
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    {viewingArticle.content}
                  </div>
                  {isAgent && (
                    <div className="flex items-center gap-2 mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setViewingArticle(null);
                          openArticleDialog(viewingArticle);
                        }}
                        data-testid="button-edit-viewed-article"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Bearbeiten
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setViewingArticle(article)}
                  data-testid={`card-article-${article.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        {article.summary && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {article.summary}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={article.status || "draft"} />
                        {isAgent && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openArticleDialog(article);
                              }}
                              data-testid={`button-edit-article-${article.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteArticleMutation.mutate(article.id);
                                }}
                                data-testid={`button-delete-article-${article.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {article.category && (
                        <Badge variant="outline">{article.category.name}</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(article.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {article.viewCount} Aufrufe
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Kategorie bearbeiten" : "Neue Kategorie"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Bearbeiten Sie die Kategorie-Details."
                : "Erstellen Sie eine neue Kategorie für Artikel."}
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="z.B. Erste Schritte"
                        onChange={(e) => {
                          field.onChange(e);
                          if (!editingCategory) {
                            categoryForm.setValue("slug", generateSlug(e.target.value));
                          }
                        }}
                        data-testid="input-category-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="erste-schritte"
                        data-testid="input-category-slug"
                      />
                    </FormControl>
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
                      <Textarea
                        {...field}
                        placeholder="Beschreibung der Kategorie..."
                        data-testid="input-category-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div>
                      <FormLabel>Öffentlich</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Für Kunden sichtbar
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-category-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(false)}
                  data-testid="button-cancel-category"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  data-testid="button-save-category"
                >
                  {editingCategory ? "Speichern" : "Erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Artikel bearbeiten" : "Neuer Artikel"}
            </DialogTitle>
            <DialogDescription>
              {editingArticle
                ? "Bearbeiten Sie den Artikel. Änderungen werden als neue Version gespeichert."
                : "Erstellen Sie einen neuen Wissensdatenbank-Artikel."}
            </DialogDescription>
          </DialogHeader>
          <Form {...articleForm}>
            <form onSubmit={articleForm.handleSubmit(handleArticleSubmit)} className="space-y-4">
              <FormField
                control={articleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Artikel-Titel"
                        data-testid="input-article-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={articleForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zusammenfassung</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Kurze Beschreibung des Artikels"
                        data-testid="input-article-summary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={articleForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-article-category">
                          <SelectValue placeholder="Kategorie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Keine Kategorie</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={articleForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inhalt</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Artikel-Inhalt..."
                        className="min-h-[200px]"
                        data-testid="input-article-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <FormField
                  control={articleForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-article-status">
                            <SelectValue placeholder="Status wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Entwurf</SelectItem>
                          <SelectItem value="published">Veröffentlicht</SelectItem>
                          <SelectItem value="archived">Archiviert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={articleForm.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-4 pt-6">
                      <FormLabel>Öffentlich</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-article-public"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setArticleDialogOpen(false)}
                  data-testid="button-cancel-article"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                  data-testid="button-save-article"
                >
                  {editingArticle ? "Speichern" : "Erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
