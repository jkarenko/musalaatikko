export const SCALES: Record<string, number[]> = {
  chromatic:         [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major:             [0, 2, 4, 5, 7, 9, 11],
  minor:             [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major:  [0, 2, 4, 7, 9],
  pentatonic_minor:  [0, 3, 5, 7, 10],
  blues:             [0, 3, 5, 6, 7, 10],
  dorian:            [0, 2, 3, 5, 7, 9, 10],
  mixolydian:        [0, 2, 4, 5, 7, 9, 10],
  harmonic_minor:    [0, 2, 3, 5, 7, 8, 11],
  melodic_minor:     [0, 2, 3, 5, 7, 9, 11],
  phrygian:          [0, 1, 3, 5, 7, 8, 10],
  lydian:            [0, 2, 4, 6, 7, 9, 11],
  whole_tone:        [0, 2, 4, 6, 8, 10],
};

export const SCALE_NAMES: Record<string, string> = {
  chromatic: 'Chromatic',
  major: 'Major',
  minor: 'Minor',
  pentatonic_major: 'Pentatonic Major',
  pentatonic_minor: 'Pentatonic Minor',
  blues: 'Blues',
  dorian: 'Dorian',
  mixolydian: 'Mixolydian',
  harmonic_minor: 'Harmonic Minor',
  melodic_minor: 'Melodic Minor',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  whole_tone: 'Whole Tone',
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function isNoteInScale(midiNote: number, rootNote: number, scaleKey: string): boolean {
  const intervals = SCALES[scaleKey];
  if (!intervals) return false;
  const semitone = ((midiNote - rootNote) % 12 + 12) % 12;
  return intervals.includes(semitone);
}

export function getScaleNotes(rootNote: number, scaleKey: string, minNote: number, maxNote: number): number[] {
  const intervals = SCALES[scaleKey] ?? SCALES.chromatic;
  const notes: number[] = [];
  for (let midi = minNote; midi <= maxNote; midi++) {
    const semitone = ((midi - rootNote) % 12 + 12) % 12;
    if (intervals.includes(semitone)) {
      notes.push(midi);
    }
  }
  return notes;
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

export function noteNameToMidi(name: string): number {
  // e.g., "C4" => 60
  const match = name.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const noteIndex = NOTE_NAMES.indexOf(match[1]);
  const octave = parseInt(match[2]);
  return (octave + 1) * 12 + noteIndex;
}
