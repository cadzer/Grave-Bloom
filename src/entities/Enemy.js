import { ENEMIES, COLORS, COINS, XP_GEMS } from '../config/GameConfig.js';

const KNOCKBACK_RESISTANCE = 0.85;
const FLASH_DURATION = 0.1;

export class Enemy {
    constructor(x, y, config, type) {
        this.x = x;
        this.y = y;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.color = config.color;
        this.eyeColor = config.eyeColor || '#000';
        this.radius = config.collisionRadius;
        this.dead = false;
        this.flashTimer = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.type = type || 'slime';
        this.coinValue = COINS.VALUE_PER_TYPE[type] || 1;
        this.animTimer = Math.random() * 10;
        this.healRadius = config.healRadius || 0;
        this.healAmount = config.healAmount || 0;
        this.aggroRange = config.aggroRange || 0;
        this.disguised = config.disguiseAs ? true : false;
        this.splitCount = config.splitCount || 0;
        this.shieldRadius = config.shieldRadius || 0;
        this.shieldAmount = config.shieldAmount || 0;
        this.shielded = false;
        this.healCooldown = 0;
    }

    update(dt, playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distSq = dx * dx + dy * dy;

        if (this.disguised && this.aggroRange > 0) {
            if (distSq < this.aggroRange * this.aggroRange) {
                this.disguised = false;
                this.speed = ENEMIES.mimic ? ENEMIES.mimic.speed : 100;
            }
        }

        if (!this.disguised) {
            const dist = Math.sqrt(distSq);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
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
        if (this.shielded) amount *= 0.5;
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
        ctx.save();
        ctx.translate(sx, sy);

        switch (this.type) {
            case 'spore': this.drawSlime(ctx); break;
            case 'wisp': this.drawBat(ctx); break;
            case 'barkfell': this.drawBrute(ctx); break;
            case 'rootcrawler': this.drawCrawler(ctx); break;
            case 'revenant': this.drawElite(ctx); break;
            case 'leech': this.drawLeech(ctx); break;
            case 'mimic': this.disguised ? this.drawMimicDisguise(ctx) : this.drawMimic(ctx); break;
            case 'hive': this.drawHive(ctx); break;
            case 'warden': this.drawWarden(ctx); break;
            default: this.drawSlime(ctx);
        }

        ctx.restore();

        if (this.hp < this.maxHp) {
            this.drawHealthBar(ctx, sx, sy - this.radius - 12);
        }
    }

    drawSlime(ctx) {
        const squash = 1 + Math.sin(this.animTimer * 3) * 0.1;
        const r = this.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.7, r * 0.8, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - wobbly blob
        const flash = this.flashTimer > 0;
        ctx.fillStyle = flash ? '#fff' : '#27ae60';
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            const wobble = 1 + Math.sin(a * 3 + this.animTimer * 4) * 0.08;
            const rx = r * 0.9 * wobble;
            const ry = r * 0.7 * squash * wobble;
            const px = Math.cos(a) * rx;
            const py = Math.sin(a) * ry - r * 0.1;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.fill();

        // Shading
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            const wobble = 1 + Math.sin(a * 3 + this.animTimer * 4) * 0.08;
            const rx = r * 0.9 * wobble;
            const ry = r * 0.7 * squash * wobble;
            const px = Math.cos(a) * rx;
            const py = Math.sin(a) * ry - r * 0.1;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-10, -r * 0.2, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(10, -r * 0.2, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-9, -r * 0.15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -r * 0.15, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-7, -r * 0.25, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(13, -r * 0.25, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBat(ctx) {
        const flapAngle = Math.sin(this.animTimer * 12) * 0.6;
        const r = this.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, r * 1.2, r * 0.6, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        const flash = this.flashTimer > 0;

        // Left wing
        ctx.save();
        ctx.translate(-8, -5);
        ctx.rotate(flapAngle);
        ctx.fillStyle = flash ? '#fff' : '#7d3c98';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-25, -15, -35, -5);
        ctx.quadraticCurveTo(-30, 5, -20, 10);
        ctx.quadraticCurveTo(-10, 8, 0, 3);
        ctx.fill();
        // Wing membrane lines
        ctx.strokeStyle = flash ? '#eee' : '#6c3483';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-18, -8, -30, -3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.quadraticCurveTo(-15, 3, -22, 8);
        ctx.stroke();
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.translate(8, -5);
        ctx.rotate(-flapAngle);
        ctx.fillStyle = flash ? '#fff' : '#7d3c98';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(25, -15, 35, -5);
        ctx.quadraticCurveTo(30, 5, 20, 10);
        ctx.quadraticCurveTo(10, 8, 0, 3);
        ctx.fill();
        ctx.strokeStyle = flash ? '#eee' : '#6c3483';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(18, -8, 30, -3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.quadraticCurveTo(15, 3, 22, 8);
        ctx.stroke();
        ctx.restore();

        // Body
        ctx.fillStyle = flash ? '#fff' : '#8e44ad';
        ctx.beginPath();
        ctx.ellipse(0, 2, r * 0.6, r * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = flash ? '#fff' : '#7d3c98';
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.lineTo(-14, -28);
        ctx.lineTo(-3, -15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.lineTo(14, -28);
        ctx.lineTo(3, -15);
        ctx.fill();

        // Eyes (red glowing)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(-6, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-6, -3, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -3, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fangs
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-4, 6);
        ctx.lineTo(-2, 14);
        ctx.lineTo(0, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(2, 14);
        ctx.lineTo(4, 6);
        ctx.fill();
    }

    drawBrute(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const t = this.animTimer;

        // Animations
        const breathe = Math.sin(t * 2.5) * 3;
        const bodySquash = 1 + Math.sin(t * 2.5) * 0.02;
        const bodyStretch = 1 - Math.sin(t * 2.5) * 0.02;
        const armSwing = Math.sin(t * 4) * 5;
        const headBob = Math.sin(t * 3) * 3;
        const weightShift = Math.sin(t * 1.5) * 3;
        const fistPulse = Math.sin(t * 5) * 2;
        const mouthOpen = Math.max(0, Math.sin(t * 2.5 + 1.2)) * 4;
        const shoulderBob = Math.sin(t * 2.5) * 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(weightShift * 0.5, r * 0.8, r * 0.9, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(weightShift, 0);

        // Legs with stride animation
        const legStride = Math.sin(t * 4) * 3;
        ctx.fillStyle = flash ? '#fff' : '#922b21';
        ctx.beginPath();
        ctx.roundRect(-18 + legStride, r * 0.3, 14, 28, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(4 - legStride, r * 0.3, 14, 28, 5);
        ctx.fill();

        // Boots with tread detail
        ctx.fillStyle = flash ? '#ddd' : '#512e2e';
        ctx.beginPath();
        ctx.roundRect(-20 + legStride, r * 0.3 + 22, 18, 12, [3, 3, 5, 5]);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(2 - legStride, r * 0.3 + 22, 18, 12, [3, 3, 5, 5]);
        ctx.fill();

        // Boot soles — thicker
        ctx.fillStyle = flash ? '#ccc' : '#3d1f1f';
        ctx.beginPath();
        ctx.roundRect(-22 + legStride, r * 0.3 + 30, 22, 4, [0, 0, 4, 4]);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(0 - legStride, r * 0.3 + 30, 22, 4, [0, 0, 4, 4]);
        ctx.fill();

        // Body (massive torso) with breathing
        ctx.save();
        ctx.translate(0, r * 0.05);
        ctx.scale(bodySquash, bodyStretch);
        ctx.translate(0, -r * 0.05);

        const bodyGrad = ctx.createLinearGradient(-r, -r * 0.4, r, r * 0.5);
        bodyGrad.addColorStop(0, flash ? '#fff' : '#c0392b');
        bodyGrad.addColorStop(0.5, flash ? '#eee' : '#a93226');
        bodyGrad.addColorStop(1, flash ? '#ddd' : '#922b21');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-r * 0.8, -r * 0.45, r * 1.6, r * 0.95, 12);
        ctx.fill();

        // Chest muscles with depth
        ctx.strokeStyle = flash ? '#ddd' : '#7b241c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-12, -r * 0.08, 16, -0.2, Math.PI + 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(12, -r * 0.08, 16, -0.2, Math.PI + 0.2);
        ctx.stroke();

        // Center chest line
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.35);
        ctx.lineTo(0, r * 0.15);
        ctx.stroke();

        // Belt / waist
        ctx.fillStyle = flash ? '#ddd' : '#512e2e';
        ctx.beginPath();
        ctx.roundRect(-r * 0.65, r * 0.15, r * 1.3, 10, 3);
        ctx.fill();

        // Belt buckle
        ctx.fillStyle = flash ? '#eee' : '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(-6, r * 0.15, 12, 10, 2);
        ctx.fill();

        ctx.restore();

        // Left arm with swing
        ctx.save();
        ctx.translate(-r * 0.8, -r * 0.15);
        ctx.rotate((-5 + armSwing) * Math.PI / 180);

        // Upper arm
        ctx.fillStyle = flash ? '#fff' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 30, 6);
        ctx.fill();

        // Forearm
        ctx.fillStyle = flash ? '#eee' : '#a93226';
        ctx.beginPath();
        ctx.roundRect(-6, 28, 12, 22, 5);
        ctx.fill();

        // Fist
        ctx.fillStyle = flash ? '#ddd' : '#922b21';
        ctx.beginPath();
        ctx.arc(0, 52 + fistPulse, 10, 0, Math.PI * 2);
        ctx.fill();

        // Knuckle highlights
        ctx.fillStyle = flash ? '#ccc' : '#7b241c';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * 5, 49 + fistPulse, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Right arm with swing (opposite phase)
        ctx.save();
        ctx.translate(r * 0.8, -r * 0.15);
        ctx.rotate((5 - armSwing) * Math.PI / 180);

        ctx.fillStyle = flash ? '#fff' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 30, 6);
        ctx.fill();

        ctx.fillStyle = flash ? '#eee' : '#a93226';
        ctx.beginPath();
        ctx.roundRect(-6, 28, 12, 22, 5);
        ctx.fill();

        ctx.fillStyle = flash ? '#ddd' : '#922b21';
        ctx.beginPath();
        ctx.arc(0, 52 - fistPulse, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flash ? '#ccc' : '#7b241c';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * 5, 49 - fistPulse, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Neck
        ctx.fillStyle = flash ? '#fff' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-10, -r * 0.55 + headBob, 20, 14, 4);
        ctx.fill();

        // Head with bob
        ctx.save();
        ctx.translate(0, headBob);

        const headGrad = ctx.createLinearGradient(-r * 0.45, -r * 0.7, r * 0.45, -r * 0.4);
        headGrad.addColorStop(0, flash ? '#fff' : '#c0392b');
        headGrad.addColorStop(1, flash ? '#eee' : '#922b21');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.6, r * 0.45, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brow ridge
        ctx.fillStyle = flash ? '#ddd' : '#a93226';
        ctx.beginPath();
        ctx.roundRect(-r * 0.4, -r * 0.78, r * 0.8, 10, 4);
        ctx.fill();

        // Eyes with blink
        const blinkCycle = t % 4;
        const eyeOpen = (blinkCycle > 3.8) ? 0.2 : 1;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.ellipse(-12, -r * 0.6, 7, 6 * eyeOpen, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(12, -r * 0.6, 7, 6 * eyeOpen, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils — follow movement direction slightly
        if (eyeOpen > 0.5) {
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(-11, -r * 0.58, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(13, -r * 0.58, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Angry eyebrows with animation
        const browFurrow = Math.sin(t * 3) * 2;
        ctx.strokeStyle = '#512e2e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-20, -r * 0.7 + browFurrow);
        ctx.lineTo(-6, -r * 0.68 - browFurrow);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, -r * 0.7 + browFurrow);
        ctx.lineTo(6, -r * 0.68 - browFurrow);
        ctx.stroke();

        // Mouth — animated open/close
        ctx.strokeStyle = '#512e2e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12, -r * 0.42);
        ctx.quadraticCurveTo(0, -r * 0.42 + mouthOpen + 4, 12, -r * 0.42);
        ctx.stroke();

        // Teeth when mouth open
        if (mouthOpen > 2) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-8, -r * 0.42);
            ctx.lineTo(-6, -r * 0.42 + mouthOpen * 0.6);
            ctx.lineTo(-4, -r * 0.42);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(4, -r * 0.42);
            ctx.lineTo(6, -r * 0.42 + mouthOpen * 0.6);
            ctx.lineTo(8, -r * 0.42);
            ctx.fill();
        }

        // Nose
        ctx.fillStyle = flash ? '#ddd' : '#b03a25';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.5, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // headBob
        ctx.restore(); // weightShift
    }

    drawCrawler(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const t = this.animTimer;
        const bodyPulse = Math.sin(t * 3) * 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.65, r * 0.8, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // ====== 6 WRITHING ROOT TENDRILS ======
        const tendrilCount = 6;
        for (let i = 0; i < tendrilCount; i++) {
            const baseAngle = (i / tendrilCount) * Math.PI * 2 - Math.PI / 2;
            const wave = Math.sin(t * 4 + i * 1.2) * 0.25;
            const len = r * 0.95 + Math.sin(t * 2 + i) * 4;

            ctx.save();
            ctx.rotate(baseAngle + wave);

            // Main tendril
            const grad = ctx.createLinearGradient(0, 0, len, 0);
            grad.addColorStop(0, flash ? '#fff' : '#3d2b1f');
            grad.addColorStop(0.5, flash ? '#eee' : '#5a3a22');
            grad.addColorStop(1, flash ? '#ddd' : '#2a1a0f');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 4 + Math.sin(i * 0.7) * 1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(r * 0.25, 0);
            const seg1 = len * 0.4;
            const seg2 = len * 0.75;
            ctx.quadraticCurveTo(seg1, Math.sin(t * 5 + i * 2) * 6, seg2, Math.sin(t * 4 + i) * 5);
            ctx.quadraticCurveTo(len * 0.9, Math.sin(t * 3 + i * 3) * 4, len, Math.sin(t * 6 + i) * 3);
            ctx.stroke();

            // Thorn nodes along tendril
            for (let j = 0; j < 3; j++) {
                const tx = r * 0.3 + j * (len * 0.25);
                const ty = Math.sin(t * 4 + i + j) * (3 + j);
                ctx.fillStyle = flash ? '#ddd' : '#7a4a2e';
                ctx.beginPath();
                ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Tendril tip — glowing orange thorn
            const tipX = len;
            const tipY = Math.sin(t * 6 + i) * 3;
            ctx.fillStyle = flash ? '#fff' : '#e67e22';
            ctx.beginPath();
            ctx.moveTo(tipX + 4, tipY);
            ctx.lineTo(tipX - 2, tipY - 4);
            ctx.lineTo(tipX - 2, tipY + 4);
            ctx.closePath();
            ctx.fill();

            // Tip glow
            const tipGlow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 6);
            tipGlow.addColorStop(0, 'rgba(230, 126, 34, 0.6)');
            tipGlow.addColorStop(1, 'rgba(230, 126, 34, 0)');
            ctx.fillStyle = tipGlow;
            ctx.beginPath();
            ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // ====== BODY — dark segmented root ball ======
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.15, 0, 0, 0, r * 0.55);
        bodyGrad.addColorStop(0, flash ? '#fff' : '#5a3a22');
        bodyGrad.addColorStop(0.6, flash ? '#eee' : '#3d2b1f');
        bodyGrad.addColorStop(1, flash ? '#ddd' : '#1a0f08');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.45 + bodyPulse * 0.3, r * 0.4 + bodyPulse * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bark texture lines on body
        ctx.strokeStyle = flash ? '#ccc' : '#2a1a0f';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const ba = (i / 5) * Math.PI * 2 + t * 0.3;
            const br1 = r * 0.15;
            const br2 = r * 0.38;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ba) * br1, Math.sin(ba) * br1);
            ctx.lineTo(Math.cos(ba + 0.1) * br2, Math.sin(ba + 0.1) * br2);
            ctx.stroke();
        }

        // ====== GLOWING CRACKS ======
        const crackGlow = 0.5 + Math.sin(t * 4) * 0.3;
        ctx.strokeStyle = `rgba(230, 126, 34, ${crackGlow})`;
        ctx.lineWidth = 2;


        // Crack 1
        ctx.beginPath();
        ctx.moveTo(-r * 0.1, -r * 0.2);
        ctx.lineTo(-r * 0.05, -r * 0.05);
        ctx.lineTo(-r * 0.15, r * 0.1);
        ctx.stroke();

        // Crack 2
        ctx.beginPath();
        ctx.moveTo(r * 0.1, -r * 0.15);
        ctx.lineTo(r * 0.12, r * 0.05);
        ctx.lineTo(r * 0.05, r * 0.2);
        ctx.stroke();

        // Crack 3
        ctx.beginPath();
        ctx.moveTo(-r * 0.02, -r * 0.3);
        ctx.lineTo(0, -r * 0.15);
        ctx.lineTo(r * 0.08, r * 0.02);
        ctx.stroke();

        // ====== HEAD — forward-facing mandibles ======
        const headTilt = Math.sin(t * 3) * 0.08;
        ctx.save();
        ctx.rotate(headTilt);

        // Head dome
        const headGrad = ctx.createRadialGradient(0, -r * 0.5, 0, 0, -r * 0.5, r * 0.3);
        headGrad.addColorStop(0, flash ? '#fff' : '#6b4226');
        headGrad.addColorStop(1, flash ? '#eee' : '#3d2b1f');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.48, r * 0.3, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes — multiple small orange glowing eyes
        const eyeGlow = 0.7 + Math.sin(t * 5) * 0.3;
        ctx.fillStyle = `rgba(230, 126, 34, ${eyeGlow})`;
        const eyePositions = [
            [-8, -r * 0.52, 2.5], [8, -r * 0.52, 2.5],
            [-14, -r * 0.46, 2], [14, -r * 0.46, 2],
            [0, -r * 0.56, 1.8]
        ];
        for (const [ex, ey, es] of eyePositions) {
            ctx.beginPath();
            ctx.arc(ex, ey, es, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mandibles — two curved pincers
        const mandibleOpen = Math.sin(t * 6) * 0.15 + 0.15;
        ctx.strokeStyle = flash ? '#fff' : '#5a3a22';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Left mandible
        ctx.beginPath();
        ctx.moveTo(-4, -r * 0.35);
        ctx.quadraticCurveTo(-r * 0.25, -r * 0.25 - mandibleOpen * 10, -r * 0.18, -r * 0.12);
        ctx.stroke();

        // Right mandible
        ctx.beginPath();
        ctx.moveTo(4, -r * 0.35);
        ctx.quadraticCurveTo(r * 0.25, -r * 0.25 - mandibleOpen * 10, r * 0.18, -r * 0.12);
        ctx.stroke();

        // Mandible tips — orange thorns
        ctx.fillStyle = flash ? '#fff' : '#e67e22';
        ctx.beginPath();
        ctx.arc(-r * 0.18, -r * 0.12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.18, -r * 0.12, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawElite(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const t = this.animTimer;

        // Animations
        const float = Math.sin(t * 2) * 5;
        const auraPulse = Math.sin(t * 3) * 0.3 + 0.7;
        const capeWave = Math.sin(t * 3.5) * 0.15;
        const weaponSwing = Math.sin(t * 4) * 8;
        const headTilt = Math.sin(t * 1.8) * 0.05;
        const shoulderBob = Math.sin(t * 2.5) * 2;
        const visorGlow = 0.6 + Math.sin(t * 5) * 0.4;

        // ====== PULSING DARK AURA ======
        const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.4);
        aura.addColorStop(0, `rgba(231, 76, 60, ${0.12 * auraPulse})`);
        aura.addColorStop(0.5, `rgba(192, 57, 43, ${0.06 * auraPulse})`);
        aura.addColorStop(1, 'rgba(231, 76, 60, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Aura ring pulse
        ctx.strokeStyle = `rgba(231, 76, 60, ${0.15 * auraPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1 + Math.sin(t * 2) * 5, 0, Math.PI * 2);
        ctx.stroke();

        // Shadow (offset by float)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.8 + float * 0.3, r * 0.7, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(0, float);

        // ====== CAPE / CLOAK — flowing behind ======
        ctx.save();
        ctx.translate(0, -r * 0.1);
        ctx.rotate(capeWave);

        const capeGrad = ctx.createLinearGradient(0, 0, 0, r * 0.9);
        capeGrad.addColorStop(0, flash ? '#ddd' : '#1a1a2e');
        capeGrad.addColorStop(0.5, flash ? '#ccc' : '#16213e');
        capeGrad.addColorStop(1, flash ? '#bbb' : '#0f0f23');
        ctx.fillStyle = capeGrad;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.15);
        ctx.quadraticCurveTo(-r * 0.7, r * 0.3, -r * 0.55, r * 0.65);
        ctx.quadraticCurveTo(-r * 0.3, r * 0.75, 0, r * 0.7);
        ctx.quadraticCurveTo(r * 0.3, r * 0.75, r * 0.55, r * 0.65);
        ctx.quadraticCurveTo(r * 0.7, r * 0.3, r * 0.5, -r * 0.15);
        ctx.closePath();
        ctx.fill();

        // Cape tattered edges
        ctx.strokeStyle = flash ? '#bbb' : '#0f0f23';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const cx = -r * 0.4 + i * (r * 0.25);
            const cy = r * 0.6 + Math.sin(t * 3 + i) * 4;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 3, cy + 12 + Math.sin(t * 4 + i) * 3);
            ctx.stroke();
        }
        ctx.restore();

        // ====== LEGS with walk animation ======
        const legPhase = Math.sin(t * 4) * 4;
        ctx.fillStyle = flash ? '#fff' : '#1a1a2e';
        ctx.beginPath();
        ctx.roundRect(-15 + legPhase, r * 0.2, 10, 30, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(5 - legPhase, r * 0.2, 10, 30, 4);
        ctx.fill();

        // Boots with red trim
        ctx.fillStyle = flash ? '#ddd' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-17 + legPhase, r * 0.2 + 24, 14, 11, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(3 - legPhase, r * 0.2 + 24, 14, 11, 4);
        ctx.fill();

        // Boot buckles
        ctx.fillStyle = flash ? '#eee' : '#e74c3c';
        ctx.beginPath();
        ctx.roundRect(-13 + legPhase, r * 0.2 + 26, 6, 3, 1);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(7 - legPhase, r * 0.2 + 26, 6, 3, 1);
        ctx.fill();

        // ====== BODY (armored) ======
        ctx.save();
        ctx.translate(0, shoulderBob * 0.3);

        const bodyGrad = ctx.createLinearGradient(-r * 0.7, -r * 0.5, r * 0.7, r * 0.3);
        bodyGrad.addColorStop(0, flash ? '#fff' : '#2c3e50');
        bodyGrad.addColorStop(0.5, flash ? '#eee' : '#34495e');
        bodyGrad.addColorStop(1, flash ? '#ddd' : '#1a252f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-r * 0.65, -r * 0.35, r * 1.3, r * 0.75, 8);
        ctx.fill();

        // Armor plate lines with animated glow
        const lineGlow = 0.3 + Math.sin(t * 3) * 0.15;
        ctx.strokeStyle = flash ? '#ccc' : `rgba(231, 76, 60, ${lineGlow})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.65, -r * 0.05);
        ctx.lineTo(r * 0.65, -r * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.65, r * 0.15);
        ctx.lineTo(r * 0.65, r * 0.15);
        ctx.stroke();

        // Center armor emblem
        ctx.fillStyle = flash ? '#ddd' : '#c0392b';
        ctx.beginPath();
        ctx.arc(0, -r * 0.05, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#eee' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, -r * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder pads with spikes
        ctx.fillStyle = flash ? '#fff' : '#c0392b';
        ctx.beginPath();
        ctx.ellipse(-r * 0.65, -r * 0.25 + shoulderBob, 14, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.65, -r * 0.25 - shoulderBob, 14, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Spike tips on shoulder pads
        ctx.fillStyle = flash ? '#eee' : '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-r * 0.65 - 14, -r * 0.25 + shoulderBob);
        ctx.lineTo(-r * 0.65 - 20, -r * 0.35 + shoulderBob);
        ctx.lineTo(-r * 0.65 - 12, -r * 0.2 + shoulderBob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.65 + 14, -r * 0.25 - shoulderBob);
        ctx.lineTo(r * 0.65 + 20, -r * 0.35 - shoulderBob);
        ctx.lineTo(r * 0.65 + 12, -r * 0.2 - shoulderBob);
        ctx.fill();

        ctx.restore(); // shoulderBob

        // ====== LEFT ARM — swings weapon ======
        ctx.save();
        ctx.translate(-r * 0.7, -r * 0.15);
        ctx.rotate(weaponSwing * Math.PI / 180);

        ctx.fillStyle = flash ? '#fff' : '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, 30, 5);
        ctx.fill();

        // Gauntlet
        ctx.fillStyle = flash ? '#ddd' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-7, 26, 14, 12, 4);
        ctx.fill();

        // Sword
        ctx.save();
        ctx.translate(0, 36);
        ctx.rotate(-0.3);

        // Blade
        const bladeGrad = ctx.createLinearGradient(-2, 0, 2, 0);
        bladeGrad.addColorStop(0, flash ? '#eee' : '#7f8c8d');
        bladeGrad.addColorStop(0.5, flash ? '#fff' : '#bdc3c7');
        bladeGrad.addColorStop(1, flash ? '#ddd' : '#95a5a6');
        ctx.fillStyle = bladeGrad;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-2, -35);
        ctx.lineTo(0, -40);
        ctx.lineTo(2, -35);
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fill();

        // Blade edge highlight
        ctx.strokeStyle = flash ? '#fff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, -38);
        ctx.stroke();

        // Guard
        ctx.fillStyle = flash ? '#ddd' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-8, -3, 16, 5, 2);
        ctx.fill();

        ctx.restore(); // sword
        ctx.restore(); // left arm

        // ====== RIGHT ARM — holds shield ======
        ctx.save();
        ctx.translate(r * 0.7, -r * 0.15);
        ctx.rotate(-weaponSwing * Math.PI / 180 * 0.3);

        ctx.fillStyle = flash ? '#fff' : '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, 28, 5);
        ctx.fill();

        // Gauntlet
        ctx.fillStyle = flash ? '#ddd' : '#c0392b';
        ctx.beginPath();
        ctx.roundRect(-7, 24, 14, 12, 4);
        ctx.fill();

        // Shield
        ctx.fillStyle = flash ? '#fff' : '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-12, 20);
        ctx.lineTo(0, 26);
        ctx.lineTo(12, 20);
        ctx.lineTo(14, 0);
        ctx.closePath();
        ctx.fill();

        // Shield border
        ctx.strokeStyle = flash ? '#ddd' : '#c0392b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-12, 20);
        ctx.lineTo(0, 26);
        ctx.lineTo(12, 20);
        ctx.lineTo(14, 0);
        ctx.closePath();
        ctx.stroke();

        // Shield emblem
        ctx.fillStyle = flash ? '#eee' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // right arm

        // ====== HEAD / HELMET with visor glow ======
        ctx.save();
        ctx.translate(0, headTilt * 10);

        // Helmet
        ctx.fillStyle = flash ? '#fff' : '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(-r * 0.35, -r * 0.72, r * 0.7, r * 0.45, [14, 14, 4, 4]);
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = flash ? '#fff' : '#c0392b';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.72);
        ctx.lineTo(-6, -r * 0.95);
        ctx.lineTo(0, -r * 1.0);
        ctx.lineTo(6, -r * 0.95);
        ctx.closePath();
        ctx.fill();

        // Crest detail
        ctx.fillStyle = flash ? '#eee' : '#e74c3c';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.88, 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Helmet visor
        ctx.fillStyle = flash ? '#eee' : '#1a252f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.3, -r * 0.58, r * 0.6, r * 0.18, 4);
        ctx.fill();

        // Glowing red eyes in visor — pulsing intensity
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(-10, -r * 0.5, 4 + visorGlow * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -r * 0.5, 4 + visorGlow * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye inner bright cores
        ctx.fillStyle = '#f5b7b1';
        ctx.beginPath();
        ctx.arc(-10, -r * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -r * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth grille lines
        ctx.strokeStyle = flash ? '#ccc' : '#1a252f';
        ctx.lineWidth = 1.5;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 5, -r * 0.4);
            ctx.lineTo(i * 5, -r * 0.34);
            ctx.stroke();
        }

        ctx.restore(); // headTilt
        ctx.restore(); // float
    }

    drawLeech(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const wriggle = Math.sin(this.animTimer * 6) * 0.15;

        ctx.save();
        ctx.rotate(wriggle);

        // Body - elongated worm
        const bodyGrad = ctx.createLinearGradient(-r, 0, r, 0);
        bodyGrad.addColorStop(0, flash ? '#fff' : '#5a1230');
        bodyGrad.addColorStop(0.5, flash ? '#fff' : '#8b2252');
        bodyGrad.addColorStop(1, flash ? '#fff' : '#5a1230');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.3, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Segments
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.ellipse(i * r * 0.35, 0, 2, r * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Mouth sucker
        ctx.fillStyle = flash ? '#ddd' : '#ff6b9d';
        ctx.beginPath();
        ctx.ellipse(r * 0.9, 0, r * 0.3, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#bbb' : '#3a0a1a';
        ctx.beginPath();
        ctx.arc(r * 0.9, 0, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Healing aura
        if (this.healRadius > 0) {
            const pulse = 0.3 + Math.sin(this.animTimer * 3) * 0.15;
            ctx.strokeStyle = `rgba(255,107,157,${pulse})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, this.healRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    drawMimicDisguise(ctx) {
        const r = this.radius;
        const bob = Math.sin(this.animTimer * 3) * XP_GEMS.BOB_HEIGHT;

        // Glow
        const glowGrad = ctx.createRadialGradient(0, bob, 0, 0, bob, r * 2);
        glowGrad.addColorStop(0, '#b8d94e44');
        glowGrad.addColorStop(1, '#b8d94e00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, bob, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Main gem body - circle like real XP gem
        const gemGrad = ctx.createLinearGradient(-r, bob - r, r, bob + r);
        gemGrad.addColorStop(0, '#b8d94e');
        gemGrad.addColorStop(0.5, '#fff');
        gemGrad.addColorStop(1, '#7c9a6e');
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.arc(0, bob, r, 0, Math.PI * 2);
        ctx.fill();

        // Facet lines
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        const spin = this.animTimer * 0.5;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + spin;
            ctx.beginPath();
            ctx.moveTo(0, bob);
            ctx.lineTo(Math.cos(a) * r * 0.85, bob + Math.sin(a) * r * 0.85);
            ctx.stroke();
        }

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(-r * 0.25, bob - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, bob, r + 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawMimic(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const chomp = Math.sin(this.animTimer * 8) * 0.3;

        // Monster body - small but aggressive
        ctx.fillStyle = flash ? '#fff' : '#6a9a3c';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        ctx.fillStyle = flash ? '#ddd' : '#4a7a2c';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + this.animTimer * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a - 0.3) * r, Math.sin(a - 0.3) * r);
            ctx.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6);
            ctx.lineTo(Math.cos(a + 0.3) * r, Math.sin(a + 0.3) * r);
            ctx.closePath();
            ctx.fill();
        }

        // Eyes
        ctx.fillStyle = flash ? '#f00' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.2, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.2, r * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.2, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = flash ? '#900' : '#2a0a0a';
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, r * 0.2);
        ctx.lineTo(0, r * 0.2 + r * 0.3 * (1 + chomp));
        ctx.lineTo(r * 0.4, r * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    drawHive(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const breath = 1 + Math.sin(this.animTimer * 2.5) * 0.06;
        const wobble = Math.sin(this.animTimer * 1.8) * 2;

        ctx.save();
        ctx.scale(breath, breath);

        // Drip trails
        ctx.fillStyle = flash ? '#fff' : 'rgba(232,200,74,0.3)';
        for (let i = 0; i < 3; i++) {
            const dx = (i - 1) * r * 0.5;
            const dripLen = r * 0.3 + Math.sin(this.animTimer * 1.5 + i) * r * 0.15;
            ctx.beginPath();
            ctx.ellipse(dx, r + dripLen, r * 0.12, dripLen, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Honeycomb body
        const grad = ctx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r);
        grad.addColorStop(0, flash ? '#fff' : '#f0d060');
        grad.addColorStop(0.5, flash ? '#fff' : '#e8c84a');
        grad.addColorStop(0.8, flash ? '#fff' : '#c4a23a');
        grad.addColorStop(1, flash ? '#fff' : '#8a7020');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Hex pattern with breathing offset
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1.5;
        const hexR = r * 0.35;
        for (let row = -1; row <= 1; row++) {
            for (let col = -1; col <= 1; col++) {
                const hx = col * hexR * 1.7 + (row % 2) * hexR * 0.85;
                const hy = row * hexR * 1.5 + Math.sin(this.animTimer * 2 + col) * 1.5;
                if (hx * hx + hy * hy > r * r * 0.7) continue;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    const px = hx + Math.cos(a) * hexR * 0.45;
                    const py = hy + Math.sin(a) * hexR * 0.45;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }

        // Animated larvae crawling around
        ctx.fillStyle = flash ? '#ddd' : '#f0d060';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + this.animTimer * (1.2 + i * 0.3);
            const dist = r * 0.3 + Math.sin(this.animTimer * 3 + i) * r * 0.08;
            const lx = Math.cos(angle) * dist;
            const ly = Math.sin(angle) * dist;
            const larvaSize = r * 0.1 + Math.sin(this.animTimer * 4 + i * 2) * r * 0.02;
            ctx.beginPath();
            ctx.arc(lx, ly, larvaSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pulsing glow spots
        ctx.fillStyle = `rgba(240,208,96,${0.15 + Math.sin(this.animTimer * 3) * 0.08})`;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + this.animTimer * 0.4;
            const gr = r * 0.15;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, gr, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawWarden(ctx) {
        const r = this.radius;
        const flash = this.flashTimer > 0;
        const float = Math.sin(this.animTimer * 1.5) * 4;
        const breathe = 1 + Math.sin(this.animTimer * 2) * 0.03;

        ctx.save();
        ctx.translate(0, float);
        ctx.scale(breathe, breathe);

        // Shield aura with pulsing opacity
        if (this.shieldRadius > 0) {
            const pulse = 0.2 + Math.sin(this.animTimer * 2.5) * 0.12;
            ctx.strokeStyle = `rgba(160,208,255,${pulse})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            ctx.arc(0, 0, this.shieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Orbiting energy dots
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + this.animTimer * 1.5;
                const ox = Math.cos(a) * this.shieldRadius;
                const oy = Math.sin(a) * this.shieldRadius;
                ctx.fillStyle = `rgba(160,208,255,${pulse + 0.15})`;
                ctx.beginPath();
                ctx.arc(ox, oy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Shield on arm
        const shieldGrad = ctx.createLinearGradient(-r * 0.8, -r, 0, r);
        shieldGrad.addColorStop(0, flash ? '#ddd' : '#6a8aaa');
        shieldGrad.addColorStop(1, flash ? '#bbb' : '#3a5a7a');
        ctx.fillStyle = shieldGrad;
        ctx.beginPath();
        ctx.roundRect(-r * 0.9, -r * 0.7, r * 0.7, r * 1.4, 4);
        ctx.fill();
        ctx.strokeStyle = flash ? '#aaa' : '#a0d0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shield emblem with pulse
        const emblemPulse = 0.7 + Math.sin(this.animTimer * 3) * 0.3;
        ctx.fillStyle = flash ? '#88b' : `rgba(192,232,255,${emblemPulse})`;
        ctx.beginPath();
        ctx.arc(-r * 0.55, 0, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyGrad = ctx.createLinearGradient(0, -r, 0, r);
        bodyGrad.addColorStop(0, flash ? '#fff' : '#4a6a8a');
        bodyGrad.addColorStop(1, flash ? '#fff' : '#2a3a4a');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-r * 0.4, -r * 0.8, r * 0.9, r * 1.6, 6);
        ctx.fill();

        // Shoulder armor plates
        ctx.fillStyle = flash ? '#ddd' : '#5a7a9a';
        ctx.beginPath();
        ctx.ellipse(-r * 0.15, -r * 0.65, r * 0.3, r * 0.15, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.55, -r * 0.65, r * 0.3, r * 0.15, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = flash ? '#ddd' : '#5a7a9a';
        ctx.beginPath();
        ctx.arc(r * 0.05, -r * 0.7, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = flash ? '#ccc' : '#4a6a8a';
        ctx.beginPath();
        ctx.moveTo(r * 0.05, -r * 1.1);
        ctx.lineTo(r * 0.05 + r * 0.2, -r * 0.7);
        ctx.lineTo(r * 0.05 - r * 0.2, -r * 0.7);
        ctx.closePath();
        ctx.fill();

        // Visor glow with animation
        const visorGlow = 0.7 + Math.sin(this.animTimer * 3) * 0.3;
        ctx.fillStyle = flash ? '#f88' : `rgba(160,208,255,${visorGlow})`;
        ctx.beginPath();
        ctx.ellipse(r * 0.05, -r * 0.7, r * 0.3, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawHealthBar(ctx, x, y) {
        const w = ENEMIES.HEALTH_BAR_WIDTH;
        const h = ENEMIES.HEALTH_BAR_HEIGHT;
        const pct = Math.max(0, this.hp / this.maxHp);
        const barX = x - w / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(barX - 1, y - 1, w + 2, h + 2, 3);
        ctx.fill();

        ctx.fillStyle = COLORS.ENEMY_HP_BAR_BG;
        ctx.beginPath();
        ctx.roundRect(barX, y, w, h, 2);
        ctx.fill();

        ctx.fillStyle = COLORS.ENEMY_HP_BAR_FG;
        ctx.beginPath();
        ctx.roundRect(barX, y, w * pct, h, 2);
        ctx.fill();
    }
}
