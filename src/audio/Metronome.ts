import { audioEngine } from './AudioEngine';

export function playMetronomeClick(time: number, isDownbeat: boolean): void {
  const ctx = audioEngine.context;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = isDownbeat ? 880 : 440;
  osc.type = 'sine';

  const duration = isDownbeat ? 0.05 : 0.03;

  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(audioEngine.masterGain);

  osc.start(time);
  osc.stop(time + duration);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

export function isDownbeat(step: number): boolean {
  return step % 4 === 0;
}

export function isBeatStep(step: number): boolean {
  return step % 4 === 0;
}
