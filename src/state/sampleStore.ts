import { create } from 'zustand';
import { generateId } from '../utils/id';
import { SampleData } from '../audio/types';
import { processRecordedSample, computeWaveformData } from '../audio/SampleProcessor';

interface SampleState {
  samples: Record<string, SampleData>;
  sampleOrder: string[]; // ordered by creation, newest first

  addRecordedSample: (name: string, rawBuffer: AudioBuffer) => string;
  addProcessedSample: (name: string, buffer: AudioBuffer) => string;
  deleteSample: (id: string) => void;
  renameSample: (id: string, name: string) => void;
  getSample: (id: string) => SampleData | undefined;
}

export const useSampleStore = create<SampleState>((set, get) => ({
  samples: {},
  sampleOrder: [],

  addRecordedSample: (name, rawBuffer) => {
    const processed = processRecordedSample(rawBuffer);
    return get().addProcessedSample(name, processed);
  },

  addProcessedSample: (name, buffer) => {
    const id = generateId();
    const sample: SampleData = {
      id,
      name,
      buffer,
      waveformData: computeWaveformData(buffer),
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      createdAt: Date.now(),
    };

    set((state) => ({
      samples: { ...state.samples, [id]: sample },
      sampleOrder: [id, ...state.sampleOrder],
    }));

    return id;
  },

  deleteSample: (id) => {
    set((state) => {
      const { [id]: _, ...rest } = state.samples;
      return {
        samples: rest,
        sampleOrder: state.sampleOrder.filter((sid) => sid !== id),
      };
    });
  },

  renameSample: (id, name) => {
    set((state) => ({
      samples: {
        ...state.samples,
        [id]: { ...state.samples[id], name },
      },
    }));
  },

  getSample: (id) => get().samples[id],
}));
