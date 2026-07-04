import { GAME } from '../config/GameConfig.js';

const RELICS = [
    {
        id: 'thorn_ring',
        name: 'Thorn Ring',
        desc: 'Orbiting blades orbit you instead of circling independently',
        icon: '\uD83C\uDF39',
        color: '#e74c3c',
        rarity: 'rare',
        effect: 'orbitAroundPlayer'
    },
    {
        id: 'blazing_trail',
        name: 'Blazing Trail',
        desc: 'Leave a burning trail behind you that damages enemies',
        icon: '\uD83D\uDD25',
        color: '#f39c12',
        rarity: 'rare',
        effect: 'fireTrail'
    },
    {
        id: 'magnetic_soul',
        name: 'Magnetic Soul',
        desc: 'XP gems attract from across the entire screen',
        icon: '\uD83E\uDDF2',
        color: '#3498db',
        rarity: 'epic',
        effect: 'globalMagnet'
    },
    {
        id: 'glass_cannon',
        name: 'Glass Cannon',
        desc: 'Deal double damage but take double damage',
        icon: '\uD83D\uDCA5',
        color: '#e74c3c',
        rarity: 'legendary',
        effect: 'doubleDamageDoubleTaken'
    },
    {
        id: 'time_warp',
        name: 'Time Warp',
        desc: 'Enemies move 25% slower globally',
        icon: '\u23F3',
        color: '#9b59b6',
        rarity: 'epic',
        effect: 'slowEnemies'
    },
    {
        id: 'soul_link',
        name: 'Soul Link',
        desc: 'Heal 15% of all damage dealt',
        icon: '\uD83D\uDC96',
        color: '#e74c3c',
        rarity: 'rare',
        effect: 'lifesteal'
    }
];

export class RelicSystem {
    constructor() {
        this.activeRelics = [];
        this.relicDropTimer = 0;
        this.RELIC_DROP_INTERVAL = 120;
        this.RELIC_DROP_CHANCE = 0.35;
    }

    update(dt) {
        this.relicDropTimer += dt;
    }

    tryDropRelic(playerLevel) {
        if (this.relicDropTimer < this.RELIC_DROP_INTERVAL) return null;
        this.relicDropTimer = 0;
        if (Math.random() > this.RELIC_DROP_CHANCE) return null;
        const available = RELICS.filter(r => !this.activeRelics.find(a => a.id === r.id));
        if (available.length === 0) return null;
        const relic = available[Math.floor(Math.random() * available.length)];
        this.activeRelics.push(relic);
        return relic;
    }

    hasRelic(effect) {
        return this.activeRelics.some(r => r.effect === effect);
    }

    getRelics() {
        return [...this.activeRelics];
    }

    clear() {
        this.activeRelics = [];
        this.relicDropTimer = 0;
    }

    static getAll() {
        return RELICS;
    }
}
