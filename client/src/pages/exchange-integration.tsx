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

// Einrichtungsassistent-Schritte
const setupSteps = [
  { id: 1, title: "Aktivierung", description: "Exchange-Integration aktivieren" },
  { id: 2, title: "Azure-App", description: "App-Registrierung konfigurieren" },
  { id: 3, title: "Postfach", description: "E-Mail-Postfach auswählen" },
  { id: 4, title: "Ordner", description: "Quellordner festlegen" },
  { id: 5, title: "Aktionen", description: "Nach-Import-Aktionen definieren" },
  { id: 6, title: "Test", description: "Verbindung testen" },
];

export default function ExchangeIntegration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("setup");
  const [currentStep, setCurrentStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingFetch, setIsTestingFetch] = useState(false);
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

            {/* Schritt 3: Postfach */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 3: Postfach auswählen</CardTitle>
                  <CardDescription>
                    Wählen Sie das Postfach für den E-Mail-Import
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Postfachtyp</Label>
                      <Select value={mailboxType} onValueChange={setMailboxType}>
                        <SelectTrigger data-testid="select-mailbox-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shared">Freigegebenes Postfach</SelectItem>
                          <SelectItem value="user">Benutzerpostfach</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailboxEmail">
                        <Mail className="w-4 h-4 inline mr-2" />
                        E-Mail-Adresse des Postfachs
                      </Label>
                      <Input
                        id="mailboxEmail"
                        type="email"
                        placeholder="support@ihrefirma.de"
                        value={mailboxEmail}
                        onChange={(e) => setMailboxEmail(e.target.value)}
                        data-testid="input-mailbox-email"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-prev-step">
                      Zurück
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(4)}
                      disabled={!mailboxEmail}
                      data-testid="button-next-step"
                    >
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schritt 4: Ordner */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 4: E-Mail-Ordner</CardTitle>
                  <CardDescription>
                    Wählen Sie den Quellordner für den E-Mail-Import
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>
                        <FolderOpen className="w-4 h-4 inline mr-2" />
                        Quellordner
                      </Label>
                      <Select value={sourceFolder} onValueChange={setSourceFolder}>
                        <SelectTrigger data-testid="select-source-folder">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbox">Posteingang</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="helpdesk">Helpdesk</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        E-Mails werden aus diesem Ordner importiert
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetFolder">
                        <FolderOpen className="w-4 h-4 inline mr-2" />
                        Zielordner (optional)
                      </Label>
                      <Input
                        id="targetFolder"
                        placeholder="Verarbeitet"
                        value={targetFolder}
                        onChange={(e) => setTargetFolder(e.target.value)}
                        data-testid="input-target-folder"
                      />
                      <p className="text-xs text-muted-foreground">
                        E-Mails werden nach Import hierhin verschoben
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} data-testid="button-prev-step">
                      Zurück
                    </Button>
                    <Button onClick={() => setCurrentStep(5)} data-testid="button-next-step">
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schritt 5: Aktionen */}
            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 5: Nach-Import-Aktionen</CardTitle>
                  <CardDescription>
                    Wählen Sie, was nach dem Import einer E-Mail passieren soll
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {[
                      { id: "mark_as_read", label: "Als gelesen markieren", icon: CheckCircle2 },
                      { id: "move_to_folder", label: "In Zielordner verschieben", icon: FolderOpen },
                      { id: "archive", label: "Archivieren", icon: Download },
                      { id: "delete", label: "Löschen", icon: Trash2 },
                      { id: "keep_unchanged", label: "Unverändert belassen", icon: Settings },
                    ].map(action => (
                      <div 
                        key={action.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover-elevate ${
                          postImportActions.includes(action.id) 
                            ? "border-primary bg-primary/5" 
                            : "border-border"
                        }`}
                        onClick={() => togglePostImportAction(action.id)}
                        data-testid={`action-${action.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <action.icon className="w-4 h-4" />
                          <span>{action.label}</span>
                        </div>
                        <Switch
                          checked={postImportActions.includes(action.id)}
                          onCheckedChange={() => togglePostImportAction(action.id)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      <Clock className="w-4 h-4 inline mr-2" />
                      Abrufintervall
                    </Label>
                    <Select value={fetchInterval} onValueChange={setFetchInterval}>
                      <SelectTrigger data-testid="select-fetch-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Jede Minute</SelectItem>
                        <SelectItem value="5">Alle 5 Minuten</SelectItem>
                        <SelectItem value="15">Alle 15 Minuten</SelectItem>
                        <SelectItem value="30">Alle 30 Minuten</SelectItem>
                        <SelectItem value="60">Stündlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(4)} data-testid="button-prev-step">
                      Zurück
                    </Button>
                    <Button onClick={() => setCurrentStep(6)} data-testid="button-next-step">
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schritt 6: Test */}
            {currentStep === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schritt 6: Verbindung testen</CardTitle>
                  <CardDescription>
                    Testen Sie die Verbindung und Funktionen der Exchange-Integration
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
                    <Button
                      variant="outline"
                      className="justify-start h-auto py-4"
                      onClick={handleTestFetch}
                      disabled={isTestingFetch}
                      data-testid="button-test-fetch"
                    >
                      {isTestingFetch ? (
                        <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-3" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Test-Mailabruf</div>
                        <div className="text-xs text-muted-foreground">
                          Ruft eine Test-E-Mail aus dem Postfach ab
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start h-auto py-4"
                      onClick={handleTestSend}
                      disabled={isTestingSend}
                      data-testid="button-test-send"
                    >
                      {isTestingSend ? (
                        <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-3" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">Test-Mailversand</div>
                        <div className="text-xs text-muted-foreground">
                          Sendet eine Test-E-Mail über das Postfach
                        </div>
                      </div>
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(5)} data-testid="button-prev-step">
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
                <Button data-testid="button-add-mailbox">
                  <Plus className="w-4 h-4 mr-2" />
                  Postfach hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Postfächer konfiguriert</p>
                  <p className="text-sm">
                    Schließen Sie zuerst den Einrichtungsassistenten ab
                  </p>
                </div>
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
    </MainLayout>
  );
}
