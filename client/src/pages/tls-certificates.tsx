import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Plus, RefreshCw, Check, X, Clock, Trash2, Power, RotateCcw, History, Settings } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface TlsSettings {
  id?: string;
  acmeEmail?: string | null;
  acmeAgreedToTos?: boolean | null;
  caType?: "staging" | "production" | null;
  challengeType?: "http-01" | "dns-01" | null;
  httpsEnabled?: boolean | null;
  httpRedirect?: boolean | null;
  autoRenewEnabled?: boolean | null;
  renewDaysBeforeExpiry?: number | null;
}

interface TlsCertificate {
  id: string;
  domain: string;
  status: "pending" | "active" | "expired" | "failed" | "revoked" | null;
  caType: "staging" | "production";
  isActive: boolean | null;
  issuedAt: string | null;
  expiresAt: string | null;
  lastRenewalAt: string | null;
  renewalAttempts: number | null;
}

interface TlsAction {
  id: string;
  certificateId: string | null;
  action: string;
  status: string;
  message: string | null;
  createdAt: string | null;
  performedBy?: { firstName: string; lastName: string } | null;
}

const requestCertSchema = z.object({
  domain: z.string().min(1, "Domain ist erforderlich"),
  email: z.string().email("Gültige E-Mail erforderlich"),
  useProduction: z.boolean().default(false),
});

type RequestCertForm = z.infer<typeof requestCertSchema>;

