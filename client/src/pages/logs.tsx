import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";

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

const levelConfig: Record<string, { icon: typeof Info; color: string; bgColor: string; label: string }> = {
  debug: { icon: Bug, color: "text-gray-500", bgColor: "bg-gray-500/10", label: "Debug" },
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Info" },
  warn: { icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Warnung" },
  error: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10", label: "Fehler" },
  security: { icon: Shield, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Sicherheit" },
  performance: { icon: Gauge, color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Performance" },
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

function LogEntryRow({ log, isExpanded, onToggle }: { log: LogEntry; isExpanded: boolean; onToggle: () => void }) {
  const config = levelConfig[log.level] || levelConfig.info;
  const Icon = config.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`border-b last:border-b-0 ${config.bgColor}`}>
        <CollapsibleTrigger asChild>
          <button 
            className="w-full p-3 text-left hover-elevate flex items-start gap-3"
            data-testid={`log-entry-${log.timestamp}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            <div className="flex-shrink-0">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`${config.color} text-xs`}>
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {sourceLabels[log.source] || log.source}
                </Badge>
                {log.entityType && log.entityType !== "none" && (
                  <Badge variant="outline" className="text-xs">
                    {log.entityType}{log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {log.timestampFormatted}
                </span>
              </div>
              <p className="font-medium mt-1 line-clamp-1">{log.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{log.description}</p>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-12 pb-4 space-y-3">
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-sm font-medium mb-1">Beschreibung</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.description}</p>
            </div>
            
            {log.error && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Fehlerbeschreibung</p>
                  <p className="text-sm">{log.error.description}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Ursache</p>
                  <p className="text-sm">{log.error.cause}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Losungsvorschlag</p>
                  <p className="text-sm">{log.error.solution}</p>
                </div>
              </div>
            )}
            
            {(log.tenantId || log.userId) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {log.tenantId && <span>Mandant: {log.tenantId}</span>}
                {log.userId && <span>Benutzer: {log.userId}</span>}
              </div>
            )}
            
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Zusatzdaten</p>
                <pre className="text-xs overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
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

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("search", searchQuery);
  if (levelFilter !== "all") queryParams.set("level", levelFilter);
  if (sourceFilter !== "all") queryParams.set("source", sourceFilter);
  queryParams.set("limit", limit.toString());
  queryParams.set("offset", offset.toString());

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
      if (next.has(timestamp)) {
        next.delete(timestamp);
      } else {
        next.add(timestamp);
      }
      return next;
    });
  };

  const handleExport = (format: "txt" | "csv" | "json") => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (searchQuery) params.set("search", searchQuery);
    if (levelFilter !== "all") params.set("level", levelFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    window.open(`/api/logs/export?${params.toString()}`, "_blank");
  };

  const levelCounts = data?.logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">System-Logs</h1>
            <p className="text-muted-foreground">Uberwachen Sie Systemereignisse und analysieren Sie Fehler</p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(levelConfig).map(([level, config]) => {
            const Icon = config.icon;
            const count = levelCounts[level] || 0;
            return (
              <Card 
                key={level} 
                className={`cursor-pointer hover-elevate ${levelFilter === level ? "ring-2 ring-primary" : ""}`}
                onClick={() => setLevelFilter(levelFilter === level ? "all" : level)}
                data-testid={`filter-level-${level}`}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="In Logs suchen..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOffset(0);
                  }}
                  className="pl-10"
                  data-testid="input-search-logs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={levelFilter} onValueChange={(val) => { setLevelFilter(val); setOffset(0); }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-level-filter">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Level</SelectItem>
                    {Object.entries(levelConfig).map(([level, config]) => (
                      <SelectItem key={level} value={level}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(val) => { setSourceFilter(val); setOffset(0); }}>
                  <SelectTrigger className="w-[180px]" data-testid="select-source-filter">
                    <SelectValue placeholder="Quelle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Quellen</SelectItem>
                    {Object.entries(sourceLabels).map(([source, label]) => (
                      <SelectItem key={source} value={source}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Logs werden geladen...</p>
              </div>
            ) : data?.logs.length === 0 ? (
              <div className="p-8 text-center">
                <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Logs gefunden</h3>
                <p className="text-muted-foreground">
                  {searchQuery || levelFilter !== "all" || sourceFilter !== "all"
                    ? "Versuchen Sie andere Filterkriterien"
                    : "Es wurden noch keine Logs erfasst"}
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {data?.logs.map((log) => (
                      <LogEntryRow
                        key={log.timestamp}
                        log={log}
                        isExpanded={expandedLogs.has(log.timestamp)}
                        onToggle={() => toggleExpanded(log.timestamp)}
                      />
                    ))}
                  </div>
                </ScrollArea>
                {data && data.total > limit && (
                  <div className="p-4 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Zeige {offset + 1} - {Math.min(offset + limit, data.total)} von {data.total} Einträgen
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={offset === 0}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        data-testid="button-prev-page"
                      >
                        Zurück
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
