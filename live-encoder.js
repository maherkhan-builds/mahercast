/* MaherCast Live MP4 Encoder — encodes the recording directly to a flat,
   real (non-fragmented) MP4 as it happens, via WebCodecs + mp4-muxer.
   Unlike the editor's export (which replays a finished file), this runs
   live alongside the actual recording — so there's no separate "export"
   step afterward: stop recording, and the MP4 is already built. Falls
   back to the old MediaRecorder/webm path automatically if this browser
   doesn't support WebCodecs. */

const LiveEncoder = (() => {
  function supported() {
    return typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined' &&
      typeof MediaStreamTrackProcessor !== 'undefined' && typeof Mp4Muxer !== 'undefined';
  }

  let state = null;

  function isRunning() { return !!state; }

  async function start({ videoTrack, audioTrack, width, height }) {
    const bitrate = width * height <= 1280 * 720 ? 6_000_000 : width * height <= 1920 * 1080 ? 8_000_000 : 12_000_000;
    let videoConfig = null;
    for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42001f']) {
      const support = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate, framerate: 30 });
      if (support.supported) { videoConfig = support.config; break; }
    }
    if (!videoConfig) throw new Error('NO_H264_ENCODER');

    let audioConfig = null, sampleRate = 48000, numberOfChannels = 2;
    if (audioTrack) {
      sampleRate = audioTrack.getSettings().sampleRate || 48000;
      numberOfChannels = audioTrack.getSettings().channelCount || 2;
      const audioSupport = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate, numberOfChannels, bitrate: 128_000 });
      if (!audioSupport.supported) throw new Error('NO_AAC_ENCODER');
      audioConfig = { codec: 'mp4a.40.2', sampleRate, numberOfChannels, bitrate: 128_000 };
    }

    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: { codec: 'avc', width, height },
      audio: audioConfig ? { codec: 'aac', numberOfChannels, sampleRate } : undefined,
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: e => console.error('live video encode error', e),
    });
    videoEncoder.configure(videoConfig);

    let audioEncoder = null;
    if (audioConfig) {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: e => console.error('live audio encode error', e),
      });
      audioEncoder.configure(audioConfig);
    }

    const videoReader = new MediaStreamTrackProcessor({ track: videoTrack }).readable.getReader();
    const audioReader = audioTrack ? new MediaStreamTrackProcessor({ track: audioTrack }).readable.getReader() : null;

    state = { muxer, videoEncoder, audioEncoder, videoReader, audioReader, paused: false, stopping: false, frameCount: 0 };

    state.pumpVideo = (async () => {
      while (!state.stopping) {
        const { value, done } = await videoReader.read();
        if (done || !value) break;
        if (!state.paused && videoEncoder.encodeQueueSize <= 2) {
          videoEncoder.encode(value, { keyFrame: state.frameCount % 90 === 0 });
          state.frameCount++;
        }
        value.close();
      }
    })();
    if (audioReader) {
      state.pumpAudio = (async () => {
        while (!state.stopping) {
          const { value, done } = await audioReader.read();
          if (done || !value) break;
          if (!state.paused) audioEncoder.encode(value);
          value.close();
        }
      })();
    }
  }

  function pause() { if (state) state.paused = true; }
  function resume() { if (state) state.paused = false; }

  async function stop() {
    if (!state) return null;
    const s = state;
    state = null; // guard against a second concurrent stop() call
    s.stopping = true;
    try { await s.videoReader.cancel(); } catch {}
    if (s.audioReader) { try { await s.audioReader.cancel(); } catch {} }
    await Promise.all([s.pumpVideo, s.pumpAudio].filter(Boolean));
    await s.videoEncoder.flush();
    if (s.audioEncoder) await s.audioEncoder.flush();
    s.muxer.finalize();
    return new Blob([s.muxer.target.buffer], { type: 'video/mp4' });
  }

  return { supported, isRunning, start, pause, resume, stop };
})();
