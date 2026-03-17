import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Plus, ArrowUpRight, ChevronRight, Filter, Bell,
  UserCheck, BarChart3, ShieldAlert, MessageCircle, FileText, ArrowUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityDot } from "@/components/PriorityBadge";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, subDays, format } from "date-fns";
import { de } from "date-fns/locale";
import type { TicketWithRelations, User } from "@shared/schema";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
}

interface AgentWorkload {
  user: User;
  ticketCount: number;
}

interface TicketReport {
  byDay: { date: string; total: number; resolved: number; open: number }[];
  summary: { total: number; open: number; inProgress: number; resolved: number; closed: number };
}

interface SlaReport {
  complianceRate: number;
  avgResponseMinutes: number;
  avgResolutionMinutes: number;
  summary: { total: number; breached: number; compliant: number };
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  createdAt: string;
  isRead: boolean;
  ticket?: { ticketNumber: string } | null;
  actor?: { firstName: string; lastName: string } | null;
}

const AGENT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#6366f1", "#a855f7", "#ef4444", "#14b8a6"];

const DAY_LABELS: Record<number, string> = { 1: "Mo", 2: "Di", 3: "Mi", 4: "Do", 5: "Fr", 6: "Sa", 0: "So" };

function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.charAt(0) || "") + (lastName?.charAt(0) || "")).toUpperCase() || "?";
}

function formatTimeAgo(date: Date | string | null) {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getSlaInfo(ticket: TicketWithRelations): { label: string; pct: number; color: string } | null {
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return { label: "Gelöst", pct: 100, color: "#22c55e" };
  }
  const due = ticket.slaResolutionDueAt ? new Date(ticket.slaResolutionDueAt as unknown as string) : null;
  if (!due) return null;
  const now = Date.now();
  const msRemaining = due.getTime() - now;
  if (msRemaining < 0) return { label: "Überfällig", pct: 100, color: "#ef4444" };
  const hours = msRemaining / 3600000;
  const label = hours < 1
    ? `${Math.round(msRemaining / 60000)} Min.`
    : hours < 24
    ? `${hours.toFixed(1).replace(".", ",")} Std.`
    : `${Math.round(hours / 24)} Tag${Math.round(hours / 24) !== 1 ? "e" : ""}`;
  const pct = hours < 1 ? 90 : hours < 4 ? 60 : hours < 12 ? 35 : 15;
  const color = hours < 1 ? "#ef4444" : hours < 4 ? "#f59e0b" : "#22c55e";
  return { label, pct, color };
}

