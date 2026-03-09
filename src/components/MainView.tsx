import { useEffect } from 'react';
import { useUIStore } from '../state/uiStore';
import { useTransportStore } from '../state/transportStore';
import { SamplerView } from './Sampler/SamplerView';
import { DrumSequencerList } from './DrumSequencer/DrumSequencerList';
import { DrumSequencerView } from './DrumSequencer/DrumSequencerView';
import { MelodySequencerList } from './MelodySequencer/MelodySequencerList';
import { MelodySequencerView } from './MelodySequencer/MelodySequencerView';
import { SongView } from './SongView/SongView';

export function MainView() {
  const activeView = useUIStore((s) => s.activeView);
  const editingSequenceId = useUIStore((s) => s.editingSequenceId);
  const stop = useTransportStore((s) => s.stop);

  // Stop playback when view changes
  useEffect(() => {
    stop();
  }, [activeView, editingSequenceId, stop]);

  switch (activeView) {
    case 'sampler':
      return <SamplerView />;
    case 'drum-list':
      return <DrumSequencerList />;
    case 'drum-edit':
      return editingSequenceId ? <DrumSequencerView sequenceId={editingSequenceId} /> : <DrumSequencerList />;
    case 'melody-list':
      return <MelodySequencerList />;
    case 'melody-edit':
      return editingSequenceId ? <MelodySequencerView sequenceId={editingSequenceId} /> : <MelodySequencerList />;
    case 'song':
      return <SongView />;
    default:
      return <SamplerView />;
  }
}
