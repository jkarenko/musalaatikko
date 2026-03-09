import { audioEngine } from './AudioEngine';
import { detectOnset } from './OnsetDetector';

const FADE_DURATION_MS = 20;

function getFadeSamples(sampleRate: number): number {
  return Math.round((FADE_DURATION_MS / 1000) * sampleRate);
}

export function processRecordedSample(buffer: AudioBuffer): AudioBuffer {
  const { onsetSample, tailSample } = detectOnset(buffer);
  return cropAndFade(buffer, onsetSample, tailSample);
}

export function cropAndFade(
  buffer: AudioBuffer,
  startSample: number,
  endSample: number
): AudioBuffer {
  const length = endSample - startSample;
  if (length <= 0) {
    return audioEngine.createBuffer(1);
  }

  const channels = buffer.numberOfChannels;
  const newBuffer = audioEngine.createBuffer(length, channels);
  const fadeSamples = Math.min(getFadeSamples(buffer.sampleRate), Math.floor(length / 2));

  for (let ch = 0; ch < channels; ch++) {
    const sourceData = buffer.getChannelData(ch);
    const destData = newBuffer.getChannelData(ch);

    // Copy the cropped region
    for (let i = 0; i < length; i++) {
      destData[i] = sourceData[startSample + i];
    }

    // Apply fade-in
    for (let i = 0; i < fadeSamples; i++) {
      destData[i] *= i / fadeSamples;
    }

    // Apply fade-out
    for (let i = 0; i < fadeSamples; i++) {
      destData[length - 1 - i] *= i / fadeSamples;
    }
  }

  return newBuffer;
}

export function computeWaveformData(buffer: AudioBuffer, numPoints: number = 200): number[] {
  const data = buffer.getChannelData(0);
  const peaks: number[] = [];
  const samplesPerPoint = Math.max(1, Math.floor(data.length / numPoints));

  for (let i = 0; i < numPoints; i++) {
    const start = i * samplesPerPoint;
    const end = Math.min(start + samplesPerPoint, data.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(data[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  return peaks;
}
