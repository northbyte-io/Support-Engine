/**
 * AttachmentList
 *
 * Renders ticket attachments with download and delete actions.
 * Upload is triggered by a hidden file input — the caller provides
 * the `onUpload` callback so progress state can live here.
 *
 * Upload flow: file → FileReader base64 → POST /api/tickets/:id/attachments
 */

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Download, Trash2, Upload, FileText, Image, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Attachment } from "@shared/schema";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return FileArchive;
  return FileText;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentListProps {
  ticketId: string;
  attachments: Attachment[];
}

export function AttachmentList({ ticketId, attachments }: Readonly<AttachmentListProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      apiRequest("DELETE", `/api/attachments/${attachmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/attachments`] });
    },
    onError: () => {
      toast({ title: "Löschen fehlgeschlagen", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toast({ title: `Datei zu groß (max. 20 MB)`, variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(0);
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 60)); // 0–60% for read phase
      }
    };
    reader.onload = async (ev) => {
      const data = ev.target?.result as string;
      setUploadProgress(70);
      try {
        await apiRequest("POST", `/api/tickets/${ticketId}/attachments`, {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          data,
        });
        setUploadProgress(100);
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/attachments`] });
        toast({ title: "Anhang hochgeladen" });
      } catch {
        toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
      } finally {
        setTimeout(() => setUploadProgress(null), 600);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast({ title: "Datei konnte nicht gelesen werden", variant: "destructive" });
      setUploadProgress(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      {attachments.length > 0 ? (
        <div className="space-y-1">
          {attachments.map(a => {
            const Icon = fileIcon(a.mimeType);
            return (
              <div
                key={a.id}
                className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-2xs text-foreground/80 truncate flex-1 leading-tight">
                  {a.fileName}
                </span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatBytes(a.fileSize)}
                </span>
                <div className={cn(
                  "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                )}>
                  <a
                    href={`/api/attachments/${a.id}/download`}
                    download={a.fileName}
                    className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                    aria-label={`${a.fileName} herunterladen`}
                  >
                    <Download className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(a.id)}
                    disabled={deleteMutation.isPending}
                    className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive"
                    aria-label={`${a.fileName} löschen`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-ui-xs text-muted-foreground">Keine Anhänge</p>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="space-y-1 pt-1">
          <Progress value={uploadProgress} className="h-1" />
          <p className="text-[10px] text-muted-foreground">
            {uploadProgress < 100 ? "Wird hochgeladen…" : "Fertig"}
          </p>
        </div>
      )}

      {/* Upload trigger */}
      <Button
        size="sm"
        variant="outline"
        className="mt-1 h-7 text-xs w-full gap-1.5"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadProgress !== null}
        data-testid="button-upload-attachment"
      >
        <Upload className="w-3 h-3" />
        Datei hochladen
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Datei hochladen"
      />
    </div>
  );
}
