import { UPGRADES, PASSIVES, LEVELING, CHEST, WEAPON_TYPES, EVOLUTIONS } from '../config/GameConfig.js';

export class UpgradeSystem {
    constructor(passiveSystem) {
        this.passiveSystem = passiveSystem;
        this.weaponLevels = {};
        for (const key of Object.keys(UPGRADES)) {
            this.weaponLevels[key] = 0;
        }
    }

    getChoices(count, weaponManager, debug) {
        const pool = [];
        const weaponUnlocks = [];

        if (weaponManager) {
            for (const [typeId, cfg] of Object.entries(WEAPON_TYPES)) {
                if (!weaponManager.getWeapon(typeId)) {
                    if (debug || Math.random() < cfg.unlockChance) {
                        weaponUnlocks.push({
                            id: typeId,
                            kind: 'weapon_unlock',
                            name: cfg.name,
                            description: cfg.description,
                            icon: this.getWeaponIcon(typeId),
                            color: cfg.color,
                            weaponTypeId: typeId,
                            currentLevel: 0,
                            maxLevel: 8,
                            apply: null
                        });
                    }
                }
            }

            for (const weapon of weaponManager.weapons) {
                if (debug || weapon.level < 8) {
                    const cfg = weapon.config;
                    const isMaxed = weapon.level >= 8;
                    pool.push({
                        id: weapon.typeId,
                        kind: 'weapon_levelup',
                        name: cfg.name,
                        description: isMaxed ? 'MAX LEVEL' : `Level ${weapon.level} \u2192 ${weapon.level + 1}`,
                        icon: weapon.isEvolved ? '\u2B50' : this.getWeaponIcon(weapon.typeId),
                        color: cfg.color,
                        currentLevel: weapon.level,
                        maxLevel: 8,
                        weaponTypeId: weapon.typeId,
                        apply: null
                    });
                }
            }
        }

        for (const key of Object.keys(UPGRADES)) {
            const up = UPGRADES[key];
            if (debug || this.weaponLevels[key] < (up.maxLevel || 99)) {
                pool.push({
                    id: key,
                    kind: 'weapon',
                    name: up.name,
                    description: up.description,
                    currentLevel: this.weaponLevels[key],
                    maxLevel: up.maxLevel,
                    apply: up.apply
                });
            }
        }

        for (const key of Object.keys(PASSIVES)) {
            const p = PASSIVES[key];
            const lvl = this.passiveSystem.getLevel(key);
            if (debug || lvl < p.maxLevel) {
                pool.push({
                    id: key,
                    kind: 'passive',
                    name: p.name,
                    description: p.description,
                    icon: p.icon,
                    color: p.color,
                    currentLevel: lvl,
                    maxLevel: p.maxLevel,
                    apply: null
                });
            }
        }

        if (pool.length === 0 && weaponUnlocks.length === 0) {
            pool.push({
                id: 'heal',
                kind: 'heal',
                name: 'Heal 30 HP',
                description: 'Restore health',
                currentLevel: 0,
                maxLevel: 99,
                apply: UPGRADES.heal.apply
            });
        }

        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // Guarantee one weapon unlock if available
        const result = [];
        if (debug) {
            for (const unlock of weaponUnlocks) {
                if (result.length < count) result.push(unlock);
            }
        } else if (weaponUnlocks.length > 0 && result.length < count) {
            const picked = weaponUnlocks[Math.floor(Math.random() * weaponUnlocks.length)];
            result.push(picked);
        }

        // Fill remaining from shuffled pool
        for (const item of pool) {
            if (result.length >= count) break;
            if (!result.some(r => r.id === item.id)) {
                result.push(item);
            }
        }

        // If still not enough, add heal (but not in debug mode where count is huge)
        if (count < 100) {
            while (result.length < count) {
                result.push({
                    id: 'heal',
                    kind: 'heal',
                    name: 'Heal 30 HP',
                    description: 'Restore health',
                    currentLevel: 0,
                    maxLevel: 99,
                    apply: UPGRADES.heal.apply
                });
            }
        }

        return result.slice(0, count);
    }

    getWeaponIcon(typeId) {
        const icons = {
            arcane_bolt: '\u2728',
            orbiting_blade: '\uD83D\uDD2E',
            holy_pulse: '\u2764\uFE0F',
            lightning_mark: '\u26A1',
            spore_swarm: '\uD83C\uDF44'
        };
        return icons[typeId] || '\u2694\uFE0F';
    }

    applyWeaponUpgrade(key, player, weaponManager) {
        this.weaponLevels[key]++;
        UPGRADES[key].apply(player, weaponManager);
    }

    applyWeaponUnlock(typeId, weaponManager) {
        return weaponManager.addWeapon(typeId, 1);
    }

    applyWeaponLevelUp(typeId, weaponManager) {
        return weaponManager.upgradeWeapon(typeId);
    }

    applyPassive(key, player, weaponManager) {
        return this.passiveSystem.apply(key, player, weaponManager);
    }

    applyHeal(player) {
        UPGRADES.heal.apply(player);
    }

