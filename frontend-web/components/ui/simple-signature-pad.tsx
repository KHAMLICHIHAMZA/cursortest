'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type SigPadProps = {
  className?: string;
  /** Hauteur d’affichage (doigt / stylet : viser ≥ 180px en agence) */
  height?: number;
  onChange?: (dataUrl: string | null) => void;
};

const CANVAS_W = 800;
const CANVAS_H = 240;

function bitmapCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  const w = r.width || 1;
  const h = r.height || 1;
  return {
    x: ((clientX - r.left) / w) * CANVAS_W,
    y: ((clientY - r.top) / h) * CANVAS_H,
  };
}

/**
 * Signature électronique utilisable souris, tactile tablette et stylet.
 * Utilise l’API Pointer Events + setPointerCapture pour éviter le scroll de page pendant le tracé.
 */
export function SimpleSignaturePad({ className, height = 192, onChange }: SigPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const activePointerId = useRef<number | null>(null);

  const setupContext = useCallback((canvas: HTMLCanvasElement) => {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.75;
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setupContext(canvas);
    onChange?.(null);
  }, [onChange, setupContext]);

  const endPointerDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (activePointerId.current !== e.pointerId) return;
      activePointerId.current = null;
      drawing.current = false;
      if (canvas?.hasPointerCapture?.(e.pointerId)) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* capture déjà relâchée */
        }
      }
    },
    [],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (activePointerId.current !== null) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    activePointerId.current = e.pointerId;
    drawing.current = true;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* navigateur très ancien */
    }

    const { x, y } = bitmapCoords(canvas, e.clientX, e.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = bitmapCoords(canvas, e.clientX, e.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
    onChange?.(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupContext(canvas);
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    onChange?.(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <canvas
        ref={canvasRef}
        className="w-full max-w-full rounded-md border border-border bg-white cursor-crosshair"
        style={{ height, touchAction: 'none' }}
        aria-label="Zone de signature"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrawing}
        onPointerCancel={endPointerDrawing}
      />
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Effacer la signature
        </Button>
      </div>
    </div>
  );
}
