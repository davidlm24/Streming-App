// Web Audio Synthesizer for live lofi/synth studio simulation
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentOscillators: OscillatorNode[] = [];
let currentGainNodes: GainNode[] = [];
let isPlaying = false;
let bpm = 110;
let sequenceInterval: NodeJS.Timeout | null = null;
let beatIndex = 0;

// Musical scale definitions based on track mood
const TRACK_MODES: { [key: string]: { root: number, chord: number[] } } = {
  'wedding-01': { root: 329.63, chord: [1, 1.25, 1.5, 1.875] }, // E Major
  'villa-penthouse': { root: 220.00, chord: [1, 1.2, 1.5, 1.8] }, // A Minor (Sophisticated)
  'vanishinghope': { root: 196.00, chord: [1, 1.18, 1.41, 1.68] }, // G Diminished
  'upbeat-energetic-guitar-rhythm': { root: 293.66, chord: [1, 1.25, 1.5, 1.67] }, // D Major 6
  'unbreakableresolve': { root: 220.00, chord: [1, 1.2, 1.4, 1.5] }, // Resolute minor
  'ukulele-chords': { root: 392.00, chord: [1, 1.25, 1.5, 1.75] }, // C Major 7
  'troublingunknown': { root: 146.83, chord: [1, 1.15, 1.35, 1.55] }, // Suspenseful
  'thelounge-jazz': { root: 207.65, chord: [1, 1.2, 1.5, 1.8] }, // G# Minor 7
  'thelightbetweenus': { root: 349.23, chord: [1, 1.25, 1.5, 2.0] }, // F Major
  'thejazzpiano': { root: 261.63, chord: [1, 1.25, 1.5, 1.8] }, // C Major 9
  'theinside-synth': { root: 164.81, chord: [1, 1.2, 1.5, 1.7] }, // E Minor Synth
  'theelevatorbossanova': { root: 220.00, chord: [1, 1.25, 1.5, 1.87] }, // G Major / A Minor hybrid
  'theduel-orchestral': { root: 130.81, chord: [1, 1.2, 1.5, 1.9] } // Epic Low C Minor
};

function getTrackSettings(trackName: string) {
  return TRACK_MODES[trackName] || { root: 220.00, chord: [1, 1.2, 1.5, 1.8] };
}

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function setVolume(volume: number) {
  if (masterGain && audioCtx) {
    masterGain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.1);
  }
}

export function stopSynth() {
  isPlaying = false;
  if (sequenceInterval) {
    clearInterval(sequenceInterval);
    sequenceInterval = null;
  }
  currentOscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
  });
  currentOscillators = [];
  currentGainNodes = [];
}

export function startSynth(trackName: string) {
  initAudio();
  stopSynth();
  if (!audioCtx || !masterGain) return;

  isPlaying = true;
  const settings = getTrackSettings(trackName);
  beatIndex = 0;

  // Start sequencer for dynamic synth pattern
  sequenceInterval = setInterval(() => {
    if (!isPlaying || !audioCtx || !masterGain) return;

    const time = audioCtx.currentTime;
    
    // Play a synth bass note on beat 0, 2
    if (beatIndex % 4 === 0) {
      playTone(settings.root / 2, 'sawtooth', 0.25, 0.4, time);
    } else if (beatIndex % 4 === 2) {
      playTone(settings.root * 1.5 / 2, 'sawtooth', 0.2, 0.4, time);
    }

    // Play a random chord note on beat 0, 1, 2, 3
    const noteRatio = settings.chord[Math.floor(Math.random() * settings.chord.length)];
    const freq = settings.root * noteRatio;
    playTone(freq, 'triangle', 0.15, 0.3, time);

    // Add a simulated hi-hat click on every odd beat
    if (beatIndex % 2 === 1) {
      playNoiseClick(0.04, time);
    }

    beatIndex = (beatIndex + 1) % 8;
  }, (60 / bpm) * 1000 / 2); // 8th notes
}

function playTone(freq: number, type: OscillatorType, duration: number, gainVal: number, startTime: number) {
  if (!audioCtx || !masterGain) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gainVal, startTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(masterGain);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);

  currentOscillators.push(osc);
  currentGainNodes.push(gainNode);

  // Cleanup completed nodes occasionally
  setTimeout(() => {
    const idx = currentOscillators.indexOf(osc);
    if (idx !== -1) {
      currentOscillators.splice(idx, 1);
      currentGainNodes.splice(idx, 1);
    }
  }, (duration + 0.5) * 1000);
}

// Generate high frequency noise for simulated clicks/percussion
function playNoiseClick(duration: number, startTime: number) {
  if (!audioCtx || !masterGain) return;

  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(8000, startTime);

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.08, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGain);

  noise.start(startTime);
  noise.stop(startTime + duration + 0.1);
}
