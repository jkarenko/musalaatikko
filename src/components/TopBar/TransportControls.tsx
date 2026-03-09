import { useTransportStore } from '../../state/transportStore';
import styles from './TransportControls.module.css';

export function TransportControls() {
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const play = useTransportStore((s) => s.play);
  const stop = useTransportStore((s) => s.stop);
  const currentStep = useTransportStore((s) => s.currentStep);

  return (
    <div className={styles.container}>
      <button
        className={`${styles.btn} ${isPlaying ? styles.stopBtn : styles.playBtn}`}
        onPointerDown={isPlaying ? stop : play}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="3" y="3" width="14" height="14" rx="2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <polygon points="4,2 18,10 4,18" />
          </svg>
        )}
      </button>

      <div className={styles.stepIndicator}>
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className={`${styles.step} ${i === currentStep ? styles.activeStep : ''} ${
              i % 4 === 0 ? styles.beatStep : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}
