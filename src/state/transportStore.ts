import { create } from 'zustand';
import { scheduler } from '../audio/Scheduler';
import { playMetronomeClick, isBeatStep } from '../audio/Metronome';
import { audioEngine } from '../audio/AudioEngine';

interface TransportState {
  tempo: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;
  timeSignature: [number, number];
  metronomeEnabled: boolean;

  setTempo: (bpm: number) => void;
  incrementTempo: () => void;
  decrementTempo: () => void;
  play: () => void;
  stop: () => void;
  toggleRecord: () => void;
  toggleMetronome: () => void;
  setCurrentStep: (step: number) => void;

  // Callbacks registered by active sequencer views
  _onStep: ((step: number, time: number) => void) | null;
  setOnStep: (cb: ((step: number, time: number) => void) | null) => void;
}

export const useTransportStore = create<TransportState>((set, get) => ({
  tempo: 120,
  isPlaying: false,
  isRecording: false,
  currentStep: -1,
  timeSignature: [4, 4],
  metronomeEnabled: true,
  _onStep: null,

  setTempo: (bpm) => {
    const clamped = Math.max(30, Math.min(300, bpm));
    set({ tempo: clamped });
    scheduler.tempo = clamped;
  },

  incrementTempo: () => {
    const { tempo, setTempo } = get();
    setTempo(tempo + 1);
  },

  decrementTempo: () => {
    const { tempo, setTempo } = get();
    setTempo(tempo - 1);
  },

  play: () => {
    const state = get();
    if (state.isPlaying) return;

    audioEngine.resume();
    scheduler.tempo = state.tempo;

    set({ isPlaying: true, currentStep: 0 });

    scheduler.start(
      (step, time) => {
        const s = get();
        // Metronome
        if (s.metronomeEnabled && isBeatStep(step)) {
          playMetronomeClick(time, step === 0);
        }
        // Sequencer callback
        s._onStep?.(step, time);
      },
      (step) => {
        set({ currentStep: step });
      }
    );
  },

  stop: () => {
    scheduler.stop();
    set({ isPlaying: false, currentStep: -1, isRecording: false });
  },

  toggleRecord: () => {
    set((state) => ({ isRecording: !state.isRecording }));
  },

  toggleMetronome: () => {
    set((state) => ({ metronomeEnabled: !state.metronomeEnabled }));
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  setOnStep: (cb) => set({ _onStep: cb }),
}));
