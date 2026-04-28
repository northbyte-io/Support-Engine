/**
 * SignatureCaptureModal
 *
 * Full-screen forced-light dialog for capturing a customer signature.
 * Uses pointer events for cross-device drawing (mouse + touch + stylus).
 *
 * ALWAYS renders with white background / dark ink regardless of app theme
 * (the technician hands the device to the customer; maximum readability required).
 *
 * Flow:
 *   1. Technician clicks "Unterschrift einholen" in MetaPanel
 *   2. Full-screen canvas opens in light mode
 *   3. Customer draws signature with finger/stylus
 *   4. Technician taps "Unterschrift speichern"
 *   5. Signature is saved via POST /api/tickets/:id/signature
 *   6. MetaPanel shows read-only signature with lock label
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SIGNATURE } from "@/lib/tokens";

interface SignatureCaptureModalProps {
  open: boolean;
  ticketId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SignatureCaptureModal({
  open,
  ticketId,
  onClose,
  onSaved,
}: Readonly<SignatureCaptureModalProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (imageData: string) => {
      await apiRequest("POST", `/api/tickets/${ticketId}/signature`, {
        signature: imageData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      toast({ title: "Unterschrift gespeichert" });
      onSaved();
    },
    onError: () => {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    },
  });

  // Initialise canvas: match resolution to rendered size, fill background
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const raf = requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = SIGNATURE.CANVAS_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasStrokes(false);
    });

    return () => cancelAnimationFrame(raf);
  }, [open]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height),
    };
  };

  const startDraw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStrokes(true);
  }, []);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = SIGNATURE.INK_COLOR;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = SIGNATURE.CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL("image/png");
    saveMutation.mutate(imageData);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      {/* Full-screen on mobile, constrained dialog on sm+ */}
      <DialogContent
        className="flex flex-col gap-0 p-0 rounded-none sm:rounded-lg sm:max-w-2xl h-dvh sm:h-auto"
        // Force light appearance — signature canvas is always white
        style={{
          backgroundColor: SIGNATURE.OVERLAY_BG,
          color: SIGNATURE.TEXT_PRIMARY,
          borderColor: SIGNATURE.BORDER,
        }}
        data-testid="modal-signature-capture"
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: SIGNATURE.TEXT_PRIMARY }}
          >
            <PenLine className="w-5 h-5" />
            Unterschrift einholen
          </DialogTitle>
        </DialogHeader>

        <p
          className="flex-shrink-0 text-sm text-center px-4 pb-2"
          style={{ color: SIGNATURE.TEXT_MUTED }}
        >
          Bitte hier unterschreiben
        </p>

        {/* Canvas — flex-1 fills remaining height on mobile; fixed 250px on desktop */}
        <div
          className="flex-1 min-h-[160px] sm:flex-none sm:h-[250px] mx-4 sm:mx-6 rounded-lg overflow-hidden border"
          style={{ borderColor: SIGNATURE.BORDER }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              touchAction: "none",
              cursor: "crosshair",
              backgroundColor: SIGNATURE.CANVAS_BG,
            }}
            aria-label="Unterschrift-Canvas"
            data-testid="canvas-signature"
          />
        </div>

        {/* Actions — 48px tap height on mobile, 36px on desktop */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 sm:px-6 sm:pt-3 sm:pb-6">
          <Button
            variant="outline"
            onClick={clearCanvas}
            disabled={!hasStrokes}
            className="h-12 sm:h-9 px-4"
            style={{
              borderColor: SIGNATURE.BORDER,
              color: SIGNATURE.TEXT_PRIMARY,
            }}
            data-testid="button-clear-signature"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Löschen
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 sm:h-9 px-4"
              style={{ borderColor: SIGNATURE.BORDER, color: SIGNATURE.TEXT_PRIMARY }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasStrokes || saveMutation.isPending}
              className="h-12 sm:h-9 px-4"
              style={{
                backgroundColor: SIGNATURE.BUTTON_BG,
                color: SIGNATURE.BUTTON_TEXT,
              }}
              data-testid="button-save-signature"
            >
              {saveMutation.isPending ? "Speichert…" : "Unterschrift speichern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
