import { CHEST } from '../config/GameConfig.js';

export class TreasureChest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.radius = CHEST.PICKUP_RADIUS;
        this.animTimer = 0;
    }

    update(dt) {
        this.bobOffset += dt * CHEST.BOB_SPEED;
        this.animTimer += dt;
    }

    draw(ctx, sx, sy) {
        const bobY = Math.sin(this.bobOffset) * CHEST.BOB_HEIGHT;
        const drawY = sy + bobY;
        const s = CHEST.SIZE;
        const sparkle = Math.sin(this.animTimer * 4) * 0.3 + 0.7;

        ctx.save();
        ctx.translate(sx, drawY);

        // Ground glow
        const glowGrad = ctx.createRadialGradient(0, s * 0.6, 0, 0, s * 0.6, CHEST.GLOW_RADIUS);
        glowGrad.addColorStop(0, `rgba(241, 196, 15, ${0.25 * sparkle})`);
        glowGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, s * 0.6, CHEST.GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.6 + 5, s * 0.7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Box body
        const bodyGrad = ctx.createLinearGradient(-s / 2, -s / 4, s / 2, s / 2);
        bodyGrad.addColorStop(0, '#f5b041');
        bodyGrad.addColorStop(0.5, '#f39c12');
        bodyGrad.addColorStop(1, '#d68910');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-s / 2, -s / 4, s, s * 0.65, 4);
        ctx.fill();

        // Body border
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-s / 2, -s / 4, s, s * 0.65, 4);
        ctx.stroke();

        // Metal trim on body
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(-s / 2, -s / 4, s, 4);
        ctx.fillRect(-s / 2, s / 2 - 4, s, 4);

        // Lid
        const lidGrad = ctx.createLinearGradient(-s / 2, -s / 4 - s * 0.28, s / 2, -s / 4);
        lidGrad.addColorStop(0, '#d68910');
        lidGrad.addColorStop(0.5, '#f39c12');
        lidGrad.addColorStop(1, '#b8860b');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.roundRect(-s / 2 - 2, -s / 4 - s * 0.28, s + 4, s * 0.28, [6, 6, 0, 0]);
        ctx.fill();

        // Lid border
        ctx.strokeStyle = '#7d6608';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-s / 2 - 2, -s / 4 - s * 0.28, s + 4, s * 0.28, [6, 6, 0, 0]);
        ctx.stroke();

        // Metal band across lid
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(-s / 2 - 2, -s / 4 - 4, s + 4, 4);

        // Corner brackets
        ctx.strokeStyle = '#7d6608';
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(-s / 2 + 8, -s / 4 - s * 0.28 + 6);
        ctx.lineTo(-s / 2 + 2, -s / 4 - s * 0.28 + 6);
        ctx.lineTo(-s / 2 + 2, -s / 4 - s * 0.28 + 14);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(s / 2 - 8, -s / 4 - s * 0.28 + 6);
        ctx.lineTo(s / 2 + 2, -s / 4 - s * 0.28 + 6);
        ctx.lineTo(s / 2 + 2, -s / 4 - s * 0.28 + 14);
        ctx.stroke();

        // Lock plate
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.roundRect(-8, -s / 4 - 4, 16, 14, 3);
        ctx.fill();

        // Lock body
        ctx.fillStyle = '#7d6608';
        ctx.beginPath();
        ctx.roundRect(-6, -s / 4 - 2, 12, 10, 2);
        ctx.fill();

        // Keyhole
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(0, -s / 4 + 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-1, -s / 4 + 1, 2, 5);

        // Sparkle effects
        const sparklePositions = [
            { x: -s / 3, y: -s / 3, delay: 0 },
            { x: s / 4, y: -s / 4, delay: 1.5 },
            { x: s / 3, y: s / 6, delay: 3 },
            { x: -s / 4, y: s / 5, delay: 0.8 }
        ];

        for (const sp of sparklePositions) {
            const t = (this.animTimer + sp.delay) % 2;
            if (t < 0.5) {
                const alpha = t < 0.25 ? t / 0.25 : (0.5 - t) / 0.25;
                const size = 2 + alpha * 3;
                ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.8})`;
                // Four-pointed star
                ctx.beginPath();
                ctx.moveTo(sp.x, sp.y - size);
                ctx.lineTo(sp.x + size * 0.3, sp.y);
                ctx.lineTo(sp.x, sp.y + size);
                ctx.lineTo(sp.x - size * 0.3, sp.y);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(sp.x - size, sp.y);
                ctx.lineTo(sp.x, sp.y + size * 0.3);
                ctx.lineTo(sp.x + size, sp.y);
                ctx.lineTo(sp.x, sp.y - size * 0.3);
                ctx.fill();
            }
        }

        // Light leak from lid seam
        ctx.fillStyle = `rgba(255, 255, 180, ${0.15 + sparkle * 0.1})`;
        ctx.fillRect(-s / 2 + 4, -s / 4 - 2, s - 8, 3);

        ctx.restore();
    }
}
