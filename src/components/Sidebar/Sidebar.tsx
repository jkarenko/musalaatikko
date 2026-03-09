import { useUIStore } from '../../state/uiStore';
import { ActiveView } from '../../state/types';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  view: ActiveView;
  color: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Sampler', view: 'sampler', color: 'var(--color-sampler)', icon: '🎙' },
  { label: 'Drums', view: 'drum-list', color: 'var(--color-drums)', icon: '🥁' },
  { label: 'Melody', view: 'melody-list', color: 'var(--color-melody)', icon: '🎹' },
  { label: 'Song', view: 'song', color: 'var(--color-song)', icon: '🎵' },
];

export function Sidebar() {
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);

  const getIsActive = (item: NavItem) => {
    if (item.view === 'drum-list') return activeView === 'drum-list' || activeView === 'drum-edit';
    if (item.view === 'melody-list') return activeView === 'melody-list' || activeView === 'melody-edit';
    return activeView === item.view;
  };

  return (
    <nav className={styles.sidebar}>
      {NAV_ITEMS.map((item) => {
        const isActive = getIsActive(item);
        return (
          <button
            key={item.view}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            style={{ '--item-color': item.color } as React.CSSProperties}
            onPointerDown={() => setView(item.view)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
