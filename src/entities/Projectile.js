import { GAME, COLORS } from '../config/GameConfig.js';

const MARGIN = 100;
const HALF_W = GAME.WIDTH / 2 + MARGIN;
const HALF_H = GAME.HEIGHT / 2 + MARGIN;

export class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, size) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.radius = size;
        this.dead = false;
        this.animTimer = 0;

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
        const trail = this.animTimer * 5;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5);
        glowGrad.addColorStop(0, 'rgba(241, 196, 15, 0.3)');
        glowGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Trail
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

        // Main body
        const bodyGrad = ctx.createRadialGradient(sx - 2, sy - 2, 0, sx, sy, r);
        bodyGrad.addColorStop(0, '#fff');
        bodyGrad.addColorStop(0.4, '#f9e547');
        bodyGrad.addColorStop(1, '#f39c12');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(sx - r * 0.2, sy - r * 0.2, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }
}
