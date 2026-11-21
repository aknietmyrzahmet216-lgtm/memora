/**
 * MEMORA — Ambient Web Audio Synthesizer Engine
 * Synthesizes analog atmospheric pads, tape warmth, felt piano tones,
 * and vinyl crackle directly in the browser with zero external dependencies.
 */

export const SOUNDTRACK_PRESETS = [
  {
    id: 'golden-afternoon',
    title: 'Golden Afternoon',
    artist: 'The Paper Kites & Ambient Acoustic',
    mood: 'happy-sunny',
    desc: 'Warm sunlit pentatonic pad with gentle vibrato and vinyl crackle',
    tag: 'Apricot Radiance'
  },
  {
    id: 'stillness-rain',
    title: 'Stillness in Rain',
    artist: 'Brian Eno & Ambient Mist',
    mood: 'calm-peaceful',
    desc: 'Soothing low-pass rain texture with resonant fifths',
    tag: 'Sage Silence'
  },
  {
    id: 'echoes-1994',
    title: 'Echoes of 1994',
    artist: 'Ryuichi Sakamoto & Warm Tape',
    mood: 'nostalgic-emotional',
    desc: 'Vintage tape flutter, gentle piano Rhodes chords, and dusty warmth',
    tag: 'Sepia Reverie'
  },
  {
    id: 'morning-light',
    title: 'Morning Light',
    artist: 'Nils Frahm & Minimal Felt',
    mood: 'calm-peaceful',
    desc: 'Soft felted piano arpeggio and morning stillness',
    tag: 'Quiet Alabaster'
  }
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.audioEl = null;
    this.activeNodes = [];
    this.currentPlayingId = null;
    this.isPlaying = false;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play or preview an atmospheric preset
   */
  play(presetId) {
    this._initContext();
    this.stop();

    this.currentPlayingId = presetId;
    this.isPlaying = true;

    switch (presetId) {
      case 'golden-afternoon':
        this._playGoldenAfternoon();
        break;
      case 'stillness-rain':
        this._playStillnessRain();
        break;
      case 'echoes-1994':
        this._playEchoes1994();
        break;
      case 'morning-light':
      default:
        this._playMorningLight();
        break;
    }
  }

  /**
   * Play an external audio stream preview (e.g. from iTunes API)
   */
  playStream(url, trackId) {
    this.stop();
    this.currentPlayingId = trackId;
    this.isPlaying = true;

    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.addEventListener('ended', () => {
        this.stop();
      });
    }

    this.audioEl.src = url;
    this.audioEl.play().catch(e => {
      console.warn('[MEMORA Audio] Stream play prevented or failed:', e);
      this.stop();
    });

    this._notifyState();
  }

  toggleStream(url, trackId) {
    if (this.isPlaying && this.currentPlayingId === trackId) {
      this.stop();
      return false;
    } else {
      this.playStream(url, trackId);
      return true;
    }
  }

  stop() {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch (e) {
        // Ignored
      }
    }

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // Node might already be stopped
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentPlayingId = null;
    this._notifyState();
  }

  _notifyState() {
    if (typeof this.onStateChange === 'function') {
      try {
        this.onStateChange({
          isPlaying: this.isPlaying,
          currentPlayingId: this.currentPlayingId
        });
      } catch (err) {
        // Ignored
      }
    }
  }

  toggle(presetId) {
    if (this.isPlaying && this.currentPlayingId === presetId) {
      this.stop();
      return false;
    } else {
      this.play(presetId);
      return true;
    }
  }

  // Preset 1: Warm Golden Afternoon Pad (F# Major pentatonic warm analog chords)
  _playGoldenAfternoon() {
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.22, now + 1.2);
    masterGain.connect(this.ctx.destination);
    this.activeNodes.push(masterGain);

    // Warm chord frequencies (F#3, C#4, A#4, F4)
    const freqs = [185.00, 277.18, 466.16, 349.23];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for lush analog chorus
      osc.detune.setValueAtTime((idx % 2 === 0 ? 5 : -6), now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);
      filter.Q.setValueAtTime(2.5, now);

      gain.gain.setValueAtTime(0.18, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      this.activeNodes.push(osc, gain, filter);
    });

    // Simulated soft vinyl crackle
    this._addVinylCrackle(masterGain);
  }

  // Preset 2: Calm Rain & Resonant Fifths (D minor tranquil mist)
  _playStillnessRain() {
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.2, now + 1.0);
    masterGain.connect(this.ctx.destination);
    this.activeNodes.push(masterGain);

    // Rain texture via filtered white noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(650, now);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.12, now);

    whiteNoise.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(masterGain);

    whiteNoise.start(now);
    this.activeNodes.push(whiteNoise, rainFilter, rainGain);

    // Soft serene Sine chimes (D4, A4, F5)
    [293.66, 440.00, 698.46].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      oscGain.gain.setValueAtTime(0.08, now);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      this.activeNodes.push(osc, oscGain);
    });
  }

  // Preset 3: Nostalgic 1994 Tape Flutter & Dusty Keys
  _playEchoes1994() {
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.24, now + 0.8);
    masterGain.connect(this.ctx.destination);
    this.activeNodes.push(masterGain);

    // Vintage chord (C#m7: C#3, G#3, B3, E4)
    const notes = [138.59, 207.65, 246.94, 329.63];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Low pass to simulate analog tape head
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      gain.gain.setValueAtTime(0.22, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      this.activeNodes.push(osc, gain, filter);
    });

    this._addVinylCrackle(masterGain);
  }

  // Preset 4: Morning Light (Minimal felt piano tone)
  _playMorningLight() {
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.18, now + 1.0);
    masterGain.connect(this.ctx.destination);
    this.activeNodes.push(masterGain);

    [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle tremolo
      gain.gain.setValueAtTime(0.12, now);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      this.activeNodes.push(osc, gain);
    });
  }

  _addVinylCrackle(destinationGain) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const crackleBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = crackleBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // Occasional random pop/crackle spike
      data[i] = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.4 : 0;
    }

    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.15, now);

    crackleSource.connect(crackleGain);
    crackleGain.connect(destinationGain);
    crackleSource.start(now);
    this.activeNodes.push(crackleSource, crackleGain);
  }
}

export const audioEngine = new AudioEngine();