    reset() {
        this.passiveSystem.reset();
        for (const key of Object.keys(this.weaponLevels)) {
            this.weaponLevels[key] = 0;
        }
    }

    checkEvolutions(weaponManager, passiveSystem) {
        const evolutions = [];
        for (const weapon of weaponManager.weapons) {
            if (weapon.canEvolve(passiveSystem)) {
                evolutions.push({
                    weaponTypeId: weapon.typeId,
                    evolution: weapon.getEvolution()
                });
            }
        }
        return evolutions;
    }

    getChestReward(player, weaponManager, passiveSystem) {
        if (weaponManager && passiveSystem) {
            const evolutions = this.checkEvolutions(weaponManager, passiveSystem);
            if (evolutions.length > 0) {
                const evo = evolutions[Math.floor(Math.random() * evolutions.length)];
                const evoConfig = evo.evolution;
                return {
                    type: 'evolution',
                    weaponTypeId: evo.weaponTypeId,
                    name: evoConfig.name,
                    description: evoConfig.description,
                    color: evoConfig.color
                };
            }
        }

        const pool = [];

        if (weaponManager) {
            for (const weapon of weaponManager.weapons) {
                if (weapon.level < 8) {
                    const cfg = weapon.config;
                    pool.push({
                        kind: 'weapon_levelup',
                        id: weapon.typeId,
                        weaponTypeId: weapon.typeId,
                        name: cfg.name,
                        description: `Level ${weapon.level} \u2192 ${weapon.level + 1}`,
                        currentLevel: weapon.level,
                        maxLevel: 8
                    });
                }
            }
        }

        for (const key of Object.keys(UPGRADES)) {
            const up = UPGRADES[key];
            if (up.type !== 'weapon') continue;
            if (this.weaponLevels[key] < (up.maxLevel || 99)) {
                pool.push({
                    kind: 'weapon',
                    id: key,
                    name: up.name,
                    description: up.description,
                    currentLevel: this.weaponLevels[key],
                    maxLevel: up.maxLevel
                });
            }
        }

        for (const key of Object.keys(PASSIVES)) {
            const p = PASSIVES[key];
            const lvl = this.passiveSystem.getLevel(key);
            if (lvl < p.maxLevel) {
                pool.push({
                    kind: 'passive',
                    id: key,
                    name: p.name,
                    description: p.description,
                    icon: p.icon,
                    currentLevel: lvl,
                    maxLevel: p.maxLevel
                });
            }
        }

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        if (pool.length > 0) {
            const choice = pool[0];
            if (choice.kind === 'weapon_levelup') {
                return {
                    type: 'weapon_levelup',
                    weaponTypeId: choice.weaponTypeId,
                    name: choice.name,
                    description: choice.description,
                    currentLevel: choice.currentLevel,
                    maxLevel: choice.maxLevel
                };
            } else if (choice.kind === 'weapon') {
                return {
                    type: 'weapon_upgrade',
                    id: choice.id,
                    name: choice.name,
                    description: choice.description,
                    currentLevel: choice.currentLevel,
                    maxLevel: choice.maxLevel
                };
            } else {
                return {
                    type: 'passive_upgrade',
                    id: choice.id,
                    name: choice.name,
                    description: choice.description,
                    icon: choice.icon,
                    currentLevel: choice.currentLevel,
                    maxLevel: choice.maxLevel
                };
            }
        }

        if (player.hp < player.maxHp) {
            return {
                type: 'heal',
                name: 'Full Heal',
                description: 'Restore all health',
                amount: CHEST.HEAL_AMOUNT
            };
        }

        return {
            type: 'coins',
            name: 'Gold Coins',
            description: 'Bonus gold',
            amount: Math.floor(CHEST.COINS_MIN + Math.random() * (CHEST.COINS_MAX - CHEST.COINS_MIN))
        };
    }

    applyChestReward(reward, player, weaponManager, passiveSystem) {
        switch (reward.type) {
            case 'evolution': {
                const weapon = weaponManager.getWeapon(reward.weaponTypeId);
                if (weapon) weapon.evolve();
                break;
            }
            case 'weapon_levelup':
                weaponManager.upgradeWeapon(reward.weaponTypeId);
                break;
            case 'weapon_upgrade':
                this.applyWeaponUpgrade(reward.id, player, weaponManager);
                break;
            case 'passive_upgrade':
                this.applyPassive(reward.id, player, weaponManager);
                break;
            case 'heal':
                player.hp = Math.min(player.hp + CHEST.HEAL_AMOUNT, player.maxHp);
                break;
            case 'coins':
                break;
        }
    }

    isEverythingMaxed(weaponManager) {
        for (const key of Object.keys(UPGRADES)) {
            if (UPGRADES[key].type === 'weapon' && this.weaponLevels[key] < UPGRADES[key].maxLevel) {
                return false;
            }
        }
        for (const key of Object.keys(PASSIVES)) {
            if (!this.passiveSystem.isMaxed(key)) {
                return false;
            }
        }
        if (weaponManager) {
            for (const weapon of weaponManager.weapons) {
                if (weapon.level < 8) return false;
            }
        }
        return true;
    }
}
