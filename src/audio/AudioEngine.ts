class AudioEngineClass {
  private _context: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  get context(): AudioContext {
    if (!this._context) {
      this._context = new AudioContext({ sampleRate: 44100 });
      this._masterGain = this._context.createGain();
      this._masterGain.connect(this._context.destination);
    }
    return this._context;
  }

  get masterGain(): GainNode {
    this.context; // ensure initialized
    return this._masterGain!;
  }

  get sampleRate(): number {
    return this.context.sampleRate;
  }

  async resume(): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  playSample(
    buffer: AudioBuffer,
    time?: number,
    gain: number = 1,
    playbackRate: number = 1
  ): AudioBufferSourceNode {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const gainNode = this.context.createGain();
    gainNode.gain.value = gain;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
      source.disconnect();
      gainNode.disconnect();
    };

    source.start(time ?? this.context.currentTime);
    return source;
  }

  stopAll(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.activeSources.clear();
  }

  createBuffer(length: number, channels: number = 1): AudioBuffer {
    return this.context.createBuffer(channels, length, this.sampleRate);
  }
}

export const audioEngine = new AudioEngineClass();
