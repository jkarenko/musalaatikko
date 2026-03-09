import { useCallback, useEffect, useState } from 'react';
import { useDrumSequencerStore } from '../../state/drumSequencerStore';
import { useSampleStore } from '../../state/sampleStore';
import { useTransportStore } from '../../state/transportStore';
import { useUIStore } from '../../state/uiStore';
import { audioEngine } from '../../audio/AudioEngine';
import { recorder } from '../../audio/Recorder';
import { Drawer } from '../shared/Drawer';
import styles from './DrumSequencerView.module.css';

interface DrumSequencerViewProps {
  sequenceId: string;
}

export function DrumSequencerView({ sequenceId }: DrumSequencerViewProps) {
  const seq = useDrumSequencerStore((s) => s.sequences[sequenceId]);
  const toggleStep = useDrumSequencerStore((s) => s.toggleStep);
  const addTrack = useDrumSequencerStore((s) => s.addTrack);
  const removeTrack = useDrumSequencerStore((s) => s.removeTrack);
  const assignSample = useDrumSequencerStore((s) => s.assignSample);
  const renameTrack = useDrumSequencerStore((s) => s.renameTrack);
  const samples = useSampleStore((s) => s.samples);
  const sampleOrder = useSampleStore((s) => s.sampleOrder);
  const addRecordedSample = useSampleStore((s) => s.addRecordedSample);
  const currentStep = useTransportStore((s) => s.currentStep);
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const play = useTransportStore((s) => s.play);
  const stop = useTransportStore((s) => s.stop);
  const setOnStep = useTransportStore((s) => s.setOnStep);
  const setView = useUIStore((s) => s.setView);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assigningTrackId, setAssigningTrackId] = useState<string | null>(null);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);

  // Set up step callback for playback
  useEffect(() => {
    if (!seq) return;
    setOnStep((step, time) => {
      const currentSeq = useDrumSequencerStore.getState().sequences[sequenceId];
      if (!currentSeq) return;
      for (const track of currentSeq.tracks) {
        if (track.steps[step] && track.sampleId) {
          const sample = useSampleStore.getState().samples[track.sampleId];
          if (sample) {
            audioEngine.playSample(sample.buffer, time, track.gain);
          }
        }
      }
    });
    return () => setOnStep(null);
  }, [sequenceId, seq, setOnStep]);

  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  const handleAssignSample = useCallback((trackId: string) => {
    setAssigningTrackId(trackId);
    setDrawerOpen(true);
  }, []);

  const handleSelectSample = useCallback((sampleId: string) => {
    if (assigningTrackId) {
      assignSample(sequenceId, assigningTrackId, sampleId);
    }
    setDrawerOpen(false);
    setAssigningTrackId(null);
  }, [assigningTrackId, assignSample, sequenceId]);

  const handleRecordTrack = useCallback(async (trackId: string) => {
    if (recordingTrackId === trackId) {
      const buffer = recorder.stop();
      setRecordingTrackId(null);
      if (buffer) {
        const sampleId = addRecordedSample(`Track Recording`, buffer);
        assignSample(sequenceId, trackId, sampleId);
      }
    } else {
      try {
        await recorder.start();
        setRecordingTrackId(trackId);
      } catch (err) {
        console.error('Recording failed:', err);
      }
    }
  }, [recordingTrackId, addRecordedSample, assignSample, sequenceId]);

  if (!seq) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onPointerDown={() => setView('drum-list')}>
          ← Back
        </button>
        <h2 className={styles.title}>{seq.name}</h2>
        <button
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          onPointerDown={handlePlayStop}
        >
          {isPlaying ? '■ Stop' : '▶ Play'}
        </button>
      </div>

      <div className={styles.grid}>
        {/* Step numbers */}
        <div className={styles.stepHeader}>
          <div className={styles.trackLabel} />
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={`${styles.stepNum} ${i === currentStep ? styles.activeStepNum : ''} ${
                i % 4 === 0 ? styles.beatNum : ''
              }`}
            >
              {i + 1}
            </div>
          ))}
          <div className={styles.trackActions} />
        </div>

        {/* Tracks */}
        {seq.tracks.map((track) => (
          <div key={track.id} className={styles.track}>
            <div className={styles.trackLabel}>
              <span className={styles.trackName}>{track.name}</span>
              {track.sampleId && samples[track.sampleId] && (
                <span className={styles.sampleIndicator}>
                  {samples[track.sampleId].name}
                </span>
              )}
            </div>

            {track.steps.map((active, step) => (
              <button
                key={step}
                className={`${styles.pad} ${active ? styles.padActive : ''} ${
                  step === currentStep ? styles.padCurrent : ''
                } ${step % 4 === 0 ? styles.padBeat : ''}`}
                onPointerDown={() => toggleStep(sequenceId, track.id, step)}
              />
            ))}

            <div className={styles.trackActions}>
              <button
                className={`${styles.trackBtn} ${recordingTrackId === track.id ? styles.recordingBtn : ''}`}
                onPointerDown={() => handleRecordTrack(track.id)}
                title="Record sample for track"
              >
                ●
              </button>
              <button
                className={styles.trackBtn}
                onPointerDown={() => handleAssignSample(track.id)}
                title="Assign sample"
              >
                ♪
              </button>
              <button
                className={styles.trackBtn}
                onPointerDown={() => removeTrack(sequenceId, track.id)}
                title="Remove track"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className={styles.addTrackBtn} onPointerDown={() => addTrack(sequenceId)}>
        + Add Track
      </button>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Select Sample"
      >
        <div className={styles.sampleList}>
          {sampleOrder.map((id) => (
            <button
              key={id}
              className={styles.sampleOption}
              onPointerDown={() => handleSelectSample(id)}
            >
              {samples[id]?.name}
            </button>
          ))}
          {sampleOrder.length === 0 && (
            <div className={styles.emptySamples}>
              No samples yet. Record some in the Sampler view.
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
