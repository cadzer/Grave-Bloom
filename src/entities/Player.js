import { clamp } from '../core/MathUtils.js';
import { PLAYER, UI, GAME, XP_GEMS, CHARACTERS } from '../config/GameConfig.js';

const SIZE = GAME.SPRITE_SIZE;

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1,3),16),
        g: parseInt(hex.slice(3,5),16),
        b: parseInt(hex.slice(5,7),16)
    };
}

export class Player {
    constructor(x, y, charId) {
        const char = CHARACTERS[charId] || CHARACTERS.bloomkeeper;
        this.charId = char.id;
        this.charPalette = char.palette;
        this.x = x;
        this.y = y;
        this.maxHp = PLAYER.MAX_HP + char.hpBonus;
        this.hp = this.maxHp;
        this.speed = PLAYER.SPEED + char.speedBonus;
        this.radius = PLAYER.COLLISION_RADIUS;
        this.spriteSize = SIZE;
        this.invincibleTimer = 0;
        this.facingX = 1;
        this.facingY = 0;
        this.magnetRadius = XP_GEMS.MAGNET_RADIUS + char.magnetBonus;
        this.pickupRadius = PLAYER.PICKUP_RADIUS;
        this.walkCycle = 0;
        this.isMoving = false;
        this.breathe = 0;
        this.damageMulti = 1 + char.damageBonus;
    }

    update(dt, input) {
        const dir = input.getMovementDirection();
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

        this.isMoving = len > 0;

        if (this.isMoving) {
            this.facingX = dir.x / len;
            this.facingY = dir.y / len;
            this.walkCycle += dt * 10;
        }

        this.x += dir.x * this.speed * dt;
        this.y += dir.y * this.speed * dt;

        this.breathe += dt * 2;

        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return false;
        this.hp = clamp(this.hp - amount, 0, this.maxHp);
        this.invincibleTimer = PLAYER.INVINCIBLE_DURATION;
        return true;
    }

    isAlive() {
        return this.hp > 0;
    }

    draw(ctx, cx, cy) {
        ctx.save();

        if (this.invincibleTimer > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(this.invincibleTimer * 20) * 0.3;
        }

        const legSwing = this.isMoving ? Math.sin(this.walkCycle) * 10 : 0;
        const armSwing = this.isMoving ? Math.sin(this.walkCycle) * 12 : 0;
        const bodyBob = this.isMoving ? Math.abs(Math.sin(this.walkCycle)) * 2.5 : Math.sin(this.breathe) * 0.8;
        const headBob = this.isMoving ? Math.abs(Math.sin(this.walkCycle + 0.3)) * 1.5 : 0;
        const flip = this.facingX < 0 ? -1 : 1;
        const capeWave = this.isMoving ? Math.sin(this.walkCycle * 0.7) * 4 : Math.sin(this.breathe * 0.6) * 2;

        ctx.save();
        ctx.translate(cx, cy + bodyBob);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 46, 26, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // === CAPE (back layer, flows behind) ===
        const p = this.charPalette;
        const capeGrad = ctx.createLinearGradient(-10, -20, -10, 45);
        capeGrad.addColorStop(0, p.cape1);
        capeGrad.addColorStop(0.5, p.cape2);
        capeGrad.addColorStop(1, p.cape3);
        ctx.fillStyle = capeGrad;
        ctx.beginPath();
        ctx.moveTo(-16, -12);
        ctx.quadraticCurveTo(-22 + capeWave, 10, -26 + capeWave * 1.5, 42);
        ctx.lineTo(-10, 38);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(16, -12);
        ctx.quadraticCurveTo(22 - capeWave, 10, 26 - capeWave * 1.5, 42);
        ctx.lineTo(10, 38);
        ctx.closePath();
        ctx.fill();
        // Cape highlight
        ctx.strokeStyle = 'rgba(139,58,98,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-16, -8);
        ctx.quadraticCurveTo(-20 + capeWave, 12, -24 + capeWave * 1.5, 40);
        ctx.stroke();

        // === LEGS ===
        // Left leg
        const legL = ctx.createLinearGradient(-10, 16, -10, 44);
        legL.addColorStop(0, '#1a1a24');
        legL.addColorStop(1, '#12121a');
        ctx.fillStyle = legL;
        ctx.beginPath();
        ctx.roundRect(-11 + legSwing * 0.25, 16, 9, 28, 3);
        ctx.fill();
        // Right leg
        const legR = ctx.createLinearGradient(2, 16, 2, 44);
        legR.addColorStop(0, '#1a1a24');
        legR.addColorStop(1, '#12121a');
        ctx.fillStyle = legR;
        ctx.beginPath();
        ctx.roundRect(2 - legSwing * 0.25, 16, 9, 28, 3);
        ctx.fill();

        // Leg wraps
        ctx.fillStyle = '#2a2230';
        ctx.fillRect(-11 + legSwing * 0.25, 28, 9, 3);
        ctx.fillRect(2 - legSwing * 0.25, 28, 9, 3);

        // Boots
        const bootGrad = ctx.createLinearGradient(0, 40, 0, 48);
        bootGrad.addColorStop(0, '#1a1218');
        bootGrad.addColorStop(1, '#0e0a10');
        ctx.fillStyle = bootGrad;
        ctx.beginPath();
        ctx.roundRect(-13 + legSwing * 0.25, 40, 13, 7, [2, 2, 3, 3]);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(0 - legSwing * 0.25, 40, 13, 7, [2, 2, 3, 3]);
        ctx.fill();
        // Boot highlight
        ctx.fillStyle = 'rgba(139,58,98,0.2)';
        ctx.fillRect(-13 + legSwing * 0.25, 40, 13, 2);
        ctx.fillRect(0 - legSwing * 0.25, 40, 13, 2);

        // === BODY (dark armor) ===
        const bodyGrad = ctx.createLinearGradient(-20, -18, 20, 20);
        bodyGrad.addColorStop(0, p.body1);
        bodyGrad.addColorStop(0.5, p.body2);
        bodyGrad.addColorStop(1, p.body3);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-20, -16, 40, 36, 5);
        ctx.fill();

