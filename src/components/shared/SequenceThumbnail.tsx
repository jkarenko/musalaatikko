import { useRef, useEffect } from 'react';

interface SequenceThumbnailProps {
  type: 'drum' | 'melody';
  tracks?: boolean[][];
  melodySteps?: ({ note: number } | null)[];
  width: number;
  height: number;
}

export function SequenceThumbnail({ type, tracks, melodySteps, width, height }: SequenceThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (type === 'drum' && tracks) {
      const numTracks = tracks.length || 1;
      const stepW = width / 16;
      const trackH = height / numTracks;
      const dotSize = Math.min(stepW * 0.6, trackH * 0.6, 8);

      const colors = ['#ffa94d', '#ff6b6b', '#74c0fc', '#69db7c', '#da77f2', '#ffd43b'];

      for (let t = 0; t < numTracks; t++) {
        const color = colors[t % colors.length];
        ctx.fillStyle = color;
        for (let s = 0; s < 16; s++) {
          if (tracks[t]?.[s]) {
            const x = s * stepW + stepW / 2;
            const y = t * trackH + trackH / 2;
            ctx.beginPath();
            ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else if (type === 'melody' && melodySteps) {
      const stepW = width / 16;
      // Find note range
      const notes = melodySteps.filter(Boolean).map((s) => s!.note);
      if (notes.length === 0) return;
      const minNote = Math.min(...notes);
      const maxNote = Math.max(...notes);
      const range = Math.max(maxNote - minNote, 1);

      ctx.fillStyle = '#69db7c';
      for (let s = 0; s < 16; s++) {
        const step = melodySteps[s];
        if (step) {
          const x = s * stepW + stepW / 2;
          const y = height - ((step.note - minNote) / range) * (height - 8) - 4;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [type, tracks, melodySteps, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        borderRadius: 'var(--border-radius-sm)',
        background: 'var(--bg-primary)',
      }}
    />
  );
}