const settingsSchema = z.object({
  acmeEmail: z.string().email("Gültige E-Mail erforderlich").optional().nullable(),
  autoRenewEnabled: z.boolean().default(true),
  renewDaysBeforeExpiry: z.number().min(7).max(60).default(30),
  caType: z.enum(["staging", "production"]).default("staging"),
  httpsEnabled: z.boolean().default(false),
  httpRedirect: z.boolean().default(true),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Aktiv", variant: "default" },
    pending: { label: "Ausstehend", variant: "secondary" },
    expired: { label: "Abgelaufen", variant: "destructive" },
    failed: { label: "Fehlgeschlagen", variant: "destructive" },
    revoked: { label: "Widerrufen", variant: "outline" },
  };
  const config = statusConfig[status || "pending"] || statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function CaTypeBadge({ caType }: { caType: string }) {
  if (caType === "production") {
    return <Badge variant="default">Produktion</Badge>;
  }
  return <Badge variant="secondary">Staging</Badge>;
}

export default function TlsCertificatesPage() {
  const { toast } = useToast();
  const [showNewCertDialog, setShowNewCertDialog] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery<TlsSettings>({
    queryKey: ["/api/tls/settings"],
  });

  const { data: certificates = [], isLoading: certsLoading } = useQuery<TlsCertificate[]>({
    queryKey: ["/api/tls/certificates"],
  });

  const { data: actions = [] } = useQuery<TlsAction[]>({
    queryKey: ["/api/tls/actions"],
  });

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      acmeEmail: null,
      autoRenewEnabled: true,
      renewDaysBeforeExpiry: 30,
      caType: "staging",
      httpsEnabled: false,
      httpRedirect: true,
    },
    values: settings ? {
      acmeEmail: settings.acmeEmail || null,
      autoRenewEnabled: settings.autoRenewEnabled ?? true,
      renewDaysBeforeExpiry: settings.renewDaysBeforeExpiry || 30,
      caType: settings.caType || "staging",
      httpsEnabled: settings.httpsEnabled ?? false,
      httpRedirect: settings.httpRedirect ?? true,
    } : undefined,
  });

  const requestCertForm = useForm<RequestCertForm>({
    resolver: zodResolver(requestCertSchema),
    defaultValues: {
      domain: "",
      email: settings?.acmeEmail || "",
      useProduction: false,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest("PATCH", "/api/tls/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/settings"] });
      toast({ title: "Einstellungen gespeichert" });
    },
    onError: () => {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    },
  });

  const requestCertMutation = useMutation({
    mutationFn: async (data: RequestCertForm) => {
      return apiRequest("POST", "/api/tls/certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tls/actions"] });
      setShowNewCertDialog(false);
      requestCertForm.reset();
      toast({ title: "Zertifikat wird angefordert..." });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Fehler bei der Anforderung", variant: "destructive" });
    },
  });

  const renewCertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/tls/certificates/${id}/renew`, { email: settings?.acmeEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tls/actions"] });
      toast({ title: "Zertifikat wird erneuert..." });
    },
    onError: () => {
      toast({ title: "Fehler bei der Erneuerung", variant: "destructive" });
    },
  });

  const revokeCertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/tls/certificates/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tls/actions"] });
      toast({ title: "Zertifikat widerrufen" });
    },
    onError: () => {
      toast({ title: "Fehler beim Widerrufen", variant: "destructive" });
    },
  });

  const activateCertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/tls/certificates/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tls/actions"] });
      toast({ title: "Zertifikat aktiviert" });
    },
    onError: () => {
      toast({ title: "Fehler bei der Aktivierung", variant: "destructive" });
    },
  });

  const deleteCertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tls/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tls/actions"] });
      toast({ title: "Zertifikat gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
  });

  const checkRenewalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tls/check-renewal");
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tls/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tls/actions"] });
      toast({ title: data.message });
    },
    onError: () => {
      toast({ title: "Fehler bei der Erneuerungsprüfung", variant: "destructive" });
    },
  });

  return (
    <MainLayout title="TLS-Zertifikate">
      <Tabs defaultValue="certificates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certificates" data-testid="tab-certificates">
            <Shield className="w-4 h-4 mr-2" />
            Zertifikate
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="w-4 h-4 mr-2" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-medium">SSL-Zertifikate</h3>
              <p className="text-sm text-muted-foreground">
                Verwalten Sie Ihre Let's Encrypt SSL-Zertifikate
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => checkRenewalMutation.mutate()}
                disabled={checkRenewalMutation.isPending}
                data-testid="button-check-renewal"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checkRenewalMutation.isPending ? "animate-spin" : ""}`} />
                Erneuerung prüfen
              </Button>
              <Dialog open={showNewCertDialog} onOpenChange={setShowNewCertDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-certificate">
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Zertifikat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neues SSL-Zertifikat anfordern</DialogTitle>
                    <DialogDescription>
                      Fordern Sie ein kostenloses SSL-Zertifikat von Let's Encrypt an.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...requestCertForm}>
                    <form onSubmit={requestCertForm.handleSubmit((data) => requestCertMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={requestCertForm.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain</FormLabel>
                            <FormControl>
                              <Input placeholder="example.com" {...field} data-testid="input-domain" />
                            </FormControl>
                            <FormDescription>
                              Die Domain, für die das Zertifikat ausgestellt werden soll
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={requestCertForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-Mail</FormLabel>
                            <FormControl>
                              <Input placeholder="admin@example.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormDescription>
                              Benachrichtigungs-E-Mail für Zertifikatserneuerungen
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={requestCertForm.control}
                        name="useProduction"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 gap-4">
                            <div className="space-y-0.5">
                              <FormLabel>Produktionszertifikat</FormLabel>
                              <FormDescription>
                                Verwendet die Let's Encrypt Produktions-CA (empfohlen für Live-Websites)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-production"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewCertDialog(false)}>
                          Abbrechen
                        </Button>
                        <Button type="submit" disabled={requestCertMutation.isPending} data-testid="button-submit-certificate">
                          {requestCertMutation.isPending ? "Wird angefordert..." : "Zertifikat anfordern"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {certsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : certificates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Zertifikate vorhanden</h3>
                <p className="text-muted-foreground mb-4">
                  Fordern Sie Ihr erstes SSL-Zertifikat von Let's Encrypt an
                </p>
                <Button onClick={() => setShowNewCertDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Zertifikat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <Card key={cert.id} data-testid={`card-certificate-${cert.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        <span className="truncate">{cert.domain}</span>
                        {cert.isActive && (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Aktiv
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap mt-1">
                        <StatusBadge status={cert.status} />
                        <CaTypeBadge caType={cert.caType} />
                        {cert.expiresAt && (
                          <span className="text-sm">
                            Läuft ab: {format(new Date(cert.expiresAt), "dd.MM.yyyy", { locale: de })}
                            {" "}({formatDistanceToNow(new Date(cert.expiresAt), { addSuffix: true, locale: de })})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {cert.status === "active" && !cert.isActive && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => activateCertMutation.mutate(cert.id)}
                          disabled={activateCertMutation.isPending}
                          data-testid={`button-activate-${cert.id}`}
                        >
                          <Power className="w-4 h-4 mr-1" />
                          Aktivieren
                        </Button>
                      )}
                      {cert.status === "active" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => renewCertMutation.mutate(cert.id)}
                          disabled={renewCertMutation.isPending}
                          data-testid={`button-renew-${cert.id}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Erneuern
                        </Button>
                      )}
                      {cert.status === "active" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={revokeCertMutation.isPending}
                              data-testid={`button-revoke-${cert.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Widerrufen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Zertifikat widerrufen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie das Zertifikat für "{cert.domain}" wirklich widerrufen? Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-revoke-${cert.id}`}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => revokeCertMutation.mutate(cert.id)}
                                data-testid={`button-confirm-revoke-${cert.id}`}
                              >
                                Widerrufen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            disabled={deleteCertMutation.isPending}
                            data-testid={`button-delete-${cert.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Zertifikat löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie das Zertifikat für "{cert.domain}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-delete-${cert.id}`}>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteCertMutation.mutate(cert.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-testid={`button-confirm-delete-${cert.id}`}
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ausgestellt:</span>
                        <p>{cert.issuedAt ? format(new Date(cert.issuedAt), "dd.MM.yyyy HH:mm", { locale: de }) : "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Läuft ab:</span>
                        <p>{cert.expiresAt ? format(new Date(cert.expiresAt), "dd.MM.yyyy HH:mm", { locale: de }) : "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Letzte Erneuerung:</span>
                        <p>{cert.lastRenewalAt ? format(new Date(cert.lastRenewalAt), "dd.MM.yyyy HH:mm", { locale: de }) : "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Erneuerungsversuche:</span>
                        <p>{cert.renewalAttempts || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>TLS-Einstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie die SSL/TLS-Einstellungen für Ihre Anwendung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit((data) => updateSettingsMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={settingsForm.control}
                    name="acmeEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ACME E-Mail-Adresse</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="admin@example.com" 
                            {...field} 
                            value={field.value || ""} 
                            data-testid="input-acme-email"
                          />
                        </FormControl>
                        <FormDescription>
                          E-Mail für Let's Encrypt Benachrichtigungen über ablaufende Zertifikate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="caType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate Authority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ca-type">
                              <SelectValue placeholder="CA auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="staging">Staging (zum Testen)</SelectItem>
                            <SelectItem value="production">Produktion (echte Zertifikate)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Staging-Zertifikate werden von Browsern nicht akzeptiert, eignen sich aber zum Testen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="renewDaysBeforeExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Erneuerung vor Ablauf (Tage)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={7} 
                            max={60}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-renew-days"
                          />
                        </FormControl>
                        <FormDescription>
                          Zertifikate werden automatisch X Tage vor Ablauf erneuert (Standard: 30)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="autoRenewEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 gap-4">
                        <div className="space-y-0.5">
                          <FormLabel>Automatische Erneuerung</FormLabel>
                          <FormDescription>
                            Zertifikate werden automatisch vor Ablauf erneuert
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-renew"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="httpsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 gap-4">
                        <div className="space-y-0.5">
                          <FormLabel>HTTPS aktivieren</FormLabel>
                          <FormDescription>
                            Aktiviert HTTPS für die Anwendung (benötigt gültiges Zertifikat)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-https"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={settingsForm.control}
                    name="httpRedirect"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 gap-4">
                        <div className="space-y-0.5">
                          <FormLabel>HTTP zu HTTPS umleiten</FormLabel>
                          <FormDescription>
                            Leitet alle HTTP-Anfragen automatisch auf HTTPS um
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-http-redirect"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? "Wird gespeichert..." : "Einstellungen speichern"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Aktionsverlauf</CardTitle>
              <CardDescription>
                Protokoll aller Zertifikatsaktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Noch keine Aktionen vorhanden
                </p>
              ) : (
                <div className="space-y-4">
                  {actions.map((action) => (
                    <div 
                      key={action.id} 
                      className="flex items-start gap-4 p-3 rounded-lg border"
                      data-testid={`action-${action.id}`}
                    >
                      <div className={`p-2 rounded-full ${
                        action.status === "success" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" :
                        action.status === "failed" ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" :
                        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}>
                        {action.status === "success" ? <Check className="w-4 h-4" /> :
                         action.status === "failed" ? <X className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium capitalize">{action.action}</span>
                          <Badge variant={action.status === "success" ? "default" : action.status === "failed" ? "destructive" : "secondary"}>
                            {action.status}
                          </Badge>
                        </div>
                        {action.message && (
                          <p className="text-sm text-muted-foreground mt-1">{action.message}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          {action.createdAt && (
                            <span>{format(new Date(action.createdAt), "dd.MM.yyyy HH:mm:ss", { locale: de })}</span>
                          )}
                          {action.performedBy && (
                            <span>von {action.performedBy.firstName} {action.performedBy.lastName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
