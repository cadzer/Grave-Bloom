import { Weapon } from '../entities/Weapon.js';
import { Projectile } from '../entities/Projectile.js';
import { WEAPON } from '../config/GameConfig.js';

export class WeaponManager {
    constructor(sound) {
        this.weapons = [];
        this.projectiles = [];
        this.pulseEffects = [];
        this.lightningChains = [];
        this.clouds = [];
        this.globalDamageMulti = 1;
        this.globalCooldownMulti = 1;
        this.globalSpeedMulti = 1;
        this.sound = sound || null;
        this._hostileBuffer = [];
    }

    addWeapon(typeId, level = 1) {
        const existing = this.getWeapon(typeId);
        if (existing) {
            existing.level = Math.max(existing.level, level);
            return existing;
        }
        const w = new Weapon(typeId, level);
        this.weapons.push(w);
        return w;
    }

    getWeapon(typeId) {
        for (let i = 0; i < this.weapons.length; i++) {
            if (this.weapons[i].typeId === typeId) return this.weapons[i];
        }
        return null;
    }

    upgradeWeapon(typeId) {
        const w = this.getWeapon(typeId);
        if (w && w.level < 8) { w.level++; return true; }
        return false;
    }

    removeWeapon(typeId) {
        for (let i = this.weapons.length - 1; i >= 0; i--) {
            if (this.weapons[i].typeId === typeId) {
                this.weapons[i] = this.weapons[this.weapons.length - 1];
                this.weapons.pop();
                return;
            }
        }
    }

    update(dt, playerX, playerY, enemies, bosses, callbacks) {
        let hostileCount = 0;
        for (let i = 0; i < enemies.length; i++) {
            if (!enemies[i].dead) this._hostileBuffer[hostileCount++] = enemies[i];
        }
        for (let i = 0; i < bosses.length; i++) {
            if (!bosses[i].dead) this._hostileBuffer[hostileCount++] = bosses[i];
        }
        this._hostileBuffer.length = hostileCount;

        const hostiles = this._hostileBuffer;

        for (let w = 0; w < this.weapons.length; w++) {
            const weapon = this.weapons[w];
            weapon.update(dt, playerX, playerY, hostiles,
                this.globalDamageMulti, this.globalCooldownMulti, this.globalSpeedMulti,
                {
                    onFireProjectile: (x, y, tx, ty, stats, color) => {
                        this.projectiles.push(new Projectile(x, y, tx, ty, stats.speed, stats.damage, stats.size));
                        if (this.sound) this.sound.playShoot();
                    },
                    onDamageHostile: (hostile, damage, x, y, dir) => {
                        hostile.takeDamage(damage, dir.x * WEAPON.KNOCKBACK_FORCE, dir.y * WEAPON.KNOCKBACK_FORCE);
                        callbacks.onEnemyHit(hostile, damage, x, y);
                        if (hostile.dead) {
                            if (hostile.isBoss) callbacks.onBossKilled(hostile);
                            else callbacks.onEnemyKilled(hostile);
                        }
                    },
                    onPulse: (x, y, radius, color) => {
                        this.pulseEffects.push({ x, y, radius, color, timer: 0.4, maxTimer: 0.4 });
                    },
                    onLightningChain: (x1, y1, x2, y2, color) => {
                        this.lightningChains.push({ x1, y1, x2, y2, color, timer: 0.35, maxTimer: 0.35, evolved: weapon.isEvolved });
                    },
                    onHeal: (amount) => {
                        callbacks.onHeal(amount);
                    },
                    onSpawnCloud: (x, y, radius, duration, tick, damage, color) => {
                        this.clouds.push({ x, y, radius, duration, maxDuration: duration, tick, tickTimer: 0, damage, color });
                    }
                }
            );
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, playerX, playerY);
            if (p.dead) {
                this.projectiles[i] = this.projectiles[this.projectiles.length - 1];
                this.projectiles.pop();
            }
        }

        for (let i = this.pulseEffects.length - 1; i >= 0; i--) {
            this.pulseEffects[i].timer -= dt;
            if (this.pulseEffects[i].timer <= 0) {
                this.pulseEffects[i] = this.pulseEffects[this.pulseEffects.length - 1];
                this.pulseEffects.pop();
            }
        }

