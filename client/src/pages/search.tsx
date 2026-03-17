import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Ticket, BookOpen, Users, Building2, UserRound,
  Search, ArrowRight, ChevronRight, Loader2, X,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface SearchResults {
  tickets: { id: string; ticketNumber: string; title: string; status: string; priority: string; createdAt: string | null }[];
  articles: { id: string; title: string; summary: string | null; status: string }[];
  customers: { id: string; name: string; email: string | null; customerNumber: string }[];
  organizations: { id: string; name: string; email: string | null; industry: string | null }[];
  contacts: { id: string; firstName: string; lastName: string; email: string | null; title: string | null }[];
  total: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig", medium: "Mittel", high: "Hoch", urgent: "Dringend", critical: "Kritisch",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf", published: "Veröffentlicht", archived: "Archiviert",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function SectionHeader({ icon: Icon, label, count, color }: {
  icon: typeof Ticket; label: string; count: number; color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-md ${color}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Badge variant="secondary" className="text-xs h-5 px-1.5 font-mono">{count}</Badge>
    </div>
  );
}

function ResultRow({ onClick, children, testId }: {
  onClick: () => void; children: React.ReactNode; testId?: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/60 transition-colors group"
      onClick={onClick}
      data-testid={testId}
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 transition-colors" />
    </button>
  );
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const initialQuery = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("q") ?? ""
    : "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setSearched(false);
      return;
    }
    setIsLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data: SearchResults = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  // Sync URL param when query changes
  useEffect(() => {
    const url = query.trim()
      ? `/search?q=${encodeURIComponent(query.trim())}`
      : "/search";
    window.history.replaceState({}, "", url);
  }, [query]);

  const hasResults = results && results.total > 0;
  const isEmpty = searched && !isLoading && results?.total === 0;

  return (
    <MainLayout title="Suche">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus
            placeholder="Tickets, Artikel, Kunden, Kontakte, Unternehmen durchsuchen…"
            className="pl-12 pr-10 h-12 text-base bg-muted/30 border-border/60 focus-visible:ring-primary"
            value={query}
            onChange={e => setQuery(e.target.value)}
            data-testid="input-global-search"
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setQuery(""); setResults(null); setSearched(false); }}
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Hint before search */}
        {!searched && !query && (
          <div className="text-center py-16 space-y-3">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-muted/40">
                <Search className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Suchbegriff eingeben, um Ergebnisse zu sehen</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["Tickets", "Wissensdatenbank", "Kunden", "Kontakte", "Unternehmen"].map(label => (
                <span key={label} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  {label === "Tickets" && <Ticket className="h-3 w-3" />}
                  {label === "Wissensdatenbank" && <BookOpen className="h-3 w-3" />}
                  {label === "Kunden" && <Users className="h-3 w-3" />}
                  {label === "Kontakte" && <UserRound className="h-3 w-3" />}
                  {label === "Unternehmen" && <Building2 className="h-3 w-3" />}
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-10 w-full rounded-lg" />)}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-16 space-y-2">
            <p className="text-base font-medium text-foreground">
              Keine Ergebnisse für „{debouncedQuery}"
            </p>
            <p className="text-sm text-muted-foreground">
              Versuche einen anderen Suchbegriff oder überprüfe die Rechtschreibung.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasResults && (
          <div className="space-y-6">
            {/* Summary */}
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.total}</span>{" "}
              Ergebnis{results.total !== 1 ? "se" : ""} für „<span className="font-medium text-foreground">{debouncedQuery}</span>"
            </p>

            {/* Tickets */}
            {results.tickets.length > 0 && (
              <section data-testid="section-tickets">
                <SectionHeader icon={Ticket} label="Tickets" count={results.tickets.length} color="bg-primary" />
                <div className="space-y-0.5">
                  {results.tickets.map(t => (
                    <ResultRow
                      key={t.id}
                      onClick={() => setLocation(`/tickets/${t.id}`)}
                      testId={`result-ticket-${t.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{t.ticketNumber}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                          {t.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true, locale: de })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={t.status} />
                      </div>
                    </ResultRow>
                  ))}
                </div>
                <button
                  className="mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 transition-colors"
                  onClick={() => setLocation(`/tickets?q=${encodeURIComponent(debouncedQuery)}`)}
                  data-testid="link-all-ticket-results"
                >
                  Alle Tickets durchsuchen <ArrowRight className="h-3 w-3" />
                </button>
              </section>
            )}

            {/* KB Articles */}
            {results.articles.length > 0 && (
              <section data-testid="section-articles">
                <SectionHeader icon={BookOpen} label="Wissensdatenbank" count={results.articles.length} color="bg-emerald-600" />
                <div className="space-y-0.5">
                  {results.articles.map(a => (
                    <ResultRow
                      key={a.id}
                      onClick={() => setLocation(`/knowledge-base?article=${a.id}`)}
                      testId={`result-article-${a.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                        {a.summary && (
                          <p className="text-xs text-muted-foreground truncate">{a.summary}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {STATUS_LABEL[a.status] ?? a.status}
                      </Badge>
                    </ResultRow>
                  ))}
                </div>
              </section>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <section data-testid="section-customers">
                <SectionHeader icon={Users} label="Kunden" count={results.customers.length} color="bg-sky-600" />
                <div className="space-y-0.5">
                  {results.customers.map(c => (
                    <ResultRow
                      key={c.id}
                      onClick={() => setLocation(`/customers/${c.id}`)}
                      testId={`result-customer-${c.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.customerNumber}{c.email ? ` · ${c.email}` : ""}
                        </p>
                      </div>
                    </ResultRow>
                  ))}
                </div>
              </section>
            )}

            {/* Organizations */}
            {results.organizations.length > 0 && (
              <section data-testid="section-organizations">
                <SectionHeader icon={Building2} label="Unternehmen" count={results.organizations.length} color="bg-violet-600" />
                <div className="space-y-0.5">
                  {results.organizations.map(o => (
                    <ResultRow
                      key={o.id}
                      onClick={() => setLocation(`/organizations`)}
                      testId={`result-org-${o.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{o.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.industry ? o.industry : ""}
                          {o.industry && o.email ? " · " : ""}
                          {o.email ?? ""}
                        </p>
                      </div>
                    </ResultRow>
                  ))}
                </div>
              </section>
            )}

            {/* Contacts */}
            {results.contacts.length > 0 && (
              <section data-testid="section-contacts">
                <SectionHeader icon={UserRound} label="Kontakte" count={results.contacts.length} color="bg-orange-600" />
                <div className="space-y-0.5">
                  {results.contacts.map(c => (
                    <ResultRow
                      key={c.id}
                      onClick={() => setLocation(`/contacts`)}
                      testId={`result-contact-${c.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.title ? c.title : ""}
                          {c.title && c.email ? " · " : ""}
                          {c.email ?? ""}
                        </p>
                      </div>
                    </ResultRow>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
