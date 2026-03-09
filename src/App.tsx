import { useEffect } from 'react';
import styles from './App.module.css';
import { TopBar } from './components/TopBar/TopBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MainView } from './components/MainView';
import { audioEngine } from './audio/AudioEngine';

export default function App() {
  // Resume AudioContext on first user interaction
  useEffect(() => {
    const resume = () => audioEngine.resume();
    document.addEventListener('pointerdown', resume, { once: true });
    return () => document.removeEventListener('pointerdown', resume);
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <TopBar />
      </div>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <div className={styles.main}>
        <MainView />
      </div>
    </div>
  );
}
