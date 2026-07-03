import { SHOP_UPGRADES, LOADOUTS } from '../config/GameConfig.js';

const STORAGE_KEY = 'survivor_save';

export class ShopSystem {
    constructor() {
        this.totalCoins = 0;
        this.upgradeLevels = {};
        for (const key of Object.keys(SHOP_UPGRADES)) {
            this.upgradeLevels[key] = 0;
        }
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this.totalCoins = data.totalCoins || 0;
                this.unlockedLoadouts = data.unlockedLoadouts || [];
                for (const key of Object.keys(SHOP_UPGRADES)) {
                    this.upgradeLevels[key] = data.upgradeLevels?.[key] || 0;
                }
            }
        } catch (e) { /* ignore corrupt saves */ }
    }

    save() {
        const data = {
            totalCoins: this.totalCoins,
            unlockedLoadouts: this.unlockedLoadouts || [],
            upgradeLevels: { ...this.upgradeLevels }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    resetSave() {
        this.totalCoins = 0;
        for (const key of Object.keys(this.upgradeLevels)) {
            this.upgradeLevels[key] = 0;
        }
        this.unlockedLoadouts = [];
        this.save();
        localStorage.removeItem('gravebloom_fullscreen');
    }

    refundUpgrades() {
        let totalSpent = 0;
        for (const key of Object.keys(SHOP_UPGRADES)) {
            const cfg = SHOP_UPGRADES[key];
            const lvl = this.upgradeLevels[key] || 0;
            if (lvl <= 0) continue;
            let cost = cfg.baseCost;
            for (let i = 0; i < lvl; i++) {
                totalSpent += Math.floor(cost);
                cost *= cfg.costMultiplier;
            }
            this.upgradeLevels[key] = 0;
        }
        this.totalCoins += totalSpent;
        this.save();
        return totalSpent;
    }

    calcRefundAmount() {
        let totalSpent = 0;
        for (const key of Object.keys(SHOP_UPGRADES)) {
            const cfg = SHOP_UPGRADES[key];
            const lvl = this.upgradeLevels[key] || 0;
            if (lvl <= 0) continue;
            let cost = cfg.baseCost;
            for (let i = 0; i < lvl; i++) {
                totalSpent += Math.floor(cost);
                cost *= cfg.costMultiplier;
            }
        }
        return totalSpent;
    }

    getLevel(key) {
        return this.upgradeLevels[key] || 0;
    }

    getCost(key) {
        const cfg = SHOP_UPGRADES[key];
        const lvl = this.upgradeLevels[key] || 0;
        return Math.floor(cfg.baseCost * Math.pow(cfg.costMultiplier, lvl));
    }

    canAfford(key) {
        return this.totalCoins >= this.getCost(key);
    }

    isMaxed(key) {
        const cfg = SHOP_UPGRADES[key];
        return (this.upgradeLevels[key] || 0) >= cfg.maxLevel;
    }

    buyUpgrade(key) {
        if (this.isMaxed(key) || !this.canAfford(key)) return false;
        this.totalCoins -= this.getCost(key);
        this.upgradeLevels[key] = (this.upgradeLevels[key] || 0) + 1;
        this.save();
        return true;
    }

    applyBonuses(player, weapons) {
        for (const [key, cfg] of Object.entries(SHOP_UPGRADES)) {
            const lvl = this.upgradeLevels[key] || 0;
            if (lvl <= 0) continue;
            const bonuses = cfg.effect(lvl);
            if (bonuses.maxHpBonus) {
                player.maxHp += bonuses.maxHpBonus;
                player.hp = player.maxHp;
            }
            if (bonuses.speedMulti) {
                player.speed = Math.floor(player.speed * bonuses.speedMulti);
            }
            if (bonuses.pickupMulti) {
                player.pickupRadius = Math.floor(player.pickupRadius * bonuses.pickupMulti);
            }
            if (bonuses.damageMulti && weapons.globalDamageMulti !== undefined) {
                weapons.globalDamageMulti *= bonuses.damageMulti;
            }
        }
        if (player.damageMulti !== 1 && weapons.globalDamageMulti !== undefined) {
            weapons.globalDamageMulti *= player.damageMulti;
        }
    }

    getStartCoins() {
        const lvl = this.upgradeLevels.startcoins || 0;
        return lvl * 10;
    }

    getXPBonusMulti() {
        const lvl = this.upgradeLevels.xpgain || 0;
        return 1 + lvl * 0.05;
    }

    addRunCoins(coins) {
        this.totalCoins += coins;
        this.save();
    }

    getUnlockedLoadouts() {
        const defaultUnlocked = LOADOUTS.filter(l => l.unlockCost === 0).map(l => l.id);
        return [...defaultUnlocked, ...(this.unlockedLoadouts || [])];
    }

    isLoadoutUnlocked(id) {
        return this.getUnlockedLoadouts().includes(id);
    }

    unlockLoadout(id) {
        const loadout = LOADOUTS.find(l => l.id === id);
        if (!loadout || this.isLoadoutUnlocked(id)) return false;
        if (this.totalCoins < loadout.unlockCost) return false;
        this.totalCoins -= loadout.unlockCost;
        if (!this.unlockedLoadouts) this.unlockedLoadouts = [];
        this.unlockedLoadouts.push(id);
        this.save();
        return true;
    }
}
