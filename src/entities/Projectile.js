import { GAME, COLORS } from '../config/GameConfig.js';

const MARGIN = 100;
const HALF_W = GAME.WIDTH / 2 + MARGIN;
const HALF_H = GAME.HEIGHT / 2 + MARGIN;

const _glowCache = new Map();

function getGlowSprite(r) {
    const key = Math.round(r * 10);
    if (_glowCache.has(key)) return _glowCache.get(key);
    const size = Math.ceil(r * 5 + 4);
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const gctx = c.getContext('2d');
    const mid = size / 2;
    const glowGrad = gctx.createRadialGradient(mid, mid, 0, mid, mid, r * 2.5);
    glowGrad.addColorStop(0, 'rgba(241, 196, 15, 0.3)');
    glowGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
    gctx.fillStyle = glowGrad;
    gctx.beginPath();
    gctx.arc(mid, mid, r * 2.5, 0, Math.PI * 2);
    gctx.fill();

    const bodyGrad = gctx.createRadialGradient(mid - 2, mid - 2, 0, mid, mid, r);
    bodyGrad.addColorStop(0, '#fff');
    bodyGrad.addColorStop(0.4, '#f9e547');
    bodyGrad.addColorStop(1, '#f39c12');
    gctx.fillStyle = bodyGrad;
    gctx.beginPath();
    gctx.arc(mid, mid, r, 0, Math.PI * 2);
    gctx.fill();

    gctx.fillStyle = '#fff';
    gctx.beginPath();
    gctx.arc(mid, mid, r * 0.4, 0, Math.PI * 2);
    gctx.fill();

    gctx.fillStyle = 'rgba(255,255,255,0.8)';
    gctx.beginPath();
    gctx.arc(mid - r * 0.2, mid - r * 0.2, r * 0.25, 0, Math.PI * 2);
    gctx.fill();

    _glowCache.set(key, c);
    if (_glowCache.size > 32) _glowCache.clear();
    return c;
}

export class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, size) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.radius = size;
        this.dead = false;
        this.animTimer = 0;
        this.trail = [];
        this.maxTrail = 5;

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.dx = dx / dist;
            this.dy = dy / dist;
        } else {
            this.dx = 1;
            this.dy = 0;
        }
    }

    update(dt, playerX, playerY) {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;
        this.animTimer += dt;

        const dx = this.x - playerX;
        const dy = this.y - playerY;
        if (dx < -HALF_W || dx > HALF_W ||
            dy < -HALF_H || dy > HALF_H) {
            this.dead = true;
        }
    }

    draw(ctx, sx, sy) {
        if (!isFinite(sx) || !isFinite(sy)) return;
        const r = this.radius;

        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const tx = sx + (t.x - this.x);
            const ty = sy + (t.y - this.y);
            const alpha = (1 - i / this.trail.length) * 0.25;
            const trailR = r * (1 - i / this.trail.length * 0.4);
            ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
            ctx.beginPath();
            ctx.arc(tx, ty, trailR, 0, Math.PI * 2);
            ctx.fill();
        }

        const sprite = getGlowSprite(r);
        const spriteR = sprite.width / 2;
        ctx.drawImage(sprite, sx - spriteR, sy - spriteR);

        ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
        ctx.beginPath();
        ctx.ellipse(
            sx - this.dx * 4,
            sy - this.dy * 4,
            r * 1.2, r * 0.8,
            Math.atan2(this.dy, this.dx),
            0, Math.PI * 2
        );
        ctx.fill();
    }
}
