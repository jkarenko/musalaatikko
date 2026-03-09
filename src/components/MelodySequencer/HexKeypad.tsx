import { useMemo } from 'react';
import { generateHexGrid, getHexClipPath } from '../../utils/hexLayout';
import { isNoteInScale, midiToNoteName, NOTE_NAMES } from '../../utils/scales';
import styles from './HexKeypad.module.css';

interface HexKeypadProps {
  rootKey: number;
  scale: string;
  onNoteInput: (midiNote: number) => void;
}

export function HexKeypad({ rootKey, scale, onNoteInput }: HexKeypadProps) {
  const hexSize = 34;
  const clipPath = useMemo(() => getHexClipPath(hexSize), [hexSize]);

  const cells = useMemo(() =>
    generateHexGrid({
      cols: 10,
      rows: 5,
      hexSize,
      rightInterval: 2,
      upRightInterval: 7,
      rootNote: rootKey,
    }),
  [rootKey, hexSize]);

  const gridWidth = useMemo(() => {
    if (cells.length === 0) return 0;
    return Math.max(...cells.map((c) => c.x)) + hexSize * 2;
  }, [cells, hexSize]);

  const gridHeight = useMemo(() => {
    if (cells.length === 0) return 0;
    return Math.max(...cells.map((c) => c.y)) + hexSize * 2;
  }, [cells, hexSize]);

  // Color mapping based on note degree relative to root
  const getNoteColor = (midiNote: number): string => {
    const semitone = ((midiNote - rootKey) % 12 + 12) % 12;
    if (semitone === 0) return 'var(--color-melody)'; // root
    const inScale = isNoteInScale(midiNote, rootKey, scale);
    if (!inScale) return 'var(--bg-elevated)';
    // Color gradient for scale degrees
    const hue = (semitone * 30) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.grid}
        style={{ width: gridWidth, height: gridHeight, position: 'relative' }}
      >
        {cells.map((cell) => {
          const inScale = isNoteInScale(cell.midiNote, rootKey, scale);
          const isRoot = ((cell.midiNote - rootKey) % 12 + 12) % 12 === 0;
          const noteName = NOTE_NAMES[cell.midiNote % 12];
          const octave = Math.floor(cell.midiNote / 12) - 1;

          return (
            <button
              key={`${cell.q}-${cell.r}`}
              className={`${styles.hex} ${inScale ? styles.inScale : styles.outScale} ${
                isRoot ? styles.root : ''
              }`}
              style={{
                left: cell.x,
                top: cell.y,
                width: hexSize * Math.sqrt(3),
                height: hexSize * 2,
                clipPath: clipPath,
                backgroundColor: getNoteColor(cell.midiNote),
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                onNoteInput(cell.midiNote);
              }}
            >
              <span className={styles.hexLabel}>{noteName}</span>
              <span className={styles.hexOctave}>{octave}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
