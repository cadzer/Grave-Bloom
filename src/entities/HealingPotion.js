const POTION_TYPES = {
    minor: {
        healPercent: 0.10,
        color: '#5a8f7c',
        glowColor: '#3d6b52',
        liquidColor: '#7c9a6e',
        label: '10%'
    },
    moderate: {
        healPercent: 0.50,
        color: '#c4a23a',
        glowColor: '#a08020',
        liquidColor: '#e0c86e',
        label: '50%'
    },
    full: {
        healPercent: 1.0,
        color: '#8b3a62',
        glowColor: '#6b2a4a',
        liquidColor: '#c46a8a',
        label: 'Full'
    }
};

const DROP_CHANCE = 0.06;
const MINOR_WEIGHT = 60;
const MODERATE_WEIGHT = 30;
const FULL_WEIGHT = 10;
const TOTAL_WEIGHT = MINOR_WEIGHT + MODERATE_WEIGHT + FULL_WEIGHT;

export class HealingPotion {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.cfg = POTION_TYPES[type];
        this.radius = 18;
        this.dead = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkleTimer = Math.random() * 10;
    }

    update(dt, playerX, playerY, magnetRadius) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magnetRadius && dist > 0) {
            const speed = 300 * (1 - dist / magnetRadius);
            this.x += (dx / dist) * speed * dt;
            this.y += (dy / dist) * speed * dt;
        }

        this.bobOffset += dt * 3;
        this.sparkleTimer += dt;
    }

    draw(ctx, sx, sy) {
        const bobY = Math.sin(this.bobOffset) * 3;
        const drawY = sy + bobY;
        const r = this.radius;
        const c = this.cfg;

        const glowGrad = ctx.createRadialGradient(sx, drawY, 0, sx, drawY, r * 2.5);
        glowGrad.addColorStop(0, c.glowColor + '40');
        glowGrad.addColorStop(1, c.glowColor + '00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(sx, drawY, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(sx + 2, drawY + r + 3, r * 0.6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1410';
        ctx.beginPath();
        ctx.arc(sx, drawY - r * 0.1, r * 0.55, Math.PI, 0);
        ctx.lineTo(sx + r * 0.55, drawY + r * 0.6);
        ctx.lineTo(sx - r * 0.55, drawY + r * 0.6);
        ctx.closePath();
        ctx.fill();

        const liquidH = r * 0.5 + Math.sin(this.sparkleTimer * 2) * 1.5;
        ctx.fillStyle = c.liquidColor;
        ctx.beginPath();
        ctx.arc(sx, drawY + r * 0.3, liquidH * 0.5, 0, Math.PI * 2);
        ctx.fill();

        const bottleGrad = ctx.createLinearGradient(sx - r * 0.5, drawY, sx + r * 0.5, drawY);
        bottleGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        bottleGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
        bottleGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = bottleGrad;
        ctx.beginPath();
        ctx.arc(sx, drawY - r * 0.1, r * 0.55, Math.PI, 0);
        ctx.lineTo(sx + r * 0.55, drawY + r * 0.6);
        ctx.lineTo(sx - r * 0.55, drawY + r * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = c.color;
        ctx.fillRect(sx - r * 0.2, drawY - r * 0.7, r * 0.4, r * 0.35);

        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(sx - r * 0.3, drawY - r * 0.75, r * 0.6, r * 0.1);

        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(sx, drawY - r * 0.75, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        const sparklePhase = this.sparkleTimer % 1.5;
        if (sparklePhase < 0.4) {
            const alpha = sparklePhase < 0.2 ? sparklePhase / 0.2 : (0.4 - sparklePhase) / 0.2;
            const sz = 2 + alpha * 2;
            ctx.fillStyle = `rgba(255,255,220,${alpha * 0.7})`;
            ctx.beginPath();
            ctx.moveTo(sx + r * 0.3, drawY - r * 0.4 - sz);
            ctx.lineTo(sx + r * 0.3 + sz * 0.3, drawY - r * 0.4);
            ctx.lineTo(sx + r * 0.3, drawY - r * 0.4 + sz);
            ctx.lineTo(sx + r * 0.3 - sz * 0.3, drawY - r * 0.4);
            ctx.closePath();
            ctx.fill();
        }
    }
}

export function tryCreatePotionDrop(x, y) {
    if (Math.random() > DROP_CHANCE) return null;
    return spawnRandomPotion(x, y);
}

export function spawnRandomPotion(x, y) {
    const roll = Math.random() * TOTAL_WEIGHT;
    let type;
    if (roll < MINOR_WEIGHT) type = 'minor';
    else if (roll < MINOR_WEIGHT + MODERATE_WEIGHT) type = 'moderate';
    else type = 'full';
    return new HealingPotion(x, y, type);
}
