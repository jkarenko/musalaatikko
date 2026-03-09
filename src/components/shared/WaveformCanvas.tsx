import { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  peaks: number[];
  width: number;
  height: number;
  color?: string;
  className?: string;
}

export function WaveformCanvas({
  peaks,
  width,
  height,
  color = 'var(--color-waveform)',
  className,
}: WaveformCanvasProps) {
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

    // Resolve CSS variable color
    const computedColor = getComputedStyle(canvas).getPropertyValue('--waveform-color').trim() || '#74c0fc';

    const lineWidth = 2;
    const gap = 2;
    const step = lineWidth + gap;
    const midY = height / 2;
    const maxBars = Math.floor(width / step);

    ctx.fillStyle = computedColor;

    for (let i = 0; i < maxBars && i < peaks.length; i++) {
      const x = i * step;
      const barHeight = Math.max(1, peaks[i] * height * 0.9);
      ctx.fillRect(x, midY - barHeight / 2, lineWidth, barHeight);
    }
  }, [peaks, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        ['--waveform-color' as string]: color,
      }}
      className={className}
    />
  );
}
