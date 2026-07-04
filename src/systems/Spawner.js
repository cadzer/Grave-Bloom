import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { randomRange } from '../core/MathUtils.js';
import { GAME, ENEMIES, WAVES, BOSS, BOSS_TYPES } from '../config/GameConfig.js';

const HALF_W = GAME.WIDTH / 2;
const HALF_H = GAME.HEIGHT / 2;
const DESPAWN_MARGIN = 200;

function pickWeightedType(types) {
    let total = 0;
    for (let i = 0; i < types.length; i++) total += types[i].weight;
    let roll = Math.random() * total;
    for (let i = 0; i < types.length; i++) {
        roll -= types[i].weight;
        if (roll <= 0) return types[i].key;
    }
    return types[types.length - 1].key;
}

const BOSS_NAMES = [
    'Gravedrift Bloom',
    'Ashen Thicket',
    'The Iron Rot',
    'Dread Petal',
    'Moldering Crown',
    'The Unseelie Court',
    'Blighted Colossus',
    'The Verdant Decay'
];

export class Spawner {
    constructor() {
        this.enemies = [];
        this.bosses = [];
        this.spawnTimer = 0;
        this.bossTimer = BOSS.SPAWN_INTERVAL;
        this.bossCount = 0;
        this.currentStageIndex = 0;
        this.stageChanged = false;
        this.bossSpawned = false;
        this._cachedStage = null;
        this._cachedStageTime = -1;
    }

    getStage(elapsedTime) {
        if (elapsedTime === this._cachedStageTime && this._cachedStage) {
            return this._cachedStage;
        }

        const stages = WAVES.stages;
        let stage = stages[0];
        for (let i = stages.length - 1; i >= 0; i--) {
            if (elapsedTime >= stages[i].start) {
                stage = stages[i];
                this.currentStageIndex = i;
                break;
            }
        }

        const totalMinutes = elapsedTime / 60;
        const fiveMinIntervals = totalMinutes / 5;
        if (fiveMinIntervals > 0) {
            stage = {
                ...stage,
                spawnRate: Math.max(
                    WAVES.MIN_SPAWN_RATE,
                    stage.spawnRate * Math.pow(0.80, fiveMinIntervals)
                )
            };
        }

        if (elapsedTime >= stages[stages.length - 1].start) {
            const extraMinutes = (elapsedTime - stages[stages.length - 1].start) / 60;
            stage = {
                ...stage,
                hpMul: stage.hpMul + extraMinutes * WAVES.HP_SCALE_PER_MIN,
                spdMul: stage.spdMul + extraMinutes * WAVES.SPEED_SCALE_PER_MIN
            };
        }

        this._cachedStage = stage;
        this._cachedStageTime = elapsedTime;
        return stage;
    }

    checkAnnouncement(elapsedTime) {
        const stages = WAVES.stages;
        const idx = this.currentStageIndex;
        if (idx > 0 && elapsedTime >= stages[idx].start && elapsedTime < stages[idx].start + 2) {
            if (!this.stageChanged) {
                this.stageChanged = true;
                return { name: stages[idx].name, message: stages[idx].message };
            }
        }
        if (idx < stages.length && elapsedTime >= stages[idx].start + 2.5) {
            this.stageChanged = false;
        }
        return null;
    }

