import { OnsetResult } from './types';

const FRAME_SIZE = 512;
const THRESHOLD_DB = -40; // dB below peak
const SAFETY_MARGIN_SAMPLES = 132; // ~3ms at 44100Hz

function computeRmsEnvelope(data: Float32Array, frameSize: number): number[] {
  const frames: number[] = [];
  for (let i = 0; i < data.length; i += frameSize) {
    const end = Math.min(i + frameSize, data.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += data[j] * data[j];
    }
    frames.push(Math.sqrt(sum / (end - i)));
  }
  return frames;
}

export function detectOnset(buffer: AudioBuffer): OnsetResult {
  const data = buffer.getChannelData(0);

  if (data.length === 0) {
    return { onsetSample: 0, tailSample: 0 };
  }

  const rmsEnvelope = computeRmsEnvelope(data, FRAME_SIZE);

  // Find peak RMS
  let peakRms = 0;
  for (const rms of rmsEnvelope) {
    if (rms > peakRms) peakRms = rms;
  }

  if (peakRms === 0) {
    return { onsetSample: 0, tailSample: data.length };
  }

  // Threshold is -40dB below peak
  const thresholdLinear = peakRms * Math.pow(10, THRESHOLD_DB / 20);

  // Find onset: first frame exceeding threshold
  let onsetFrame = 0;
  for (let i = 0; i < rmsEnvelope.length; i++) {
    if (rmsEnvelope[i] >= thresholdLinear) {
      onsetFrame = i;
      break;
    }
  }

  // Find tail: last frame exceeding threshold
  let tailFrame = rmsEnvelope.length - 1;
  for (let i = rmsEnvelope.length - 1; i >= 0; i--) {
    if (rmsEnvelope[i] >= thresholdLinear) {
      tailFrame = i;
      break;
    }
  }

  // Convert to sample indices with safety margin
  const onsetSample = Math.max(0, onsetFrame * FRAME_SIZE - SAFETY_MARGIN_SAMPLES);
  const tailSample = Math.min(data.length, (tailFrame + 1) * FRAME_SIZE + SAFETY_MARGIN_SAMPLES);

  return { onsetSample, tailSample };
}
