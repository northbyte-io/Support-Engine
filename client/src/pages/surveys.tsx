import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, BarChart3, Settings, Trash2, Edit, ClipboardList, Star, MessageSquare, List, ChevronRight, Eye } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Form,
  FormControl,
  FormDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SurveyWithRelations, SurveyResultSummary, SurveyQuestion } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const surveyFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  triggerOnClose: z.boolean().default(true),
  delayMinutes: z.coerce.number().min(0).default(0),
});

const questionFormSchema = z.object({
  questionText: z.string().min(1, "Frage ist erforderlich"),
  questionType: z.enum(["rating", "text", "choice", "nps"]),
  options: z.string().optional(),
  isRequired: z.boolean().default(true),
  order: z.coerce.number().min(0).default(0),
});

type SurveyFormValues = z.infer<typeof surveyFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;

function QuestionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "rating":
      return <Star className="h-4 w-4" />;
    case "text":
      return <MessageSquare className="h-4 w-4" />;
    case "choice":
      return <List className="h-4 w-4" />;
    case "nps":
      return <BarChart3 className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
}

function QuestionTypeLabel({ type }: { type: string }) {
  switch (type) {
    case "rating":
      return "Bewertung (1-5)";
    case "text":
      return "Freitext";
    case "choice":
      return "Auswahl";
    case "nps":
      return "NPS (0-10)";
    default:
      return type;
  }
}

