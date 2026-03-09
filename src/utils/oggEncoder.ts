export async function encodeOgg(audioBuffer: AudioBuffer): Promise<Blob> {
  // Check if OGG/Opus is supported
  if (!MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
    // Fallback: try webm/opus which is more widely supported
    if (!MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
      throw new Error('OGG/Opus encoding is not supported in this browser. Use WAV export instead.');
    }
  }

  const mimeType = MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')
    ? 'audio/ogg; codecs=opus'
    : 'audio/webm; codecs=opus';

  return new Promise((resolve, reject) => {
    const ctx = new AudioContext({ sampleRate: audioBuffer.sampleRate });
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(dest);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(dest.stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      ctx.close();
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.onerror = () => {
      ctx.close();
      reject(new Error('Recording failed'));
    };

    recorder.start();
    source.start();

    source.onended = () => {
      // Small delay to ensure all audio is captured
      setTimeout(() => recorder.stop(), 100);
    };
  });
}
