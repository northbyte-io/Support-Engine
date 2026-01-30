import { useLocation } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Palette, Bell, Shield, Building, ScrollText, Lock, Mail } from "lucide-react";

interface SettingItem {
  title: string;
  description: string;
  icon: React.ElementType;
  url: string;
  available: boolean;
}

const settingItems: SettingItem[] = [
  {
    title: "SLA-Verwaltung",
    description: "Service-Level-Vereinbarungen und Eskalationsregeln verwalten",
    icon: Clock,
    url: "/settings/sla",
    available: true,
  },
  {
    title: "Branding",
    description: "Logo, Farben und Erscheinungsbild anpassen",
    icon: Palette,
    url: "/branding",
    available: true,
  },
  {
    title: "System-Logs",
    description: "Systemprotokolle einsehen, filtern und exportieren",
    icon: ScrollText,
    url: "/logs",
    available: true,
  },
  {
    title: "TLS-Zertifikate",
    description: "SSL/TLS-Zertifikate mit Let's Encrypt verwalten",
    icon: Lock,
    url: "/tls-certificates",
    available: true,
  },
  {
    title: "Exchange-Integration",
    description: "Microsoft Exchange Online E-Mail-Integration",
    icon: Mail,
    url: "/exchange-integration",
    available: true,
  },
  {
    title: "Benachrichtigungen",
    description: "E-Mail-Vorlagen und Benachrichtigungseinstellungen",
    icon: Bell,
    url: "/settings/notifications",
    available: false,
  },
  {
    title: "Sicherheit",
    description: "SSO, Azure AD und Zugriffsrechte konfigurieren",
    icon: Shield,
    url: "/settings/security",
    available: false,
  },
  {
    title: "Mandantenverwaltung",
    description: "Mandanteninformationen und Konfiguration",
    icon: Building,
    url: "/settings/tenant",
    available: false,
  },
];

export default function SettingsPage() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout title="Einstellungen">
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          Systemeinstellungen und Konfiguration verwalten
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {settingItems.map((item) => (
            <Card
              key={item.url}
              className={item.available ? "hover-elevate cursor-pointer" : "opacity-60"}
              onClick={() => item.available && setLocation(item.url)}
              data-testid={`card-settings-${item.url.split('/').pop()}`}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="p-2 rounded-lg bg-muted">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    {item.title}
                    {!item.available && (
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Demnächst
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
