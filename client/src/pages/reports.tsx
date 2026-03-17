import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { de } from "date-fns/locale";
import {
  Download, FileText, FileSpreadsheet, FileCode, File,
  TrendingUp, Clock, ShieldCheck, BarChart3, ChevronDown,
  Calendar,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketReport {
  byDay: { date: string; total: number; resolved: number; open: number }[];
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byAgent: { agentName: string; assigned: number; resolved: number }[];
  summary: { total: number; open: number; inProgress: number; resolved: number; closed: number };
}

interface SlaReport {
  complianceRate: number;
  avgResponseMinutes: number;
  avgResolutionMinutes: number;
  byDay: { date: string; total: number; breached: number; compliant: number }[];
  summary: { total: number; breached: number; compliant: number };
}

interface TimeReport {
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  byAgent: { agentName: string; totalMinutes: number; billableMinutes: number }[];
  byDay: { date: string; minutes: number; billableMinutes: number }[];
  summary: { totalHours: string; billableHours: string; totalAmount: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst",
  closed: "Geschlossen", pending: "Wartend",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig", medium: "Mittel", high: "Hoch", urgent: "Dringend", none: "Keine",
};
const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b", in_progress: "#3b82f6", resolved: "#10b981",
  closed: "#6b7280", pending: "#8b5cf6",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "#10b981", medium: "#f59e0b", high: "#f97316", urgent: "#ef4444", none: "#6b7280",
};
const CHART_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f97316"];

function fmtMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  return `${h}h ${min > 0 ? min + "m" : ""}`;
}

