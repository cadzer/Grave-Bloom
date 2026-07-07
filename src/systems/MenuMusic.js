const STORAGE_KEY_PLAYING = 'gravebloom_music_playing';
const STORAGE_KEY_VOLUME = 'gravebloom_music_volume';

export class MenuMusic {
    constructor() {
        this.audio = null;
        this.playing = false;
        this.volume = 0.3;
        this._loaded = false;
        this._loadSettings();
    }

    _loadSettings() {
        try {
            this.playing = localStorage.getItem(STORAGE_KEY_PLAYING) !== '0';
            const v = parseFloat(localStorage.getItem(STORAGE_KEY_VOLUME));
            if (!isNaN(v)) this.volume = Math.max(0, Math.min(1, v));
        } catch (e) { /* ignore */ }
    }

    _saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY_PLAYING, this.playing ? '1' : '0');
            localStorage.setItem(STORAGE_KEY_VOLUME, String(this.volume));
        } catch (e) { /* ignore */ }
    }

    init() {
        if (this._loaded) return;
        try {
            this.audio = new Audio('assets/menu-music.mp3');
            this.audio.loop = true;
            this.audio.volume = this.volume;
            this._loaded = true;
            if (this.playing) this.play();
        } catch (e) { /* no audio support */ }
    }

    play() {
        if (!this.audio) return;
        this.playing = true;
        this.audio.volume = this.volume;
        this.audio.play().catch(() => {});
        this._saveSettings();
    }

    pause() {
        if (!this.audio) return;
        this.playing = false;
        this.audio.pause();
        this._saveSettings();
    }

    toggle() {
        if (this.playing) this.pause();
        else this.play();
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.audio) this.audio.volume = this.volume;
        this._saveSettings();
    }

    resume() {
        if (this.playing && this.audio) {
            this.audio.play().catch(() => {});
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }
}
