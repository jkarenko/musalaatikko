import { audioEngine } from './AudioEngine';

export type StepCallback = (step: number, time: number) => void;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

export class Scheduler {
  private intervalId: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private _tempo = 120;
  private _totalSteps = 16;
  private _isRunning = false;
  private onStep: StepCallback | null = null;
  private onStepUI: ((step: number) => void) | null = null;

  get isRunning(): boolean {
    return this._isRunning;
  }

  get tempo(): number {
    return this._tempo;
  }

  set tempo(bpm: number) {
    this._tempo = Math.max(30, Math.min(300, bpm));
  }

  set totalSteps(steps: number) {
    this._totalSteps = steps;
  }

  private get secondsPerStep(): number {
    // 16 steps = 4 beats in 4/4, so each step = 1/4 of a beat = 1 sixteenth note
    return 60.0 / this._tempo / 4;
  }

  start(onStep: StepCallback, onStepUI?: (step: number) => void): void {
    if (this._isRunning) return;

    this.onStep = onStep;
    this.onStepUI = onStepUI ?? null;
    this.currentStep = 0;
    this.nextNoteTime = audioEngine.context.currentTime;
    this._isRunning = true;

    this.intervalId = window.setInterval(() => this.tick(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (!this._isRunning) return;
    this._isRunning = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.onStep = null;
    this.onStepUI = null;
    audioEngine.stopAll();
  }

  private tick(): void {
    const currentTime = audioEngine.context.currentTime;

    while (this.nextNoteTime < currentTime + SCHEDULE_AHEAD_S) {
      this.onStep?.(this.currentStep, this.nextNoteTime);

      // Schedule UI update (approximate, for visual feedback)
      const delay = Math.max(0, (this.nextNoteTime - currentTime) * 1000);
      const step = this.currentStep;
      setTimeout(() => this.onStepUI?.(step), delay);

      this.nextNoteTime += this.secondsPerStep;
      this.currentStep = (this.currentStep + 1) % this._totalSteps;
    }
  }
}

export const scheduler = new Scheduler();
