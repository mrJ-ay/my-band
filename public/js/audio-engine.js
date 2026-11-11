import { INSTRUMENTS } from './presets.js';
import { beatToSeconds, secondsToBeat } from './musicxml-parser.js';

const SOUNDFONT_BASES = [
  'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/',
  'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/'
];

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class EnsembleAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.dryGain = null;
    this.wetGain = null;
    this.convolver = null;
    this.compressor = null;

    this.soundfontCache = new Map(); // sfName -> { status: 'loading'|'ready'|'failed', player }
    this.loadingCallbacks = new Set();

    this.scoreData = null; // { tracks, tempoMap, totalBeats }
    this.trackAudioMap = new Map(); // trackId -> { gainNode, panNode, activeVoices: Set, nextNoteIdx }

    this.isPlaying = false;
    this.rateMultiplier = 1.0;
    this.masterVolume = 0.85;
    this.reverbAmount = 0.28;

    this.playStartCtxTime = 0;
    this.offsetSeconds = 0;
    this.schedulerTimer = null;
    this.rafId = null;

    this.onProgress = null;
    this.onEnded = null;
    this.onTrackLoadUpdate = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.005;
      this.compressor.release.value = 0.15;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;

      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this._createImpulseResponse(2.1, 2.4);

      this._applyReverbMix();

      // Master routing: inputs -> dryGain & convolver->wetGain -> compressor -> masterGain -> destination
      this.masterInput = this.ctx.createGain();
      this.masterInput.connect(this.dryGain);
      this.masterInput.connect(this.convolver);
      this.convolver.connect(this.wetGain);

      this.dryGain.connect(this.compressor);
      this.wetGain.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _createImpulseResponse(durationSec, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.6;
      }
    }
    return impulse;
  }

  _applyReverbMix() {
    if (!this.dryGain || !this.wetGain || !this.ctx) return;
    const wet = Math.max(0, Math.min(1, this.reverbAmount));
    this.dryGain.gain.setTargetAtTime(1 - wet * 0.35, this.ctx.currentTime, 0.02);
    this.wetGain.gain.setTargetAtTime(wet * 0.85, this.ctx.currentTime, 0.02);
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1.2, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  setReverb(val) {
    this.reverbAmount = Math.max(0, Math.min(1, val));
    this._applyReverbMix();
  }

  setRateMultiplier(rate) {
    const newRate = Math.max(0.5, Math.min(1.6, rate));
    if (this.isPlaying && this.scoreData && this.ctx) {
      const curBeat = this.getCurrentBeat();
      this.rateMultiplier = newRate;
      const newSec = beatToSeconds(curBeat, this.scoreData.tempoMap, this.rateMultiplier);
      this.offsetSeconds = newSec;
      this.playStartCtxTime = this.ctx.currentTime;
    } else {
      this.rateMultiplier = newRate;
    }
  }

  setScore(scoreData) {
    this.stop();
    this.scoreData = scoreData;
    this.rebuildTrackNodes();
    this.preloadScoreInstruments();
  }

  rebuildTrackNodes() {
    this.ensureContext();
    for (const nodeInfo of this.trackAudioMap.values()) {
      nodeInfo.gainNode.disconnect();
      nodeInfo.panNode.disconnect();
    }
    this.trackAudioMap.clear();

    if (!this.scoreData) return;

    for (const track of this.scoreData.tracks) {
      const gainNode = this.ctx.createGain();
      const panNode = this.ctx.createStereoPanner();
      gainNode.connect(panNode);
      panNode.connect(this.masterInput);

      this.trackAudioMap.set(track.id, {
        gainNode,
        panNode,
        nextNoteIdx: 0,
        activeStops: new Set()
      });
    }
    this.syncTrackMixerStates();
  }

  syncTrackMixerStates() {
    if (!this.scoreData || !this.ctx) return;
    const anySolo = this.scoreData.tracks.some((t) => t.solo);

    for (const track of this.scoreData.tracks) {
      const nodeInfo = this.trackAudioMap.get(track.id);
      if (!nodeInfo) continue;

      const isAudible = anySolo ? track.solo : !track.muted;
      const targetGain = isAudible ? track.volume : 0;
      nodeInfo.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.015);
      nodeInfo.panNode.pan.setTargetAtTime(track.pan || 0, this.ctx.currentTime, 0.015);
    }
  }

  async preloadScoreInstruments() {
    if (!this.scoreData) return;
    const keys = Array.from(new Set(this.scoreData.tracks.map((t) => t.instrumentKey)));
    await Promise.all(keys.map((key) => this.loadInstrumentSoundfont(key)));
  }

  async loadInstrumentSoundfont(instrumentKey) {
    const inst = INSTRUMENTS[instrumentKey] || INSTRUMENTS.acoustic_grand_piano;
    const sfName = inst.sfName;

    if (this.soundfontCache.has(sfName)) {
      const cached = this.soundfontCache.get(sfName);
      if (cached.status !== 'loading') return cached;
      return await cached.promise;
    }

    this.ensureContext();
    const entry = { status: 'loading', player: null, promise: null };

    const loadPromise = (async () => {
      if (!window.Soundfont) {
        entry.status = 'failed';
        this._notifyTrackLoad();
        return entry;
      }

      for (const base of SOUNDFONT_BASES) {
        try {
          const player = await Promise.race([
            window.Soundfont.instrument(this.ctx, sfName, {
              soundfont: 'MusyngKite',
              nameToUrl: (name, sf, format) => `${base}${name}-${format || 'mp3'}.js`
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Soundfont timeout')), 12000))
          ]);
          entry.player = player;
          entry.status = 'ready';
          this._notifyTrackLoad();
          return entry;
        } catch (err) {
          // Try next mirror CDN
        }
      }

      entry.status = 'failed';
      this._notifyTrackLoad();
      return entry;
    })();

    entry.promise = loadPromise;
    this.soundfontCache.set(sfName, entry);
    this._notifyTrackLoad();
    return await loadPromise;
  }

  getInstrumentStatus(instrumentKey) {
    const inst = INSTRUMENTS[instrumentKey] || INSTRUMENTS.acoustic_grand_piano;
    const cached = this.soundfontCache.get(inst.sfName);
    return cached ? cached.status : 'idle';
  }

  _notifyTrackLoad() {
    if (this.onTrackLoadUpdate) {
      this.onTrackLoadUpdate();
    }
  }

  getTotalSeconds() {
    if (!this.scoreData) return 0;
    return beatToSeconds(this.scoreData.totalBeats, this.scoreData.tempoMap, this.rateMultiplier);
  }

  getCurrentSeconds() {
    if (!this.isPlaying || !this.ctx) {
      return this.offsetSeconds;
    }
    return this.offsetSeconds + (this.ctx.currentTime - this.playStartCtxTime);
  }

  getCurrentBeat() {
    if (!this.scoreData) return 0;
    return secondsToBeat(this.getCurrentSeconds(), this.scoreData.tempoMap, this.rateMultiplier);
  }

  play() {
    if (!this.scoreData || this.isPlaying) return;
    this.ensureContext();

    if (this.trackAudioMap.size !== this.scoreData.tracks.length) {
      this.rebuildTrackNodes();
    }

    const totalSec = this.getTotalSeconds();
    if (this.offsetSeconds >= totalSec - 0.05) {
      this.offsetSeconds = 0;
    }

    const startBeat = secondsToBeat(this.offsetSeconds, this.scoreData.tempoMap, this.rateMultiplier);
    for (const track of this.scoreData.tracks) {
      const nodeInfo = this.trackAudioMap.get(track.id);
      if (nodeInfo) {
        nodeInfo.nextNoteIdx = this._binarySearchNoteIdx(track.notes, startBeat - 0.01);
      }
    }

    this.playStartCtxTime = this.ctx.currentTime;
    this.isPlaying = true;
    this.schedulerTimer = setInterval(() => this._schedulerTick(), 25);
    this._schedulerTick();
    this._startRafLoop();
  }

  _binarySearchNoteIdx(notes, targetBeat) {
    let lo = 0;
    let hi = notes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (notes[mid].startBeat < targetBeat) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  pause() {
    if (!this.isPlaying) return;
    this.offsetSeconds = this.getCurrentSeconds();
    this.isPlaying = false;
    clearInterval(this.schedulerTimer);
    this.schedulerTimer = null;
    cancelAnimationFrame(this.rafId);
    this._stopAllActiveVoices();
    this._emitProgress();
  }

  stop() {
    this.isPlaying = false;
    this.offsetSeconds = 0;
    clearInterval(this.schedulerTimer);
    this.schedulerTimer = null;
    cancelAnimationFrame(this.rafId);
    this._stopAllActiveVoices();
    for (const nodeInfo of this.trackAudioMap.values()) {
      nodeInfo.nextNoteIdx = 0;
    }
    this._emitProgress();
  }

  seekToSeconds(sec) {
    const totalSec = this.getTotalSeconds();
    const clamped = Math.max(0, Math.min(totalSec, sec));
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      clearInterval(this.schedulerTimer);
      cancelAnimationFrame(this.rafId);
      this._stopAllActiveVoices();
      this.isPlaying = false;
    }
    this.offsetSeconds = clamped;
    if (wasPlaying) {
      this.play();
    } else {
      this._emitProgress();
    }
  }

  seekToBeat(beat) {
    if (!this.scoreData) return;
    const sec = beatToSeconds(beat, this.scoreData.tempoMap, this.rateMultiplier);
    this.seekToSeconds(sec);
  }

  _stopAllActiveVoices() {
    for (const nodeInfo of this.trackAudioMap.values()) {
      for (const voice of nodeInfo.activeStops) {
        try {
          if (typeof voice === 'function') voice();
          else if (voice && voice.stopFn) voice.stopFn();
        } catch (_) {}
      }
      nodeInfo.activeStops.clear();
    }
  }

  _pruneExpiredVoices(now) {
    let totalActive = 0;
    for (const nodeInfo of this.trackAudioMap.values()) {
      for (const voice of nodeInfo.activeStops) {
        if (voice.endAudioTime <= now) {
          nodeInfo.activeStops.delete(voice);
        } else {
          totalActive++;
        }
      }
    }
    return totalActive;
  }

  _schedulerTick() {
    if (!this.isPlaying || !this.scoreData || !this.ctx) return;

    const now = this.ctx.currentTime;
    const elapsed = now - this.playStartCtxTime;
    const currentPlaybackSec = this.offsetSeconds + elapsed;
    const lookAheadSec = currentPlaybackSec + 0.15;
    const totalSec = this.getTotalSeconds();
    const rate = this.rateMultiplier;

    let activeVoiceCount = this._pruneExpiredVoices(now);
    const MAX_POLYPHONY = 52;

    const anySolo = this.scoreData.tracks.some((t) => t.solo);

    for (const track of this.scoreData.tracks) {
      const nodeInfo = this.trackAudioMap.get(track.id);
      if (!nodeInfo) continue;

      const isAudible = anySolo ? track.solo : !track.muted;

      while (nodeInfo.nextNoteIdx < track.notes.length) {
        const note = track.notes[nodeInfo.nextNoteIdx];
        const noteStartSec =
          note._sec1x !== undefined
            ? note._sec1x / rate
            : beatToSeconds(note.startBeat, this.scoreData.tempoMap, rate);

        if (noteStartSec > lookAheadSec) break;

        nodeInfo.nextNoteIdx++;
        if (!isAudible || noteStartSec < currentPlaybackSec - 0.08) {
          continue;
        }

        if (activeVoiceCount >= MAX_POLYPHONY) {
          continue;
        }

        const durSec =
          note._durSec1x !== undefined
            ? Math.max(0.05, note._durSec1x / rate)
            : Math.max(
                0.06,
                beatToSeconds(note.startBeat + note.durationBeats, this.scoreData.tempoMap, rate) -
                  noteStartSec
              );
        const humanizeSec = (track.humanizeMs || 0) / 1000;
        const scheduleAudioTime =
          this.playStartCtxTime + (noteStartSec - this.offsetSeconds) + humanizeSec;

        if (scheduleAudioTime >= now - 0.05) {
          this._triggerVoice(
            track,
            nodeInfo,
            note,
            Math.max(now, scheduleAudioTime),
            durSec
          );
          activeVoiceCount++;
        }
      }
    }

    if (currentPlaybackSec >= totalSec + 0.35) {
      this.stop();
      if (this.onEnded) this.onEnded();
    }
  }

  _triggerVoice(track, nodeInfo, note, audioTime, durationSec) {
    const inst = INSTRUMENTS[track.instrumentKey] || INSTRUMENTS.acoustic_grand_piano;
    const cached = this.soundfontCache.get(inst.sfName);

    if (inst.isPercussion || note.isPercussion) {
      const stopFn = this._playDrumSynth(note.midi, audioTime, nodeInfo.gainNode);
      nodeInfo.activeStops.add({ stopFn, endAudioTime: audioTime + 0.35 });
      return;
    }

    if (cached && cached.status === 'ready' && cached.player) {
      const stopNode = cached.player.play(note.midi, audioTime, {
        duration: durationSec,
        gain: note.velocity || 0.78,
        destination: nodeInfo.gainNode,
        cents: track.detuneCents || 0
      });
      if (stopNode && typeof stopNode.stop === 'function') {
        const stopFn = () => stopNode.stop(this.ctx.currentTime);
        nodeInfo.activeStops.add({ stopFn, endAudioTime: audioTime + durationSec + 0.35 });
      }
    } else {
      const stopFn = this._playFallbackSynth(
        inst.synthType,
        note.midi,
        audioTime,
        durationSec,
        nodeInfo.gainNode,
        track.detuneCents || 0
      );
      nodeInfo.activeStops.add({ stopFn, endAudioTime: audioTime + durationSec + 0.35 });
    }
  }

  /**
   * Instant Web Audio synthesizer fallback when SoundFont is still downloading or offline.
   */
  _playFallbackSynth(synthType, midi, startTime, durationSec, destination, detuneCents = 0) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    let attack = 0.02;
    let release = 0.14;
    let peak = 0.24;

    if (synthType === 'strings' || synthType === 'pad') {
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc2.detune.value = detuneCents + 6;
      filter.type = 'lowpass';
      filter.frequency.value = synthType === 'pad' ? 1400 : 2200;
      attack = synthType === 'pad' ? 0.12 : 0.08;
      release = 0.28;
      peak = 0.18;
    } else if (synthType === 'brass') {
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc2.detune.value = detuneCents + 4;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, startTime);
      filter.frequency.linearRampToValueAtTime(2400, startTime + 0.06);
      attack = 0.035;
      release = 0.12;
      peak = 0.18;
    } else if (synthType === 'woodwind') {
      osc1.type = 'triangle';
      osc2.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      attack = 0.04;
      release = 0.12;
      peak = 0.22;
    } else if (synthType === 'bass') {
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc2.frequency.value = freq * 0.5;
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      attack = 0.015;
      release = 0.12;
      peak = 0.28;
    } else if (synthType === 'guitar') {
      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, startTime);
      filter.frequency.exponentialRampToValueAtTime(750, startTime + Math.min(durationSec, 0.45));
      attack = 0.008;
      release = 0.18;
      peak = 0.22;
    } else {
      // keyboard
      osc1.type = 'triangle';
      osc2.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3400, startTime);
      filter.frequency.exponentialRampToValueAtTime(1000, startTime + Math.min(durationSec, 0.7));
      attack = 0.006;
      release = 0.22;
      peak = 0.24;
    }

    osc1.frequency.value = freq;
    osc1.detune.value = detuneCents;
    if (synthType !== 'bass') {
      osc2.frequency.value = freq;
      osc2.detune.value = detuneCents + 2;
    }

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + attack);
    const sustainLevel = synthType === 'keyboard' || synthType === 'guitar' ? peak * 0.35 : peak * 0.75;
    const endTime = startTime + Math.max(0.05, durationSec);
    env.gain.linearRampToValueAtTime(sustainLevel, endTime);
    env.gain.exponentialRampToValueAtTime(0.0001, endTime + release);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    env.connect(destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(endTime + release + 0.02);
    osc2.stop(endTime + release + 0.02);

    return () => {
      try {
        osc1.stop();
        osc2.stop();
      } catch (_) {}
    };
  }

  _playDrumSynth(midi, startTime, destination) {
    const ctx = this.ctx;
    if (midi === 35 || midi === 36) {
      // Kick drum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, startTime);
      osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.14);
      gain.gain.setValueAtTime(0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.24);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + 0.26);
      return () => { try { osc.stop(); } catch (_) {} };
    }

    // Snare / Hi-hat noise burst
    const isHihat = midi === 42 || midi === 44 || midi === 46 || midi === 49 || midi === 51;
    const len = Math.floor(ctx.sampleRate * (isHihat ? 0.09 : 0.16));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = isHihat ? 'highpass' : 'bandpass';
    filter.frequency.value = isHihat ? 5500 : 1800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isHihat ? 0.24 : 0.42, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + (isHihat ? 0.08 : 0.15));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start(startTime);
    return () => { try { noise.stop(); } catch (_) {} };
  }

  async previewInstrument(instrumentKey) {
    this.ensureContext();
    const entry = await this.loadInstrumentSoundfont(instrumentKey);
    const now = this.ctx.currentTime;
    const notes = INSTRUMENTS[instrumentKey]?.synthType === 'bass'
      ? [48, 52, 55]
      : [60, 64, 67, 72];

    if (INSTRUMENTS[instrumentKey]?.isPercussion) {
      this._playDrumSynth(36, now, this.masterInput);
      this._playDrumSynth(42, now + 0.12, this.masterInput);
      this._playDrumSynth(38, now + 0.24, this.masterInput);
      return;
    }

    notes.forEach((midi, idx) => {
      const t = now + idx * 0.12;
      if (entry.status === 'ready' && entry.player) {
        entry.player.play(midi, t, { duration: 0.45, gain: 0.7, destination: this.masterInput });
      } else {
        this._playFallbackSynth(
          INSTRUMENTS[instrumentKey]?.synthType || 'keyboard',
          midi,
          t,
          0.35,
          this.masterInput
        );
      }
    });
  }

  _startRafLoop() {
    const tick = () => {
      if (!this.isPlaying) return;
      this._emitProgress();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _emitProgress() {
    if (!this.onProgress || !this.scoreData) return;
    const currentSeconds = this.getCurrentSeconds();
    const totalSeconds = this.getTotalSeconds();
    const currentBeat = this.getCurrentBeat();
    this.onProgress({
      currentSeconds,
      totalSeconds,
      currentBeat,
      totalBeats: this.scoreData.totalBeats,
      isPlaying: this.isPlaying
    });
  }
}
