import { useCallback, useRef, useState, useEffect } from 'react';
import { useSongStore } from '../../state/songStore';
import { useDrumSequencerStore } from '../../state/drumSequencerStore';
import { useMelodySequencerStore } from '../../state/melodySequencerStore';
import { useSampleStore } from '../../state/sampleStore';
import { useTransportStore } from '../../state/transportStore';
import { audioEngine } from '../../audio/AudioEngine';
import { Drawer } from '../shared/Drawer';
import { WaveformCanvas } from '../shared/WaveformCanvas';
import { SequenceThumbnail } from '../shared/SequenceThumbnail';
import styles from './SongView.module.css';

const PIXELS_PER_BEAT = 60;
const TRACK_HEIGHT = 64;

export function SongView() {
  const items = useSongStore((s) => s.items);
  const trackCount = useSongStore((s) => s.trackCount);
  const addItem = useSongStore((s) => s.addItem);
  const moveItem = useSongStore((s) => s.moveItem);
  const removeItem = useSongStore((s) => s.removeItem);
  const totalBeats = useSongStore((s) => s.getTotalBeats());
  const drumSequences = useDrumSequencerStore((s) => s.sequences);
  const drumOrder = useDrumSequencerStore((s) => s.sequenceOrder);
  const melodySequences = useMelodySequencerStore((s) => s.sequences);
  const melodyOrder = useMelodySequencerStore((s) => s.sequenceOrder);
  const samples = useSampleStore((s) => s.samples);
  const sampleOrder = useSampleStore((s) => s.sampleOrder);
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const play = useTransportStore((s) => s.play);
  const stop = useTransportStore((s) => s.stop);
  const setOnStep = useTransportStore((s) => s.setOnStep);
  const tempo = useTransportStore((s) => s.tempo);

  const [drawerType, setDrawerType] = useState<'sequences' | 'samples' | null>(null);
  const [dragItem, setDragItem] = useState<{ type: string; sourceId: string } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const timelineWidth = Math.max((totalBeats + 8) * PIXELS_PER_BEAT, 800);

  // Song playback step callback
  useEffect(() => {
    if (!isPlaying) return;

    let songBeat = 0;
    const secondsPerBeat = 60 / tempo;

    setOnStep((step, time) => {
      songBeat = step / 4; // steps are 16th notes, 4 per beat

      for (const item of useSongStore.getState().items) {
        if (item.type === 'sample') {
          // Play sample at its start beat
          const sampleBeat = item.startBeat;
          if (Math.abs(songBeat - sampleBeat) < 0.0625) { // within 1/16th note
            const sample = useSampleStore.getState().samples[item.sourceId];
            if (sample) {
              audioEngine.playSample(sample.buffer, time);
            }
          }
        } else if (item.type === 'drum-sequence') {
          const seq = useDrumSequencerStore.getState().sequences[item.sourceId];
          if (!seq) return;
          const seqStep = step - Math.floor(item.startBeat * 4);
          if (seqStep >= 0 && seqStep < 16) {
            for (const track of seq.tracks) {
              if (track.steps[seqStep] && track.sampleId) {
                const sample = useSampleStore.getState().samples[track.sampleId];
                if (sample) {
                  audioEngine.playSample(sample.buffer, time, track.gain);
                }
              }
            }
          }
        } else if (item.type === 'melody-sequence') {
          const seq = useMelodySequencerStore.getState().sequences[item.sourceId];
          if (!seq || !seq.sampleId) return;
          const seqStep = step - Math.floor(item.startBeat * 4);
          if (seqStep >= 0 && seqStep < 16) {
            const note = seq.steps[seqStep];
            if (note) {
              const sample = useSampleStore.getState().samples[seq.sampleId];
              if (sample) {
                const playbackRate = Math.pow(2, (note.note - seq.rootKey) / 12);
                audioEngine.playSample(sample.buffer, time, note.velocity, playbackRate);
              }
            }
          }
        }
      }
    });

    return () => setOnStep(null);
  }, [isPlaying, tempo, setOnStep]);

  const handleDragStart = useCallback((type: string, sourceId: string) => {
    setDragItem({ type, sourceId });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragItem) {
      setDragPos({ x: e.clientX, y: e.clientY });
    }
  }, [dragItem]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragItem || !timelineRef.current) {
      setDragItem(null);
      setDragPos(null);
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const y = e.clientY - rect.top;

    if (x >= 0 && y >= 0 && y < trackCount * TRACK_HEIGHT) {
      const beatPos = x / PIXELS_PER_BEAT;
      const snappedBeat = Math.floor(beatPos); // snap to nearest previous beat
      const trackIndex = Math.floor(y / TRACK_HEIGHT);

      let itemType: 'drum-sequence' | 'melody-sequence' | 'sample';
      if (dragItem.type === 'drum') itemType = 'drum-sequence';
      else if (dragItem.type === 'melody') itemType = 'melody-sequence';
      else itemType = 'sample';

      addItem({
        type: itemType,
        sourceId: dragItem.sourceId,
        trackIndex,
        startBeat: snappedBeat,
      });
    }

    setDragItem(null);
    setDragPos(null);
  }, [dragItem, addItem, trackCount]);

  const getItemName = (item: typeof items[0]): string => {
    if (item.type === 'drum-sequence') return drumSequences[item.sourceId]?.name ?? 'Unknown';
    if (item.type === 'melody-sequence') return melodySequences[item.sourceId]?.name ?? 'Unknown';
    return samples[item.sourceId]?.name ?? 'Unknown';
  };

  const getItemWidth = (item: typeof items[0]): number => {
    if (item.type === 'sample') {
      const s = samples[item.sourceId];
      if (!s) return PIXELS_PER_BEAT;
      return Math.max(PIXELS_PER_BEAT, s.duration / (60 / tempo) * PIXELS_PER_BEAT);
    }
    return 16 * PIXELS_PER_BEAT / 4; // 4 bars = 16 beats (but steps are 16th notes so 4 beats)
  };

  const getItemColor = (item: typeof items[0]): string => {
    if (item.type === 'drum-sequence') return 'var(--color-drums)';
    if (item.type === 'melody-sequence') return 'var(--color-melody)';
    return 'var(--color-sampler)';
  };

  return (
    <div
      className={styles.container}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Song</h2>
        <div className={styles.controls}>
          <button
            className={`${styles.drawerBtn} ${drawerType === 'sequences' ? styles.drawerActive : ''}`}
            onPointerDown={() => setDrawerType(drawerType === 'sequences' ? null : 'sequences')}
          >
            Sequences
          </button>
          <button
            className={`${styles.drawerBtn} ${drawerType === 'samples' ? styles.drawerActive : ''}`}
            onPointerDown={() => setDrawerType(drawerType === 'samples' ? null : 'samples')}
          >
            Samples
          </button>
          <button
            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
            onPointerDown={() => isPlaying ? stop() : play()}
          >
            {isPlaying ? '■ Stop' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className={styles.timeline} ref={timelineRef}>
        {/* Ruler */}
        <div className={styles.ruler} style={{ width: timelineWidth }}>
          {Array.from({ length: Math.ceil(totalBeats + 8) }, (_, i) => (
            <div
              key={i}
              className={`${styles.rulerMark} ${i % 4 === 0 ? styles.barMark : ''}`}
              style={{ left: i * PIXELS_PER_BEAT, width: PIXELS_PER_BEAT }}
            >
              {i % 4 === 0 && <span className={styles.barNum}>{Math.floor(i / 4) + 1}</span>}
            </div>
          ))}
        </div>

        {/* Tracks */}
        <div className={styles.tracks} style={{ width: timelineWidth }}>
          {Array.from({ length: trackCount }, (_, trackIdx) => (
            <div
              key={trackIdx}
              className={styles.track}
              style={{ height: TRACK_HEIGHT }}
            >
              {items
                .filter((item) => item.trackIndex === trackIdx)
                .map((item) => (
                  <div
                    key={item.id}
                    className={styles.timelineItem}
                    style={{
                      left: item.startBeat * PIXELS_PER_BEAT,
                      width: getItemWidth(item),
                      borderColor: getItemColor(item),
                    }}
                  >
                    <span className={styles.itemLabel}>{getItemName(item)}</span>
                    {item.type === 'sample' && samples[item.sourceId] && (
                      <WaveformCanvas
                        peaks={samples[item.sourceId].waveformData}
                        width={Math.max(60, getItemWidth(item) - 16)}
                        height={24}
                        color={getItemColor(item)}
                      />
                    )}
                    {item.type === 'drum-sequence' && drumSequences[item.sourceId] && (
                      <SequenceThumbnail
                        type="drum"
                        tracks={drumSequences[item.sourceId].tracks.map((t) => t.steps)}
                        width={Math.max(60, getItemWidth(item) - 16)}
                        height={24}
                      />
                    )}
                    <button
                      className={styles.removeBtn}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      {dragItem && dragPos && (
        <div
          className={styles.dragGhost}
          style={{ left: dragPos.x - 40, top: dragPos.y - 20 }}
        >
          {dragItem.type === 'drum' && drumSequences[dragItem.sourceId]?.name}
          {dragItem.type === 'melody' && melodySequences[dragItem.sourceId]?.name}
          {dragItem.type === 'sample' && samples[dragItem.sourceId]?.name}
        </div>
      )}

      {/* Sequences Drawer */}
      <Drawer
        open={drawerType === 'sequences'}
        onClose={() => setDrawerType(null)}
        title="Sequences"
      >
        <div className={styles.drawerList}>
          {drumOrder.map((id) => (
            <div
              key={id}
              className={styles.drawerItem}
              onPointerDown={() => handleDragStart('drum', id)}
              style={{ borderLeftColor: 'var(--color-drums)' }}
            >
              <span className={styles.drawerItemType}>Drum</span>
              <span>{drumSequences[id]?.name}</span>
            </div>
          ))}
          {melodyOrder.map((id) => (
            <div
              key={id}
              className={styles.drawerItem}
              onPointerDown={() => handleDragStart('melody', id)}
              style={{ borderLeftColor: 'var(--color-melody)' }}
            >
              <span className={styles.drawerItemType}>Melody</span>
              <span>{melodySequences[id]?.name}</span>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Samples Drawer */}
      <Drawer
        open={drawerType === 'samples'}
        onClose={() => setDrawerType(null)}
        title="Samples"
      >
        <div className={styles.drawerList}>
          {sampleOrder.map((id) => (
            <div
              key={id}
              className={styles.drawerItem}
              onPointerDown={() => handleDragStart('sample', id)}
              style={{ borderLeftColor: 'var(--color-sampler)' }}
            >
              <span>{samples[id]?.name}</span>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
