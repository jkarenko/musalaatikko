import { useCallback } from 'react';
import { useMelodySequencerStore } from '../../state/melodySequencerStore';
import { useUIStore } from '../../state/uiStore';
import { SequenceThumbnail } from '../shared/SequenceThumbnail';
import styles from './MelodySequencerList.module.css';

export function MelodySequencerList() {
  const sequences = useMelodySequencerStore((s) => s.sequenceOrder.map((id) => s.sequences[id]));
  const createSequence = useMelodySequencerStore((s) => s.createSequence);
  const deleteSequence = useMelodySequencerStore((s) => s.deleteSequence);
  const setView = useUIStore((s) => s.setView);

  const handleNew = useCallback(() => {
    const id = createSequence();
    setView('melody-edit', id);
  }, [createSequence, setView]);

  const handleEdit = useCallback((id: string) => {
    setView('melody-edit', id);
  }, [setView]);

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
            <div className={styles.itemContent} onPointerDown={() => handleEdit(seq.id)}>
              <span className={styles.itemName}>{seq.name}</span>
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
