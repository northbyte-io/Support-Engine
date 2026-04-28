/**
 * CommentBlock
 *
 * Renders a single comment with avatar, author, timestamp, and body.
 * Agents see an optional time-entry chip below the body when a time
 * entry is associated with this comment.
 *
 * Body is rendered as DOMPurify-sanitised HTML from TipTap.
 */

import DOMPurify from "dompurify";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Lock, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Comment, TimeEntry } from "@shared/schema";

type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role?: string;
};

type CommentWithAuthor = Comment & {
  author?: CommentAuthor | null;
};

interface CommentBlockProps {
  comment: CommentWithAuthor;
  /** When true, show agent-only UI (time entry chip, internal badge) */
  isAgent: boolean;
  /** Optional time entry linked to this comment */
  timeEntry?: TimeEntry | null;
}

function getInitials(firstName?: string, lastName?: string): string {
  return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?";
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function CommentBlock({
  comment,
  isAgent,
  timeEntry,
}: Readonly<CommentBlockProps>) {
  const isInternal = comment.visibility === "internal";
  const safeHtml = DOMPurify.sanitize(comment.content ?? "");

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 rounded-lg",
        isInternal
          ? "bg-status-waiting/5 border border-status-waiting/20"
          : "bg-transparent"
      )}
      data-testid={`comment-${comment.id}`}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={comment.author?.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {getInitials(comment.author?.firstName, comment.author?.lastName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-ui-sm font-medium text-foreground">
            {comment.author?.firstName} {comment.author?.lastName}
          </span>
          <time
            className="font-mono text-2xs text-muted-foreground"
            dateTime={comment.createdAt?.toString()}
            title={comment.createdAt
              ? format(new Date(comment.createdAt), "dd.MM.yyyy HH:mm", { locale: de })
              : ""}
          >
            {comment.createdAt
              ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: de })
              : ""}
          </time>

          {/* Internal badge — agents only */}
          {isAgent && isInternal && (
            <span className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded bg-status-waiting/10 text-status-waiting">
              <Lock className="w-2.5 h-2.5" />
              Intern
            </span>
          )}
        </div>

        {/* Body — rendered HTML from TipTap, sanitised */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {/* Time-entry chip — agents only */}
        {isAgent && timeEntry && timeEntry.minutes > 0 && (
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-2xs
            bg-[var(--comment-time-entry-bg,hsl(var(--muted)/0.5))]
            border-[var(--comment-time-entry-border,hsl(var(--border)))]">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-foreground/80">
              {formatMinutes(timeEntry.minutes)}
            </span>
            {timeEntry.isBillable && (
              <span className="flex items-center gap-1 text-billable">
                <span className="w-1.5 h-1.5 rounded-full bg-billable inline-block" />
                Abrechenbar
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
