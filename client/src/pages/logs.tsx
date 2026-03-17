import { useState } from "react";
import { t } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Shield,
  Gauge,
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  FileSpreadsheet,
  FileJson,
  FlaskConical,
  Clock,
  User,
  Building2,
  Tag,
  Terminal,
  AlertOctagon,
  Lightbulb,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface LogEntry {
  timestamp: string;
  timestampFormatted: string;
  level: string;
  source: string;
  entityType: string;
  entityId: string | null;
  tenantId: string | null;
  userId: string | null;
  title: string;
  description: string;
  error: {
    description: string;
    cause: string;
    solution: string;
  } | null;
  metadata: Record<string, unknown> | null;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
}

const levelConfig: Record<string, { icon: typeof Info; color: string; bgColor: string; borderColor: string; label: string }> = {
  debug:       { icon: Bug,           color: "text-muted-foreground",  bgColor: "bg-muted/40",          borderColor: "border-muted",          label: "Debug"       },
  info:        { icon: Info,          color: "text-primary",           bgColor: "bg-primary/5",         borderColor: "border-primary/20",     label: "Info"        },
  warn:        { icon: AlertTriangle, color: "text-yellow-500",        bgColor: "bg-yellow-500/5",      borderColor: "border-yellow-500/20",  label: "Warnung"     },
  error:       { icon: AlertCircle,   color: "text-red-500",           bgColor: "bg-red-500/5",         borderColor: "border-red-500/20",     label: "Fehler"      },
  security:    { icon: Shield,        color: "text-purple-500",        bgColor: "bg-purple-500/5",      borderColor: "border-purple-500/20",  label: "Sicherheit"  },
  performance: { icon: Gauge,         color: "text-orange-500",        bgColor: "bg-orange-500/5",      borderColor: "border-orange-500/20",  label: "Performance" },
};

const sourceLabels: Record<string, string> = {
  api: "API",
  auth: "Authentifizierung",
  authorization: "Autorisierung",
  ticket: "Ticket-Engine",
  sla: "SLA-Engine",
  crm: "CRM-Modul",
  email: "E-Mail",
  integration: "Integrationen",
  database: "Datenbank",
  background: "Hintergrundjobs",
  system: "System",
};

function tryParseJson(text: string): { prefix: string; json: unknown | null } {
  const sep = " :: ";
  const idx = text.indexOf(sep);
  if (idx === -1) return { prefix: text, json: null };
  const prefix = text.slice(0, idx);
  const raw = text.slice(idx + sep.length).trim();
  try {
    return { prefix, json: JSON.parse(raw) };
  } catch {
    return { prefix: text, json: null };
  }
}

