import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  className,
  size = "md",
}: Readonly<LoadingSpinnerProps>) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      data-testid="loading-spinner"
    />
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({
  message = "Laden...",
}: Readonly<LoadingPageProps>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function TicketListSkeleton({
  count = 5,
}: Readonly<{ count?: number }>) {
  const keys = useMemo(
    () => Array.from({ length: count }, () => crypto.randomUUID()),
    [count],
  );

  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <TicketCardSkeleton key={key} />
      ))}
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function DashboardSkeleton() {
  const dashboardCardKeys = useMemo(
    () => Array.from({ length: 4 }, () => crypto.randomUUID()),
    [],
  );

  const ticketCardKeys = useMemo(
    () => Array.from({ length: 5 }, () => crypto.randomUUID()),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCardKeys.map((key) => (
          <DashboardCardSkeleton key={key} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {ticketCardKeys.map((key) => (
              <TicketCardSkeleton key={key} />
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

/** Matches the TicketListRow compact design in the three-pane list pane */
export function SkeletonTicketRow() {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTicketList({ count = 6 }: Readonly<{ count?: number }>) {
  const keys = useMemo(
    () => Array.from({ length: count }, () => crypto.randomUUID()),
    [count],
  );
  return (
    <div className="flex flex-col">
      {keys.map((key) => (
        <SkeletonTicketRow key={key} />
      ))}
    </div>
  );
}

/** Matches the CommentBlock bubble layout */
export function SkeletonCommentBlock({ align = "left" }: Readonly<{ align?: "left" | "right" }>) {
  const isRight = align === "right";
  return (
    <div className={cn("flex gap-3", isRight ? "flex-row-reverse" : "flex-row")}>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className={cn("flex flex-col gap-1.5 max-w-[70%]", isRight ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonCommentThread({ count = 3 }: Readonly<{ count?: number }>) {
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ key: crypto.randomUUID(), align: (i % 2 === 0 ? "left" : "right") as "left" | "right" })),
    [count],
  );
  return (
    <div className="flex flex-col gap-4 p-4">
      {items.map(({ key, align }) => (
        <SkeletonCommentBlock key={key} align={align} />
      ))}
    </div>
  );
}

/** Matches the MetaPanel right sidebar structure */
export function SkeletonMetaPanel() {
  return (
    <div className="flex flex-col gap-0 w-full">
      {/* Section 1 — assignee / status / priority */}
      <div className="px-4 py-3 border-b border-border space-y-3">
        <Skeleton className="h-3 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="px-4 py-3 border-b border-border space-y-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="px-4 py-3 border-b border-border space-y-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      {/* Section 2 — SLA countdown */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      {/* Section 3 — customer info */}
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: Readonly<{
  rows?: number;
  cols?: number;
}>) {
  const colKeys = useMemo(
    () => Array.from({ length: cols }, () => crypto.randomUUID()),
    [cols],
  );

  const rowKeys = useMemo(
    () => Array.from({ length: rows }, () => crypto.randomUUID()),
    [rows],
  );

  const cellKeys = useMemo(
    () =>
      rowKeys.map(() =>
        Array.from({ length: cols }, () => crypto.randomUUID()),
      ),
    [rowKeys, cols],
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="grid gap-4 p-4 border-b bg-muted/50"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {colKeys.map((key) => (
          <Skeleton key={key} className="h-4 w-full max-w-[100px]" />
        ))}
      </div>

      {rowKeys.map((rowKey, rowIndex) => (
        <div
          key={rowKey}
          className="grid gap-4 p-4 border-b last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {cellKeys[rowIndex].map((cellKey) => (
            <Skeleton key={cellKey} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
