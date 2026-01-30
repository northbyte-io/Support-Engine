import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Plus,
  FolderOpen,
  Clock,
  Send,
  Download,
  Shield,
  Key,
  Building2,
  Loader2,
  ArrowLeft,
  TestTube,
  Info,
  Save
} from "lucide-react";
import { Link } from "wouter";

// Status-Badge Komponente
function ConnectionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "connected":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verbunden
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Fehler
        </Badge>
      );
    case "disconnected":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Getrennt
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          <Settings className="w-3 h-3 mr-1" />
          Nicht konfiguriert
        </Badge>
      );
  }
}

// Einrichtungsassistent-Schritte (vereinfacht - Postfächer werden separat verwaltet)
const setupSteps = [
  { id: 1, title: "Aktivierung", description: "Exchange-Integration aktivieren" },
  { id: 2, title: "Azure-App", description: "App-Registrierung konfigurieren" },
  { id: 3, title: "Test", description: "Verbindung testen" },
];

export default function ExchangeIntegration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("setup");
  const [currentStep, setCurrentStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingFetch, setIsTestingFetch] = useState(false);
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [testingMailboxId, setTestingMailboxId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMailboxDialog, setShowMailboxDialog] = useState(false);
  const [isSavingMailbox, setIsSavingMailbox] = useState(false);

  // Mailbox Form States
  const [newMailboxEmail, setNewMailboxEmail] = useState("");
  const [newMailboxDisplayName, setNewMailboxDisplayName] = useState("");
  const [newMailboxType, setNewMailboxType] = useState<"incoming" | "outgoing" | "shared">("shared");
  const [newMailboxSourceFolderId, setNewMailboxSourceFolderId] = useState("");
  const [newMailboxSourceFolderName, setNewMailboxSourceFolderName] = useState("");
  const [newMailboxTargetFolderId, setNewMailboxTargetFolderId] = useState("");
  const [newMailboxTargetFolderName, setNewMailboxTargetFolderName] = useState("");
  const [newMailboxPostImportAction, setNewMailboxPostImportAction] = useState<"mark_as_read" | "move_to_folder" | "archive" | "delete" | "keep_unchanged">("mark_as_read");
  const [availableFolders, setAvailableFolders] = useState<Array<{ id: string; displayName: string }>>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [useStandardFolders, setUseStandardFolders] = useState(false);

  // Standard Exchange-Ordner (Well-Known Folder Names)
  const standardFolders = [
    { id: "inbox", displayName: "Posteingang (Inbox)" },
    { id: "drafts", displayName: "Entwürfe (Drafts)" },
    { id: "sentitems", displayName: "Gesendete Elemente" },
    { id: "deleteditems", displayName: "Gelöschte Elemente" },
    { id: "archive", displayName: "Archiv" },
    { id: "junkemail", displayName: "Junk-E-Mail" },
  ];

  // Form States
  const [isEnabled, setIsEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [tenantAzureId, setTenantAzureId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authType, setAuthType] = useState("client_secret");
  const [mailboxEmail, setMailboxEmail] = useState("");
  const [mailboxType, setMailboxType] = useState("shared");
  const [sourceFolder, setSourceFolder] = useState("inbox");
  const [targetFolder, setTargetFolder] = useState("");
  const [postImportActions, setPostImportActions] = useState<string[]>(["mark_as_read"]);
  const [fetchInterval, setFetchInterval] = useState("5");

  // Load configuration from API
  const { data: configData, isLoading: isLoadingConfig } = useQuery<any>({
    queryKey: ["/api/exchange/configuration"],
  });

  // Update form states when config is loaded
  useEffect(() => {
    if (configData && configData.configured) {
      setIsEnabled(configData.isEnabled || false);
      setClientId(configData.clientId || "");
      setTenantAzureId(configData.tenantAzureId || "");
      setAuthType(configData.authType || "client_secret");
    }
  }, [configData]);

  // Get connection status from API
  const connectionStatus = configData?.connectionStatus || "not_configured";

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/exchange/configuration", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/configuration"] });
      toast({
        title: "Konfiguration gespeichert",
        description: "Die Exchange-Einstellungen wurden erfolgreich gespeichert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Speichern",
        description: error.message || "Die Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/exchange/test-connection", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/configuration"] });
      if (data.success) {
        toast({
          title: "Verbindung erfolgreich",
          description: data.message || "Die Verbindung zu Microsoft Graph API wurde hergestellt.",
        });
      } else {
        toast({
          title: "Verbindungstest fehlgeschlagen",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verbindungstest fehlgeschlagen",
        description: error.message || "Die Verbindung konnte nicht hergestellt werden.",
        variant: "destructive",
      });
    },
  });

  // Query für Postfächer
  const { data: mailboxesData, isLoading: isLoadingMailboxes } = useQuery<any[]>({
    queryKey: ["/api/exchange/mailboxes"],
    enabled: configData?.configured === true,
  });

  // Mutation zum Speichern eines Postfachs
  const saveMailboxMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/exchange/mailboxes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/mailboxes"] });
      setShowMailboxDialog(false);
      resetMailboxForm();
      toast({
        title: "Postfach hinzugefügt",
        description: "Das Postfach wurde erfolgreich konfiguriert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Speichern",
        description: error.message || "Das Postfach konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Mutation zum Löschen eines Postfachs
  const deleteMailboxMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/exchange/mailboxes/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/mailboxes"] });
      toast({
        title: "Postfach gelöscht",
        description: "Das Postfach wurde erfolgreich entfernt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message || "Das Postfach konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Reset mailbox form
  const resetMailboxForm = () => {
    setNewMailboxEmail("");
    setNewMailboxDisplayName("");
    setNewMailboxType("shared");
    setNewMailboxSourceFolderId("");
    setNewMailboxSourceFolderName("");
    setNewMailboxTargetFolderId("");
    setNewMailboxTargetFolderName("");
    setNewMailboxPostImportAction("mark_as_read");
    setAvailableFolders([]);
    setFoldersError(null);
    setUseStandardFolders(false);
  };

  // Handler zum Laden der Ordner
  const handleLoadFolders = async (email: string) => {
    if (!email || !email.includes("@")) return;
    
    setIsLoadingFolders(true);
    setFoldersError(null);
    setAvailableFolders([]);
    
    try {
      const response = await apiRequest("GET", `/api/exchange/folders/${encodeURIComponent(email)}`, undefined);
      const folders = await response.json();
      setAvailableFolders(folders);
      
      // Automatisch "Inbox" auswählen wenn vorhanden
      const inbox = folders.find((f: any) => f.displayName.toLowerCase() === "inbox" || f.displayName === "Posteingang");
      if (inbox) {
        setNewMailboxSourceFolderId(inbox.id);
        setNewMailboxSourceFolderName(inbox.displayName);
      }
    } catch (error: any) {
      setFoldersError(error.message || "Ordner konnten nicht geladen werden");
      toast({
        title: "Fehler beim Laden der Ordner",
        description: error.message || "Die Ordner konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Handler für Postfach hinzufügen
  const handleAddMailbox = async () => {
    if (!newMailboxEmail) {
      toast({
        title: "E-Mail-Adresse erforderlich",
        description: "Bitte geben Sie eine E-Mail-Adresse für das Postfach ein.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newMailboxSourceFolderId) {
      toast({
        title: "Quellordner erforderlich",
        description: "Bitte wählen Sie einen Quellordner aus.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSavingMailbox(true);
    try {
      await saveMailboxMutation.mutateAsync({
        emailAddress: newMailboxEmail,
        displayName: newMailboxDisplayName || newMailboxEmail,
        mailboxType: newMailboxType,
        sourceFolderId: newMailboxSourceFolderId,
        sourceFolderName: newMailboxSourceFolderName,
        targetFolderId: newMailboxTargetFolderId || undefined,
        targetFolderName: newMailboxTargetFolderName || undefined,
        postImportAction: newMailboxPostImportAction,
        isActive: true,
      });
    } finally {
      setIsSavingMailbox(false);
    }
  };

  // Handler für Verbindungstest
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync();
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handler für Test-Mailabruf
  const handleTestFetch = async () => {
    setIsTestingFetch(true);
    try {
      const response = await apiRequest("POST", "/api/exchange/sync", {});
      const data = await response.json();
      toast({
        title: "Synchronisation abgeschlossen",
        description: `${data.emailsProcessed || 0} E-Mails verarbeitet, ${data.ticketsCreated || 0} Tickets erstellt.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler bei der Synchronisation",
        description: error.message || "Die E-Mails konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setIsTestingFetch(false);
    }
  };

  // Handler für Test-Mailversand
  const handleTestSend = async () => {
    setIsTestingSend(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTestingSend(false);
    toast({
      title: "Test-Mailversand",
      description: "Diese Funktion ist noch nicht implementiert.",
      variant: "default",
    });
  };

  // Handler für Test-Mailabruf für ein bestimmtes Postfach
  const handleTestFetchForMailbox = async (mailboxEmail: string) => {
    const mailbox = mailboxesData?.find((m: any) => m.emailAddress === mailboxEmail);
    if (mailbox) {
      setTestingMailboxId(mailbox.id);
    }
    setIsTestingFetch(true);
    try {
      const response = await apiRequest("POST", "/api/exchange/sync", { mailboxEmail });
      const data = await response.json();
      toast({
        title: "Synchronisation abgeschlossen",
        description: `${data.emailsProcessed || 0} E-Mails verarbeitet, ${data.ticketsCreated || 0} Tickets erstellt.`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler bei der Synchronisation",
        description: error.message || "Die E-Mails konnten nicht abgerufen werden.",
        variant: "destructive",
      });
    } finally {
      setIsTestingFetch(false);
      setTestingMailboxId(null);
    }
  };

  // Handler für Test-Mailversand für ein bestimmtes Postfach
  const handleTestSendForMailbox = async (mailboxEmail: string) => {
    const mailbox = mailboxesData?.find((m: any) => m.emailAddress === mailboxEmail);
    if (mailbox) {
      setTestingMailboxId(mailbox.id);
    }
    setIsTestingSend(true);
    try {
      const response = await apiRequest("POST", "/api/exchange/send-test", { mailboxEmail });
      const data = await response.json();
      toast({
        title: "Test-Mail gesendet",
        description: data.message || "Die Test-E-Mail wurde erfolgreich gesendet.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Senden",
        description: error.message || "Die Test-E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsTestingSend(false);
      setTestingMailboxId(null);
    }
  };

  // Handler für Speichern
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveConfigMutation.mutateAsync({
        clientId,
        tenantAzureId,
        authType,
        clientSecret: clientSecret || undefined,
        isEnabled,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Post-Import-Aktionen Toggle
  const togglePostImportAction = (action: string) => {
    if (postImportActions.includes(action)) {
      setPostImportActions(postImportActions.filter(a => a !== action));
    } else {
      setPostImportActions([...postImportActions, action]);
    }
  };

  return (
    <MainLayout 
      title="Exchange-Integration" 
      description="Microsoft Exchange Online E-Mail-Integration verwalten"
    >
      <div className="space-y-6">
        {/* Header mit Zurück-Button */}
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" data-testid="button-back-settings">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold" data-testid="text-page-title">Exchange Online Integration</h1>
                <p className="text-sm text-muted-foreground">
                  E-Mail-Integration mit Microsoft Exchange Online über Graph API
                </p>
              </div>
            </div>
          </div>
          <ConnectionStatusBadge status={connectionStatus} />
        </div>

        {/* Info-Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Vorbereitung erforderlich</AlertTitle>
          <AlertDescription>
            Um Exchange Online zu integrieren, benötigen Sie eine Azure-App-Registrierung mit den entsprechenden Graph-API-Berechtigungen (Mail.Read, Mail.ReadWrite, Mail.Send).
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup" data-testid="tab-setup">
              <Settings className="w-4 h-4 mr-2" />
              Einrichtung
            </TabsTrigger>
            <TabsTrigger value="mailboxes" data-testid="tab-mailboxes">
              <Mail className="w-4 h-4 mr-2" />
              Postfächer
            </TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">
              <RefreshCw className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Clock className="w-4 h-4 mr-2" />
              Protokoll
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            {/* Fortschrittsanzeige */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Einrichtungsassistent</CardTitle>
                <CardDescription>
                  Folgen Sie den Schritten, um die Exchange-Integration einzurichten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  {setupSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex flex-col items-center ${
                          currentStep === step.id
                            ? "text-primary"
                            : currentStep > step.id
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                        data-testid={`button-step-${step.id}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep === step.id
                              ? "bg-primary text-primary-foreground"
                              : currentStep > step.id
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              : "bg-muted"
                          }`}
                        >
                          {currentStep > step.id ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <span className="text-xs mt-1">{step.title}</span>
                      </button>
                      {index < setupSteps.length - 1 && (
                        <div
                          className={`w-12 h-0.5 mx-2 ${
                            currentStep > step.id
                              ? "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schritt 1: Aktivierung */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 1: Exchange-Integration aktivieren</CardTitle>
                  <CardDescription>
                    Aktivieren Sie die Exchange-Integration, um fortzufahren
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Exchange-Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktivieren Sie die Integration mit Microsoft Exchange Online
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={setIsEnabled}
                      data-testid="switch-enable-exchange"
                    />
                  </div>
                  {isEnabled && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">Aktiviert</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        Die Exchange-Integration wurde aktiviert. Fahren Sie mit der Konfiguration fort.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setCurrentStep(2)} 
                      disabled={!isEnabled}
                      data-testid="button-next-step"
                    >
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schritt 2: Azure-App */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 2: Azure-App-Registrierung</CardTitle>
                  <CardDescription>
                    Geben Sie die Daten Ihrer Azure Entra ID App-Registrierung ein
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">
                        <Key className="w-4 h-4 inline mr-2" />
                        Client ID (Application ID)
                      </Label>
                      <Input
                        id="clientId"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        data-testid="input-client-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantId">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Tenant ID (Directory ID)
                      </Label>
                      <Input
                        id="tenantId"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={tenantAzureId}
                        onChange={(e) => setTenantAzureId(e.target.value)}
                        data-testid="input-tenant-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Authentifizierungstyp</Label>
                      <Select value={authType} onValueChange={setAuthType}>
                        <SelectTrigger data-testid="select-auth-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client_secret">Client Secret</SelectItem>
                          <SelectItem value="certificate">Zertifikat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {authType === "client_secret" && (
                      <div className="space-y-2">
                        <Label htmlFor="clientSecret">
                          <Shield className="w-4 h-4 inline mr-2" />
                          Client Secret
                        </Label>
                        <Input
                          id="clientSecret"
                          type="password"
                          placeholder="Client Secret eingeben"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          data-testid="input-client-secret"
                        />
                        <p className="text-xs text-muted-foreground">
                          Das Secret wird verschlüsselt gespeichert
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-prev-step">
                      Zurück
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      disabled={!clientId || !tenantAzureId || !clientSecret}
                      data-testid="button-next-step"
                    >
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schritt 3: Test */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 3: Verbindung testen</CardTitle>
                  <CardDescription>
                    Testen Sie die Verbindung zur Microsoft Graph API und speichern Sie die Konfiguration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-auto py-4"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      data-testid="button-test-connection"
                    >
                      {isTestingConnection ? (
                        <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-3" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Verbindung testen</div>
                        <div className="text-xs text-muted-foreground">
                          Prüft die Verbindung zu Microsoft Graph API
                        </div>
                      </div>
                    </Button>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Hinweis</AlertTitle>
                    <AlertDescription>
                      Nach erfolgreicher Einrichtung können Sie im Tab "Postfächer" einzelne E-Mail-Postfächer hinzufügen und dort jeweils den Mailabruf und -versand testen.
                    </AlertDescription>
                  </Alert>
                  <Separator />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-prev-step">
                      Zurück
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-config">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Konfiguration speichern
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Postfächer Tab */}
          <TabsContent value="mailboxes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Konfigurierte Postfächer</CardTitle>
                  <CardDescription>
                    Verwalten Sie die E-Mail-Postfächer für die Integration
                  </CardDescription>
                </div>
                <Button 
                  data-testid="button-add-mailbox"
                  onClick={() => setShowMailboxDialog(true)}
                  disabled={!configData?.configured || connectionStatus === "not_configured"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Postfach hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMailboxes ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Lade Postfächer...</p>
                  </div>
                ) : mailboxesData && mailboxesData.length > 0 ? (
                  <div className="space-y-4">
                    {mailboxesData.map((mailbox: any) => (
                      <div key={mailbox.id} className="p-4 border rounded-md space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{mailbox.displayName || mailbox.emailAddress}</p>
                              <p className="text-sm text-muted-foreground">{mailbox.emailAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={mailbox.isActive ? "default" : "secondary"}>
                              {mailbox.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                            <Badge variant="outline">
                              {mailbox.mailboxType === "incoming" ? "Eingehend" : 
                               mailbox.mailboxType === "outgoing" ? "Ausgehend" : "Gemeinsam"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMailboxMutation.mutate(mailbox.id)}
                              data-testid={`button-delete-mailbox-${mailbox.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Details und Ordner-Info */}
                        <div className="text-sm text-muted-foreground pl-8 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            {mailbox.sourceFolderName || "Nicht konfiguriert"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            {mailbox.postImportAction === "mark_as_read" ? "Als gelesen markieren" :
                             mailbox.postImportAction === "move_to_folder" ? "In Ordner verschieben" :
                             mailbox.postImportAction === "archive" ? "Archivieren" :
                             mailbox.postImportAction === "delete" ? "Löschen" : "Unverändert"}
                          </span>
                        </div>
                        {/* Test-Buttons für jedes Postfach */}
                        <div className="flex gap-2 pl-8">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestFetchForMailbox(mailbox.emailAddress)}
                            disabled={testingMailboxId === mailbox.id && isTestingFetch}
                            data-testid={`button-test-fetch-${mailbox.id}`}
                          >
                            {testingMailboxId === mailbox.id && isTestingFetch ? (
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 mr-2" />
                            )}
                            Mails abrufen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestSendForMailbox(mailbox.emailAddress)}
                            disabled={testingMailboxId === mailbox.id && isTestingSend}
                            data-testid={`button-test-send-${mailbox.id}`}
                          >
                            {testingMailboxId === mailbox.id && isTestingSend ? (
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3 mr-2" />
                            )}
                            Test-Mail senden
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Postfächer konfiguriert</p>
                    <p className="text-sm">
                      {configData?.configured ? "Klicken Sie auf 'Postfach hinzufügen', um zu beginnen" : "Schließen Sie zuerst den Einrichtungsassistenten ab"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verbindungsstatus</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <ConnectionStatusBadge status={connectionStatus} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Letzter Abruf</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Noch kein Abruf</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Importierte E-Mails</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Gesamt</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Erstellte Tickets</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Aus E-Mails</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Letzte Fehler</CardTitle>
                <CardDescription>
                  Übersicht der letzten Synchronisierungsfehler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p>Keine Fehler vorhanden</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Synchronisierungsprotokoll</CardTitle>
                <CardDescription>
                  Verlauf der E-Mail-Synchronisierungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Synchronisierungen</p>
                  <p className="text-sm">
                    Das Protokoll wird nach der ersten Synchronisierung angezeigt
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Postfach hinzufügen Dialog */}
      <Dialog open={showMailboxDialog} onOpenChange={setShowMailboxDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Postfach hinzufügen</DialogTitle>
            <DialogDescription>
              Konfigurieren Sie ein neues E-Mail-Postfach für die Exchange-Integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mailbox-email">E-Mail-Adresse *</Label>
              <div className="flex gap-2">
                <Input
                  id="mailbox-email"
                  type="email"
                  placeholder="support@ihre-domain.de"
                  value={newMailboxEmail}
                  onChange={(e) => setNewMailboxEmail(e.target.value)}
                  data-testid="input-mailbox-email"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleLoadFolders(newMailboxEmail)}
                  disabled={!newMailboxEmail || !newMailboxEmail.includes("@") || isLoadingFolders}
                  data-testid="button-load-folders"
                >
                  {isLoadingFolders ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Geben Sie die E-Mail-Adresse ein und klicken Sie auf den Ordner-Button, um die verfügbaren Ordner zu laden
              </p>
            </div>
            
            {foldersError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ordner konnten nicht geladen werden</AlertTitle>
                <AlertDescription>
                  {foldersError}
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setUseStandardFolders(true);
                        setFoldersError(null);
                        // Setze automatisch auf inbox
                        setNewMailboxSourceFolderId("inbox");
                        setNewMailboxSourceFolderName("Posteingang (Inbox)");
                      }}
                    >
                      Standard-Ordner verwenden
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="mailbox-name">Anzeigename</Label>
              <Input
                id="mailbox-name"
                placeholder="Support-Postfach"
                value={newMailboxDisplayName}
                onChange={(e) => setNewMailboxDisplayName(e.target.value)}
                data-testid="input-mailbox-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailbox-type">Postfachtyp</Label>
              <Select value={newMailboxType} onValueChange={(v) => setNewMailboxType(v as any)}>
                <SelectTrigger id="mailbox-type" data-testid="select-mailbox-type">
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">Gemeinsames Postfach</SelectItem>
                  <SelectItem value="incoming">Nur eingehend</SelectItem>
                  <SelectItem value="outgoing">Nur ausgehend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-folder">Quellordner *</Label>
              {(availableFolders.length > 0 || useStandardFolders) ? (
                <Select 
                  value={newMailboxSourceFolderId} 
                  onValueChange={(v) => {
                    setNewMailboxSourceFolderId(v);
                    const folders = useStandardFolders ? standardFolders : availableFolders;
                    const folder = folders.find(f => f.id === v);
                    setNewMailboxSourceFolderName(folder?.displayName || "");
                  }}
                >
                  <SelectTrigger id="source-folder" data-testid="select-source-folder">
                    <SelectValue placeholder="Ordner auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(useStandardFolders ? standardFolders : availableFolders).map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  {isLoadingFolders ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Lade Ordner...
                    </div>
                  ) : (
                    "Bitte zuerst E-Mail-Adresse eingeben und Ordner laden"
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Der Ordner, aus dem E-Mails importiert werden
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-import-action">Nach-Import-Aktion</Label>
              <Select value={newMailboxPostImportAction} onValueChange={(v) => setNewMailboxPostImportAction(v as any)}>
                <SelectTrigger id="post-import-action" data-testid="select-post-import-action">
                  <SelectValue placeholder="Aktion auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark_as_read">Als gelesen markieren</SelectItem>
                  <SelectItem value="move_to_folder">In Ordner verschieben</SelectItem>
                  <SelectItem value="archive">Archivieren</SelectItem>
                  <SelectItem value="delete">Löschen</SelectItem>
                  <SelectItem value="keep_unchanged">Unverändert lassen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newMailboxPostImportAction === "move_to_folder" && (
              <div className="space-y-2">
                <Label htmlFor="target-folder">Zielordner</Label>
                {(availableFolders.length > 0 || useStandardFolders) ? (
                  <Select 
                    value={newMailboxTargetFolderId} 
                    onValueChange={(v) => {
                      setNewMailboxTargetFolderId(v);
                      const folders = useStandardFolders ? standardFolders : availableFolders;
                      const folder = folders.find(f => f.id === v);
                      setNewMailboxTargetFolderName(folder?.displayName || "");
                    }}
                  >
                    <SelectTrigger id="target-folder" data-testid="select-target-folder">
                      <SelectValue placeholder="Zielordner auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {(useStandardFolders ? standardFolders : availableFolders).map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                    Bitte zuerst Ordner laden
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMailboxDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleAddMailbox} 
              disabled={isSavingMailbox || !newMailboxEmail || !newMailboxSourceFolderId}
              data-testid="button-save-mailbox"
            >
              {isSavingMailbox ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Postfach hinzufügen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
