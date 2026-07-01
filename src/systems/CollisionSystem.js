import { normalize } from '../core/MathUtils.js';
import { WEAPON } from '../config/GameConfig.js';

function circlesCollideSq(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const rSum = r1 + r2;
    return dx * dx + dy * dy < rSum * rSum;
}

export class CollisionSystem {
    constructor() {
        this.onPlayerHit = null;
        this.onEnemyHit = null;
        this.onEnemyKilled = null;
        this.onBossKilled = null;
        this.onChestPickedUp = null;
    }

    checkEnemyPlayerCollisions(enemies, player) {
        const px = player.x;
        const py = player.y;
        const pr = player.radius;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e.dead) continue;
            if (circlesCollideSq(e.x, e.y, e.radius, px, py, pr)) {
                if (this.onPlayerHit) this.onPlayerHit(e.damage);
                break;
            }
        }
    }

    checkBossPlayerCollisions(bosses, player) {
        const px = player.x;
        const py = player.y;
        const pr = player.radius;
        for (let i = 0; i < bosses.length; i++) {
            const b = bosses[i];
            if (b.dead) continue;
            if (circlesCollideSq(b.x, b.y, b.radius, px, py, pr)) {
                if (this.onPlayerHit) this.onPlayerHit(b.damage);
                break;
            }
        }
    }

    checkProjectileEnemyCollisions(projectiles, enemies) {
        for (let i = 0; i < projectiles.length; i++) {
            const proj = projectiles[i];
            if (proj.dead) continue;

            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                if (enemy.dead) continue;

                if (circlesCollideSq(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
                    const dx = enemy.x - proj.x;
                    const dy = enemy.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const kb = WEAPON.KNOCKBACK_FORCE;

                    enemy.takeDamage(proj.damage, nx * kb, ny * kb);
                    proj.dead = true;

                    if (this.onEnemyHit) this.onEnemyHit(enemy, proj.damage, enemy.x, enemy.y);
                    if (enemy.dead && this.onEnemyKilled) this.onEnemyKilled(enemy);
                    break;
                }
            }
        }
    }

    checkProjectileBossCollisions(projectiles, bosses) {
        for (let i = 0; i < projectiles.length; i++) {
            const proj = projectiles[i];
            if (proj.dead) continue;

            for (let j = 0; j < bosses.length; j++) {
                const boss = bosses[j];
                if (boss.dead) continue;

                if (circlesCollideSq(proj.x, proj.y, proj.radius, boss.x, boss.y, boss.radius)) {
                    const dx = boss.x - proj.x;
                    const dy = boss.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const kb = WEAPON.KNOCKBACK_FORCE;

                    boss.takeDamage(proj.damage, nx * kb, ny * kb);
                    proj.dead = true;

                    if (this.onEnemyHit) this.onEnemyHit(boss, proj.damage, boss.x, boss.y);
                    if (boss.dead && this.onBossKilled) this.onBossKilled(boss);
                    break;
                }
            }
        }
    }

    checkChestPickup(chests, player) {
        const px = player.x;
        const py = player.y;
        const pr = player.radius;
        for (let i = 0; i < chests.length; i++) {
            const chest = chests[i];
            if (chest.dead) continue;
            if (circlesCollideSq(chest.x, chest.y, chest.radius, px, py, pr)) {
                chest.dead = true;
                if (this.onChestPickedUp) this.onChestPickedUp(chest);
            }
        }
    }
}
