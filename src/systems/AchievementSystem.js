const STORAGE_KEY = 'gravebloom_achievements';

const ACHIEVEMENTS = [
    { id: 'kill_100', name: 'Blight Reaper', desc: 'Kill 100 enemies in one run', icon: '\u2694\uFE0F', check: (s) => s.kills >= 100 },
    { id: 'kill_500', name: 'Blight Annihilator', desc: 'Kill 500 enemies in one run', icon: '\uD83D\uDD25', check: (s) => s.kills >= 500 },
    { id: 'boss_kill', name: 'Bloom Hunter', desc: 'Defeat your first boss', icon: '\uD83D\uDC79', check: (s) => s.bossesKilled >= 1 },
    { id: 'boss_5', name: 'Bloom Slayer', desc: 'Defeat 5 bosses in one run', icon: '\uD83D\uDC80', check: (s) => s.bossesKilled >= 5 },
    { id: 'survive_5m', name: 'Endurance', desc: 'Survive for 5 minutes', icon: '\u23F1', check: (s) => s.elapsedTime >= 300 },
    { id: 'survive_10m', name: 'Iron Will', desc: 'Survive for 10 minutes', icon: '\u23F1', check: (s) => s.elapsedTime >= 600 },
    { id: 'survive_20m', name: 'Deathless', desc: 'Survive for 20 minutes', icon: '\u23F1', check: (s) => s.elapsedTime >= 1200 },
    { id: 'level_20', name: 'Vigorous Growth', desc: 'Reach level 20', icon: '\u2B50', check: (s) => s.level >= 20 },
    { id: 'level_50', name: 'Mighty Bloom', desc: 'Reach level 50', icon: '\u2B50', check: (s) => s.level >= 50 },
    { id: 'evolve', name: 'Evolved', desc: 'Achieve a weapon evolution', icon: '\uD83D\uDD2E', check: (s) => s.evolutions >= 1 },
    { id: 'coins_100', name: 'Seed Hoarder', desc: 'Collect 100 seeds in one run', icon: '\uD83D\uDCB0', check: (s) => s.runCoins >= 100 },
    { id: 'coins_500', name: 'Seed Baron', desc: 'Collect 500 seeds in one run', icon: '\uD83D\uDCB0', check: (s) => s.runCoins >= 500 },
    { id: 'all_weapons', name: 'Arsenal', desc: 'Own 4 weapons at once', icon: '\uD83D\uDDE1\uFE0F', check: (s) => s.weaponsOwned >= 4 },
    { id: 'speedrun_3m', name: 'Speed Bloom', desc: 'Kill 50 enemies in under 3 minutes', icon: '\u26A1', check: (s) => s.kills >= 50 && s.elapsedTime <= 180 },
    { id: 'no_hit_boss', name: 'Untouchable', desc: 'Defeat a boss without taking damage', icon: '\uD83D\uDEE1\uFE0F', check: (s) => s.bossKillNoHit },
];

export class AchievementSystem {
    constructor() {
        this._unlocked = this._load();
        this._newThisRun = [];
    }

    _load() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (data && Array.isArray(data)) return new Set(data);
        } catch (e) {}
        return new Set();
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...this._unlocked]));
        } catch (e) {}
    }

    check(runStats) {
        const newlyUnlocked = [];
        for (const a of ACHIEVEMENTS) {
            if (!this._unlocked.has(a.id) && a.check(runStats)) {
                this._unlocked.add(a.id);
                newlyUnlocked.push(a);
                this._newThisRun.push(a);
            }
        }
        if (newlyUnlocked.length > 0) this._save();
        return newlyUnlocked;
    }

    getNewThisRun() {
        return this._newThisRun;
    }

    clearNewThisRun() {
        this._newThisRun = [];
    }

    reset() {
        this._unlocked = new Set();
        this._newThisRun = [];
        localStorage.removeItem(STORAGE_KEY);
    }

    getAll() {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked: this._unlocked.has(a.id)
        }));
    }

    getUnlockedCount() {
        return this._unlocked.size;
    }

    getTotalCount() {
        return ACHIEVEMENTS.length;
    }
}
