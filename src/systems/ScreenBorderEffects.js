import { GAME } from '../config/GameConfig.js';

export class ScreenBorderEffects {
    constructor() {
        this.vineTimer = 0;
        this.vines = [];
        this._lastHpPct = 1;
        this._active = false;
    }

    update(dt, hpPct) {
        this.vineTimer += dt;

        if (hpPct < 0.35 && !this._active) {
            this._active = true;
            this._spawnVines();
        }

        if (hpPct >= 0.4) {
            this._active = false;
        }

        for (const v of this.vines) {
            if (this._active && v.growth < 1) {
                v.growth = Math.min(1, v.growth + dt * 1.5);
            }
            if (!this._active && v.growth > 0) {
                v.growth = Math.max(0, v.growth - dt * 2);
            }
        }

        this.vines = this.vines.filter(v => v.growth > 0 || !this._active);
    }

    _spawnVines() {
        this.vines = [];
        const count = 8;
        for (let i = 0; i < count; i++) {
            const side = i % 4;
            let x, y, angle;
            if (side === 0) { x = (i / 4 | 0) * GAME.WIDTH; y = 0; angle = Math.PI / 2; }
            else if (side === 1) { x = GAME.WIDTH; y = ((i - 1) / 4 | 0) * GAME.HEIGHT; angle = Math.PI; }
            else if (side === 2) { x = ((i - 2) / 4 | 0) * GAME.WIDTH; y = GAME.HEIGHT; angle = -Math.PI / 2; }
            else { x = 0; y = ((i - 3) / 4 | 0) * GAME.HEIGHT; angle = 0; }

            this.vines.push({
                x, y, side, angle,
                segments: 4 + (Math.random() * 3 | 0),
                growth: 0,
                offset: Math.random() * 100
            });
        }
    }

    draw(ctx) {
        if (this.vines.length === 0) return;

        ctx.save();
        for (const vine of this.vines) {
            if (vine.growth <= 0) continue;
            this._drawVine(ctx, vine);
        }
        ctx.restore();
    }

    _drawVine(ctx, vine) {
        const segLen = 30;
        const t = this.vineTimer + vine.offset;

        ctx.strokeStyle = 'rgba(50,80,30,0.6)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(vine.x, vine.y);

        let px = vine.x, py = vine.y;

        for (let i = 0; i < vine.segments; i++) {
            const segGrowth = Math.max(0, Math.min(1, vine.growth * vine.segments - i));
            if (segGrowth <= 0) break;

            const wobble = Math.sin(t * 1.5 + i * 0.8) * 8;
            const nx = px + Math.cos(vine.angle + wobble * 0.05) * segLen * segGrowth;
            const ny = py + Math.sin(vine.angle + wobble * 0.05) * segLen * segGrowth;

            ctx.lineTo(nx, ny);
            px = nx;
            py = ny;

            if (segGrowth > 0.5) {
                const thornAngle = vine.angle + (i % 2 === 0 ? 0.5 : -0.5);
                const thornLen = 8 * segGrowth;
                ctx.stroke();
                ctx.save();
                ctx.strokeStyle = 'rgba(60,90,40,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(nx, ny);
                ctx.lineTo(nx + Math.cos(thornAngle) * thornLen, ny + Math.sin(thornAngle) * thornLen);
                ctx.stroke();
                ctx.restore();
                ctx.beginPath();
                ctx.moveTo(nx, ny);
                ctx.strokeStyle = 'rgba(50,80,30,0.6)';
                ctx.lineWidth = 3;
            }
        }
        ctx.stroke();

        if (vine.growth > 0.3) {
            const leafSize = 6 * vine.growth;
            ctx.fillStyle = 'rgba(80,120,50,0.4)';
            ctx.beginPath();
            ctx.ellipse(px, py, leafSize, leafSize * 0.5, vine.angle, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
