import { create } from 'zustand';
import { generateId } from '../utils/id';
import { SongItem } from './types';

interface SongState {
  items: SongItem[];
  trackCount: number;

  addItem: (item: Omit<SongItem, 'id'>) => string;
  moveItem: (id: string, trackIndex: number, startBeat: number) => void;
  removeItem: (id: string) => void;
  getTotalBeats: () => number;
}

export const useSongStore = create<SongState>((set, get) => ({
  items: [],
  trackCount: 4,

  addItem: (item) => {
    const id = generateId();
    set((state) => {
      const newItems = [...state.items, { ...item, id }];
      const maxTrack = Math.max(...newItems.map((i) => i.trackIndex), state.trackCount - 1);
      return {
        items: newItems,
        trackCount: Math.max(state.trackCount, maxTrack + 2), // always have one empty track
      };
    });
    return id;
  },

  moveItem: (id, trackIndex, startBeat) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, trackIndex, startBeat } : item
      ),
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  getTotalBeats: () => {
    const { items } = get();
    if (items.length === 0) return 16;
    // Each sequence is 4 bars = 16 beats, samples we estimate as 1 beat minimum
    let maxEnd = 16;
    for (const item of items) {
      const duration = item.type === 'sample' ? 1 : 16;
      maxEnd = Math.max(maxEnd, item.startBeat + duration);
    }
    return Math.ceil(maxEnd / 4) * 4; // Round up to nearest 4 beats
  },
}));
