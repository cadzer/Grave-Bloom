const STORAGE_KEY = 'gravebloom_history';
const MAX_RUNS = 20;

export class RunHistorySystem {
    constructor() {
        this.runs = this._load();
    }

    _load() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (data && Array.isArray(data)) return data.slice(0, MAX_RUNS);
        } catch (e) {}
        return [];
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.runs.slice(0, MAX_RUNS)));
        } catch (e) {}
    }

    addRun(stats) {
        this.runs.unshift({
            date: Date.now(),
            elapsedTime: stats.elapsedTime,
            kills: stats.kills,
            bossesKilled: stats.bossesKilled,
            level: stats.level,
            runCoins: stats.runCoins,
            evolutions: stats.evolutions,
            weaponsOwned: stats.weaponsOwned
        });
        if (this.runs.length > MAX_RUNS) this.runs.length = MAX_RUNS;
        this._save();
    }

    getRuns() { return this.runs; }

    getBestTime() {
        if (this.runs.length === 0) return 0;
        return Math.max(...this.runs.map(r => r.elapsedTime));
    }

    getBestKills() {
        if (this.runs.length === 0) return 0;
        return Math.max(...this.runs.map(r => r.kills));
    }

    getBestLevel() {
        if (this.runs.length === 0) return 0;
        return Math.max(...this.runs.map(r => r.level));
    }

    getTotalRuns() { return this.runs.length; }

    clear() {
        this.runs = [];
        this._save();
    }
}
