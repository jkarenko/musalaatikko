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
const RULER_HEIGHT = 28;

export function SongView() {
  const items = useSongStore((s) => s.items);
  const trackCount = useSongStore((s) => s.trackCount);
  const addItem = useSongStore((s) => s.addItem);
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
  const [snapPreview, setSnapPreview] = useState<{ beat: number; track: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const timelineWidth = Math.max((totalBeats + 8) * PIXELS_PER_BEAT, 800);

  // Song playback: uses a global step counter that advances indefinitely
  useEffect(() => {
    if (!isPlaying) return;

    // Track global step position across the entire song
    let globalStep = 0;
    const totalSteps = useSongStore.getState().getTotalBeats() * 4; // 4 steps per beat

    setOnStep((_step, time) => {
      const currentItems = useSongStore.getState().items;

      for (const item of currentItems) {
        const itemStartStep = Math.floor(item.startBeat * 4);

        if (item.type === 'sample') {
          if (globalStep === itemStartStep) {
            const sample = useSampleStore.getState().samples[item.sourceId];
            if (sample) {
              audioEngine.playSample(sample.buffer, time);
            }
          }
        } else if (item.type === 'drum-sequence') {
          const seq = useDrumSequencerStore.getState().sequences[item.sourceId];
          if (!seq) continue;
          const seqStep = globalStep - itemStartStep;
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
          if (!seq || !seq.sampleId) continue;
          const seqStep = globalStep - itemStartStep;
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

      globalStep++;
      if (globalStep >= totalSteps) {
        // Stop at end of song
        useTransportStore.getState().stop();
      }
    });

    return () => setOnStep(null);
  }, [isPlaying, tempo, setOnStep]);

  // Compute timeline position from pointer event
  const getTimelinePos = useCallback((clientX: number, clientY: number) => {
    if (!timelineRef.current) return null;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left + timelineRef.current.scrollLeft;
    const y = clientY - rect.top - RULER_HEIGHT; // subtract ruler height

    if (x < 0 || y < 0) return null;

    const beat = Math.floor(x / PIXELS_PER_BEAT);
    const track = Math.floor(y / TRACK_HEIGHT);
    if (track >= trackCount) return null;

    return { beat, track };
  }, [trackCount]);

  // Drag start from drawer items
  const handleDragStart = useCallback((e: React.PointerEvent, type: string, sourceId: string) => {
    e.preventDefault();
    setDragItem({ type, sourceId });
    setDragPos({ x: e.clientX, y: e.clientY });
    isDraggingRef.current = true;

    const onMove = (ev: PointerEvent) => {
      setDragPos({ x: ev.clientX, y: ev.clientY });
      // Update snap preview
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = ev.clientX - rect.left + timelineRef.current.scrollLeft;
        const y = ev.clientY - rect.top - RULER_HEIGHT;
        if (x >= 0 && y >= 0) {
          const beat = Math.floor(x / PIXELS_PER_BEAT);
          const track = Math.floor(y / TRACK_HEIGHT);
          setSnapPreview({ beat: Math.max(0, beat), track: Math.max(0, Math.min(track, useSongStore.getState().trackCount - 1)) });
        } else {
          setSnapPreview(null);
        }
      }
    };

    const onUp = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      isDraggingRef.current = false;

      // Try to place item on timeline
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = ev.clientX - rect.left + timelineRef.current.scrollLeft;
        const y = ev.clientY - rect.top - RULER_HEIGHT;

        if (x >= 0 && y >= 0) {
          const beat = Math.max(0, Math.floor(x / PIXELS_PER_BEAT));
          const track = Math.floor(y / TRACK_HEIGHT);
          const tc = useSongStore.getState().trackCount;

          if (track >= 0 && track < tc) {
            let itemType: 'drum-sequence' | 'melody-sequence' | 'sample';
            if (type === 'drum') itemType = 'drum-sequence';
            else if (type === 'melody') itemType = 'melody-sequence';
            else itemType = 'sample';

            addItem({
              type: itemType,
              sourceId,
              trackIndex: track,
              startBeat: beat,
            });
          }
        }
      }

      setDragItem(null);
      setDragPos(null);
      setSnapPreview(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [addItem]);

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
    // Sequences are 16 steps = 4 beats
    return 4 * PIXELS_PER_BEAT;
  };

  const getItemColor = (item: typeof items[0]): string => {
    if (item.type === 'drum-sequence') return 'var(--color-drums)';
    if (item.type === 'melody-sequence') return 'var(--color-melody)';
    return 'var(--color-sampler)';
  };

  return (
    <div className={styles.container} ref={containerRef}>
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
              {/* Snap preview indicator */}
              {snapPreview && snapPreview.track === trackIdx && (
                <div
                  className={styles.snapIndicator}
                  style={{
                    left: snapPreview.beat * PIXELS_PER_BEAT,
                    width: 4 * PIXELS_PER_BEAT, // default 4-beat width
                  }}
                />
              )}

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
                    {item.type === 'melody-sequence' && melodySequences[item.sourceId] && (
                      <SequenceThumbnail
                        type="melody"
                        melodySteps={melodySequences[item.sourceId].steps}
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
        title="Drag sequences onto the timeline"
      >
        <div className={styles.drawerList}>
          {drumOrder.length === 0 && melodyOrder.length === 0 && (
            <div className={styles.drawerEmpty}>No sequences yet. Create some in the Drums or Melody views.</div>
          )}
          {drumOrder.map((id) => (
            <div
              key={id}
              className={styles.drawerItem}
              onPointerDown={(e) => handleDragStart(e, 'drum', id)}
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
              onPointerDown={(e) => handleDragStart(e, 'melody', id)}
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
        title="Drag samples onto the timeline"
      >
        <div className={styles.drawerList}>
          {sampleOrder.length === 0 && (
            <div className={styles.drawerEmpty}>No samples yet. Record some in the Sampler view.</div>
          )}
          {sampleOrder.map((id) => (
            <div
              key={id}
              className={styles.drawerItem}
              onPointerDown={(e) => handleDragStart(e, 'sample', id)}
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
