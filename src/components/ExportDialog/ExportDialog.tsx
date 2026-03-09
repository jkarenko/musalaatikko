import { useState } from 'react';
import { exportToWav, exportToOgg } from '../../audio/Exporter';
import styles from './ExportDialog.module.css';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleExport = async (format: 'wav' | 'ogg') => {
    setExporting(true);
    setError(null);
    try {
      if (format === 'wav') {
        await exportToWav();
      } else {
        await exportToOgg();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.overlay} onPointerDown={onClose}>
      <div className={styles.dialog} onPointerDown={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Export Song</h3>

        {error && <div className={styles.error}>{error}</div>}

        {exporting ? (
          <div className={styles.progress}>Rendering...</div>
        ) : (
          <div className={styles.buttons}>
            <button
              className={styles.exportBtn}
              onPointerDown={() => handleExport('wav')}
            >
              <span className={styles.format}>WAV</span>
              <span className={styles.desc}>Uncompressed, highest quality</span>
            </button>
            <button
              className={styles.exportBtn}
              onPointerDown={() => handleExport('ogg')}
            >
              <span className={styles.format}>OGG</span>
              <span className={styles.desc}>Compressed, smaller file</span>
            </button>
          </div>
        )}

        <button className={styles.cancelBtn} onPointerDown={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
