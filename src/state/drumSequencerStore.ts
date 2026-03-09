import { create } from 'zustand';
import { generateId } from '../utils/id';
import { DrumSequence, DrumTrack } from './types';

interface DrumSequencerState {
  sequences: Record<string, DrumSequence>;
  sequenceOrder: string[];

  createSequence: (name?: string) => string;
  deleteSequence: (id: string) => void;
  renameSequence: (id: string, name: string) => void;
  addTrack: (seqId: string, name?: string) => string;
  removeTrack: (seqId: string, trackId: string) => void;
  toggleStep: (seqId: string, trackId: string, step: number) => void;
  assignSample: (seqId: string, trackId: string, sampleId: string) => void;
  renameTrack: (seqId: string, trackId: string, name: string) => void;
  getSequence: (id: string) => DrumSequence | undefined;
}

function createEmptyTrack(name: string): DrumTrack {
  return {
    id: generateId(),
    sampleId: null,
    name,
    steps: Array(16).fill(false),
    gain: 1,
  };
}

export const useDrumSequencerStore = create<DrumSequencerState>((set, get) => ({
  sequences: {},
  sequenceOrder: [],

  createSequence: (name) => {
    const id = generateId();
    const seq: DrumSequence = {
      id,
      name: name ?? `Drum ${Object.keys(get().sequences).length + 1}`,
      tracks: [
        createEmptyTrack('Kick'),
        createEmptyTrack('Snare'),
        createEmptyTrack('Hi-hat'),
        createEmptyTrack('Clap'),
      ],
      createdAt: Date.now(),
    };
    set((state) => ({
      sequences: { ...state.sequences, [id]: seq },
      sequenceOrder: [id, ...state.sequenceOrder],
    }));
    return id;
  },

  deleteSequence: (id) => {
    set((state) => {
      const { [id]: _, ...rest } = state.sequences;
      return {
        sequences: rest,
        sequenceOrder: state.sequenceOrder.filter((sid) => sid !== id),
      };
    });
  },

  renameSequence: (id, name) => {
    set((state) => ({
      sequences: {
        ...state.sequences,
        [id]: { ...state.sequences[id], name },
      },
    }));
  },

  addTrack: (seqId, name) => {
    const trackId = generateId();
    set((state) => {
      const seq = state.sequences[seqId];
      if (!seq) return state;
      const track = createEmptyTrack(name ?? `Track ${seq.tracks.length + 1}`);
      return {
        sequences: {
          ...state.sequences,
          [seqId]: {
            ...seq,
            tracks: [...seq.tracks, { ...track, id: trackId }],
          },
        },
      };
    });
    return trackId;
  },

  removeTrack: (seqId, trackId) => {
    set((state) => {
      const seq = state.sequences[seqId];
      if (!seq) return state;
      return {
        sequences: {
          ...state.sequences,
          [seqId]: {
            ...seq,
            tracks: seq.tracks.filter((t) => t.id !== trackId),
          },
        },
      };
    });
  },

  toggleStep: (seqId, trackId, step) => {
    set((state) => {
      const seq = state.sequences[seqId];
      if (!seq) return state;
      return {
        sequences: {
          ...state.sequences,
          [seqId]: {
            ...seq,
            tracks: seq.tracks.map((t) =>
              t.id === trackId
                ? { ...t, steps: t.steps.map((s, i) => (i === step ? !s : s)) }
                : t
            ),
          },
        },
      };
    });
  },

  assignSample: (seqId, trackId, sampleId) => {
    set((state) => {
      const seq = state.sequences[seqId];
      if (!seq) return state;
      return {
        sequences: {
          ...state.sequences,
          [seqId]: {
            ...seq,
            tracks: seq.tracks.map((t) =>
              t.id === trackId ? { ...t, sampleId } : t
            ),
          },
        },
      };
    });
  },

  renameTrack: (seqId, trackId, name) => {
    set((state) => {
      const seq = state.sequences[seqId];
      if (!seq) return state;
      return {
        sequences: {
          ...state.sequences,
          [seqId]: {
            ...seq,
            tracks: seq.tracks.map((t) =>
              t.id === trackId ? { ...t, name } : t
            ),
          },
        },
      };
    });
  },

  getSequence: (id) => get().sequences[id],
}));
