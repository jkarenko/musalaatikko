export type ActiveView =
  | 'sampler'
  | 'drum-list'
  | 'drum-edit'
  | 'melody-list'
  | 'melody-edit'
  | 'song';

export type DrawerType = 'samples' | 'sequences' | null;

export interface DrumTrack {
  id: string;
  sampleId: string | null;
  name: string;
  steps: boolean[];
  gain: number;
}

export interface DrumSequence {
  id: string;
  name: string;
  tracks: DrumTrack[];
  createdAt: number;
}

export interface MelodyNote {
  note: number; // MIDI note number
  velocity: number;
}

export interface MelodySequence {
  id: string;
  name: string;
  sampleId: string | null;
  steps: (MelodyNote | null)[];
  rootKey: number; // MIDI note for root (e.g., 60 = C4)
  scale: string;
  createdAt: number;
}

export interface SongItem {
  id: string;
  type: 'drum-sequence' | 'melody-sequence' | 'sample';
  sourceId: string;
  trackIndex: number;
  startBeat: number;
}
