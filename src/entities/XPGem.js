import { XP_GEMS } from '../config/GameConfig.js';

const GEM_VISUALS = {
    small: { radius: 8, color: '#5a8f7c', glow: '#3d6b52' },
    medium: { radius: 12, color: '#7c9a6e', glow: '#5a7a3c' },
    large: { radius: 18, color: '#b8d94e', glow: '#8ab832' }
};

export class XPGem {
    constructor(x, y, value, size) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.size = size;
        this.radius = GEM_VISUALS[size].radius;
        this.color = GEM_VISUALS[size].color;
        this.glowColor = GEM_VISUALS[size].glow;
        this.dead = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.spinOffset = Math.random() * Math.PI * 2;
    }

    update(dt, playerX, playerY, magnetRadius) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magnetRadius && dist > 0) {
            const speed = XP_GEMS.MAGNET_SPEED * (1 - dist / magnetRadius);
            this.x += (dx / dist) * speed * dt;
            this.y += (dy / dist) * speed * dt;
        }

        this.bobOffset += dt * XP_GEMS.BOB_SPEED;
        this.spinOffset += dt * 2;
    }

    draw(ctx, sx, sy) {
        const bobY = Math.sin(this.bobOffset) * XP_GEMS.BOB_HEIGHT;
        const r = this.radius;
        const drawY = sy + bobY;

        // Glow
        const glowGrad = ctx.createRadialGradient(sx, drawY, 0, sx, drawY, r * 2);
        glowGrad.addColorStop(0, this.glowColor + '44');
        glowGrad.addColorStop(1, this.glowColor + '00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(sx, drawY, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Main gem body
        const gemGrad = ctx.createLinearGradient(sx - r, drawY - r, sx + r, drawY + r);
        gemGrad.addColorStop(0, this.color);
        gemGrad.addColorStop(0.5, '#fff');
        gemGrad.addColorStop(1, this.glowColor);
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.arc(sx, drawY, r, 0, Math.PI * 2);
        ctx.fill();

        // Facet lines
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        const facets = this.size === 'large' ? 6 : this.size === 'medium' ? 5 : 4;
        for (let i = 0; i < facets; i++) {
            const a = (i / facets) * Math.PI * 2 + this.spinOffset;
            ctx.beginPath();
            ctx.moveTo(sx, drawY);
            ctx.lineTo(sx + Math.cos(a) * r * 0.85, drawY + Math.sin(a) * r * 0.85);
            ctx.stroke();
        }

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(sx - r * 0.25, drawY - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, drawY, r + 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

export function createGemDrop(x, y) {
    const roll = Math.random();
    if (roll < XP_GEMS.LARGE_CHANCE) {
        return new XPGem(x, y, XP_GEMS.LARGE_VALUE, 'large');
    } else if (roll < XP_GEMS.LARGE_CHANCE + XP_GEMS.MEDIUM_CHANCE) {
        return new XPGem(x, y, XP_GEMS.MEDIUM_VALUE, 'medium');
    }
    return new XPGem(x, y, XP_GEMS.SMALL_VALUE, 'small');
}
