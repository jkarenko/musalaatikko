import { useTransportStore } from '../../state/transportStore';
import styles from './TempoControl.module.css';

export function TempoControl() {
  const tempo = useTransportStore((s) => s.tempo);
  const increment = useTransportStore((s) => s.incrementTempo);
  const decrement = useTransportStore((s) => s.decrementTempo);

  return (
    <div className={styles.container}>
      <button className={styles.btn} onPointerDown={decrement}>-</button>
      <span className={styles.display}>{tempo} <span className={styles.unit}>BPM</span></span>
      <button className={styles.btn} onPointerDown={increment}>+</button>
    </div>
  );
}
