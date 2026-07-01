import { GAME } from '../config/GameConfig.js';

const W = GAME.WIDTH;
const H = GAME.HEIGHT;

const BIOME_AMBIENT = [
    {
        motes: { count: 25, colors: ['#7c9a6e', '#b8d94e', '#a9dfbf'], size: [1, 3], speed: 12, alpha: 0.15 },
        embers: { count: 0, colors: [], size: [0, 0], speed: 0, alpha: 0 },
        fog: { count: 6, colors: ['rgba(124,154,110,0.04)', 'rgba(124,154,110,0.06)'], size: [60, 140], speed: 8, alpha: 1 }
    },
    {
        motes: { count: 18, colors: ['#c0703a', '#e67e22', '#d4a76a'], size: [1, 2.5], speed: 15, alpha: 0.12 },
        embers: { count: 10, colors: ['#e67e22', '#f39c12', '#ff6b35'], size: [1, 2], speed: 25, alpha: 0.35 },
        fog: { count: 5, colors: ['rgba(100,80,50,0.04)', 'rgba(120,90,50,0.05)'], size: [80, 160], speed: 6, alpha: 1 }
    },
    {
        motes: { count: 12, colors: ['#c4a23a', '#e8c84a', '#f0d060'], size: [1, 2], speed: 10, alpha: 0.1 },
        embers: { count: 20, colors: ['#e74c3c', '#f39c12', '#ff4500', '#ff6b35'], size: [1, 2.5], speed: 35, alpha: 0.45 },
        fog: { count: 4, colors: ['rgba(180,80,40,0.04)', 'rgba(200,100,50,0.05)'], size: [100, 200], speed: 10, alpha: 1 }
    }
];

export class AmbientSystem {
    constructor() {
        this.particles = [];
        this.biomeIdx = 0;
        this.spawnTimer = 0;
    }

    setBiome(idx) {
        this.biomeIdx = idx;
    }

    update(dt, playerX, playerY, elapsedTime) {
        const biomeIdx = elapsedTime !== undefined ? this._getBiomeIdx(elapsedTime) : 0;
        if (biomeIdx !== this.biomeIdx) {
            this.biomeIdx = biomeIdx;
        }

        this.spawnTimer += dt;
        while (this.spawnTimer >= 0.3) {
            this.spawnTimer -= 0.3;
            this._spawnMotes(biomeIdx);
            this._spawnEmbers(biomeIdx);
        }

        this._spawnFog(biomeIdx);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.type === 'fog') {
                p.size += p.growRate * dt;
                if (p.x < playerX - W || p.x > playerX + W ||
                    p.y < playerY - H || p.y > playerY + H) {
                    p.life = 0;
                }
            }
            if (p.type === 'ember') {
                p.vy -= 8 * dt;
                p.vx += (Math.random() - 0.5) * 20 * dt;
            }
            if (p.type === 'mote') {
                p.x += Math.sin(p.phase + p.life * 2) * 8 * dt;
            }
            if (p.life <= 0) {
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
            }
        }
    }

    _getBiomeIdx(elapsedTime) {
        if (elapsedTime >= 300) return 2;
        if (elapsedTime >= 120) return 1;
        return 0;
    }

    _spawnMotes(biomeIdx) {
        const cfg = BIOME_AMBIENT[biomeIdx].motes;
        if (cfg.count <= 0 || this.particles.length > 400) return;
        if (Math.random() > cfg.count * 0.03) return;

        const colors = cfg.colors;
        this.particles.push({
            type: 'mote',
            x: (Math.random() - 0.5) * W * 1.2,
            y: (Math.random() - 0.5) * H * 1.2,
            vx: (Math.random() - 0.5) * cfg.speed,
            vy: (Math.random() - 0.5) * cfg.speed * 0.5 - 3,
            life: 4 + Math.random() * 4,
            size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: cfg.alpha * (0.5 + Math.random() * 0.5),
            phase: Math.random() * Math.PI * 2
        });
    }

    _spawnEmbers(biomeIdx) {
        const cfg = BIOME_AMBIENT[biomeIdx].embers;
        if (cfg.count <= 0 || this.particles.length > 400) return;
        if (Math.random() > cfg.count * 0.02) return;

        const colors = cfg.colors;
        this.particles.push({
            type: 'ember',
            x: (Math.random() - 0.5) * W * 1.2,
            y: H * 0.3 + Math.random() * H * 0.5,
            vx: (Math.random() - 0.5) * cfg.speed,
            vy: -cfg.speed - Math.random() * 20,
            life: 1.5 + Math.random() * 2.5,
            size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: cfg.alpha
        });
    }

    _spawnFog(biomeIdx) {
        const cfg = BIOME_AMBIENT[biomeIdx].fog;
        const existingFog = this.particles.filter(p => p.type === 'fog').length;
        if (existingFog >= cfg.count) return;
        if (Math.random() > 0.01) return;

        const colors = cfg.colors;
        this.particles.push({
            type: 'fog',
            x: (Math.random() - 0.5) * W * 1.5,
            y: H * 0.3 + Math.random() * H * 0.5,
            vx: cfg.speed * (Math.random() > 0.5 ? 1 : -1),
            vy: (Math.random() - 0.5) * 3,
            life: 8 + Math.random() * 6,
            size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
            growRate: 5 + Math.random() * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: cfg.alpha
        });
    }

    draw(ctx, playerX, playerY) {
        for (const p of this.particles) {
            const sx = p.x - playerX + W / 2;
            const sy = p.y - playerY + H / 2;
            if (sx < -200 || sx > W + 200 || sy < -200 || sy > H + 200) continue;

            const alpha = Math.min(1, p.life / 2) * p.alpha;

            if (p.type === 'mote') {
                ctx.globalAlpha = alpha;
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'ember') {
                ctx.globalAlpha = alpha;
                ctx.globalCompositeOperation = 'lighter';
                const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * 2);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(sx, sy, p.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'fog') {
                ctx.globalAlpha = alpha * 0.5;
                ctx.globalCompositeOperation = 'source-over';
                const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
}