export default function SurveysPage() {
  const { toast } = useToast();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [isSurveyDialogOpen, setIsSurveyDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<SurveyWithRelations | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);

  const { data: surveys = [], isLoading } = useQuery<SurveyWithRelations[]>({
    queryKey: ["/api/surveys"],
  });

  const selectedSurvey = selectedSurveyId 
    ? surveys.find(s => s.id === selectedSurveyId) || null 
    : null;

  const { data: surveyResults } = useQuery<SurveyResultSummary>({
    queryKey: ["/api/surveys", selectedSurveyId, "results"],
    enabled: !!selectedSurveyId,
  });

  const surveyForm = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      triggerOnClose: true,
      delayMinutes: 0,
    },
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      questionType: "rating",
      options: "",
      isRequired: true,
      order: 0,
    },
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (data: SurveyFormValues) => {
      const response = await apiRequest("POST", "/api/surveys", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsSurveyDialogOpen(false);
      surveyForm.reset();
      toast({ title: "Erfolg", description: "Umfrage wurde erstellt" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Umfrage konnte nicht erstellt werden", variant: "destructive" });
    },
  });

  const updateSurveyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SurveyFormValues> }) => {
      const response = await apiRequest("PATCH", `/api/surveys/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsSurveyDialogOpen(false);
      setEditingSurvey(null);
      surveyForm.reset();
      toast({ title: "Erfolg", description: "Umfrage wurde aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Umfrage konnte nicht aktualisiert werden", variant: "destructive" });
    },
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      if (selectedSurveyId) setSelectedSurveyId(null);
      toast({ title: "Erfolg", description: "Umfrage wurde gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Umfrage konnte nicht gelöscht werden", variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async ({ surveyId, data }: { surveyId: string; data: QuestionFormValues }) => {
      const payload = {
        ...data,
        options: data.questionType === "choice" && data.options
          ? data.options.split(",").map(o => o.trim())
          : undefined,
      };
      const response = await apiRequest("POST", `/api/surveys/${surveyId}/questions`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      toast({ title: "Erfolg", description: "Frage wurde hinzugefügt" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Frage konnte nicht hinzugefügt werden", variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuestionFormValues> }) => {
      const payload = {
        ...data,
        options: data.questionType === "choice" && data.options
          ? data.options.split(",").map(o => o.trim())
          : undefined,
      };
      const response = await apiRequest("PATCH", `/api/survey-questions/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      questionForm.reset();
      toast({ title: "Erfolg", description: "Frage wurde aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Frage konnte nicht aktualisiert werden", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/survey-questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Erfolg", description: "Frage wurde gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Frage konnte nicht gelöscht werden", variant: "destructive" });
    },
  });

  const handleSurveySubmit = (data: SurveyFormValues) => {
    if (editingSurvey) {
      updateSurveyMutation.mutate({ id: editingSurvey.id, data });
    } else {
      createSurveyMutation.mutate(data);
    }
  };

  const handleQuestionSubmit = (data: QuestionFormValues) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else if (selectedSurvey) {
      createQuestionMutation.mutate({ surveyId: selectedSurvey.id, data });
    }
  };

  const openEditSurvey = (survey: SurveyWithRelations) => {
    setEditingSurvey(survey);
    surveyForm.reset({
      name: survey.name,
      description: survey.description || "",
      isActive: survey.isActive ?? true,
      triggerOnClose: survey.triggerOnClose ?? true,
      delayMinutes: survey.delayMinutes ?? 0,
    });
    setIsSurveyDialogOpen(true);
  };

  const openEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    questionForm.reset({
      questionText: question.questionText,
      questionType: question.questionType as "rating" | "text" | "choice" | "nps",
      options: Array.isArray(question.options) ? (question.options as string[]).join(", ") : "",
      isRequired: question.isRequired ?? true,
      order: question.order ?? 0,
    });
    setIsQuestionDialogOpen(true);
  };

  return (
    <MainLayout
      title="Umfragen"
      actions={
        <Dialog open={isSurveyDialogOpen} onOpenChange={(open) => {
          setIsSurveyDialogOpen(open);
          if (!open) {
            setEditingSurvey(null);
            surveyForm.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-survey">
              <Plus className="h-4 w-4 mr-2" />
              Neue Umfrage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSurvey ? "Umfrage bearbeiten" : "Neue Umfrage"}</DialogTitle>
              <DialogDescription>
                {editingSurvey ? "Bearbeiten Sie die Umfrage-Einstellungen" : "Erstellen Sie eine neue Zufriedenheitsumfrage"}
              </DialogDescription>
            </DialogHeader>
            <Form {...surveyForm}>
              <form onSubmit={surveyForm.handleSubmit(handleSurveySubmit)} className="space-y-4">
                <FormField
                  control={surveyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Kundenzufriedenheit" {...field} data-testid="input-survey-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={surveyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optionale Beschreibung..." {...field} data-testid="input-survey-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={surveyForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Aktiv</FormLabel>
                        <FormDescription>Umfrage ist aktiv und wird gesendet</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-survey-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={surveyForm.control}
                  name="triggerOnClose"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Automatisch senden</FormLabel>
                        <FormDescription>Umfrage wird automatisch nach Ticket-Schliessung gesendet</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-survey-auto-send" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createSurveyMutation.isPending || updateSurveyMutation.isPending} data-testid="button-submit-survey">
                    {editingSurvey ? "Speichern" : "Erstellen"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Umfragen</CardTitle>
              <CardDescription>Verwalten Sie Ihre Zufriedenheitsumfragen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Wird geladen...</div>
              ) : surveys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Keine Umfragen vorhanden</p>
                </div>
              ) : (
                surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className={`p-3 rounded-md cursor-pointer hover-elevate flex items-center justify-between ${
                      selectedSurvey?.id === survey.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedSurveyId(survey.id)}
                    data-testid={`survey-item-${survey.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ClipboardList className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`survey-name-${survey.id}`}>{survey.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {survey.questions?.length || 0} Fragen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={survey.isActive ? "default" : "secondary"}>
                        {survey.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedSurvey ? (
            <Tabs defaultValue="questions" className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold" data-testid="text-selected-survey-name">{selectedSurvey.name}</h2>
                  {selectedSurvey.description && (
                    <p className="text-muted-foreground">{selectedSurvey.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => openEditSurvey(selectedSurvey)} data-testid="button-edit-survey">
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteSurveyMutation.mutate(selectedSurvey.id)}
                    data-testid="button-delete-survey"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              </div>

              <TabsList>
                <TabsTrigger value="questions" data-testid="tab-questions">
                  <Settings className="h-4 w-4 mr-2" />
                  Fragen
                </TabsTrigger>
                <TabsTrigger value="results" data-testid="tab-results">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ergebnisse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="space-y-4">
                <div className="flex justify-end">
                  <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
                    setIsQuestionDialogOpen(open);
                    if (!open) {
                      setEditingQuestion(null);
                      questionForm.reset();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-question">
                        <Plus className="h-4 w-4 mr-2" />
                        Frage hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingQuestion ? "Frage bearbeiten" : "Neue Frage"}</DialogTitle>
                        <DialogDescription>
                          {editingQuestion ? "Bearbeiten Sie die Umfrage-Frage" : "Fügen Sie eine neue Frage hinzu"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...questionForm}>
                        <form onSubmit={questionForm.handleSubmit(handleQuestionSubmit)} className="space-y-4">
                          <FormField
                            control={questionForm.control}
                            name="questionText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fragetext</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="z.B. Wie zufrieden waren Sie mit unserem Service?" {...field} data-testid="input-question-text" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={questionForm.control}
                            name="questionType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fragetyp</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-question-type">
                                      <SelectValue placeholder="Typ auswählen" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="rating">Bewertung (1-5 Sterne)</SelectItem>
                                    <SelectItem value="nps">NPS (0-10)</SelectItem>
                                    <SelectItem value="text">Freitext</SelectItem>
                                    <SelectItem value="choice">Auswahl</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {questionForm.watch("questionType") === "choice" && (
                            <FormField
                              control={questionForm.control}
                              name="options"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Optionen</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Option 1, Option 2, Option 3" {...field} data-testid="input-question-options" />
                                  </FormControl>
                                  <FormDescription>Kommagetrennte Liste der Auswahloptionen</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <FormField
                            control={questionForm.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reihenfolge</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} data-testid="input-question-order" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={questionForm.control}
                            name="isRequired"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Pflichtfrage</FormLabel>
                                  <FormDescription>Diese Frage muss beantwortet werden</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-question-required" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending} data-testid="button-submit-question">
                              {editingQuestion ? "Speichern" : "Hinzufügen"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    {selectedSurvey.questions && selectedSurvey.questions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Frage</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead className="w-24">Pflicht</TableHead>
                            <TableHead className="w-24">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSurvey.questions.map((question, index) => (
                            <TableRow key={question.id} data-testid={`question-row-${question.id}`}>
                              <TableCell className="font-mono">{question.order ?? index + 1}</TableCell>
                              <TableCell data-testid={`question-text-${question.id}`}>{question.questionText}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <QuestionTypeIcon type={question.questionType || "rating"} />
                                  <span className="text-sm"><QuestionTypeLabel type={question.questionType || "rating"} /></span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={question.isRequired ? "default" : "secondary"}>
                                  {question.isRequired ? "Ja" : "Nein"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditQuestion(question)} data-testid={`button-edit-question-${question.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteQuestionMutation.mutate(question.id)} data-testid={`button-delete-question-${question.id}`}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Keine Fragen vorhanden</p>
                        <p className="text-xs">Fügen Sie Fragen hinzu, um die Umfrage zu vervollständigen</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                {surveyResults ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Einladungen</CardDescription>
                          <CardTitle className="text-2xl" data-testid="stat-total-invitations">{surveyResults.totalInvitations}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Abgeschlossen</CardDescription>
                          <CardTitle className="text-2xl" data-testid="stat-completed">{surveyResults.completedCount}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Rücklaufquote</CardDescription>
                          <CardTitle className="text-2xl" data-testid="stat-response-rate">{surveyResults.responseRate.toFixed(1)}%</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Durchschn. Bewertung</CardDescription>
                          <CardTitle className="text-2xl" data-testid="stat-avg-rating">
                            {surveyResults.avgRating !== null ? surveyResults.avgRating.toFixed(1) : "-"}/5
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    {surveyResults.npsScore !== null && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">NPS Score</CardTitle>
                          <CardDescription>Net Promoter Score (-100 bis +100)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold text-center" data-testid="stat-nps-score">
                            {surveyResults.npsScore.toFixed(0)}
                          </div>
                          <Progress value={(surveyResults.npsScore + 100) / 2} className="mt-4" />
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Fragen-Statistik</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Frage</TableHead>
                              <TableHead>Typ</TableHead>
                              <TableHead>Antworten</TableHead>
                              <TableHead>Ergebnis</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {surveyResults.questionStats.map((stat) => (
                              <TableRow key={stat.questionId} data-testid={`result-row-${stat.questionId}`}>
                                <TableCell data-testid={`result-question-${stat.questionId}`}>{stat.questionText}</TableCell>
                                <TableCell>
                                  <QuestionTypeLabel type={stat.questionType} />
                                </TableCell>
                                <TableCell>{stat.responseCount}</TableCell>
                                <TableCell>
                                  {stat.questionType === "rating" || stat.questionType === "nps" ? (
                                    stat.avgRating !== null ? (
                                      <span className="font-medium">
                                        {stat.avgRating.toFixed(1)} {stat.questionType === "rating" ? "/ 5" : "/ 10"}
                                      </span>
                                    ) : "-"
                                  ) : stat.questionType === "choice" && stat.choiceDistribution ? (
                                    <div className="text-sm">
                                      {Object.entries(stat.choiceDistribution).map(([choice, count]) => (
                                        <div key={choice}>{choice}: {count}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Textantworten</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Keine Ergebnisse vorhanden</p>
                        <p className="text-xs">Ergebnisse werden angezeigt, sobald Umfragen ausgefüllt wurden</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg">Wählen Sie eine Umfrage aus</p>
                  <p className="text-sm">Klicken Sie auf eine Umfrage links, um Details und Ergebnisse zu sehen</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
