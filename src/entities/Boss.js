import { BOSS, COLORS, BOSS_TYPES } from '../config/GameConfig.js';

const KNOCKBACK_RESISTANCE = 0.92;
const FLASH_DURATION = 0.12;

export class Boss {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.radius = config.collisionRadius;
        this.visualSize = config.visualSize;
        this.name = config.name;
        this.dead = false;
        this.flashTimer = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.isBoss = true;
        this.animTimer = Math.random() * 10;
        this.bossType = config.bossType || BOSS_TYPES[0];
    }

    update(dt, playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        this.x += this.knockbackX * dt;
        this.y += this.knockbackY * dt;
        this.knockbackX *= KNOCKBACK_RESISTANCE;
        this.knockbackY *= KNOCKBACK_RESISTANCE;

        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        this.animTimer += dt;
    }

    takeDamage(amount, knockbackX, knockbackY) {
        this.hp -= amount;
        this.flashTimer = FLASH_DURATION;
        if (knockbackX !== undefined) {
            this.knockbackX += knockbackX;
            this.knockbackY += knockbackY;
        }
        if (this.hp <= 0) {
            this.dead = true;
        }
    }

    draw(ctx, sx, sy) {
        const half = this.visualSize / 2;
        const flash = this.flashTimer > 0;
        const t = this.animTimer;
        const bt = this.bossType;
        const breathe = Math.sin(t * 2) * 3;
        const auraPulse = Math.sin(t * 3) * 0.3 + 0.7;
        const armSwing = Math.sin(t * 4) * 6;
        const headBob = Math.sin(t * 2.5) * 3;
        const legPhase = Math.sin(t * 3) * 5;
        const visorGlow = 0.5 + Math.sin(t * 5) * 0.5;

        ctx.save();
        ctx.translate(sx, sy + breathe);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, half * 0.8, half * 0.7, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // ====== TYPE-SPECIFIC AURA ======
        if (bt.isEthereal) {
            // Wraith — soul flames rising
            for (let i = 0; i < 5; i++) {
                const fa = (i / 5) * Math.PI * 2 + t * 2;
                const fx = Math.cos(fa) * half * 0.5;
                const fy = Math.sin(fa) * half * 0.3 - half * 0.1;
                const fSize = 8 + Math.sin(t * 4 + i) * 3;
                const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize);
                fGrad.addColorStop(0, `rgba(${bt.auraColor}, 0.4)`);
                fGrad.addColorStop(1, `rgba(${bt.auraColor}, 0)`);
                ctx.fillStyle = fGrad;
                ctx.beginPath();
                ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Aura rings for non-wraith types
            for (let i = 3; i >= 1; i--) {
                ctx.strokeStyle = `rgba(${bt.auraColor}, ${0.08 * auraPulse * i})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, half * (0.8 + i * 0.25) + Math.sin(t * 2 + i) * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            const auraGrad = ctx.createRadialGradient(0, 0, half * 0.3, 0, 0, half * 1.3);
            auraGrad.addColorStop(0, `rgba(${bt.auraColor}, ${0.12 * auraPulse})`);
            auraGrad.addColorStop(1, `rgba(${bt.auraColor}, 0)`);
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, half * 1.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        if (bt.isEthereal) {
            const floatY = Math.sin(t * 2) * 8;
            ctx.translate(0, floatY);
        }

        // ====== LEGS ======
        if (!bt.isEthereal) {
            ctx.fillStyle = flash ? '#fff' : bt.bodyColor1;
            ctx.beginPath();
            ctx.roundRect(-20 + legPhase, half * 0.3, 16, 35, 6);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(4 - legPhase, half * 0.3, 16, 35, 6);
            ctx.fill();

            // Armored boots
            ctx.fillStyle = flash ? '#ddd' : bt.bodyColor2;
            ctx.beginPath();
            ctx.roundRect(-22 + legPhase, half * 0.3 + 28, 20, 12, [3, 3, 6, 6]);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(2 - legPhase, half * 0.3 + 28, 20, 12, [3, 3, 6, 6]);
            ctx.fill();
        } else {
            // Wraith — trailing wispy tail
            const tailWave = Math.sin(t * 4) * 8;
            ctx.fillStyle = flash ? '#fff' : bt.bodyColor3;
            ctx.beginPath();
            ctx.moveTo(-half * 0.3, 0);
            ctx.quadraticCurveTo(-half * 0.4 + tailWave, half * 0.4, -half * 0.2, half * 0.8);
            ctx.quadraticCurveTo(0, half * 0.9, half * 0.2, half * 0.8);
            ctx.quadraticCurveTo(half * 0.4 - tailWave, half * 0.4, half * 0.3, 0);
            ctx.closePath();
            ctx.fill();

            // Wispy trail tendrils
            for (let i = 0; i < 3; i++) {
                const tx = -half * 0.2 + i * half * 0.2;
                const ty = half * 0.5 + Math.sin(t * 3 + i) * 10;
                ctx.strokeStyle = flash ? '#ddd' : `rgba(${bt.auraColor}, 0.3)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + Math.sin(t * 4 + i) * 8, ty + 15, tx + Math.sin(t * 3 + i) * 5, ty + 30);
                ctx.stroke();
            }
        }

        // ====== BODY ======
        const bodyGrad = ctx.createLinearGradient(-half * 0.6, -half * 0.3, half * 0.6, half * 0.4);
        bodyGrad.addColorStop(0, flash ? '#fff' : bt.bodyColor2);
        bodyGrad.addColorStop(0.5, flash ? '#eee' : bt.bodyColor1);
        bodyGrad.addColorStop(1, flash ? '#ddd' : bt.bodyColor3);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-half * 0.55, -half * 0.3, half * 1.1, half * 0.65, 12);
        ctx.fill();

        // Body details per type
        if (bt.hasBarkPlates) {
            // Bark titan — wood grain lines
            ctx.strokeStyle = flash ? '#ccc' : '#4a2508';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const ly = -half * 0.2 + i * 15;
                ctx.beginPath();
                ctx.moveTo(-half * 0.5, ly);
                ctx.quadraticCurveTo(0, ly + Math.sin(t + i) * 3, half * 0.5, ly);
                ctx.stroke();
            }
            // Green moss patches
            ctx.fillStyle = flash ? '#ddd' : '#27ae60';
            ctx.beginPath();
            ctx.ellipse(-half * 0.3, half * 0.05, 8, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(half * 0.25, -half * 0.1, 6, 4, -0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (bt.hasSporePuffs) {
            // Spore giant — spotted body
            ctx.fillStyle = flash ? '#ddd' : '#82e0aa';
            const spotCount = 6;
            for (let i = 0; i < spotCount; i++) {
                const sa = (i / spotCount) * Math.PI * 2 + t * 0.5;
                const sr = half * 0.25;
                ctx.beginPath();
                ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr * 0.6, 4 + Math.sin(t * 2 + i) * 1, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Default armor plates
            ctx.strokeStyle = flash ? '#ccc' : bt.accentColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-half * 0.55, -half * 0.1 + i * 18);
                ctx.lineTo(half * 0.55, -half * 0.1 + i * 18);
                ctx.stroke();
            }
        }

        // ====== SHOULDER PAULDRONS ======
        ctx.fillStyle = flash ? '#fff' : bt.bodyColor2;
        ctx.beginPath();
        ctx.ellipse(-half * 0.55, -half * 0.2, 20, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(half * 0.55, -half * 0.2, 20, 14, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder spikes
        ctx.fillStyle = flash ? '#eee' : bt.accentColor;
        for (const side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                const angle = side * (0.6 + i * 0.3);
                const spx = Math.cos(angle) * half * 0.55 + side * 15;
                const spy = Math.sin(angle) * 10 - half * 0.2;
                ctx.beginPath();
                ctx.moveTo(spx, spy);
                ctx.lineTo(spx + side * 8, spy - 10);
                ctx.lineTo(spx + side * 4, spy + 2);
                ctx.fill();
            }
        }

        // ====== ARMS with swing ======
        ctx.fillStyle = flash ? '#fff' : bt.bodyColor1;

        // Left arm
        ctx.save();
        ctx.translate(-half * 0.65, -half * 0.15);
        ctx.rotate(armSwing * Math.PI / 180);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 40, 6);
        ctx.fill();

        // Gauntlet
        ctx.fillStyle = flash ? '#ddd' : bt.bodyColor3;
        ctx.beginPath();
        ctx.roundRect(-9, 34, 18, 12, 4);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(half * 0.65, -half * 0.15);
        ctx.rotate(-armSwing * Math.PI / 180);
        ctx.fillStyle = flash ? '#fff' : bt.bodyColor1;
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 40, 6);
        ctx.fill();

        ctx.fillStyle = flash ? '#ddd' : bt.bodyColor3;
        ctx.beginPath();
        ctx.roundRect(-9, 34, 18, 12, 4);
        ctx.fill();
        ctx.restore();

        // ====== NECK ======
        ctx.fillStyle = flash ? '#fff' : bt.bodyColor3;
        ctx.fillRect(-8, -half * 0.35, 16, 12);

        // ====== HEAD ======
        ctx.save();
        ctx.translate(0, headBob);

        const headGrad = ctx.createLinearGradient(-half * 0.35, -half * 0.8, half * 0.35, -half * 0.35);
        headGrad.addColorStop(0, flash ? '#fff' : bt.bodyColor2);
        headGrad.addColorStop(1, flash ? '#eee' : bt.bodyColor3);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.roundRect(-half * 0.32, -half * 0.8, half * 0.64, half * 0.45, [16, 16, 6, 6]);
        ctx.fill();

        // ---- TYPE-SPECIFIC HEAD FEATURES ----
        if (bt.hasCrown) {
            const crownW = half * 0.7;
            const crownH = 28;
            const crownY = -half * 0.8 - crownH + 4;
            ctx.fillStyle = flash ? '#fff' : bt.accentColor;
            ctx.beginPath();
            ctx.moveTo(-crownW / 2, -half * 0.8 + 4);
            ctx.lineTo(-crownW / 2, crownY + 8);
            ctx.lineTo(-crownW / 4, crownY + 16);
            ctx.lineTo(0, crownY);
            ctx.lineTo(crownW / 4, crownY + 16);
            ctx.lineTo(crownW / 2, crownY + 8);
            ctx.lineTo(crownW / 2, -half * 0.8 + 4);
            ctx.fill();

            // Crown jewels
            ctx.fillStyle = flash ? '#ddd' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(0, crownY + 6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = flash ? '#ddd' : '#2ecc71';
            ctx.beginPath();
            ctx.arc(-crownW / 4, crownY + 12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(crownW / 4, crownY + 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (bt.hasHorns) {
            ctx.fillStyle = flash ? '#fff' : bt.bodyColor1;
            ctx.beginPath();
            ctx.moveTo(-half * 0.28, -half * 0.65);
            ctx.quadraticCurveTo(-half * 0.5, -half * 1.1, -half * 0.35, -half * 1.15);
            ctx.quadraticCurveTo(-half * 0.3, -half * 0.9, -half * 0.2, -half * 0.65);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(half * 0.28, -half * 0.65);
            ctx.quadraticCurveTo(half * 0.5, -half * 1.1, half * 0.35, -half * 1.15);
            ctx.quadraticCurveTo(half * 0.3, -half * 0.9, half * 0.2, -half * 0.65);
            ctx.fill();
        }

        if (bt.hasVines) {
            // Bark titan — vine tendrils wrapping
            ctx.strokeStyle = flash ? '#ddd' : '#27ae60';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const va = (i / 3) * Math.PI + Math.PI * 0.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(va) * half * 0.25, -half * 0.65);
                ctx.quadraticCurveTo(
                    Math.cos(va) * half * 0.4, -half * 0.5 + Math.sin(t * 2 + i) * 5,
                    Math.cos(va) * half * 0.35, -half * 0.35
                );
                ctx.stroke();
            }
        }

        if (bt.hasSoulFlame) {
            // Wraith — soul flame above head
            const flamePulse = Math.sin(t * 6) * 0.3 + 0.7;
            for (let i = 0; i < 3; i++) {
                const fy = -half * 0.85 - i * 8;
                const fSize = 6 - i * 1.5;
                const fGrad = ctx.createRadialGradient(0, fy, 0, 0, fy, fSize);
                fGrad.addColorStop(0, `rgba(${bt.auraColor}, ${0.5 * flamePulse})`);
                fGrad.addColorStop(1, `rgba(${bt.auraColor}, 0)`);
                ctx.fillStyle = fGrad;
                ctx.beginPath();
                ctx.arc(0, fy, fSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (bt.hasSporePuffs) {
            // Spore giant — puffy cap on head
            ctx.fillStyle = flash ? '#fff' : '#27ae60';
            ctx.beginPath();
            ctx.ellipse(0, -half * 0.75, half * 0.45, half * 0.2, 0, Math.PI, Math.PI * 2);
            ctx.fill();

            // Spore puff spots
            ctx.fillStyle = flash ? '#ddd' : '#82e0aa';
            for (let i = 0; i < 5; i++) {
                const pa = (i / 5) * Math.PI + Math.PI;
                const pr = half * 0.3;
                ctx.beginPath();
                ctx.arc(Math.cos(pa) * pr, -half * 0.75 + Math.sin(pa) * half * 0.12, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ---- VISOR (for helmet types) ----
        if (bt.headShape === 'helmet' || bt.headShape === 'skull') {
            ctx.fillStyle = flash ? '#eee' : '#1a1a2e';
            ctx.beginPath();
            ctx.roundRect(-half * 0.25, -half * 0.68, half * 0.5, half * 0.15, 4);
            ctx.fill();
        }

        if (bt.headShape === 'flat') {
            // Bark titan — flat face with eye slits
            ctx.fillStyle = flash ? '#eee' : '#1a1a2e';
            ctx.beginPath();
            ctx.roundRect(-half * 0.2, -half * 0.65, half * 0.15, half * 0.08, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(half * 0.05, -half * 0.65, half * 0.15, half * 0.08, 2);
            ctx.fill();
        }

        if (bt.headShape === 'dome') {
            // Spore giant — dome head
            ctx.fillStyle = flash ? '#fff' : '#196f3d';
            ctx.beginPath();
            ctx.ellipse(0, -half * 0.75, half * 0.35, half * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ====== EYES (type-colored, pulsing) ======
        ctx.fillStyle = bt.eyeColor;
        ctx.shadowColor = bt.eyeColor;
        ctx.shadowBlur = 10 + visorGlow * 5;

        const eyeY = bt.headShape === 'flat' ? -half * 0.63 : -half * 0.62;
        const eyeSpacing = bt.headShape === 'dome' ? half * 0.2 : 14;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eye inner glow
        ctx.fillStyle = '#f5b7b1';
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth / grille
        ctx.strokeStyle = flash ? '#ccc' : '#1a1a2e';
        ctx.lineWidth = 2;
        const mouthY = -half * 0.42;
        if (bt.headShape === 'helmet') {
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 6, mouthY);
                ctx.lineTo(i * 6, mouthY + 6);
                ctx.stroke();
            }
        } else if (bt.headShape === 'skull') {
            // Skull jaw
            ctx.beginPath();
            ctx.moveTo(-half * 0.15, mouthY);
            ctx.lineTo(half * 0.15, mouthY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-half * 0.12, mouthY + 4);
            ctx.lineTo(half * 0.12, mouthY + 4);
            ctx.stroke();
        }

        ctx.restore(); // headBob
        ctx.restore(); // ethereal float
        ctx.restore(); // breathe translate
    }

    drawBossBar(ctx, bossName) {
        const barW = BOSS.HP_BAR_WIDTH;
        const barH = BOSS.HP_BAR_HEIGHT;
        const barX = (ctx.canvas.width - barW) / 2;
        const barY = BOSS.HP_BAR_Y;
        const pct = Math.max(0, this.hp / this.maxHp);
        const bt = this.bossType;

        // Outer glow
        ctx.shadowColor = bt.accentColor;
        ctx.shadowBlur = 8;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(barX - 4, barY - 4, barW + 8, barH + 8, 6);
        ctx.fill();

        // Border
        ctx.strokeStyle = bt.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 5);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Inner background
        ctx.fillStyle = COLORS.BOSS_HP_BAR_BG;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        // HP fill with type color gradient
        const hpGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        hpGrad.addColorStop(0, bt.bodyColor2);
        hpGrad.addColorStop(1, bt.bodyColor1);
        ctx.fillStyle = hpGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * pct, barH, 4);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * pct, barH / 2, [4, 4, 0, 0]);
        ctx.fill();

        // Boss name
        ctx.fillStyle = bt.accentColor;
        ctx.font = 'bold 16px Rajdhani';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(bossName, ctx.canvas.width / 2, barY - 8);
        ctx.shadowBlur = 0;

        // HP text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, ctx.canvas.width / 2, barY + barH - 5);
    }
}
