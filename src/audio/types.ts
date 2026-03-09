export interface SampleData {
  id: string;
  name: string;
  buffer: AudioBuffer;
  waveformData: number[];
  duration: number;
  sampleRate: number;
  createdAt: number;
}

export interface ScheduleEvent {
  step: number;
  time: number;
}

export interface OnsetResult {
  onsetSample: number;
  tailSample: number;
}
