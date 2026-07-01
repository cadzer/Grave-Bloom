const STORAGE_KEY = 'survivor_mute';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export class SoundSystem {
    constructor() {
        this.ctx = null;
        this.muted = this._loadMute();
        this._initialized = false;
        this._killStreak = 0;
        this._killStreakTimer = 0;
    }

    _init() {
        if (this._initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._initialized = true;
        } catch (e) { /* no audio support */ }
    }

    _loadMute() {
        try {
            return localStorage.getItem(STORAGE_KEY) === '1';
        } catch (e) { return false; }
    }

    _saveMute() {
        try {
            localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0');
        } catch (e) { /* ignore */ }
    }

    toggleMute() {
        this.muted = !this.muted;
        this._saveMute();
        return this.muted;
    }

    isMuted() { return this.muted; }

    _tone(freq, duration, type, vol, ramp) {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, now);
        if (ramp) osc.frequency.linearRampToValueAtTime(ramp, now + duration);
        gain.gain.setValueAtTime(clamp(vol || 0.15, 0, 0.4), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    _noise(duration, vol) {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(clamp(vol || 0.08, 0, 0.3), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
    }

    playShoot() {
        this._init();
        this._tone(800, 0.08, 'square', 0.06, 400);
    }

    playEnemyHit() {
        this._init();
        this._tone(300, 0.06, 'square', 0.05, 150);
    }

    playEnemyDeath() {
        this._init();
        this._killStreak++;
        this._killStreakTimer = 1.5;
        const pitchMulti = 1 + Math.min(this._killStreak * 0.04, 0.6);
        this._tone(200 * pitchMulti, 0.15, 'sawtooth', 0.07, 60 * pitchMulti);
        this._noise(0.08, 0.04);
    }

    updateKillStreak(dt) {
        if (this._killStreakTimer > 0) {
            this._killStreakTimer -= dt;
            if (this._killStreakTimer <= 0) {
                this._killStreak = 0;
            }
        }
    }

    playXpPickup() {
        this._init();
        this._tone(1200, 0.06, 'sine', 0.04, 1600);
    }

    playCoinPickup() {
        this._init();
        this._tone(1400, 0.05, 'sine', 0.05, 1800);
        setTimeout(() => this._tone(1800, 0.05, 'sine', 0.04), 50);
    }

    playLevelUp() {
        this._init();
        this._tone(523, 0.12, 'sine', 0.1);
        setTimeout(() => this._tone(659, 0.12, 'sine', 0.1), 100);
        setTimeout(() => this._tone(784, 0.18, 'sine', 0.12), 200);
    }

    playChestOpen() {
        this._init();
        this._tone(400, 0.15, 'sine', 0.08, 800);
        this._noise(0.1, 0.03);
    }

    playEvolution() {
        this._init();
        this._tone(400, 0.2, 'sine', 0.1);
        setTimeout(() => this._tone(600, 0.2, 'sine', 0.1), 150);
        setTimeout(() => this._tone(800, 0.2, 'sine', 0.12), 300);
        setTimeout(() => this._tone(1200, 0.3, 'sine', 0.14), 450);
    }

    playPlayerHit() {
        this._init();
        this._tone(120, 0.2, 'sawtooth', 0.1, 60);
        this._noise(0.12, 0.06);
    }

    playGameOver() {
        this._init();
        this._tone(400, 0.3, 'sine', 0.1, 200);
        setTimeout(() => this._tone(300, 0.3, 'sine', 0.1, 150), 250);
        setTimeout(() => this._tone(200, 0.5, 'sine', 0.12, 80), 500);
    }

    playWeaponUnlock() {
        this._init();
        this._tone(600, 0.1, 'sine', 0.08);
        setTimeout(() => this._tone(900, 0.15, 'sine', 0.1), 100);
        setTimeout(() => this._tone(1200, 0.2, 'sine', 0.1), 200);
    }
}