function fmtDate(d: string) {
  try { return format(new Date(d), "dd.MM.", { locale: de }); } catch { return d; }
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Date Range Picker ───────────────────────────────────────────────────────

interface DateRange { from: string; to: string }
type Preset = "7d" | "30d" | "90d" | "custom";

function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [preset, setPreset] = useState<Preset>("30d");

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
      onChange({
        from: format(subDays(new Date(), days), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="date-range-picker">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {(["7d", "30d", "90d"] as Preset[]).map(p => (
        <Button
          key={p}
          variant={preset === p ? "default" : "outline"}
          size="sm"
          onClick={() => applyPreset(p)}
          data-testid={`preset-${p}`}
        >
          {p === "7d" ? "7 Tage" : p === "30d" ? "30 Tage" : "90 Tage"}
        </Button>
      ))}
      <Button
        variant={preset === "custom" ? "default" : "outline"}
        size="sm"
        onClick={() => setPreset("custom")}
        data-testid="preset-custom"
      >
        Benutzerdefiniert
      </Button>
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Von</Label>
            <Input
              type="date"
              value={value.from}
              onChange={e => onChange({ ...value, from: e.target.value })}
              className="h-8 w-36 text-sm"
              data-testid="input-date-from"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Bis</Label>
            <Input
              type="date"
              value={value.to}
              onChange={e => onChange({ ...value, to: e.target.value })}
              className="h-8 w-36 text-sm"
              data-testid="input-date-to"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export Button ────────────────────────────────────────────────────────────

function ExportButton({ type, dateRange }: { type: string; dateRange: DateRange }) {
  const doExport = useCallback((fmt: string) => {
    const params = new URLSearchParams({
      type,
      format: fmt,
      from: dateRange.from,
      to: dateRange.to,
    });
    window.open(`/api/reports/export?${params}`, "_blank");
  }, [type, dateRange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Exportieren
          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format wählen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => doExport("csv")} data-testid="export-csv">
          <FileText className="h-4 w-4 mr-2 text-green-600" />
          CSV (.csv) – Excel-kompatibel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => doExport("xlsx")} data-testid="export-xlsx">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => doExport("pdf")} data-testid="export-pdf">
          <File className="h-4 w-4 mr-2 text-red-600" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => doExport("html")} data-testid="export-html">
          <FileCode className="h-4 w-4 mr-2 text-orange-600" />
          HTML (.html) – Druckfertig
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Tab: Tickets ─────────────────────────────────────────────────────────────

function TicketTab({ dateRange }: { dateRange: DateRange }) {
  const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
  const { data, isLoading } = useQuery<TicketReport>({
    queryKey: ["/api/reports/tickets", dateRange],
    queryFn: () => fetch(`/api/reports/tickets?${params}`).then(r => r.json()),
  });

  if (isLoading) return <ReportSkeleton />;
  if (!data) return <p className="text-muted-foreground text-sm">Keine Daten verfügbar.</p>;

  const { summary, byDay, byStatus, byPriority, byAgent } = data;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Gesamt" value={summary.total} />
        <StatCard label="Offen" value={summary.open} color="text-amber-500" />
        <StatCard label="In Bearbeitung" value={summary.inProgress} color="text-blue-500" />
        <StatCard label="Gelöst" value={summary.resolved} color="text-emerald-500" />
        <StatCard label="Geschlossen" value={summary.closed} color="text-slate-400" />
      </div>

      {/* Tickets pro Tag */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tickets pro Tag</CardTitle>
          <CardDescription>Neue und gelöste Tickets im Zeitraum</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDay} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, n: string) => [v, n === "total" ? "Gesamt" : n === "resolved" ? "Gelöst" : "Offen"]} labelFormatter={fmtDate} />
              <Legend formatter={v => v === "total" ? "Gesamt" : v === "resolved" ? "Gelöst" : "Offen"} />
              <Bar dataKey="total" fill="#f59e0b" radius={[3, 3, 0, 0]} name="total" />
              <Bar dataKey="resolved" fill="#10b981" radius={[3, 3, 0, 0]} name="resolved" />
              <Bar dataKey="open" fill="#3b82f6" radius={[3, 3, 0, 0]} name="open" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nach Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${STATUS_LABELS[status] ?? status} ${(percent * 100).toFixed(0)}%`}>
                  {byStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [v, STATUS_LABELS[n] ?? n]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nach Priorität</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80} label={({ priority, percent }) => `${PRIORITY_LABELS[priority] ?? priority} ${(percent * 100).toFixed(0)}%`}>
                  {byPriority.map((entry, i) => <Cell key={i} fill={PRIORITY_COLORS[entry.priority] ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [v, PRIORITY_LABELS[n] ?? n]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent table */}
      {byAgent.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agenten-Performance</CardTitle>
            <CardDescription>Top Agents nach zugewiesenen Tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-agents">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="py-2 text-left font-medium">Agent</th>
                    <th className="py-2 text-right font-medium">Zugewiesen</th>
                    <th className="py-2 text-right font-medium">Gelöst</th>
                    <th className="py-2 text-right font-medium">Lösungsrate</th>
                  </tr>
                </thead>
                <tbody>
                  {byAgent.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors" data-testid={`row-agent-${i}`}>
                      <td className="py-2 font-medium">{row.agentName}</td>
                      <td className="py-2 text-right">{row.assigned}</td>
                      <td className="py-2 text-right text-emerald-600">{row.resolved}</td>
                      <td className="py-2 text-right">
                        <Badge variant="outline" className="font-mono text-xs">
                          {row.assigned > 0 ? Math.round((row.resolved / row.assigned) * 100) : 0}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: SLA ─────────────────────────────────────────────────────────────────

function SlaTab({ dateRange }: { dateRange: DateRange }) {
  const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
  const { data, isLoading } = useQuery<SlaReport>({
    queryKey: ["/api/reports/sla", dateRange],
    queryFn: () => fetch(`/api/reports/sla?${params}`).then(r => r.json()),
  });

  if (isLoading) return <ReportSkeleton />;
  if (!data) return <p className="text-muted-foreground text-sm">Keine Daten verfügbar.</p>;

  const { summary, complianceRate, avgResponseMinutes, avgResolutionMinutes, byDay } = data;
  const complianceColor = complianceRate >= 90 ? "text-emerald-500" : complianceRate >= 70 ? "text-amber-500" : "text-red-500";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Gesamt-Tickets" value={summary.total} />
        <StatCard label="Compliance-Rate" value={`${complianceRate}%`} color={complianceColor}
          sub={`${summary.compliant} eingehalten`} />
        <StatCard label="SLA-Verletzungen" value={summary.breached} color="text-red-500"
          sub={summary.total > 0 ? `${Math.round((summary.breached / summary.total) * 100)}% aller Tickets` : undefined} />
        <StatCard label="Ø Antwortzeit" value={fmtMinutes(avgResponseMinutes)}
          sub={avgResolutionMinutes > 0 ? `Lösung: Ø ${fmtMinutes(avgResolutionMinutes)}` : undefined} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SLA-Verlauf</CardTitle>
          <CardDescription>Eingehaltene vs. verletzte SLAs pro Tag</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={byDay} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={fmtDate}
                formatter={(v: number, n: string) => [v, n === "compliant" ? "Eingehalten" : n === "breached" ? "Verletzt" : "Gesamt"]} />
              <Legend formatter={v => v === "compliant" ? "Eingehalten" : v === "breached" ? "Verletzt" : "Gesamt"} />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={false} name="total" />
              <Line type="monotone" dataKey="compliant" stroke="#10b981" strokeWidth={2} dot={false} name="compliant" />
              <Line type="monotone" dataKey="breached" stroke="#ef4444" strokeWidth={2} dot={false} name="breached" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SLA-Compliance täglich</CardTitle>
          <CardDescription>Anteil eingehaltener SLAs pro Tag</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDay.map(d => ({
              ...d,
              rate: d.total > 0 ? Math.round((d.compliant / d.total) * 100) : 100,
            }))} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={fmtDate} formatter={(v: number) => [`${v}%`, "Compliance-Rate"]} />
              <Bar dataKey="rate" radius={[3, 3, 0, 0]} name="rate">
                {byDay.map((d, i) => {
                  const rate = d.total > 0 ? (d.compliant / d.total) * 100 : 100;
                  return <Cell key={i} fill={rate >= 90 ? "#10b981" : rate >= 70 ? "#f59e0b" : "#ef4444"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Zeit ────────────────────────────────────────────────────────────────

function ZeitTab({ dateRange }: { dateRange: DateRange }) {
  const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
  const { data, isLoading } = useQuery<TimeReport>({
    queryKey: ["/api/reports/time", dateRange],
    queryFn: () => fetch(`/api/reports/time?${params}`).then(r => r.json()),
  });

  if (isLoading) return <ReportSkeleton />;
  if (!data) return <p className="text-muted-foreground text-sm">Keine Daten verfügbar.</p>;

  const { summary, byDay, byAgent, totalMinutes, billableMinutes, nonBillableMinutes } = data;
  const billablePercent = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Gesamtstunden" value={summary.totalHours} sub="erfasste Zeit" />
        <StatCard label="Abrechenbar" value={summary.billableHours} color="text-emerald-500"
          sub={`${billablePercent}% der Gesamtzeit`} />
        <StatCard label="Nicht abrechenbar" value={fmtMinutes(nonBillableMinutes)} color="text-slate-400"
          sub={`${100 - billablePercent}% der Gesamtzeit`} />
        <StatCard label="Gesamtbetrag" value={`${(summary.totalAmount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`}
          color="text-amber-500" sub="abrechenbar" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Erfasste Zeit pro Tag</CardTitle>
          <CardDescription>Gesamtminuten und abrechenbare Minuten</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDay} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${Math.floor(v / 60)}h`} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={fmtDate}
                formatter={(v: number, n: string) => [fmtMinutes(v), n === "minutes" ? "Gesamt" : "Abrechenbar"]} />
              <Legend formatter={v => v === "minutes" ? "Gesamt" : "Abrechenbar"} />
              <Bar dataKey="minutes" fill="#f59e0b" radius={[3, 3, 0, 0]} name="minutes" />
              <Bar dataKey="billableMinutes" fill="#10b981" radius={[3, 3, 0, 0]} name="billableMinutes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {byAgent.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Zeit pro Agent</CardTitle>
            <CardDescription>Erfasste Stunden aufgeschlüsselt nach Agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byAgent.map((row, i) => {
                const pct = row.totalMinutes > 0 ? Math.round((row.billableMinutes / row.totalMinutes) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3" data-testid={`row-timeagent-${i}`}>
                    <div className="w-32 text-sm font-medium truncate">{row.agentName}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{fmtMinutes(row.totalMinutes)}</span>
                        <span className="text-emerald-600">{fmtMinutes(row.billableMinutes)} abr.</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs w-12 justify-center">{pct}%</Badge>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-time-agents">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="py-2 text-left font-medium">Agent</th>
                    <th className="py-2 text-right font-medium">Gesamt</th>
                    <th className="py-2 text-right font-medium">Abrechenbar</th>
                    <th className="py-2 text-right font-medium">Quote</th>
                  </tr>
                </thead>
                <tbody>
                  {byAgent.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2 font-medium">{row.agentName}</td>
                      <td className="py-2 text-right font-mono">{fmtMinutes(row.totalMinutes)}</td>
                      <td className="py-2 text-right text-emerald-600 font-mono">{fmtMinutes(row.billableMinutes)}</td>
                      <td className="py-2 text-right">
                        <Badge variant="outline" className="font-mono text-xs">
                          {row.totalMinutes > 0 ? Math.round((row.billableMinutes / row.totalMinutes) * 100) : 0}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });
  const [activeTab, setActiveTab] = useState("tickets");

  const exportTypeMap: Record<string, string> = {
    tickets: "tickets",
    sla: "sla",
    time: "time",
  };

  return (
    <MainLayout title="Berichte">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Berichte & Analysen
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Auswertungen für Tickets, SLA-Performance und Zeiterfassung
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton type={exportTypeMap[activeTab] ?? "tickets"} dateRange={dateRange} />
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-muted/40 border rounded-lg px-4 py-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="tickets" data-testid="tab-tickets">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="sla" data-testid="tab-sla">
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              SLA
            </TabsTrigger>
            <TabsTrigger value="time" data-testid="tab-time">
              <Clock className="h-4 w-4 mr-1.5" />
              Zeiterfassung
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-5">
            <TicketTab dateRange={dateRange} />
          </TabsContent>
          <TabsContent value="sla" className="mt-5">
            <SlaTab dateRange={dateRange} />
          </TabsContent>
          <TabsContent value="time" className="mt-5">
            <ZeitTab dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
