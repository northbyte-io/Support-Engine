import type { ReactNode } from "react";
import { Ticket, ShieldCheck, BarChart2, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

const features = [
  {
    icon: Ticket,
    title: "Vollständiges Ticket-Management",
    description: "Lifecycle, SLA-Tracking, automatische Eskalation",
  },
  {
    icon: Mail,
    title: "Microsoft Exchange Online",
    description: "Automatischer E-Mail-Import und Ticket-Erstellung",
  },
  {
    icon: BarChart2,
    title: "Echtzeit-Analysen",
    description: "SLA-Metriken, Agent-Performance, Auslastung",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Tenant & sicher",
    description: "Vollständige Datenisolierung, AGPL-3.0 lizenziert",
  },
];

export function AuthPageShell({ title, description, children }: Readonly<Props>) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left brand panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between p-10 border-r border-border bg-sidebar relative overflow-hidden flex-shrink-0">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Amber glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% -5%, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-base text-foreground block leading-tight">Support-Engine</span>
              <span className="font-mono text-[10px] text-muted-foreground">v0.1.3</span>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="font-display font-extrabold text-3xl xl:text-4xl text-foreground leading-tight tracking-tight mb-4">
            Helpdesk-Management<br />
            für <span className="text-primary">professionelle</span><br />
            Support-Teams.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-8">
            Enterprise-grade Ticket-Verwaltung mit SLA-Tracking und vollständiger Microsoft 365 Integration — entwickelt für deutschsprachige Unternehmen.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex gap-4 text-[11px] text-muted-foreground">
          <a href="/api/license" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            AGPL-3.0 Lizenz
          </a>
          <span>·</span>
          <a href="/api/source" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Quellcode
          </a>
          <span>·</span>
          <span>© 2026</span>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border lg:border-none">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Ticket className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm">Support-Engine</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
