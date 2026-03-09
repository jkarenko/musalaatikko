import { useState, useCallback } from 'react';
import { recorder } from '../../audio/Recorder';
import { audioEngine } from '../../audio/AudioEngine';
import { useSampleStore } from '../../state/sampleStore';
import { WaveformCanvas } from '../shared/WaveformCanvas';
import styles from './SamplerView.module.css';

export function SamplerView() {
  const [isRecording, setIsRecording] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const samples = useSampleStore((s) => s.sampleOrder.map((id) => s.samples[id]));
  const addRecordedSample = useSampleStore((s) => s.addRecordedSample);
  const deleteSample = useSampleStore((s) => s.deleteSample);
  const renameSample = useSampleStore((s) => s.renameSample);

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      const buffer = recorder.stop();
      setIsRecording(false);
      if (buffer) {
        const name = `Sample ${samples.length + 1}`;
        addRecordedSample(name, buffer);
      }
    } else {
      try {
        await recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  }, [isRecording, samples.length, addRecordedSample]);

  const handlePlay = useCallback((buffer: AudioBuffer) => {
    audioEngine.resume();
    audioEngine.playSample(buffer);
  }, []);

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleFinishRename = () => {
    if (editingId && editName.trim()) {
      renameSample(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sampler</h2>
        <button
          className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
          onPointerDown={handleRecord}
        >
          <span className={styles.recordDot} />
          {isRecording ? 'Stop Recording' : 'New Sample'}
        </button>
      </div>

      {isRecording && (
        <div className={styles.recordingIndicator}>
          <span className={styles.recordingPulse} />
          Recording...
        </div>
      )}

      <div className={styles.sampleList}>
        {samples.length === 0 && !isRecording && (
          <div className={styles.empty}>
            Tap "New Sample" to record your first sample
          </div>
        )}
        {samples.map((sample) => (
          <div key={sample.id} className={styles.sampleItem}>
            <button
              className={styles.playBtn}
              onPointerDown={() => handlePlay(sample.buffer)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <polygon points="3,1 14,8 3,15" />
              </svg>
            </button>

            <div className={styles.sampleInfo}>
              {editingId === sample.id ? (
                <input
                  className={styles.renameInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                  autoFocus
                />
              ) : (
                <span
                  className={styles.sampleName}
                  onDoubleClick={() => handleStartRename(sample.id, sample.name)}
                >
                  {sample.name}
                </span>
              )}
              <span className={styles.duration}>{sample.duration.toFixed(2)}s</span>
            </div>

            <WaveformCanvas
              peaks={sample.waveformData}
              width={200}
              height={40}
              color="var(--color-sampler)"
            />

            <button
              className={styles.deleteBtn}
              onPointerDown={() => deleteSample(sample.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
