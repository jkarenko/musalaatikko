import { create } from 'zustand';
import { ActiveView, DrawerType } from './types';

interface UIState {
  activeView: ActiveView;
  editingSequenceId: string | null;
  drawerOpen: boolean;
  drawerType: DrawerType;

  setView: (view: ActiveView, sequenceId?: string | null) => void;
  openDrawer: (type: 'samples' | 'sequences') => void;
  closeDrawer: () => void;
  toggleDrawer: (type: 'samples' | 'sequences') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: 'sampler',
  editingSequenceId: null,
  drawerOpen: false,
  drawerType: null,

  setView: (view, sequenceId = null) => {
    set({
      activeView: view,
      editingSequenceId: sequenceId,
      drawerOpen: false,
      drawerType: null,
    });
  },

  openDrawer: (type) => {
    set({ drawerOpen: true, drawerType: type });
  },

  closeDrawer: () => {
    set({ drawerOpen: false, drawerType: null });
  },

  toggleDrawer: (type) => {
    const state = get();
    if (state.drawerOpen && state.drawerType === type) {
      set({ drawerOpen: false, drawerType: null });
    } else {
      set({ drawerOpen: true, drawerType: type });
    }
  },
}));