function LogEntryRow({ log, isExpanded, onToggle }: Readonly<{ log: LogEntry; isExpanded: boolean; onToggle: () => void }>) {
  const config = levelConfig[log.level] ?? levelConfig.info;
  const Icon = config.icon;
  const { prefix: titlePrefix, json: titleJson } = tryParseJson(log.title);
  const hasDescription = log.description && log.description.trim().length > 0;
  const hasContext = log.tenantId || log.userId || (log.entityType && log.entityType !== "none");
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`border-b last:border-b-0 transition-colors ${isExpanded ? config.bgColor : "hover:bg-muted/30"}`}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full p-3 text-left flex items-start gap-3 group"
            data-testid={`log-entry-${log.timestamp}`}
          >
            <div className="flex-shrink-0 mt-1 text-muted-foreground group-hover:text-foreground transition-colors">
              {isExpanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />}
            </div>
            <div className="flex-shrink-0 mt-0.5">
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <Badge variant="outline" className={`${config.color} text-[10px] px-1.5 py-0`}>
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {sourceLabels[log.source] ?? log.source}
                </Badge>
                {log.entityType && log.entityType !== "none" && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    {log.entityType}{log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {log.timestampFormatted}
                </span>
              </div>
              <p className="font-mono text-xs leading-relaxed text-foreground/80 break-all line-clamp-2">
                {titlePrefix}
              </p>
              {hasDescription && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.description}</p>
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={`mx-3 mb-3 rounded-lg border ${config.borderColor} overflow-hidden`}>

            {/* Vollständige Nachricht */}
            <div className="p-3 border-b border-inherit">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Terminal className="w-3.5 h-3.5" />
                Vollständige Nachricht
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed bg-muted/40 rounded p-2 max-h-40 overflow-y-auto">
                {log.title}
              </pre>
            </div>

            {/* Beschreibung */}
            {hasDescription && (
              <div className="p-3 border-b border-inherit">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Info className="w-3.5 h-3.5" />
                  Beschreibung
                </div>
                <p className="text-sm leading-relaxed">{log.description}</p>
              </div>
            )}

            {/* Inline-JSON aus dem Titel */}
            {titleJson !== null && (
              <div className="p-3 border-b border-inherit">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <FileJson className="w-3.5 h-3.5" />
                  Antwort-Payload
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed bg-muted/40 rounded p-2 max-h-48 overflow-y-auto">
                  {JSON.stringify(titleJson, null, 2)}
                </pre>
              </div>
            )}

            {/* Fehler-Details */}
            {log.error && (
              <div className="p-3 border-b border-inherit space-y-2">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Fehler-Details
                </div>
                <div className="rounded p-2.5 bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Fehlerbeschreibung</p>
                  <p className="text-xs">{log.error.description}</p>
                </div>
                <div className="rounded p-2.5 bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Ursache</p>
                  <p className="text-xs">{log.error.cause}</p>
                </div>
                <div className="rounded p-2.5 bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Lösungsvorschlag
                  </p>
                  <p className="text-xs">{log.error.solution}</p>
                </div>
              </div>
            )}

            {/* Zusatzdaten / Metadata */}
            {hasMetadata && (
              <div className="p-3 border-b border-inherit">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Tag className="w-3.5 h-3.5" />
                  Zusatzdaten
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed bg-muted/40 rounded p-2 max-h-48 overflow-y-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Kontext */}
            {hasContext && (
              <div className="p-3 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide w-full">
                  <Tag className="w-3.5 h-3.5" />
                  Kontext
                </div>
                {log.tenantId && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span className="font-medium text-foreground">Mandant:</span>
                    <code className="font-mono">{log.tenantId}</code>
                  </span>
                )}
                {log.userId && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="font-medium text-foreground">Benutzer:</span>
                    <code className="font-mono">{log.userId}</code>
                  </span>
                )}
                {log.entityType && log.entityType !== "none" && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    <span className="font-medium text-foreground">Entität:</span>
                    <code className="font-mono">{log.entityType}{log.entityId ? ` / ${log.entityId}` : ""}</code>
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground ml-auto">
                  <Clock className="w-3 h-3" />
                  <code className="font-mono">{log.timestamp}</code>
                </span>
              </div>
            )}

            {/* Fallback wenn keine Zusatzinfos */}
            {!hasDescription && !hasContext && !hasMetadata && titleJson === null && !log.error && (
              <div className="p-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {log.timestamp}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, refetch, isFetching } = useQuery<LogsResponse>({
    queryKey: ["/api/logs", levelFilter, sourceFilter, searchQuery, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (levelFilter !== "all") params.set("level", levelFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      const res = await fetch(`/api/logs?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const toggleExpanded = (timestamp: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(timestamp)) next.delete(timestamp);
      else next.add(timestamp);
      return next;
    });
  };

  const handleExport = async (format: "txt" | "csv" | "json") => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (searchQuery) params.set("search", searchQuery);
    if (levelFilter !== "all") params.set("level", levelFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    try {
      const res = await fetch(`/api/logs/export?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-export.${format}`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleGenerateTestLogs = async () => {
    try {
      const res = await fetch("/api/logs/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) refetch();
    } catch (error) {
      console.error("Generate test logs error:", error);
    }
  };

  const levelCounts = data?.logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const renderLogContent = () => {
    if (isLoading) {
      return (
        <div className="p-10 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{t("loading.logs")}</p>
        </div>
      );
    }
    if (!data?.logs.length) {
      return (
        <div className="p-10 text-center">
          <Info className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">Keine Logs gefunden</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || levelFilter !== "all" || sourceFilter !== "all"
              ? "Versuchen Sie andere Filterkriterien"
              : "Es wurden noch keine Logs erfasst"}
          </p>
        </div>
      );
    }
    return (
      <>
        <ScrollArea className="h-[calc(100vh-340px)] min-h-[400px]">
          <div>
            {data.logs.map((log) => (
              <LogEntryRow
                key={log.timestamp}
                log={log}
                isExpanded={expandedLogs.has(log.timestamp)}
                onToggle={() => toggleExpanded(log.timestamp)}
              />
            ))}
          </div>
        </ScrollArea>
        {data.total > limit && (
          <div className="p-3 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {offset + 1}–{Math.min(offset + limit, data.total)} von {data.total} Einträgen
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                data-testid="button-prev-page"
              >
                Zurück
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={offset + limit >= data.total}
                onClick={() => setOffset(offset + limit)}
                data-testid="button-next-page"
              >
                Weiter
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <MainLayout
      title="System-Logs"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTestLogs}
            data-testid="button-generate-test-logs"
          >
            <FlaskConical className="w-4 h-4 mr-2" />
            Test-Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-export-logs">
                <Download className="w-4 h-4 mr-2" />
                Exportieren
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("txt")} data-testid="export-txt">
                <FileText className="w-4 h-4 mr-2" />
                Als TXT exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")} data-testid="export-csv">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Als CSV exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")} data-testid="export-json">
                <FileJson className="w-4 h-4 mr-2" />
                Als JSON exportieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Level-Stat-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(levelConfig).map(([level, config]) => {
            const Icon = config.icon;
            const count = levelCounts[level] ?? 0;
            const isActive = levelFilter === level;
            return (
              <Card
                key={level}
                className={`cursor-pointer transition-all hover-elevate ${isActive ? "ring-2 ring-primary" : ""}`}
                onClick={() => setLevelFilter(isActive ? "all" : level)}
                data-testid={`filter-level-${level}`}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{config.label}</p>
                    <p className="text-lg font-semibold leading-none">{count}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter & Log-Liste */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="In Logs suchen..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
                  className="pl-10 h-9"
                  data-testid="input-search-logs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Select value={levelFilter} onValueChange={(val) => { setLevelFilter(val); setOffset(0); }}>
                  <SelectTrigger className="w-[140px] h-9" data-testid="select-level-filter">
                    <SelectValue placeholder="Alle Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Level</SelectItem>
                    {Object.entries(levelConfig).map(([level, config]) => (
                      <SelectItem key={level} value={level}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(val) => { setSourceFilter(val); setOffset(0); }}>
                  <SelectTrigger className="w-[170px] h-9" data-testid="select-source-filter">
                    <SelectValue placeholder="Alle Quellen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Quellen</SelectItem>
                    {Object.entries(sourceLabels).map(([source, label]) => (
                      <SelectItem key={source} value={source}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {data && (
                <p className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                  {data.logs.length} von {data.total} Einträgen
                </p>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {renderLogContent()}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
