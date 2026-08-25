let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function noiseBurst(ctx, { start, duration, filterType, frequency, q, peakGain }) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peakGain, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
  source.stop(start + duration);
}

// Bat-on-ball "thwock" + a rising fanfare + a crowd-cheer swell, all synthesized
// (no audio assets needed).
export function playWinFanfare() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    noiseBurst(ctx, { start: now, duration: 0.08, filterType: "bandpass", frequency: 1200, q: 1.2, peakGain: 0.9 });

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const t = now + 0.12 + i * 0.11;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    const cheerDur = 1.6;
    const cheerStart = now + 0.15;
    const cheerBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * cheerDur), ctx.sampleRate);
    const cheerData = cheerBuffer.getChannelData(0);
    for (let i = 0; i < cheerData.length; i++) cheerData[i] = Math.random() * 2 - 1;
    const cheerSource = ctx.createBufferSource();
    cheerSource.buffer = cheerBuffer;
    const cheerFilter = ctx.createBiquadFilter();
    cheerFilter.type = "bandpass";
    cheerFilter.frequency.value = 1800;
    cheerFilter.Q.value = 0.6;
    const cheerGain = ctx.createGain();
    cheerGain.gain.setValueAtTime(0, cheerStart);
    cheerGain.gain.linearRampToValueAtTime(0.18, cheerStart + 0.5);
    cheerGain.gain.linearRampToValueAtTime(0.12, cheerStart + 1.0);
    cheerGain.gain.linearRampToValueAtTime(0, cheerStart + cheerDur);
    cheerSource.connect(cheerFilter).connect(cheerGain).connect(ctx.destination);
    cheerSource.start(cheerStart);
    cheerSource.stop(cheerStart + cheerDur);
  } catch {
    // Web Audio unavailable — celebration continues silently via confetti.
  }
}
