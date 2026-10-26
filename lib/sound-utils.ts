// Web Audio API synthesizers for crisp, zero-latency micro-interaction sound effects & ambient noise

let audioCtx: AudioContext | null = null;
let activeAmbientSource: AudioNode | null = null;
let activeAmbientGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Satisfying task completion chime with ascending harmonic notes
 */
export function playTaskCompleteSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Note 2: B5 (987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {
    // Ignore audio errors gracefully
  }
}

/**
 * Resonant bell chime for Pomodoro focus/break completion
 */
export function playPomodoroBellSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 523.25; // C5

    [1, 2, 3].forEach((harmonic, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * harmonic, now);

      const initialVol = 0.2 / (idx + 1);
      gain.gain.setValueAtTime(initialVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  } catch (e) {
    // Ignore audio errors
  }
}

/**
 * Subtle mechanical click for timer start/pause
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    // Ignore
  }
}

/**
 * Ambient White Noise / Rain Sound Generator using Web Audio API
 */
export function startAmbientSound(type: "rain" | "whitenoise" | "clock"): () => void {
  stopAmbientSound();

  try {
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    if (type === "clock") {
      let interval: NodeJS.Timeout | null = setInterval(() => {
        playClickSound();
      }, 1000);
      return () => {
        if (interval) clearInterval(interval);
      };
    }

    // Generate 5 seconds of looping filtered noise
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoiseSource = ctx.createBufferSource();
    whiteNoiseSource.buffer = buffer;
    whiteNoiseSource.loop = true;

    // Filter noise based on type
    const filter = ctx.createBiquadFilter();
    if (type === "rain") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
    } else {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    whiteNoiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoiseSource.start();

    activeAmbientSource = whiteNoiseSource;
    activeAmbientGain = gain;

    return () => {
      stopAmbientSound();
    };
  } catch (e) {
    return () => {};
  }
}

export function stopAmbientSound() {
  try {
    if (activeAmbientSource) {
      (activeAmbientSource as any).stop?.();
      activeAmbientSource.disconnect?.();
      activeAmbientSource = null;
    }
    if (activeAmbientGain) {
      activeAmbientGain.disconnect?.();
      activeAmbientGain = null;
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Satisfying 3-note harmonic arpeggio for habit completion
 */
export function playHabitChimeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.2 },      // C5
      { freq: 659.25, time: 0.08, duration: 0.25 },   // E5
      { freq: 783.99, time: 0.16, duration: 0.4 },    // G5
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.14, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (e) {
    // Ignore audio errors
  }
}

/**
 * Celebratory fanfare sound for milestone unlocks & level-ups
 */
export function playMilestoneFanfareSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.18 },     // C5
      { freq: 659.25, time: 0.12, duration: 0.18 },   // E5
      { freq: 783.99, time: 0.24, duration: 0.22 },   // G5
      { freq: 1046.5, time: 0.4, duration: 0.7 },     // C6
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle"; // richer, warmer overtone
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.2, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (e) {
    // Ignore audio errors
  }
}
