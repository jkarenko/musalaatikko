import { useCallback, useEffect, useState, useRef } from 'react';
import { useMelodySequencerStore } from '../../state/melodySequencerStore';
import { useSampleStore } from '../../state/sampleStore';
import { useTransportStore } from '../../state/transportStore';
import { useUIStore } from '../../state/uiStore';
import { audioEngine } from '../../audio/AudioEngine';
import { HexKeypad } from './HexKeypad';
import { Drawer } from '../shared/Drawer';
import { NOTE_NAMES, SCALE_NAMES, midiToNoteName } from '../../utils/scales';
import styles from './MelodySequencerView.module.css';

interface MelodySequencerViewProps {
  sequenceId: string;
}

export function MelodySequencerView({ sequenceId }: MelodySequencerViewProps) {
  const seq = useMelodySequencerStore((s) => s.sequences[sequenceId]);
  const setStep = useMelodySequencerStore((s) => s.setStep);
  const clearStep = useMelodySequencerStore((s) => s.clearStep);
  const assignSample = useMelodySequencerStore((s) => s.assignSample);
  const setRootKey = useMelodySequencerStore((s) => s.setRootKey);
  const setScale = useMelodySequencerStore((s) => s.setScale);
  const samples = useSampleStore((s) => s.samples);
  const sampleOrder = useSampleStore((s) => s.sampleOrder);
  const currentStep = useTransportStore((s) => s.currentStep);
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const isRecording = useTransportStore((s) => s.isRecording);
  const play = useTransportStore((s) => s.play);
  const stop = useTransportStore((s) => s.stop);
  const toggleRecord = useTransportStore((s) => s.toggleRecord);
  const setOnStep = useTransportStore((s) => s.setOnStep);
  const setView = useUIStore((s) => s.setView);

  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  // Step callback for playback
  useEffect(() => {
    if (!seq) return;
    setOnStep((step, time) => {
      const currentSeq = useMelodySequencerStore.getState().sequences[sequenceId];
      if (!currentSeq || !currentSeq.sampleId) return;
      const note = currentSeq.steps[step];
      if (note) {
        const sample = useSampleStore.getState().samples[currentSeq.sampleId];
        if (sample) {
          const playbackRate = Math.pow(2, (note.note - currentSeq.rootKey) / 12);
          audioEngine.playSample(sample.buffer, time, note.velocity, playbackRate);
        }
      }
    });
    return () => setOnStep(null);
  }, [sequenceId, seq, setOnStep]);

  const handlePlayStop = useCallback(() => {
    if (isPlaying) stop();
    else play();
  }, [isPlaying, play, stop]);

  const handleNoteInput = useCallback((midiNote: number) => {
    if (!seq) return;

    // Play preview sound
    if (seq.sampleId) {
      const sample = samples[seq.sampleId];
      if (sample) {
        const playbackRate = Math.pow(2, (midiNote - seq.rootKey) / 12);
        audioEngine.playSample(sample.buffer, undefined, 1, playbackRate);
      }
    }

    // Real-time recording mode: assign to current step
    if (isPlaying && isRecording) {
      const step = currentStepRef.current;
      if (step >= 0 && step < 16) {
        setStep(sequenceId, step, { note: midiNote, velocity: 1 });
      }
      return;
    }

    // Step input mode: assign to selected step
    if (selectedStep !== null) {
      setStep(sequenceId, selectedStep, { note: midiNote, velocity: 1 });
      // Advance to next step
      setSelectedStep((selectedStep + 1) % 16);
    }
  }, [seq, sequenceId, selectedStep, isPlaying, isRecording, setStep, samples]);

  const handleStepClick = useCallback((step: number) => {
    if (selectedStep === step) {
      // Toggle off / clear
      if (seq?.steps[step]) {
        clearStep(sequenceId, step);
      }
      setSelectedStep(null);
    } else {
      setSelectedStep(step);
    }
  }, [selectedStep, seq, sequenceId, clearStep]);

  if (!seq) return null;

  const rootNoteName = NOTE_NAMES[seq.rootKey % 12];
  const rootOctave = Math.floor(seq.rootKey / 12) - 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onPointerDown={() => setView('melody-list')}>
          ← Back
        </button>
        <h2 className={styles.title}>{seq.name}</h2>
        <div className={styles.controls}>
          <button
            className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
            onPointerDown={toggleRecord}
            title="Real-time record"
          >
            ●
          </button>
          <button
            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
            onPointerDown={handlePlayStop}
          >
            {isPlaying ? '■ Stop' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Scale/Key selector */}
      <div className={styles.selectors}>
        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel}>Root</label>
          <select
            className={styles.select}
            value={seq.rootKey % 12}
            onChange={(e) => setRootKey(sequenceId, parseInt(e.target.value) + (rootOctave + 1) * 12)}
          >
            {NOTE_NAMES.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel}>Octave</label>
          <select
            className={styles.select}
            value={rootOctave}
            onChange={(e) => setRootKey(sequenceId, (parseInt(e.target.value) + 1) * 12 + (seq.rootKey % 12))}
          >
            {[2, 3, 4, 5, 6].map((oct) => (
              <option key={oct} value={oct}>{oct}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel}>Scale</label>
          <select
            className={styles.select}
            value={seq.scale}
            onChange={(e) => setScale(sequenceId, e.target.value)}
          >
            {Object.entries(SCALE_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        <button
          className={styles.sampleBtn}
          onPointerDown={() => setDrawerOpen(true)}
        >
          {seq.sampleId && samples[seq.sampleId]
            ? `♪ ${samples[seq.sampleId].name}`
            : '♪ Select Sample'}
        </button>
      </div>

      {/* Step grid */}
      <div className={styles.stepGrid}>
        {Array.from({ length: 16 }, (_, i) => {
          const note = seq.steps[i];
          return (
            <button
              key={i}
              className={`${styles.step} ${note ? styles.stepActive : ''} ${
                i === currentStep ? styles.stepCurrent : ''
              } ${i === selectedStep ? styles.stepSelected : ''} ${
                i % 4 === 0 ? styles.stepBeat : ''
              }`}
              onPointerDown={() => handleStepClick(i)}
            >
              <span className={styles.stepNum}>{i + 1}</span>
              {note && <span className={styles.noteLabel}>{midiToNoteName(note.note)}</span>}
            </button>
          );
        })}
      </div>

      {/* Hex Keypad */}
      <HexKeypad
        rootKey={seq.rootKey}
        scale={seq.scale}
        onNoteInput={handleNoteInput}
      />

      {/* Sample drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Select Instrument Sample"
      >
        <div className={styles.sampleList}>
          {sampleOrder.map((id) => (
            <button
              key={id}
              className={`${styles.sampleOption} ${seq.sampleId === id ? styles.sampleActive : ''}`}
              onPointerDown={() => {
                assignSample(sequenceId, id);
                setDrawerOpen(false);
              }}
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
