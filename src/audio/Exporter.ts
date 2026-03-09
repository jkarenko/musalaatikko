import { useSongStore } from '../state/songStore';
import { useDrumSequencerStore } from '../state/drumSequencerStore';
import { useMelodySequencerStore } from '../state/melodySequencerStore';
import { useSampleStore } from '../state/sampleStore';
import { useTransportStore } from '../state/transportStore';
import { encodeWav } from '../utils/wavEncoder';
import { encodeOgg } from '../utils/oggEncoder';

export async function renderSong(): Promise<AudioBuffer> {
  const { items } = useSongStore.getState();
  const { tempo } = useTransportStore.getState();
  const drumSeqs = useDrumSequencerStore.getState().sequences;
  const melodySeqs = useMelodySequencerStore.getState().sequences;
  const sampleLib = useSampleStore.getState().samples;

  const secondsPerBeat = 60 / tempo;
  const secondsPerStep = secondsPerBeat / 4;
  const totalBeats = useSongStore.getState().getTotalBeats();
  const totalDuration = totalBeats * secondsPerBeat + 2; // 2s padding

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

  for (const item of items) {
    const startTime = item.startBeat * secondsPerBeat;

    if (item.type === 'sample') {
      const sample = sampleLib[item.sourceId];
      if (!sample) continue;
      const source = offlineCtx.createBufferSource();
      source.buffer = sample.buffer;
      source.connect(offlineCtx.destination);
      source.start(startTime);
    } else if (item.type === 'drum-sequence') {
      const seq = drumSeqs[item.sourceId];
      if (!seq) continue;

      for (const track of seq.tracks) {
        if (!track.sampleId) continue;
        const sample = sampleLib[track.sampleId];
        if (!sample) continue;

        for (let step = 0; step < 16; step++) {
          if (track.steps[step]) {
            const time = startTime + step * secondsPerStep;
            const source = offlineCtx.createBufferSource();
            source.buffer = sample.buffer;
            const gain = offlineCtx.createGain();
            gain.gain.value = track.gain;
            source.connect(gain);
            gain.connect(offlineCtx.destination);
            source.start(time);
          }
        }
      }
    } else if (item.type === 'melody-sequence') {
      const seq = melodySeqs[item.sourceId];
      if (!seq || !seq.sampleId) continue;
      const sample = sampleLib[seq.sampleId];
      if (!sample) continue;

      for (let step = 0; step < 16; step++) {
        const note = seq.steps[step];
        if (note) {
          const time = startTime + step * secondsPerStep;
          const source = offlineCtx.createBufferSource();
          source.buffer = sample.buffer;
          source.playbackRate.value = Math.pow(2, (note.note - seq.rootKey) / 12);
          const gain = offlineCtx.createGain();
          gain.gain.value = note.velocity;
          source.connect(gain);
          gain.connect(offlineCtx.destination);
          source.start(time);
        }
      }
    }
  }

  return await offlineCtx.startRendering();
}

export async function exportToWav(): Promise<void> {
  const buffer = await renderSong();
  const blob = encodeWav(buffer);
  downloadBlob(blob, 'musalaatikko-song.wav');
}

export async function exportToOgg(): Promise<void> {
  const buffer = await renderSong();
  const blob = await encodeOgg(buffer);
  downloadBlob(blob, 'musalaatikko-song.ogg');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
