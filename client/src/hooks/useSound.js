import { useState, useCallback, useEffect } from 'react';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('quiz_sound_muted') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('quiz_sound_muted', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const playTone = useCallback((freq, duration = 0.15, type = 'sine', gainVal = 0.15) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext might be blocked until user gesture
    }
  }, [isMuted]);

  // Sound effects
  const playTick = useCallback(() => {
    playTone(800, 0.05, 'square', 0.05);
  }, [playTone]);

  const playCorrect = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          playTone(freq, 0.25, 'triangle', 0.18);
        }, i * 70);
      });
    } catch (e) {}
  }, [isMuted, playTone]);

  const playWrong = useCallback(() => {
    if (isMuted) return;
    try {
      playTone(220, 0.35, 'sawtooth', 0.15);
      setTimeout(() => playTone(180, 0.4, 'sawtooth', 0.15), 100);
    } catch (e) {}
  }, [isMuted, playTone]);

  const playStart = useCallback(() => {
    if (isMuted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.15), i * 100);
    });
  }, [isMuted, playTone]);

  const playPowerUp = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, [isMuted]);

  const playVictory = useCallback(() => {
    if (isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const delays = [0, 150, 300, 450, 700, 900];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'triangle', 0.2), delays[i]);
    });
  }, [isMuted, playTone]);

  return {
    isMuted,
    toggleMute,
    playTick,
    playCorrect,
    playWrong,
    playStart,
    playPowerUp,
    playVictory
  };
}
