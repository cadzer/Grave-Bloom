import { DAMAGE_NUMBERS } from '../config/GameConfig.js';

export class DamageNumbers {
    constructor() {
        this.numbers = [];
    }

    add(x, y, value) {
        this.numbers.push({
            x,
            y,
            value,
            timer: DAMAGE_NUMBERS.LIFETIME,
            vy: DAMAGE_NUMBERS.RISE_SPEED,
            vx: (Math.random() - 0.5) * 40,
            scale: value >= DAMAGE_NUMBERS.CRIT_THRESHOLD ? 1.4 : 1.0,
            color: value >= DAMAGE_NUMBERS.CRIT_THRESHOLD
                ? DAMAGE_NUMBERS.CRIT_COLOR
                : DAMAGE_NUMBERS.DEFAULT_COLOR
        });
    }

    update(dt) {
        let writeIdx = 0;
        for (let i = 0; i < this.numbers.length; i++) {
            const n = this.numbers[i];
            n.timer -= dt;
            n.y += n.vy * dt;
            n.x += n.vx * dt;
            n.vy += DAMAGE_NUMBERS.GRAVITY * dt;
            if (n.timer > 0) this.numbers[writeIdx++] = n;
        }
        this.numbers.length = writeIdx;
    }

    getCount() { return this.numbers.length; }

    draw(ctx, playerX, playerY) {
        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        for (const n of this.numbers) {
            const sx = cx + (n.x - playerX);
            const sy = cy + (n.y - playerY);
            if (sx < -50 || sx > ctx.canvas.width + 50 || sy < -50 || sy > ctx.canvas.height + 50) continue;

            const alpha = Math.min(1, n.timer / 0.2);
            const scale = n.scale * (1 + (1 - n.timer / DAMAGE_NUMBERS.LIFETIME) * 0.3);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(sx, sy);
            ctx.scale(scale, scale);

            const text = Math.ceil(n.value);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.font = `bold ${DAMAGE_NUMBERS.FONT_SIZE}px Rajdhani`;
            ctx.textAlign = 'center';
            ctx.fillText(text, 2, 2);

            // Main text
            ctx.fillStyle = n.color;
            ctx.fillText(text, 0, 0);

            // Bright outline for crits
            if (n.value >= DAMAGE_NUMBERS.CRIT_THRESHOLD) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeText(text, 0, 0);
            }

            ctx.restore();
        }
    }
}
