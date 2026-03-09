import { create } from 'zustand';
import { generateId } from '../utils/id';
import { MelodySequence, MelodyNote } from './types';

interface MelodySequencerState {
  sequences: Record<string, MelodySequence>;
  sequenceOrder: string[];

  createSequence: (name?: string) => string;
  deleteSequence: (id: string) => void;
  renameSequence: (id: string, name: string) => void;
  setStep: (seqId: string, step: number, note: MelodyNote | null) => void;
  clearStep: (seqId: string, step: number) => void;
  assignSample: (seqId: string, sampleId: string) => void;
  setRootKey: (seqId: string, rootKey: number) => void;
  setScale: (seqId: string, scale: string) => void;
  getSequence: (id: string) => MelodySequence | undefined;
}

export const useMelodySequencerStore = create<MelodySequencerState>((set, get) => ({
  sequences: {},
  sequenceOrder: [],

  createSequence: (name) => {
    const id = generateId();
    const seq: MelodySequence = {
      id,
      name: name ?? `Melody ${Object.keys(get().sequences).length + 1}`,
      sampleId: null,
      steps: Array(16).fill(null),
      rootKey: 60, // C4
      scale: 'major',
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

  setStep: (seqId, step, note) => {
    set((state) => {
      const seq = state.sequences[seqId];
      if (!seq) return state;
      const newSteps = [...seq.steps];
      newSteps[step] = note;
      return {
        sequences: {
          ...state.sequences,
          [seqId]: { ...seq, steps: newSteps },
        },
      };
    });
  },

  clearStep: (seqId, step) => {
    get().setStep(seqId, step, null);
  },

  assignSample: (seqId, sampleId) => {
    set((state) => ({
      sequences: {
        ...state.sequences,
        [seqId]: { ...state.sequences[seqId], sampleId },
      },
    }));
  },

  setRootKey: (seqId, rootKey) => {
    set((state) => ({
      sequences: {
        ...state.sequences,
        [seqId]: { ...state.sequences[seqId], rootKey },
      },
    }));
  },

  setScale: (seqId, scale) => {
    set((state) => ({
      sequences: {
        ...state.sequences,
        [seqId]: { ...state.sequences[seqId], scale },
      },
    }));
  },

  getSequence: (id) => get().sequences[id],
}));
