import { ReactNode } from 'react';
import styles from './Drawer.module.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.closeBtn} onPointerDown={onClose}>✕</button>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
