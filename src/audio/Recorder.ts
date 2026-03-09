import { audioEngine } from './AudioEngine';

export class Recorder {
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private _isRecording = false;

  get isRecording(): boolean {
    return this._isRecording;
  }

  async start(): Promise<void> {
    if (this._isRecording) return;

    await audioEngine.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const ctx = audioEngine.context;
    this.sourceNode = ctx.createMediaStreamSource(this.stream);

    // Using ScriptProcessorNode for broad compatibility
    this.processorNode = ctx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];

    this.processorNode.onaudioprocess = (e) => {
      if (!this._isRecording) return;
      const input = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(input));
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(ctx.destination); // Required for processing to work
    this._isRecording = true;
  }

  stop(): AudioBuffer | null {
    if (!this._isRecording) return null;
    this._isRecording = false;

    // Cleanup nodes
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    if (this.chunks.length === 0) return null;

    // Assemble chunks into a single AudioBuffer
    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
    const buffer = audioEngine.createBuffer(totalLength, 1);
    const channelData = buffer.getChannelData(0);

    let offset = 0;
    for (const chunk of this.chunks) {
      channelData.set(chunk, offset);
      offset += chunk.length;
    }

    this.chunks = [];
    return buffer;
  }
}

export const recorder = new Recorder();
