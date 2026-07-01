import { PASSIVES } from '../config/GameConfig.js';

// Tracks which passive items the player owns and at what level.
export class PassiveSystem {
    constructor() {
        this.levels = {};
        for (const key of Object.keys(PASSIVES)) {
            this.levels[key] = 0;
        }
    }

    // Get current level of a passive (0 = not owned)
    getLevel(key) {
        return this.levels[key] || 0;
    }

    // Check if passive is at max level
    isMaxed(key) {
        return this.levels[key] >= PASSIVES[key].maxLevel;
    }

    // Acquire or upgrade a passive. Returns true if successful.
    apply(key, player, weapons) {
        if (this.isMaxed(key)) return false;
        this.levels[key]++;
        PASSIVES[key].apply(player, weapons, this.levels[key]);
        return true;
    }

    // Get all owned passives (level > 0) as array of { key, level, ...config }
    getOwned() {
        return Object.keys(this.levels)
            .filter(key => this.levels[key] > 0)
            .map(key => ({
                key,
                level: this.levels[key],
                ...PASSIVES[key]
            }));
    }

    // Reset all passives
    reset() {
        for (const key of Object.keys(this.levels)) {
            this.levels[key] = 0;
        }
    }
}
