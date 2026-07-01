import { WEAPON_TYPES, EVOLUTIONS, WEAPON } from '../config/GameConfig.js';
import { Projectile } from './Projectile.js';
import { distance, normalize } from '../core/MathUtils.js';

export class Weapon {
    constructor(typeId, level = 1) {
        this.typeId = typeId;
        this.level = level;
        this.cooldownTimer = 0;
        this.orbitAngle = 0;
        this.pulseTimer = 0;
        this.isEvolved = EVOLUTIONS[typeId] !== undefined;
        this.config = this.isEvolved ? EVOLUTIONS[typeId] : WEAPON_TYPES[typeId];
    }

    getStats(globalDamageMulti, globalCooldownMulti, globalSpeedMulti) {
        const cfg = this.config;
        const lvl = this.level;
        const scale = cfg.scale || {};
        const base = this.isEvolved ? (WEAPON_TYPES[cfg.baseWeaponId] || {}) : WEAPON_TYPES[this.typeId];

        return {
            damage: Math.floor(
                (cfg.baseDamage || base.baseDamage || WEAPON.DAMAGE)
                * Math.pow(scale.damage || 1, lvl - 1)
                * (globalDamageMulti || 1)
            ),
            cooldown: (cfg.baseCooldown || base.baseCooldown || WEAPON.COOLDOWN)
                * Math.pow(scale.cooldown || 1, lvl - 1)
                * (globalCooldownMulti || 1),
            speed: (cfg.baseSpeed || base.baseSpeed || WEAPON.SPEED)
                * Math.pow(scale.speed || 1, lvl - 1)
                * (globalSpeedMulti || 1),
            size: cfg.baseSize || base.baseSize || WEAPON.SIZE,
            projectiles: (cfg.baseProjectiles || base.baseProjectiles || 1)
                + (this.isEvolved ? (cfg.addProjectiles || 0) : 0)
                + (cfg.projectilesPerLevel != null
                    ? Math.floor((lvl - 1) * cfg.projectilesPerLevel)
                    : Math.floor((lvl - 1) / 3)),
            pierce: (cfg.basePierce || base.basePierce || 0)
                + (this.isEvolved ? (cfg.addPierce || 0) : 0),
            orbitRadius: (cfg.baseOrbitRadius || base.baseOrbitRadius || 80)
                + (this.isEvolved ? (cfg.orbitRadiusBonus || 0) : 0)
                + (lvl - 1) * 5,
            pulseRadius: (cfg.basePulseRadius || base.basePulseRadius || 120)
                + (this.isEvolved ? (cfg.pulseRadiusBonus || 0) : 0)
                + (lvl - 1) * 10,
            chainCount: (cfg.baseChainCount || base.baseChainCount || 2)
                + (this.isEvolved ? (cfg.addChainCount || 0) : 0)
                + Math.floor((lvl - 1) / 2),
            chainRange: (cfg.baseChainRange || base.baseChainRange || 150)
                + (this.isEvolved ? (cfg.chainRangeBonus || 0) : 0)
                + (lvl - 1) * 10,
            cloudRadius: (cfg.baseCloudRadius || base.baseCloudRadius || 60)
                + (lvl - 1) * 8,
            cloudDuration: (cfg.baseCloudDuration || base.baseCloudDuration || 3)
                + (lvl - 1) * 0.3,
            cloudTick: (cfg.baseCloudTick || base.baseCloudTick || 0.4)
                * Math.pow(0.95, lvl - 1),
        };
    }

    update(dt, playerX, playerY, hostiles, gDmg, gCd, gSpd, callbacks) {
        const stats = this.getStats(gDmg, gCd, gSpd);

        switch (this.config.category) {
            case 'projectile':
                this.updateProjectile(dt, playerX, playerY, hostiles, stats, callbacks);
                break;
            case 'orbit':
                this.updateOrbit(dt, playerX, playerY, hostiles, stats, callbacks);
                break;
            case 'pulse':
                this.updatePulse(dt, playerX, playerY, hostiles, stats, callbacks);
                break;
            case 'lightning':
                this.updateLightning(dt, playerX, playerY, hostiles, stats, callbacks);
                break;
            case 'cloud':
                this.updateCloud(dt, playerX, playerY, hostiles, stats, callbacks);
                break;
        }
    }

    updateProjectile(dt, playerX, playerY, hostiles, stats, callbacks) {
        this.cooldownTimer -= dt;
        if (this.cooldownTimer <= 0 && hostiles.length > 0) {
            this.cooldownTimer = stats.cooldown;
            for (let i = 0; i < stats.projectiles; i++) {
                const target = this.findNearest(playerX, playerY, hostiles);
                if (target) {
                    const spread = stats.projectiles > 1 ? (i - (stats.projectiles - 1) / 2) * 0.15 : 0;
                    callbacks.onFireProjectile(
                        playerX, playerY,
                        target.x + Math.cos(spread) * 30,
                        target.y + Math.sin(spread) * 30,
                        stats, this.config.color
                    );
                }
            }
        }
    }

