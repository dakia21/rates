"use client";

class SoundEffects {
  private ctx: AudioContext | null = null;

  private isSoundsEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("rates_sounds_enabled") !== "false";
  }

  private init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playSent() {
    if (!this.isSoundsEnabled()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Failed to play sent sound:", e);
    }
  }

  playReceived() {
    if (!this.isSoundsEnabled()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const playPop = (delay: number, freq: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + delay + 0.06);
        
        gain.gain.setValueAtTime(0.06, now + delay);
        gain.gain.linearRampToValueAtTime(0.001, now + delay + 0.06);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      };

      playPop(0, 523.25); // C5
      playPop(0.05, 659.25); // E5
    } catch (e) {
      console.warn("Failed to play received sound:", e);
    }
  }

  playLike() {
    if (!this.isSoundsEnabled()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn("Failed to play like sound:", e);
    }
  }

  playClick() {
    if (!this.isSoundsEnabled()) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.setValueAtTime(300, now + 0.015);
      
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.015);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.015);
    } catch (e) {
      console.warn("Failed to play click sound:", e);
    }
  }
}

export const soundEffects = new SoundEffects();