    update(dt, playerX, playerY, elapsedTime) {
        const stage = this.getStage(elapsedTime);
        this.spawnTimer += dt;

        while (this.spawnTimer >= stage.spawnRate && this.enemies.length < ENEMIES.MAX_ON_SCREEN) {
            this.spawnTimer -= stage.spawnRate;
            this.spawnEnemy(playerX, playerY, stage);
        }

        const despawnDistSq = (HALF_W + DESPAWN_MARGIN) * (HALF_W + DESPAWN_MARGIN)
            + (HALF_H + DESPAWN_MARGIN) * (HALF_H + DESPAWN_MARGIN);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.dead) {
                this.enemies[i] = this.enemies[this.enemies.length - 1];
                this.enemies.pop();
                continue;
            }
            e._speedMulti = this._speedMulti || 1;
            const dx = e.x - playerX;
            const dy = e.y - playerY;
            if (dx * dx + dy * dy > despawnDistSq) {
                this.enemies[i] = this.enemies[this.enemies.length - 1];
                this.enemies.pop();
                continue;
            }
            e.update(dt, playerX, playerY);
        }

        this.bossTimer -= dt;
        if (this.bossTimer <= 0 && this.bosses.length < BOSS.MAX_BOSS_COUNT) {
            this.spawnBoss(playerX, playerY, elapsedTime);
            this.bossTimer = BOSS.SPAWN_INTERVAL;
            this.bossSpawned = true;
            this.bossJustSpawned = true;
        }

        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const b = this.bosses[i];
            if (b.dead) {
                this.bosses[i] = this.bosses[this.bosses.length - 1];
                this.bosses.pop();
                continue;
            }
            b.update(dt, playerX, playerY);
        }
    }

    spawnEnemy(playerX, playerY, stage) {
        const margin = WAVES.SPAWN_MARGIN;
        const side = Math.floor(Math.random() * 4);
        let x, y;

        if (side === 0) {
            x = playerX + randomRange(-HALF_W - margin, HALF_W + margin);
            y = playerY - HALF_H - margin;
        } else if (side === 1) {
            x = playerX + randomRange(-HALF_W - margin, HALF_W + margin);
            y = playerY + HALF_H + margin;
        } else if (side === 2) {
            x = playerX - HALF_W - margin;
            y = playerY + randomRange(-HALF_H - margin, HALF_H + margin);
        } else {
            x = playerX + HALF_W + margin;
            y = playerY + randomRange(-HALF_H - margin, HALF_H + margin);
        }

        const typeKey = pickWeightedType(stage.types);
        const base = ENEMIES[typeKey];
        const config = {
            hp: Math.floor(base.hp * stage.hpMul),
            speed: base.speed * stage.spdMul,
            damage: base.damage,
            color: base.color,
            eyeColor: base.eyeColor,
            collisionRadius: base.collisionRadius,
            healRadius: base.healRadius || 0,
            healAmount: base.healAmount || 0,
            aggroRange: base.aggroRange || 0,
            disguiseAs: base.disguiseAs || null,
            splitCount: base.splitCount || 0,
            shieldRadius: base.shieldRadius || 0,
            shieldAmount: base.shieldAmount || 0
        };

        this.enemies.push(new Enemy(x, y, config, typeKey));
    }

    spawnSmallHive(x, y) {
        const config = {
            hp: 10,
            speed: 55,
            damage: 8,
            color: '#c4a23a',
            eyeColor: '#2c1810',
            collisionRadius: 12
        };
        this.enemies.push(new Enemy(x, y, config, 'spore'));
    }

    updateSpecialBehaviors(dt, playerX, playerY) {
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.dead) continue;

            if (e.healRadius > 0) {
                e.healCooldown = (e.healCooldown || 0) - dt;
                if (e.healCooldown <= 0) {
                    e.healCooldown = 1.5;
                    for (let j = 0; j < this.enemies.length; j++) {
                        if (i === j || this.enemies[j].dead) continue;
                        const other = this.enemies[j];
                        const dx = other.x - e.x;
                        const dy = other.y - e.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < e.healRadius * e.healRadius) {
                            other.hp = Math.min(other.hp + e.healAmount, other.maxHp);
                        }
                    }
                }
            }

            if (e.shieldRadius > 0) {
                e.shielded = false;
                for (let j = 0; j < this.enemies.length; j++) {
                    if (i === j || this.enemies[j].dead) continue;
                    const other = this.enemies[j];
                    if (other.type === 'warden') continue;
                    const dx = other.x - e.x;
                    const dy = other.y - e.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < e.shieldRadius * e.shieldRadius) {
                        other.shielded = true;
                    }
                }
            }
        }
    }

    getEnemies() { return this.enemies; }
    getBosses() { return this.bosses; }

    removeEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies[idx] = this.enemies[this.enemies.length - 1];
            this.enemies.pop();
        }
    }

    removeBoss(boss) {
        const idx = this.bosses.indexOf(boss);
        if (idx !== -1) {
            this.bosses[idx] = this.bosses[this.bosses.length - 1];
            this.bosses.pop();
        }
    }

    spawnBoss(playerX, playerY, elapsedTime) {
        const margin = WAVES.SPAWN_MARGIN;
        const side = Math.floor(Math.random() * 4);
        let x, y;

        if (side === 0) {
            x = playerX + randomRange(-HALF_W - margin, HALF_W + margin);
            y = playerY - HALF_H - margin;
        } else if (side === 1) {
            x = playerX + randomRange(-HALF_W - margin, HALF_W + margin);
            y = playerY + HALF_H + margin;
        } else if (side === 2) {
            x = playerX - HALF_W - margin;
            y = playerY + randomRange(-HALF_H - margin, HALF_H + margin);
        } else {
            x = playerX + HALF_W + margin;
            y = playerY + randomRange(-HALF_H - margin, HALF_H + margin);
        }

        this.bossCount++;
        const hpScale = 1 + (this.bossCount - 1) * BOSS.HP_SCALE_PER_BOSS;
        const nameIdx = (this.bossCount - 1) % BOSS_NAMES.length;
        const typeIdx = (this.bossCount - 1) % BOSS_TYPES.length;

        this.bosses.push(new Boss(x, y, {
            hp: Math.floor(BOSS.BASE_HP * hpScale),
            speed: BOSS.SPEED,
            damage: BOSS.DAMAGE,
            collisionRadius: BOSS.COLLISION_RADIUS,
            visualSize: BOSS.VISUAL_SIZE,
            name: BOSS_NAMES[nameIdx],
            bossType: BOSS_TYPES[typeIdx]
        }));
    }

    getLatestBoss() {
        return this.bosses.length > 0 ? this.bosses[this.bosses.length - 1] : null;
    }

    getEnemyCount() { return this.enemies.length; }
    getBossCount() { return this.bosses.length; }
}
