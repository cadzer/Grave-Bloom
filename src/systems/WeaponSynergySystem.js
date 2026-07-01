const SYNERGIES = [
    {
        id: 'arcane_orbit',
        name: 'Thornstorm',
        weapons: ['arcane_bolt', 'orbiting_blade'],
        description: 'Orbiting thorns launch seed projectiles periodically',
        icon: '\uD83C\uDF3F',
        color: '#7c9a6e',
        apply: (weaponManager) => {
            const orbit = weaponManager.getWeapon('orbiting_blade');
            const bolt = weaponManager.getWeapon('arcane_bolt');
            if (orbit && bolt) {
                orbit.bonusProjectileChance = 0.3;
                orbit.bonusProjectileDamage = bolt.getStats(1, 1, 1).damage * 0.5;
            }
        }
    },
    {
        id: 'pulse_chain',
        name: 'Blight Pulse',
        weapons: ['holy_pulse', 'lightning_mark'],
        description: 'Pulse strikes chain to nearby enemies',
        icon: '\u26A1',
        color: '#f1c40f',
        apply: (weaponManager) => {
            const pulse = weaponManager.getWeapon('holy_pulse');
            if (pulse) {
                pulse.bonusChainCount = 2;
                pulse.bonusChainRange = 120;
            }
        }
    },
    {
        id: 'bolt_storm',
        name: 'Vine Barrage',
        weapons: ['arcane_bolt', 'lightning_mark'],
        description: 'Seeds gain chain lightning on hit',
        icon: '\uD83C\uDF29',
        color: '#9b59b6',
        apply: (weaponManager) => {
            const bolt = weaponManager.getWeapon('arcane_bolt');
            if (bolt) {
                bolt.bonusChainChance = 0.25;
                bolt.bonusChainDamage = 0.4;
            }
        }
    },
    {
        id: 'orbit_pulse',
        name: 'Bloom Nova',
        weapons: ['orbiting_blade', 'holy_pulse'],
        description: 'Orbiting thorns emit a heal pulse on enemy kill',
        icon: '\u2764\uFE0F',
        color: '#e74c3c',
        apply: (weaponManager) => {
            const orbit = weaponManager.getWeapon('orbiting_blade');
            if (orbit) {
                orbit.bonusHealOnKill = 2;
            }
        }
    }
];

export class WeaponSynergySystem {
    constructor() {
        this.activeSynergies = [];
    }

    check(weaponManager) {
        this.activeSynergies = [];
        const ownedIds = weaponManager.weapons.map(w => w.typeId);

        for (const syn of SYNERGIES) {
            if (syn.weapons.every(id => ownedIds.includes(id))) {
                this.activeSynergies.push(syn);
            }
        }

        return this.activeSynergies;
    }

    apply(weaponManager) {
        for (const syn of this.activeSynergies) {
            syn.apply(weaponManager);
        }
    }

    getActive() {
        return this.activeSynergies;
    }

    getAll() {
        return SYNERGIES;
    }
}