    updateOrbit(dt, playerX, playerY, hostiles, stats, callbacks) {
        this.orbitAngle += stats.speed * dt;
        const ringCount = stats.projectiles;

        for (let r = 0; r < ringCount; r++) {
            const ringRadius = stats.orbitRadius + r * 38;
            const ringSpeed = 1 + r * 0.3;
            const angle = this.orbitAngle * ringSpeed + (r / ringCount) * Math.PI * 2;
            const bx = playerX + Math.cos(angle) * ringRadius;
            const by = playerY + Math.sin(angle) * ringRadius;

            const hitKey = `_orbitHit_${r}`;
            for (let i = 0; i < hostiles.length; i++) {
                const hostile = hostiles[i];
                if (hostile.dead) continue;
                const dist = distance(bx, by, hostile.x, hostile.y);
                if (dist < stats.size + hostile.radius) {
                    if (!hostile[hitKey]) hostile[hitKey] = 0;
                    if (hostile[hitKey] <= 0) {
                        const dir = normalize(hostile.x - bx, hostile.y - by);
                        callbacks.onDamageHostile(hostile, stats.damage, bx, by, dir);
                        if (hostile.dead) continue;
                        hostile[hitKey] = 0.3;
                    }
                }
            }
        }

        // Pulse-strike: periodic AoE lightning burst (for evolved orbit weapons)
        if (stats.pulseRadius && this.config.pulseCooldown) {
            this.pulseTimer -= dt;
            if (this.pulseTimer <= 0) {
                this.pulseTimer = this.config.pulseCooldown;
                for (let i = 0; i < hostiles.length; i++) {
                    const hostile = hostiles[i];
                    if (hostile.dead) continue;
                    const dist = distance(playerX, playerY, hostile.x, hostile.y);
                    if (dist < stats.pulseRadius) {
                        callbacks.onDamageHostile(hostile, stats.damage, hostile.x, hostile.y, { x: 0, y: 0 });
                    }
                }
                callbacks.onPulse(playerX, playerY, stats.pulseRadius, this.config.color);
            }
        }

        for (let i = 0; i < hostiles.length; i++) {
            const hostile = hostiles[i];
            for (let r = 0; r < ringCount; r++) {
                const key = `_orbitHit_${r}`;
                if (hostile[key] > 0) hostile[key] -= dt;
            }
        }
    }

    updatePulse(dt, playerX, playerY, hostiles, stats, callbacks) {
        this.cooldownTimer -= dt;
        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = stats.cooldown;

            for (const hostile of hostiles) {
                if (hostile.dead) continue;
                const dist = distance(playerX, playerY, hostile.x, hostile.y);
                if (dist < stats.pulseRadius) {
                    callbacks.onDamageHostile(hostile, stats.damage, hostile.x, hostile.y, { x: 0, y: 0 });
                }
            }

            callbacks.onPulse(playerX, playerY, stats.pulseRadius, this.config.color);

            if (this.isEvolved && this.config.healAmount) {
                callbacks.onHeal(this.config.healAmount);
            }
        }
    }

    updateLightning(dt, playerX, playerY, hostiles, stats, callbacks) {
        this.cooldownTimer -= dt;
        if (this.cooldownTimer <= 0 && hostiles.length > 0) {
            this.cooldownTimer = stats.cooldown;

            const first = this.findNearest(playerX, playerY, hostiles);
            if (!first) return;

            const hit = new Set([first]);
            callbacks.onDamageHostile(first, stats.damage, first.x, first.y, { x: 0, y: 0 });
            callbacks.onLightningChain(playerX, playerY, first.x, first.y, this.config.color);

            let current = first;
            for (let chain = 0; chain < stats.chainCount - 1; chain++) {
                let nearest = null;
                let nearestDist = stats.chainRange;

                for (const hostile of hostiles) {
                    if (hit.has(hostile) || hostile.dead) continue;
                    const dist = distance(current.x, current.y, hostile.x, hostile.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = hostile;
                    }
                }

                if (nearest) {
                    hit.add(nearest);
                    const falloff = Math.max(0.3, 1 - chain * 0.2);
                    callbacks.onDamageHostile(nearest, Math.floor(stats.damage * falloff), nearest.x, nearest.y, { x: 0, y: 0 });
                    callbacks.onLightningChain(current.x, current.y, nearest.x, nearest.y, this.config.color);
                    current = nearest;
                } else {
                    break;
                }
            }
        }
    }

    updateCloud(dt, playerX, playerY, hostiles, stats, callbacks) {
        this.cooldownTimer -= dt;
        if (this.cooldownTimer <= 0 && hostiles.length > 0) {
            this.cooldownTimer = stats.cooldown;

            const target = this.findNearest(playerX, playerY, hostiles);
            if (!target) return;

            const dx = target.x - playerX;
            const dy = target.y - playerY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const speed = stats.speed;
            const cloudX = playerX + (dx / dist) * Math.min(dist, speed * 0.5);
            const cloudY = playerY + (dy / dist) * Math.min(dist, speed * 0.5);

            callbacks.onSpawnCloud(
                cloudX, cloudY,
                stats.cloudRadius,
                stats.cloudDuration,
                stats.cloudTick,
                stats.damage,
                this.config.color
            );
        }
    }

    findNearest(playerX, playerY, hostiles) {
        let nearest = null;
        let nearestDist = Infinity;
        for (const h of hostiles) {
            if (h.dead) continue;
            const d = distance(playerX, playerY, h.x, h.y);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = h;
            }
        }
        return nearest;
    }

    canEvolve(passiveSystem) {
        if (this.isEvolved) return false;
        if (this.level < 8) return false;

        const evo = Object.values(EVOLUTIONS).find(e => e.baseWeaponId === this.typeId);
        if (!evo) return false;

        return passiveSystem.getLevel(evo.requiredPassive) >= evo.requiredPassiveLevel;
    }

    getEvolution() {
        return Object.values(EVOLUTIONS).find(e => e.baseWeaponId === this.typeId) || null;
    }

    evolve() {
        const evo = this.getEvolution();
        if (!evo) return false;

        this.typeId = evo.id;
        this.config = { ...evo };
        if (!this.config.category && this.config.baseWeaponId) {
            const base = WEAPON_TYPES[this.config.baseWeaponId];
            if (base) this.config.category = base.category;
        }
        this.isEvolved = true;
        this.cooldownTimer = 0;
        return true;
    }
}
