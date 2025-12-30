import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Palette, 
  Image, 
  Type, 
  Mail, 
  Globe, 
  Phone,
  Save,
  RotateCcw,
  Eye,
  Sun,
  Moon,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tenant } from "@shared/schema";

const brandingSchema = z.object({
  logo: z.string().optional().nullable(),
  logoLight: z.string().optional().nullable(),
  logoDark: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  emailHeaderHtml: z.string().optional().nullable(),
  emailFooterHtml: z.string().optional().nullable(),
  emailFromName: z.string().optional().nullable(),
  emailFromAddress: z.string().email().optional().nullable().or(z.literal("")),
  customCss: z.string().optional().nullable(),
  companyWebsite: z.string().url().optional().nullable().or(z.literal("")),
  supportEmail: z.string().email().optional().nullable().or(z.literal("")),
  supportPhone: z.string().optional().nullable(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

const fontFamilies = [
  { value: "Inter", label: "Inter (Standard)" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Nunito", label: "Nunito" },
  { value: "Work Sans", label: "Work Sans" },
  { value: "DM Sans", label: "DM Sans" },
];

function ColorPreview({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded-md border shadow-sm" 
        style={{ backgroundColor: color }}
      />
      <div className="text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground font-mono text-xs">{color}</p>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenant/branding"],
  });

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo: "",
      logoLight: "",
      logoDark: "",
      favicon: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#6366F1",
      accentColor: "#10B981",
      fontFamily: "Inter",
      emailHeaderHtml: "",
      emailFooterHtml: "",
      emailFromName: "",
      emailFromAddress: "",
      customCss: "",
      companyWebsite: "",
      supportEmail: "",
      supportPhone: "",
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        logo: tenant.logo || "",
        logoLight: tenant.logoLight || "",
        logoDark: tenant.logoDark || "",
        favicon: tenant.favicon || "",
        primaryColor: tenant.primaryColor || "#3B82F6",
        secondaryColor: tenant.secondaryColor || "#6366F1",
        accentColor: tenant.accentColor || "#10B981",
        fontFamily: tenant.fontFamily || "Inter",
        emailHeaderHtml: tenant.emailHeaderHtml || "",
        emailFooterHtml: tenant.emailFooterHtml || "",
        emailFromName: tenant.emailFromName || "",
        emailFromAddress: tenant.emailFromAddress || "",
        customCss: tenant.customCss || "",
        companyWebsite: tenant.companyWebsite || "",
        supportEmail: tenant.supportEmail || "",
        supportPhone: tenant.supportPhone || "",
      });
    }
  }, [tenant, form]);

  const updateBrandingMutation = useMutation({
    mutationFn: async (data: BrandingFormData) => {
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? null : value])
      );
      return apiRequest("PATCH", "/api/tenant/branding", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/branding"] });
      toast({
        title: "Branding gespeichert",
        description: "Die Branding-Einstellungen wurden erfolgreich aktualisiert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Branding-Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BrandingFormData) => {
    updateBrandingMutation.mutate(data);
  };

  const handleReset = () => {
    if (tenant) {
      form.reset({
        logo: tenant.logo || "",
        logoLight: tenant.logoLight || "",
        logoDark: tenant.logoDark || "",
        favicon: tenant.favicon || "",
        primaryColor: tenant.primaryColor || "#3B82F6",
        secondaryColor: tenant.secondaryColor || "#6366F1",
        accentColor: tenant.accentColor || "#10B981",
        fontFamily: tenant.fontFamily || "Inter",
        emailHeaderHtml: tenant.emailHeaderHtml || "",
        emailFooterHtml: tenant.emailFooterHtml || "",
        emailFromName: tenant.emailFromName || "",
        emailFromAddress: tenant.emailFromAddress || "",
        customCss: tenant.customCss || "",
        companyWebsite: tenant.companyWebsite || "",
        supportEmail: tenant.supportEmail || "",
        supportPhone: tenant.supportPhone || "",
      });
      toast({
        title: "Zurückgesetzt",
        description: "Die Änderungen wurden verworfen.",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Mandanten-Branding">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const watchedValues = form.watch();

  return (
    <MainLayout title="Mandanten-Branding">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Mandant: <span className="font-medium text-foreground">{tenant?.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={updateBrandingMutation.isPending}
                data-testid="button-reset-branding"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
              <Button
                type="submit"
                disabled={updateBrandingMutation.isPending}
                data-testid="button-save-branding"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBrandingMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1">
              <TabsTrigger value="colors" data-testid="tab-colors">
                <Palette className="w-4 h-4 mr-2" />
                Farben
              </TabsTrigger>
              <TabsTrigger value="logos" data-testid="tab-logos">
                <Image className="w-4 h-4 mr-2" />
                Logos
              </TabsTrigger>
              <TabsTrigger value="typography" data-testid="tab-typography">
                <Type className="w-4 h-4 mr-2" />
                Typografie
              </TabsTrigger>
              <TabsTrigger value="email" data-testid="tab-email">
                <Mail className="w-4 h-4 mr-2" />
                E-Mail
              </TabsTrigger>
              <TabsTrigger value="contact" data-testid="tab-contact">
                <Globe className="w-4 h-4 mr-2" />
                Kontakt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Farbschema</CardTitle>
                    <CardDescription>
                      Definieren Sie die Hauptfarben Ihres Brandings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primärfarbe</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="color"
                                className="w-12 h-10 p-1 cursor-pointer"
                                {...field}
                                value={field.value || "#3B82F6"}
                                data-testid="input-primary-color"
                              />
                              <Input
                                type="text"
                                className="font-mono"
                                {...field}
                                value={field.value || "#3B82F6"}
                                onChange={(e) => field.onChange(e.target.value)}
                                data-testid="input-primary-color-text"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Hauptfarbe für Buttons, Links und Akzente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sekundärfarbe</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="color"
                                className="w-12 h-10 p-1 cursor-pointer"
                                {...field}
                                value={field.value || "#6366F1"}
                                data-testid="input-secondary-color"
                              />
                              <Input
                                type="text"
                                className="font-mono"
                                {...field}
                                value={field.value || "#6366F1"}
                                onChange={(e) => field.onChange(e.target.value)}
                                data-testid="input-secondary-color-text"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Ergänzende Farbe für Hover-Effekte und Highlights
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Akzentfarbe</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="color"
                                className="w-12 h-10 p-1 cursor-pointer"
                                {...field}
                                value={field.value || "#10B981"}
                                data-testid="input-accent-color"
                              />
                              <Input
                                type="text"
                                className="font-mono"
                                {...field}
                                value={field.value || "#10B981"}
                                onChange={(e) => field.onChange(e.target.value)}
                                data-testid="input-accent-color-text"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Farbe für Erfolgs- und Bestätigungselemente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle>Vorschau</CardTitle>
                        <CardDescription>
                          So sehen Ihre Farben aus
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant={previewMode === "light" ? "default" : "outline"}
                          onClick={() => setPreviewMode("light")}
                          data-testid="button-preview-light"
                        >
                          <Sun className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant={previewMode === "dark" ? "default" : "outline"}
                          onClick={() => setPreviewMode("dark")}
                          data-testid="button-preview-dark"
                        >
                          <Moon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className={`p-6 rounded-lg border space-y-4 ${previewMode === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
                    >
                      <div className="space-y-3">
                        <ColorPreview 
                          color={watchedValues.primaryColor || "#3B82F6"} 
                          label="Primärfarbe" 
                        />
                        <ColorPreview 
                          color={watchedValues.secondaryColor || "#6366F1"} 
                          label="Sekundärfarbe" 
                        />
                        <ColorPreview 
                          color={watchedValues.accentColor || "#10B981"} 
                          label="Akzentfarbe" 
                        />
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <Button 
                          type="button"
                          style={{ backgroundColor: watchedValues.primaryColor || "#3B82F6" }}
                          className="w-full text-white"
                        >
                          Primär-Button
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          style={{ borderColor: watchedValues.primaryColor || "#3B82F6", color: watchedValues.primaryColor || "#3B82F6" }}
                          className="w-full"
                        >
                          Outline-Button
                        </Button>
                        <div 
                          className="text-sm p-2 rounded"
                          style={{ backgroundColor: `${watchedValues.accentColor}20` || "#10B98120", color: watchedValues.accentColor || "#10B981" }}
                        >
                          Erfolgs-Nachricht
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo-Einstellungen</CardTitle>
                  <CardDescription>
                    Laden Sie Ihr Unternehmenslogo hoch (URL zu einer Bilddatei)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standard-Logo (URL)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/logo.png"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-logo"
                          />
                        </FormControl>
                        <FormDescription>
                          Wird verwendet, wenn kein spezifisches Light/Dark-Logo definiert ist
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="logoLight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo für Light Mode (URL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/logo-light.png"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-logo-light"
                            />
                          </FormControl>
                          <FormDescription>
                            Dunkles Logo für hellen Hintergrund
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logoDark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo für Dark Mode (URL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/logo-dark.png"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-logo-dark"
                            />
                          </FormControl>
                          <FormDescription>
                            Helles Logo für dunklen Hintergrund
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="favicon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon (URL)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/favicon.ico"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-favicon"
                          />
                        </FormControl>
                        <FormDescription>
                          Kleines Icon, das im Browser-Tab angezeigt wird (16x16 oder 32x32 Pixel)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(watchedValues.logo || watchedValues.logoLight || watchedValues.logoDark) && (
                    <div className="space-y-3">
                      <Label>Vorschau</Label>
                      <div className="flex items-center gap-6 flex-wrap">
                        {watchedValues.logo && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Standard</p>
                            <img 
                              src={watchedValues.logo} 
                              alt="Logo" 
                              className="h-12 object-contain rounded border p-1"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                        )}
                        {watchedValues.logoLight && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Light Mode</p>
                            <div className="bg-white p-2 rounded border">
                              <img 
                                src={watchedValues.logoLight} 
                                alt="Logo Light" 
                                className="h-10 object-contain"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </div>
                          </div>
                        )}
                        {watchedValues.logoDark && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Dark Mode</p>
                            <div className="bg-gray-900 p-2 rounded border">
                              <img 
                                src={watchedValues.logoDark} 
                                alt="Logo Dark" 
                                className="h-10 object-contain"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Schriftart</CardTitle>
                    <CardDescription>
                      Wählen Sie die Schriftart für Ihre Anwendung
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fontFamily"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schriftfamilie</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "Inter"}
                            value={field.value || "Inter"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-font-family">
                                <SelectValue placeholder="Schriftart auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fontFamilies.map((font) => (
                                <SelectItem 
                                  key={font.value} 
                                  value={font.value}
                                  style={{ fontFamily: font.value }}
                                >
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Die gewählte Schriftart wird in der gesamten Anwendung verwendet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vorschau</CardTitle>
                    <CardDescription>
                      So sieht die gewählte Schriftart aus
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="space-y-4 p-4 rounded-lg border"
                      style={{ fontFamily: watchedValues.fontFamily || "Inter" }}
                    >
                      <h1 className="text-2xl font-bold">Überschrift Ebene 1</h1>
                      <h2 className="text-xl font-semibold">Überschrift Ebene 2</h2>
                      <h3 className="text-lg font-medium">Überschrift Ebene 3</h3>
                      <p>
                        Dies ist ein Beispieltext, um die Schriftart zu demonstrieren. 
                        Die gewählte Schriftart ({watchedValues.fontFamily || "Inter"}) wird 
                        für alle Textelemente in der Anwendung verwendet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Kleinerer Text für Beschreibungen und Metadaten.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Benutzerdefiniertes CSS</CardTitle>
                  <CardDescription>
                    Fortgeschritten: Fügen Sie eigene CSS-Regeln hinzu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="customCss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CSS-Code</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`/* Eigene CSS-Regeln */
.my-class {
  color: #333;
}`}
                            className="font-mono text-sm min-h-[200px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-custom-css"
                          />
                        </FormControl>
                        <FormDescription>
                          Benutzerdefiniertes CSS wird am Ende der Seite eingefügt
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>E-Mail-Absender</CardTitle>
                  <CardDescription>
                    Konfigurieren Sie den Absender für System-E-Mails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emailFromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Absendername</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ihr Unternehmen Support"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-email-from-name"
                            />
                          </FormControl>
                          <FormDescription>
                            Name, der als Absender angezeigt wird
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailFromAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Absender-E-Mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="support@example.com"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-email-from-address"
                            />
                          </FormControl>
                          <FormDescription>
                            E-Mail-Adresse für den Versand
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>E-Mail-Templates</CardTitle>
                  <CardDescription>
                    Passen Sie den Header und Footer Ihrer E-Mails an (HTML)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="emailHeaderHtml"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail-Header (HTML)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`<div style="background: #f5f5f5; padding: 20px; text-align: center;">
  <img src="https://example.com/logo.png" alt="Logo" style="max-height: 50px;" />
</div>`}
                            className="font-mono text-sm min-h-[150px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-email-header"
                          />
                        </FormControl>
                        <FormDescription>
                          HTML-Code für den Kopfbereich Ihrer E-Mails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailFooterHtml"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail-Footer (HTML)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`<div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
  <p>Ihr Unternehmen GmbH | Musterstraße 1 | 12345 Berlin</p>
  <p><a href="https://example.com">www.example.com</a></p>
</div>`}
                            className="font-mono text-sm min-h-[150px]"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-email-footer"
                          />
                        </FormControl>
                        <FormDescription>
                          HTML-Code für den Fußbereich Ihrer E-Mails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinformationen</CardTitle>
                  <CardDescription>
                    Öffentliche Kontaktdaten für Ihre Kunden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Globe className="w-4 h-4 inline mr-2" />
                          Unternehmenswebsite
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://www.example.com"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-company-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Mail className="w-4 h-4 inline mr-2" />
                          Support-E-Mail
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="support@example.com"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-support-email"
                          />
                        </FormControl>
                        <FormDescription>
                          E-Mail-Adresse für Support-Anfragen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supportPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Phone className="w-4 h-4 inline mr-2" />
                          Support-Telefon
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+49 123 456789"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-support-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          Telefonnummer für telefonischen Support
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </MainLayout>
  );
}
