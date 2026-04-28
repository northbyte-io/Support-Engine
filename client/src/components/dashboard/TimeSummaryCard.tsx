/**
 * TimeSummaryCard widget
 *
 * Shows today's tracked time for the current agent.
 * Highlights billable hours in green.
 */

import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimeEntry } from "@shared/schema";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function TimeSummaryCard() {
  const today = new Date().toISOString().split("T")[0];

  const { data: entries, isLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", { date: today, agent: "me" }],
    refetchInterval: 120_000,
  });

  const totalMinutes = entries?.reduce((sum, e) => sum + (e.minutes ?? 0), 0) ?? 0;
  const billableMinutes = entries?.filter(e => e.isBillable).reduce((sum, e) => sum + (e.minutes ?? 0), 0) ?? 0;
  const billablePercent = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;

  return (
    <Card className="bg-[var(--dashboard-time-summary-bg,hsl(var(--card)))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-ui-sm font-semibold">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Heute erfasste Zeit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-ui-lg font-semibold text-foreground">
                {formatMinutes(totalMinutes)}
              </span>
              <span className="text-ui-xs text-muted-foreground">erfasst</span>
            </div>

            {totalMinutes > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-ui-sm font-semibold text-billable">
                    {formatMinutes(billableMinutes)}
                  </span>
                  <span className="text-ui-xs text-muted-foreground">
                    abrechenbar ({billablePercent}%)
                  </span>
                </div>

                <div className="space-y-1">
                  <Progress value={billablePercent} className="h-1.5" />
                  <p className="text-2xs text-muted-foreground">
                    {billablePercent}% abrechenbar
                  </p>
                </div>
              </>
            )}

            {totalMinutes === 0 && (
              <p className="text-ui-xs text-muted-foreground">
                Noch keine Zeit erfasst heute
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