        // Armor chest plate
        ctx.fillStyle = p.armor;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(14, -14);
        ctx.lineTo(12, 8);
        ctx.lineTo(-12, 8);
        ctx.closePath();
        ctx.fill();

        // Armor plate highlight
        ctx.fillStyle = 'rgba(184,217,78,0.08)';
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(0, -12);
        ctx.lineTo(-2, 6);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fill();

        // Armor center line
        ctx.strokeStyle = 'rgba(184,217,78,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 8);
        ctx.stroke();

        // Belt
        ctx.fillStyle = p.belt;
        ctx.fillRect(-20, 8, 40, 5);
        // Belt buckle (seed shape)
        ctx.fillStyle = p.buckle;
        ctx.beginPath();
        ctx.ellipse(0, 10.5, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.visor;
        ctx.beginPath();
        ctx.ellipse(0, 10.5, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vine detail on armor
        ctx.strokeStyle = 'rgba(124,154,110,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.quadraticCurveTo(-6, -2, -8, 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, -6);
        ctx.quadraticCurveTo(6, -2, 8, 6);
        ctx.stroke();

        // Shoulder pads
        const spGrad = ctx.createLinearGradient(0, -20, 0, -10);
        spGrad.addColorStop(0, '#2a2438');
        spGrad.addColorStop(1, '#1e1a28');
        ctx.fillStyle = spGrad;
        // Left
        ctx.beginPath();
        ctx.roundRect(-24, -18, 10, 8, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(184,217,78,0.1)';
        ctx.fillRect(-24, -18, 10, 2);
        // Right
        ctx.fillStyle = spGrad;
        ctx.beginPath();
        ctx.roundRect(14, -18, 10, 8, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(184,217,78,0.1)';
        ctx.fillRect(14, -18, 10, 2);

        // === LEFT ARM ===
        ctx.save();
        ctx.translate(-20, -8);
        ctx.rotate((-armSwing * Math.PI) / 180);
        // Sleeve
        ctx.fillStyle = '#1a1624';
        ctx.beginPath();
        ctx.roundRect(-5, 0, 9, 18, 3);
        ctx.fill();
        // Gauntlet
        ctx.fillStyle = '#22202e';
        ctx.beginPath();
        ctx.roundRect(-4, 14, 7, 8, 2);
        ctx.fill();
        // Hand
        ctx.fillStyle = '#8a7060';
        ctx.beginPath();
        ctx.arc(-1, 24, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === RIGHT ARM (holds staff) ===
        ctx.save();
        ctx.translate(20, -8);
        ctx.rotate((armSwing * Math.PI) / 180);
        ctx.fillStyle = '#1a1624';
        ctx.beginPath();
        ctx.roundRect(-4, 0, 9, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#22202e';
        ctx.beginPath();
        ctx.roundRect(-3, 14, 7, 8, 2);
        ctx.fill();
        ctx.fillStyle = '#8a7060';
        ctx.beginPath();
        ctx.arc(1, 24, 4, 0, Math.PI * 2);
        ctx.fill();

        // Staff
        const staffGrad = ctx.createLinearGradient(0, -28, 0, 30);
        staffGrad.addColorStop(0, '#3a2a20');
        staffGrad.addColorStop(0.5, '#2a1a12');
        staffGrad.addColorStop(1, '#1a1008');
        ctx.fillStyle = staffGrad;
        ctx.beginPath();
        ctx.roundRect(-2, -28, 4, 56, 2);
        ctx.fill();

        // Staff vine wrap
        ctx.strokeStyle = 'rgba(124,154,110,0.4)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const sy = -20 + i * 10;
            ctx.beginPath();
            ctx.moveTo(-3, sy);
            ctx.quadraticCurveTo(0, sy + 3, 3, sy);
            ctx.stroke();
        }

        // Seed orb at top
        const orbGlow = ctx.createRadialGradient(0, -30, 2, 0, -30, 14);
        orbGlow.addColorStop(0, 'rgba(184,217,78,0.6)');
        orbGlow.addColorStop(0.5, 'rgba(124,154,110,0.2)');
        orbGlow.addColorStop(1, 'rgba(124,154,110,0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(0, -30, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b8d94e';
        ctx.beginPath();
        ctx.arc(0, -30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4f080';
        ctx.beginPath();
        ctx.arc(-1, -32, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === HOOD ===
        const headY = -28 + headBob;

        // Hood outer
        const hoodGrad = ctx.createLinearGradient(0, headY - 24, 0, headY + 16);
        hoodGrad.addColorStop(0, p.hood);
        hoodGrad.addColorStop(0.5, p.body2);
        hoodGrad.addColorStop(1, p.body3);
        ctx.fillStyle = hoodGrad;
        ctx.beginPath();
        ctx.moveTo(-22, headY + 14);
        ctx.quadraticCurveTo(-26, headY - 4, -18, headY - 22);
        ctx.quadraticCurveTo(0, headY - 30, 18, headY - 22);
        ctx.quadraticCurveTo(26, headY - 4, 22, headY + 14);
        ctx.closePath();
        ctx.fill();

        // Hood inner shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(-18, headY + 10);
        ctx.quadraticCurveTo(-20, headY - 2, -14, headY - 16);
        ctx.quadraticCurveTo(0, headY - 22, 14, headY - 16);
        ctx.quadraticCurveTo(20, headY - 2, 18, headY + 10);
        ctx.closePath();
        ctx.fill();

        // Hood rim highlight
        ctx.strokeStyle = 'rgba(139,58,98,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-18, headY + 12);
        ctx.quadraticCurveTo(-22, headY - 2, -14, headY - 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(18, headY + 12);
        ctx.quadraticCurveTo(22, headY - 2, 14, headY - 18);
        ctx.stroke();

        // Face area (shadowed)
        ctx.fillStyle = '#c9a882';
        ctx.beginPath();
        ctx.ellipse(0, headY + 2, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Face shadow from hood
        const faceShadow = ctx.createLinearGradient(0, headY - 10, 0, headY + 8);
        faceShadow.addColorStop(0, 'rgba(0,0,0,0.4)');
        faceShadow.addColorStop(0.5, 'rgba(0,0,0,0.1)');
        faceShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = faceShadow;
        ctx.beginPath();
        ctx.ellipse(0, headY + 2, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing green, serious)
        const eyeOff = 6;
        // Eye sockets
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(-eyeOff, headY, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOff, headY, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye glow
        const vc = hexToRgb(p.visor);
        const eyeGlow = ctx.createRadialGradient(-eyeOff, headY, 1, -eyeOff, headY, 8);
        eyeGlow.addColorStop(0, `rgba(${vc.r},${vc.g},${vc.b},0.4)`);
        eyeGlow.addColorStop(1, `rgba(${vc.r},${vc.g},${vc.b},0)`);
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(-eyeOff, headY, 8, 0, Math.PI * 2);
        ctx.fill();
        const eyeGlow2 = ctx.createRadialGradient(eyeOff, headY, 1, eyeOff, headY, 8);
        eyeGlow2.addColorStop(0, `rgba(${vc.r},${vc.g},${vc.b},0.4)`);
        eyeGlow2.addColorStop(1, `rgba(${vc.r},${vc.g},${vc.b},0)`);
        ctx.fillStyle = eyeGlow2;
        ctx.beginPath();
        ctx.arc(eyeOff, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        const pupilX = flip * 1.5;
        ctx.fillStyle = p.buckle;
        ctx.beginPath();
        ctx.arc(-eyeOff + pupilX, headY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOff + pupilX, headY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye inner bright spot
        ctx.fillStyle = '#e0f8a0';
        ctx.beginPath();
        ctx.arc(-eyeOff + pupilX - 0.5, headY - 0.5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOff + pupilX - 0.5, headY - 0.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Nose hint
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.moveTo(-1, headY + 3);
        ctx.lineTo(1, headY + 3);
        ctx.lineTo(0, headY + 6);
        ctx.closePath();
        ctx.fill();

        // Mouth (subtle, serious)
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, headY + 9);
        ctx.lineTo(3, headY + 9);
        ctx.stroke();

        ctx.restore();
        ctx.restore();

        // Health bar (only when damaged)
        if (this.hp < this.maxHp) {
            this.drawHealthBar(ctx, cx, cy - SIZE / 2 - PLAYER.PLAYER_BAR_OFFSET_Y);
        }
    }

    drawHealthBar(ctx, x, y) {
        const w = PLAYER.PLAYER_BAR_WIDTH;
        const h = PLAYER.PLAYER_BAR_HEIGHT;
        const pct = this.hp / this.maxHp;
        const barX = x - w / 2;

        // Background with rounded corners
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(barX - 1, y - 1, w + 2, h + 2, 4);
        ctx.fill();

        // HP fill
        const color = pct > 0.5 ? UI.HP_COLOR_HIGH
            : pct > 0.25 ? UI.HP_COLOR_MED
            : UI.HP_COLOR_LOW;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(barX, y, w * pct, h, 3);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(barX, y, w * pct, h / 2, [3, 3, 0, 0]);
        ctx.fill();
    }
}