        for (let i = this.lightningChains.length - 1; i >= 0; i--) {
            this.lightningChains[i].timer -= dt;
            if (this.lightningChains[i].timer <= 0) {
                this.lightningChains[i] = this.lightningChains[this.lightningChains.length - 1];
                this.lightningChains.pop();
            }
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const c = this.clouds[i];
            c.duration -= dt;
            c.tickTimer += dt;
            if (c.tickTimer >= c.tick) {
                c.tickTimer -= c.tick;
                for (let j = 0; j < hostiles.length; j++) {
                    const h = hostiles[j];
                    if (h.dead) continue;
                    const dx = h.x - c.x;
                    const dy = h.y - c.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < c.radius * c.radius) {
                        h.takeDamage(c.damage, 0, 0);
                        callbacks.onEnemyHit(h, c.damage, h.x, h.y);
                        if (h.dead) {
                            if (h.isBoss) callbacks.onBossKilled(h);
                            else callbacks.onEnemyKilled(h);
                        }
                    }
                }
            }
            if (c.duration <= 0) {
                this.clouds[i] = this.clouds[this.clouds.length - 1];
                this.clouds.pop();
            }
        }
    }

    getProjectiles() { return this.projectiles; }

    draw(ctx, psx, psy, pwx, pwy) {
        for (let i = 0; i < this.weapons.length; i++) {
            if (this.weapons[i].config.category === 'orbit') {
                this.drawOrbitWeapon(ctx, this.weapons[i], psx, psy);
            }
        }

        for (let i = 0; i < this.pulseEffects.length; i++) {
            const p = this.pulseEffects[i];
            this.drawPulseEffect(ctx, psx + (p.x - pwx), psy + (p.y - pwy), p);
        }

        for (let i = 0; i < this.clouds.length; i++) {
            const c = this.clouds[i];
            this.drawCloud(ctx, psx + (c.x - pwx), psy + (c.y - pwy), c);
        }

        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            const px = psx + (p.x - pwx);
            const py = psy + (p.y - pwy);
            if (px < -50 || px > 1970 || py < -50 || py > 1130) continue;
            p.draw(ctx, px, py);
        }

        for (let i = 0; i < this.lightningChains.length; i++) {
            const c = this.lightningChains[i];
            this.drawLightningChain(ctx, psx + (c.x1 - pwx), psy + (c.y1 - pwy),
                psx + (c.x2 - pwx), psy + (c.y2 - pwy), c);
        }
    }

    drawOrbitWeapon(ctx, weapon, psx, psy) {
        const stats = weapon.getStats(this.globalDamageMulti, this.globalCooldownMulti, this.globalSpeedMulti);
        const ringCount = stats.projectiles;
        const color = weapon.config.color;
        const secColor = weapon.config.secondaryColor || color;
        const isEvolved = weapon.isEvolved;

        for (let r = 0; r < ringCount; r++) {
            const ringRadius = stats.orbitRadius + r * 38;
            const ringSpeed = 1 + r * 0.3;
            const angle = weapon.orbitAngle * ringSpeed + (r / ringCount) * Math.PI * 2;
            const bx = psx + Math.cos(angle) * ringRadius;
            const by = psy + Math.sin(angle) * ringRadius;

            ctx.save();

            if (isEvolved) {
                // Lightning orb visual
                const pulse = 0.8 + Math.sin(weapon.orbitAngle * 8 + r) * 0.2;
                const orbR = stats.size * 0.7 * pulse;

                // Outer glow
                const glow = ctx.createRadialGradient(bx, by, 0, bx, by, orbR * 3);
                glow.addColorStop(0, `rgba(240,224,96,${0.5 * pulse})`);
                glow.addColorStop(0.4, `rgba(160,208,255,${0.25 * pulse})`);
                glow.addColorStop(1, 'rgba(160,208,255,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(bx, by, orbR * 3, 0, Math.PI * 2);
                ctx.fill();

                // Core orb
                const core = ctx.createRadialGradient(bx, by, 0, bx, by, orbR);
                core.addColorStop(0, '#ffffff');
                core.addColorStop(0.3, secColor);
                core.addColorStop(1, color);
                ctx.fillStyle = core;
                ctx.beginPath();
                ctx.arc(bx, by, orbR, 0, Math.PI * 2);
                ctx.fill();

                // Lightning crackle bolts from orb
                ctx.strokeStyle = `rgba(255,255,255,${0.6 * pulse})`;
                ctx.lineWidth = 1.5;
                const boltCount = 3 + r;
                const seed = Math.floor(bx * 13.7 + by * 29.3 + r * 41);
                for (let b = 0; b < boltCount; b++) {
                    const bAngle = (seed + b * 137.5) * Math.PI / 180;
                    const bLen = orbR * (1.5 + Math.sin(seed + b * 7) * 0.5);
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    const segs = 4;
                    for (let s = 1; s <= segs; s++) {
                        const t = s / segs;
                        ctx.lineTo(
                            bx + Math.cos(bAngle) * bLen * t + Math.sin(seed + s * 5.3) * 8,
                            by + Math.sin(bAngle) * bLen * t + Math.cos(seed + s * 3.7) * 8
                        );
                    }
                    ctx.stroke();
                }
            } else {
                // Original thorn blade visual
                ctx.translate(bx, by);
                ctx.rotate(angle + Math.PI / 2);

                const bladeLen = stats.size;
                const grad = ctx.createLinearGradient(0, -bladeLen, 0, bladeLen * 0.4);
                grad.addColorStop(0, secColor);
                grad.addColorStop(0.5, color);
                grad.addColorStop(1, '#fff');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, -bladeLen);
                ctx.lineTo(-5, -bladeLen * 0.2);
                ctx.lineTo(-3, bladeLen * 0.3);
                ctx.lineTo(0, bladeLen * 0.4);
                ctx.lineTo(3, bladeLen * 0.3);
                ctx.lineTo(5, -bladeLen * 0.2);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();

            // Orbit ring trail
            const ringAlpha = isEvolved ? 0.15 + r * 0.05 : 0.12 + r * 0.04;
            const ringColor = isEvolved ? '#a0d0ff' : color;
            ctx.strokeStyle = `${ringColor}${Math.floor(ringAlpha * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = isEvolved ? 2 : 1.5;
            ctx.setLineDash(isEvolved ? [6, 10] : [4, 8]);
            ctx.beginPath();
            ctx.arc(psx, psy, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawPulseEffect(ctx, sx, sy, pulse) {
        const progress = 1 - pulse.timer / pulse.maxTimer;
        const radius = pulse.radius * (0.3 + progress * 0.7);
        const alpha = 1 - progress;

        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
        grad.addColorStop(0, `rgba(255,255,220,${alpha * 0.4})`);
        grad.addColorStop(0.4, `${pulse.color}${Math.floor(alpha * 100).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, `${pulse.color}00`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${pulse.color}${Math.floor(alpha * 220).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawLightningChain(ctx, sx1, sy1, sx2, sy2, chain) {
        const alpha = chain.timer / chain.maxTimer;
        const hex = chain.color;
        const evo = chain.evolved;

        ctx.save();
        ctx.strokeStyle = `${hex}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = evo ? 4 : 2.5;

        const dx = sx2 - sx1;
        const dy = sy2 - sy1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const segments = Math.max(4, Math.floor(len / (evo ? 20 : 30)));
        const seed = Math.floor(sx1 * 17.3 + sy1 * 31.7);
        const jitter = evo ? 22 : 16;

        // Main bolt
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            ctx.lineTo(
                sx1 + dx * t + Math.sin(seed + i * 7.3) * jitter,
                sy1 + dy * t + Math.cos(seed + i * 5.1) * jitter
            );
        }
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        // Glow overlay for evolved
        if (evo) {
            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                ctx.lineTo(
                    sx1 + dx * t + Math.sin(seed + i * 7.3) * jitter * 0.6,
                    sy1 + dy * t + Math.cos(seed + i * 5.1) * jitter * 0.6
                );
            }
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawCloud(ctx, sx, sy, cloud) {
        const lifeRatio = cloud.duration / cloud.maxDuration;
        const alpha = Math.min(1, lifeRatio * 2) * 0.6;
        const pulse = 0.9 + Math.sin(cloud.duration * 6) * 0.1;

        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, cloud.radius * pulse);
        grad.addColorStop(0, `rgba(106,154,60,${alpha * 0.5})`);
        grad.addColorStop(0.5, `rgba(139,196,74,${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(106,154,60,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, cloud.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(139,196,74,${alpha * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(sx, sy, cloud.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        for (let i = 0; i < 3; i++) {
            const t = cloud.duration * 2 + i * 2.1;
            const px = sx + Math.sin(t * 1.3 + i) * cloud.radius * 0.4;
            const py = sy + Math.cos(t * 0.9 + i * 1.7) * cloud.radius * 0.3;
            ctx.fillStyle = `rgba(139,196,74,${alpha * 0.25})`;
            ctx.beginPath();
            ctx.arc(px, py, 5 + Math.sin(t) * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset() {
        this.weapons.length = 0;
        this.projectiles.length = 0;
        this.pulseEffects.length = 0;
        this.lightningChains.length = 0;
        this.clouds.length = 0;
        this.globalDamageMulti = 1;
        this.globalCooldownMulti = 1;
        this.globalSpeedMulti = 1;
        delete this._baseDamageMulti;
        delete this._baseCooldownMulti;
        delete this._upgradeDamageMulti;
        delete this._upgradeCooldownMulti;
        delete this.passiveDamageLevel;
        delete this.passiveCooldownLevel;
    }

    getProjectileCount() { return this.projectiles.length; }
    getPulseCount() { return this.pulseEffects.length; }
    getChainCount() { return this.lightningChains.length; }
}
