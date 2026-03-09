// Axial hex coordinate system for Musix Pro-style isomorphic keyboard
// Moving right (+q): increase by a configurable interval (default: 2 semitones, whole step)
// Moving up-right (+r): increase by a configurable interval (default: 7 semitones, perfect fifth)

export interface HexCell {
  q: number;
  r: number;
  midiNote: number;
  x: number; // pixel position
  y: number; // pixel position
}

export interface HexLayoutConfig {
  cols: number;
  rows: number;
  hexSize: number; // radius in pixels
  rightInterval: number; // semitones per +q
  upRightInterval: number; // semitones per +r
  rootNote: number; // MIDI note at center
}

const DEFAULT_CONFIG: HexLayoutConfig = {
  cols: 10,
  rows: 6,
  hexSize: 36,
  rightInterval: 2, // whole step
  upRightInterval: 7, // perfect fifth
  rootNote: 60, // C4
};

export function generateHexGrid(config: Partial<HexLayoutConfig> = {}): HexCell[] {
  const c = { ...DEFAULT_CONFIG, ...config };
  const cells: HexCell[] = [];

  const hexWidth = c.hexSize * Math.sqrt(3);
  const hexHeight = c.hexSize * 2;
  const vertSpacing = hexHeight * 0.75;

  // Center offsets
  const centerQ = Math.floor(c.cols / 2);
  const centerR = Math.floor(c.rows / 2);

  for (let r = 0; r < c.rows; r++) {
    for (let q = 0; q < c.cols; q++) {
      const relQ = q - centerQ;
      const relR = r - centerR;

      const midiNote = c.rootNote + relQ * c.rightInterval + relR * c.upRightInterval;

      // Pixel position: offset odd rows
      const x = q * hexWidth + (r % 2 === 1 ? hexWidth / 2 : 0);
      const y = (c.rows - 1 - r) * vertSpacing; // flip Y so higher notes are up

      if (midiNote >= 0 && midiNote <= 127) {
        cells.push({ q, r, midiNote, x, y });
      }
    }
  }

  return cells;
}

export function getHexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return points.join(' ');
}

export function getHexClipPath(size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = 50 + 50 * Math.cos(angle);
    const y = 50 + 50 * Math.sin(angle);
    points.push(`${x}% ${y}%`);
  }
  return `polygon(${points.join(', ')})`;
}
