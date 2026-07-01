import { Projectile } from '../entities/Projectile.js';
import { distance } from '../core/MathUtils.js';
import { WEAPON } from '../config/GameConfig.js';

export class WeaponSystem {
    constructor() {
        this.projectiles = [];
        this.cooldown = 0;
        // Stats that upgrades will modify
        this.cooldownMax = WEAPON.COOLDOWN;
        this.damage = WEAPON.DAMAGE;
        this.projectileSpeed = WEAPON.SPEED;
        this.projectileSize = WEAPON.SIZE;
    }

    update(dt, playerX, playerY, enemies) {
        this.cooldown -= dt;

        if (this.cooldown <= 0 && enemies.length > 0) {
            this.cooldown = this.cooldownMax;
            this.shootNearest(playerX, playerY, enemies);
        }

        for (const proj of this.projectiles) {
            proj.update(dt, playerX, playerY);
        }

        this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    shootNearest(playerX, playerY, enemies) {
        let nearest = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            const dist = distance(playerX, playerY, enemy.x, enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        if (nearest) {
            this.projectiles.push(new Projectile(
                playerX, playerY,
                nearest.x, nearest.y,
                this.projectileSpeed,
                this.damage,
                this.projectileSize
            ));
        }
    }

    getProjectiles() {
        return this.projectiles;
    }
}
