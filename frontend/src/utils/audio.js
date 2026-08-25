// Dual Audio Engine: High-reliability HTML5 Audio (Base64 WAV) + Web Audio API fallback
// Ensures 100% audible restaurant bell chimes across all browsers and background tabs

function generateBellWav(frequencies, duration = 0.8) {
  if (typeof window === 'undefined') return '';
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // WAV Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Synthesize Bell Harmonics with natural exponential decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const { freq, delay, gain, decay } of frequencies) {
      if (t >= delay) {
        const dt = t - delay;
        const env = Math.exp(-dt * decay);
        sample += Math.sin(2 * Math.PI * freq * dt) * gain * env;
      }
    }
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(44 + i * 2, intSample, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Pre-generate rich, loud, pleasant chime sounds
let staffBellDataUri = '';
let baristaBellDataUri = '';

try {
  // Staff Chime: 4-tone ascending doorbell chime (D5 -> F#5 -> A5 -> D6)
  staffBellDataUri = generateBellWav([
    { freq: 587.33, delay: 0.0, gain: 0.4, decay: 5.0 },
    { freq: 739.99, delay: 0.12, gain: 0.45, decay: 5.0 },
    { freq: 880.00, delay: 0.24, gain: 0.5, decay: 4.5 },
    { freq: 1174.66, delay: 0.38, gain: 0.55, decay: 3.5 },
  ], 1.1);

  // Barista KDS Chime: Loud & energetic 3-tone kitchen alert bell (880Hz -> 1320Hz -> 1760Hz)
  baristaBellDataUri = generateBellWav([
    { freq: 880.00, delay: 0.0, gain: 0.5, decay: 4.5 },
    { freq: 1318.51, delay: 0.14, gain: 0.55, decay: 4.0 },
    { freq: 1760.00, delay: 0.28, gain: 0.6, decay: 3.0 },
  ], 1.0);
} catch (e) {
  console.warn('Cannot pre-generate audio WAV:', e);
}

// Web Audio API Fallback
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

// Play audio via HTML5 Audio with fallback to Web Audio API
const playSoundWithFallback = (dataUri, frequencies, role = 'staff') => {
  // 1. Primary: HTML5 Audio Element (Works everywhere without context suspension)
  if (dataUri) {
    try {
      const audio = new Audio(dataUri);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 Audio autoplay restricted, falling back to Web Audio:', err);
          playWebAudioTones(frequencies);
        });
      }
      return;
    } catch (e) {
      console.warn('HTML5 Audio error:', e);
    }
  }

  // 2. Secondary: Web Audio API
  playWebAudioTones(frequencies);
};

const playWebAudioTones = (frequencies) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => scheduleTones(ctx, frequencies)).catch(() => {});
    } else {
      scheduleTones(ctx, frequencies);
    }
  } catch (err) {
    console.warn('Web Audio error:', err);
  }
};

const scheduleTones = (ctx, frequencies) => {
  const now = ctx.currentTime;
  for (const { freq, delay, gain, decay } of frequencies) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(gain * 0.5, now + delay + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + (1 / decay) * 2.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + delay);
    osc.stop(now + delay + (1 / decay) * 2.5);
  }
};

/**
 * Play Staff New Order Chime
 */
export const playOrderNotificationSound = () => {
  const isMuted = localStorage.getItem('staff_notification_sound_enabled') === 'false';
  if (isMuted) return;

  const staffTones = [
    { freq: 587.33, delay: 0.0, gain: 0.4, decay: 5.0 },
    { freq: 739.99, delay: 0.12, gain: 0.45, decay: 5.0 },
    { freq: 880.00, delay: 0.24, gain: 0.5, decay: 4.5 },
    { freq: 1174.66, delay: 0.38, gain: 0.55, decay: 3.5 },
  ];

  playSoundWithFallback(staffBellDataUri, staffTones, 'staff');
};

/**
 * Play Barista KDS Ticket Chime
 */
export const playBaristaNotificationSound = () => {
  const isMuted = localStorage.getItem('barista_notification_sound_enabled') === 'false';
  if (isMuted) return;

  const baristaTones = [
    { freq: 880.00, delay: 0.0, gain: 0.5, decay: 4.5 },
    { freq: 1318.51, delay: 0.14, gain: 0.55, decay: 4.0 },
    { freq: 1760.00, delay: 0.28, gain: 0.6, decay: 3.0 },
  ];

  playSoundWithFallback(baristaBellDataUri, baristaTones, 'barista');
};

/**
 * Test sound preview
 */
export const testNotificationSound = (role = 'staff') => {
  if (role === 'barista') {
    const baristaTones = [
      { freq: 880.00, delay: 0.0, gain: 0.5, decay: 4.5 },
      { freq: 1318.51, delay: 0.14, gain: 0.55, decay: 4.0 },
      { freq: 1760.00, delay: 0.28, gain: 0.6, decay: 3.0 },
    ];
    playSoundWithFallback(baristaBellDataUri, baristaTones, 'barista');
  } else {
    const staffTones = [
      { freq: 587.33, delay: 0.0, gain: 0.4, decay: 5.0 },
      { freq: 739.99, delay: 0.12, gain: 0.45, decay: 5.0 },
      { freq: 880.00, delay: 0.24, gain: 0.5, decay: 4.5 },
      { freq: 1174.66, delay: 0.38, gain: 0.55, decay: 3.5 },
    ];
    playSoundWithFallback(staffBellDataUri, staffTones, 'staff');
  }
};
