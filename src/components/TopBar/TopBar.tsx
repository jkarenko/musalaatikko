import { useState } from 'react';
import styles from './TopBar.module.css';
import { TempoControl } from './TempoControl';
import { TransportControls } from './TransportControls';
import { MetronomeToggle } from './MetronomeToggle';
import { ExportDialog } from '../ExportDialog/ExportDialog';

export function TopBar() {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className={styles.topbar}>
      <div className={styles.brand}>Musalaatikko</div>
      <TempoControl />
      <div className={styles.timeSig}>4/4</div>
      <TransportControls />
      <MetronomeToggle />
      <div className={styles.spacer} />
      <button className={styles.exportBtn} onPointerDown={() => setExportOpen(true)}>
        Export
      </button>
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
