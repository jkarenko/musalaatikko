import { useTransportStore } from '../../state/transportStore';
import styles from './MetronomeToggle.module.css';

export function MetronomeToggle() {
  const enabled = useTransportStore((s) => s.metronomeEnabled);
  const toggle = useTransportStore((s) => s.toggleMetronome);

  return (
    <button
      className={`${styles.btn} ${enabled ? styles.active : ''}`}
      onPointerDown={toggle}
      title="Metronome"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 1L6 18H14L10 1ZM10 5L12.5 16H7.5L10 5Z" />
        <line x1="10" y1="6" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}
