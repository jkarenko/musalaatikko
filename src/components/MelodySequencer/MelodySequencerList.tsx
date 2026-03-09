import { useCallback } from 'react';
import { useMelodySequencerStore } from '../../state/melodySequencerStore';
import { useSampleStore } from '../../state/sampleStore';
import { useUIStore } from '../../state/uiStore';
import { useTransportStore } from '../../state/transportStore';
import { audioEngine } from '../../audio/AudioEngine';
import { SequenceThumbnail } from '../shared/SequenceThumbnail';
import styles from './MelodySequencerList.module.css';

export function MelodySequencerList() {
  const sequences = useMelodySequencerStore((s) => s.sequenceOrder.map((id) => s.sequences[id]));
  const createSequence = useMelodySequencerStore((s) => s.createSequence);
  const deleteSequence = useMelodySequencerStore((s) => s.deleteSequence);
  const setView = useUIStore((s) => s.setView);
  const samples = useSampleStore((s) => s.samples);
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const play = useTransportStore((s) => s.play);
  const stop = useTransportStore((s) => s.stop);
  const setOnStep = useTransportStore((s) => s.setOnStep);

  const handleNew = useCallback(() => {
    const id = createSequence();
    setView('melody-edit', id);
  }, [createSequence, setView]);

  const handleEdit = useCallback((id: string) => {
    setView('melody-edit', id);
  }, [setView]);

  const handlePlayPreview = useCallback((seqId: string) => {
    if (isPlaying) {
      stop();
      return;
    }

    setOnStep((step, time) => {
      const seq = useMelodySequencerStore.getState().sequences[seqId];
      if (!seq || !seq.sampleId) return;
      const note = seq.steps[step];
      if (note) {
        const sample = useSampleStore.getState().samples[seq.sampleId];
        if (sample) {
          const playbackRate = Math.pow(2, (note.note - seq.rootKey) / 12);
          audioEngine.playSample(sample.buffer, time, note.velocity, playbackRate);
        }
      }
    });

    play();
  }, [isPlaying, play, stop, setOnStep]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Melody Sequences</h2>
      </div>

      <div className={styles.list}>
        <button className={styles.newBtn} onPointerDown={handleNew}>
          <span className={styles.plusIcon}>+</span>
          New Melody Sequence
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
              <div className={styles.itemMeta}>
                <span className={styles.itemName}>{seq.name}</span>
                {seq.sampleId && samples[seq.sampleId] && (
                  <span className={styles.sampleName}>♪ {samples[seq.sampleId].name}</span>
                )}
              </div>
              <SequenceThumbnail
                type="melody"
                melodySteps={seq.steps}
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
            Create your first melody sequence
          </div>
        )}
      </div>
    </div>
  );
}