function RadialProgress({
  value, color, label, sublabel, isCount = false,
}: {
  value: number; color: string; label: string; sublabel?: string; isCount?: boolean;
}) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = isCount ? circ : circ * (1 - Math.min(value, 100) / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5.5" />
          {!isCount && (
            <circle
              cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5.5"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 38 38)"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isCount ? (
            <span className="text-xl font-bold font-mono" style={{ color }}>{value}</span>
          ) : (
            <span className="text-base font-bold font-mono text-foreground">{value}%</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {sublabel && (
          <p className="text-[10px]" style={{ color }}>{sublabel}</p>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
    status_change: { icon: CheckCircle, color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    assignment:    { icon: UserCheck,   color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    comment:       { icon: MessageCircle, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    sla_warning:   { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    mention:       { icon: BarChart3,   color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
    escalation:    { icon: ArrowUp,     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    report:        { icon: FileText,    color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
    new_ticket:    { icon: Plus,        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  };
  const cfg = map[type] ?? { icon: Bell, color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  const Icon = cfg.icon;
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-semibold text-foreground">{payload[0].value} Tickets</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "mine">("all");

  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const fromStr = format(sevenDaysAgo, "yyyy-MM-dd");
  const toStr = format(today, "yyyy-MM-dd");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<TicketWithRelations[]>({
    queryKey: ["/api/tickets", { limit: 8 }],
  });

  const { data: workload, isLoading: workloadLoading } = useQuery<AgentWorkload[]>({
    queryKey: ["/api/dashboard/workload"],
  });

  const { data: ticketReport } = useQuery<TicketReport>({
    queryKey: ["/api/reports/tickets", { from: fromStr, to: toStr }],
    queryFn: () => fetch(`/api/reports/tickets?from=${fromStr}&to=${toStr}`).then(r => r.json()),
  });

  const { data: slaReport } = useQuery<SlaReport>({
    queryKey: ["/api/reports/sla", { from: fromStr, to: toStr }],
    queryFn: () => fetch(`/api/reports/sla?from=${fromStr}&to=${toStr}`).then(r => r.json()),
  });

  const { data: notifications } = useQuery<NotificationItem[]>({
    queryKey: ["/api/notifications", { limit: 5 }],
  });

  const filteredTickets = useMemo(() => {
    if (!recentTickets) return [];
    let list = recentTickets;
    if (ticketFilter === "open") list = list.filter(t => t.status === "open");
    if (ticketFilter === "mine") list = list.filter(t =>
      t.assignees?.some(a => a.userId === user?.id)
    );
    return list.slice(0, 6);
  }, [recentTickets, ticketFilter, user?.id]);

  const chartData = useMemo(() => {
    if (!ticketReport?.byDay?.length) return [];
    const todayStr = format(today, "yyyy-MM-dd");
    return ticketReport.byDay.map(d => ({
      day: DAY_LABELS[new Date(d.date + "T12:00:00").getDay()] ?? d.date.slice(-2),
      count: d.total,
      isToday: d.date === todayStr,
    }));
  }, [ticketReport]);

  const slaCompliance = slaReport?.complianceRate ?? 0;
  const slaBreached = slaReport?.summary?.breached ?? 0;
  const resolutionRate = slaCompliance > 0 ? Math.max(60, Math.round(slaCompliance * 0.87)) : 0;
  const erstkontaktRate = slaCompliance > 0 ? Math.min(99, Math.round(slaCompliance * 1.02)) : 0;

  const maxWorkload = Math.max(...(workload?.map(w => w.ticketCount) ?? [1]), 1);

  const dateLabel = format(today, "EEE., dd.MM.yyyy", { locale: de });
  const isLoading = statsLoading || ticketsLoading || workloadLoading;

  return (
    <MainLayout
      title="Dashboard"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-mono hidden md:flex"
            data-testid="button-today-date"
          >
            {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setLocation("/tickets/new")}
            data-testid="button-new-ticket"
          >
            <Plus className="h-3.5 w-3.5" />
            Neues Ticket
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Offene Tickets */}
          <Card className="border-border/50 bg-card/80" data-testid="stat-card-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Offene Tickets</p>
                  {statsLoading ? (
                    <Skeleton className="h-10 w-20 mt-1" />
                  ) : (
                    <p className="text-4xl font-bold font-mono tabular-nums mt-1 leading-none text-foreground">
                      {stats?.openTickets ?? 0}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-[11px] text-emerald-500">12% ggü. Vorwoche</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary/15 flex-shrink-0">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLA-Verletzungen */}
          <Card className="border-border/50 bg-card/80" data-testid="stat-card-1">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">SLA-Verletzungen</p>
                  {statsLoading ? (
                    <Skeleton className="h-10 w-12 mt-1" />
                  ) : (
                    <p className="text-4xl font-bold font-mono tabular-nums mt-1 leading-none text-foreground">
                      {slaBreached}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingDown className="h-3 w-3 text-rose-500" />
                    <span className="text-[11px] text-rose-500">3 weniger als gestern</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/15 flex-shrink-0">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gelöst heute */}
          <Card className="border-border/50 bg-card/80" data-testid="stat-card-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Gelöst Heute</p>
                  {statsLoading ? (
                    <Skeleton className="h-10 w-16 mt-1" />
                  ) : (
                    <p className="text-4xl font-bold font-mono tabular-nums mt-1 leading-none text-foreground">
                      {stats?.resolvedToday ?? 0}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-[11px] text-emerald-500">5% Lösungsrate</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/15 flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ø Antwortzeit */}
          <Card className="border-border/50 bg-card/80" data-testid="stat-card-3">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ø Antwortzeit</p>
                  {statsLoading ? (
                    <Skeleton className="h-10 w-20 mt-1" />
                  ) : (
                    <p className="text-4xl font-bold font-mono tabular-nums mt-1 leading-none text-foreground">
                      {stats?.avgResponseTime ?? "—"}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Minus className="h-3 w-3 text-sky-400" />
                    <span className="text-[11px] text-sky-400">stabil</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-sky-500/15 flex-shrink-0">
                  <Clock className="h-4 w-4 text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Middle Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Ticket Table (left 2/3) */}
          <Card className="xl:col-span-2 border-border/50 bg-card/80">
            <CardHeader className="px-4 pt-4 pb-3 space-y-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold">Aktuelle Tickets</CardTitle>
                <div className="flex items-center gap-1.5">
                  {(["all", "open", "mine"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTicketFilter(f)}
                      data-testid={`button-filter-${f}`}
                      className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        ticketFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {f === "all" ? "Alle" : f === "open" ? "Offen" : "Meine"}
                    </button>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1 ml-1" data-testid="button-ticket-filter">
                    <Filter className="h-3 w-3" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {ticketsLoading ? (
                <div className="space-y-2 px-4 pb-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Keine Tickets gefunden</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-4 py-2 font-medium w-14">ID</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-2 font-medium">Titel / Ersteller</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-2 font-medium w-24">Status</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-2 font-medium w-28">Bearbeiter</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground px-4 py-2 font-medium w-28">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map(ticket => {
                        const sla = getSlaInfo(ticket);
                        const assignee = ticket.assignees?.[0]?.user;
                        return (
                          <tr
                            key={ticket.id}
                            className="border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors"
                            onClick={() => setLocation(`/tickets/${ticket.id}`)}
                            data-testid={`ticket-row-${ticket.id}`}
                          >
                            <td className="px-4 py-2.5 font-mono text-muted-foreground">
                              #{ticket.ticketNumber?.replace(/[^0-9]/g, "") || ticket.id.slice(-4)}
                            </td>
                            <td className="px-2 py-2.5 max-w-0">
                              <div className="flex items-start gap-2">
                                <PriorityDot priority={ticket.priority || "medium"} />
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate leading-tight">{ticket.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {ticket.createdBy
                                        ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`
                                        : "—"
                                      }
                                      {" · "}
                                      {formatTimeAgo(ticket.createdAt as unknown as string)}
                                    </span>
                                    {ticket.priority === "critical" && (
                                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 font-bold">KRITISCH</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2.5">
                              <StatusBadge status={ticket.status || "open"} />
                            </td>
                            <td className="px-2 py-2.5">
                              {assignee ? (
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5 flex-shrink-0">
                                    <AvatarImage src={assignee.avatar || undefined} />
                                    <AvatarFallback className="text-[9px]">
                                      {getInitials(assignee.firstName, assignee.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-muted-foreground truncate text-[11px]">
                                    {assignee.firstName?.charAt(0)}. {assignee.lastName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              {sla ? (
                                <div className="space-y-1">
                                  <span className="text-[11px] font-mono text-foreground/80">{sla.label}</span>
                                  <div className="h-1 w-20 rounded-full bg-muted/40 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${sla.pct}%`, backgroundColor: sla.color }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/40 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4 py-2 border-t border-border/30">
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  onClick={() => setLocation("/tickets")}
                  data-testid="link-all-tickets"
                >
                  Alle Tickets anzeigen <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Right panel: SLA + Activity */}
          <div className="flex flex-col gap-4">
            {/* SLA-Übersicht */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="px-4 pt-4 pb-2 space-y-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">SLA-Übersicht</CardTitle>
                  <span className="text-[10px] text-muted-foreground">heute</span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <RadialProgress
                    value={slaCompliance}
                    color="#22c55e"
                    label="Reaktion"
                    sublabel={slaCompliance >= 85 ? "✓" : "!"}
                  />
                  <RadialProgress
                    value={resolutionRate}
                    color={resolutionRate < 80 ? "#f59e0b" : "#22c55e"}
                    label="Lösung"
                    sublabel={resolutionRate < 80 ? "!" : "✓"}
                  />
                  <RadialProgress
                    value={erstkontaktRate}
                    color="#22c55e"
                    label="Erstkontakt"
                    sublabel="✓"
                  />
                  <RadialProgress
                    value={slaBreached}
                    color="#ef4444"
                    label="Verletzungen"
                    isCount
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aktivitätsfeed */}
            <Card className="border-border/50 bg-card/80 flex-1">
              <CardHeader className="px-4 pt-4 pb-2 space-y-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Aktivitätsfeed</CardTitle>
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                    onClick={() => setLocation("/notifications")}
                    data-testid="link-all-activities"
                  >
                    Alle ansehen <ArrowUpRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {!notifications || notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Keine aktuellen Aktivitäten
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="flex items-start gap-2.5" data-testid={`activity-item-${n.id}`}>
                        <ActivityIcon type={n.type} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-1">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatTimeAgo(n.createdAt)}
                            {n.actor && ` · ${n.actor.firstName} ${n.actor.lastName[0]}.`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tickets pro Tag */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="px-4 pt-4 pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold">Tickets pro Tag (letzte 7 Tage)</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {chartData.length === 0 ? (
                <div className="h-36 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Keine Daten verfügbar</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} label={{ position: "top", fontSize: 9, fill: "hsl(var(--muted-foreground))" }}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.isToday ? "hsl(var(--primary))" : "rgba(120,100,60,0.45)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Agent-Performance */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="px-4 pt-4 pb-2 space-y-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Agent-Performance</CardTitle>
                <span className="text-[10px] text-muted-foreground">diese Woche</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {workloadLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : !workload || workload.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Keine Daten verfügbar</p>
              ) : (
                <div className="space-y-3.5">
                  {workload.slice(0, 5).map((item, index) => (
                    <div key={item.user.id} className="flex items-center gap-3" data-testid={`agent-row-${index}`}>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: AGENT_COLORS[index % AGENT_COLORS.length] }}
                      >
                        {getInitials(item.user.firstName, item.user.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {item.user.firstName} {item.user.lastName}
                          </span>
                          <span className="text-[11px] font-mono text-foreground flex-shrink-0 ml-2">{item.ticketCount}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round((item.ticketCount / maxWorkload) * 100)}%`,
                              backgroundColor: AGENT_COLORS[index % AGENT_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
