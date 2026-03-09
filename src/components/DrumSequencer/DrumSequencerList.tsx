import { useCallback } from 'react';
import { useDrumSequencerStore } from '../../state/drumSequencerStore';
import { useSampleStore } from '../../state/sampleStore';
import { useUIStore } from '../../state/uiStore';
import { useTransportStore } from '../../state/transportStore';
import { audioEngine } from '../../audio/AudioEngine';
import { SequenceThumbnail } from '../shared/SequenceThumbnail';
import styles from './DrumSequencerList.module.css';

export function DrumSequencerList() {
  const sequences = useDrumSequencerStore((s) => s.sequenceOrder.map((id) => s.sequences[id]));
  const createSequence = useDrumSequencerStore((s) => s.createSequence);
  const deleteSequence = useDrumSequencerStore((s) => s.deleteSequence);
  const setView = useUIStore((s) => s.setView);
  const samples = useSampleStore((s) => s.samples);
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const play = useTransportStore((s) => s.play);
  const stop = useTransportStore((s) => s.stop);
  const setOnStep = useTransportStore((s) => s.setOnStep);

  const handleNew = useCallback(() => {
    const id = createSequence();
    setView('drum-edit', id);
  }, [createSequence, setView]);

  const handleEdit = useCallback((id: string) => {
    setView('drum-edit', id);
  }, [setView]);

  const handlePlayPreview = useCallback((seqId: string) => {
    const seq = useDrumSequencerStore.getState().sequences[seqId];
    if (!seq) return;

    if (isPlaying) {
      stop();
      return;
    }

    setOnStep((step, time) => {
      for (const track of seq.tracks) {
        if (track.steps[step] && track.sampleId) {
          const sample = samples[track.sampleId];
          if (sample) {
            audioEngine.playSample(sample.buffer, time, track.gain);
          }
        }
      }
    });

    play();
  }, [isPlaying, play, stop, setOnStep, samples]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Drum Sequences</h2>
      </div>

      <div className={styles.list}>
        <button className={styles.newBtn} onPointerDown={handleNew}>
          <span className={styles.plusIcon}>+</span>
          New Drum Sequence
        </button>

        {sequences.map((seq) => (
          <div key={seq.id} className={styles.item}>
            <button
              className={styles.playBtn}
              onPointerDown={() => handlePlayPreview(seq.id)}
            >
              {isPlaying ? '■' : '▶'}
            </button>

            <div className={styles.itemContent} onPointerDown={() => handleEdit(seq.id)}>
              <span className={styles.itemName}>{seq.name}</span>
              <SequenceThumbnail
                type="drum"
                tracks={seq.tracks.map((t) => t.steps)}
                width={200}
                height={48}
              />
            </div>

            <button
              className={styles.deleteBtn}
              onPointerDown={() => deleteSequence(seq.id)}
            >
              ✕
            </button>
          </div>
        ))}

        {sequences.length === 0 && (
          <div className={styles.empty}>
            Create your first drum sequence
          </div>
        )}
      </div>
    </div>
  );
}
