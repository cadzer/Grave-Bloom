import { GAME, UI, WAVES, CHEST, SHOP_UPGRADES, COINS, WEAPON_TYPES, EVOLUTIONS, ENEMIES, PASSIVES, CHARACTERS, LOADOUTS } from '../config/GameConfig.js';
import { MenuBackground } from './MenuBackground.js';
import { Enemy } from '../entities/Enemy.js';

let _passiveLevels = {};

function setPassiveLevels(levels) { _passiveLevels = levels; }
function getPassiveLevel(id) { return _passiveLevels[id] || 0; }

const FD = 'Rajdhani';
const FB = 'Inter';

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function lerpColor(hex, amt) {
    const c = hexToRgb(hex);
    return `rgb(${Math.min(255, Math.floor(c.r + (255 - c.r) * amt))},${Math.min(255, Math.floor(c.g + (255 - c.g) * amt))},${Math.min(255, Math.floor(c.b + (255 - c.b) * amt))})`;
}

function darkColor(hex, amt) {
    const c = hexToRgb(hex);
    return `rgb(${Math.floor(c.r * (1 - amt))},${Math.floor(c.g * (1 - amt))},${Math.floor(c.b * (1 - amt))})`;
}

function drawParticles(ctx, t, cx, cy, count, spread, color, speed) {
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + t * speed;
        const dist = spread + Math.sin(t * 2 + i * 1.7) * (spread * 0.3);
        const px = cx + Math.cos(a) * dist;
        const py = cy + Math.sin(a) * dist;
        const s = 1.5 + Math.sin(t * 3 + i * 2.1) * 1;
        const alpha = 0.3 + Math.sin(t * 2.5 + i * 1.3) * 0.2;
        ctx.fillStyle = `rgba(${hexToRgb(color).r},${hexToRgb(color).g},${hexToRgb(color).b},${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, s, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGlassPanel(ctx, x, y, w, h, r, tint) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, `rgba(${tint.r},${tint.g},${tint.b},0.18)`);
    grad.addColorStop(0.5, `rgba(${tint.r},${tint.g},${tint.b},0.08)`);
    grad.addColorStop(1, `rgba(${tint.r},${tint.g},${tint.b},0.14)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = `rgba(255,255,255,0.12)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, h * 0.4, [r - 2, r - 2, 0, 0]);
    ctx.fill();
}

function drawGlowBorder(ctx, x, y, w, h, r, color, t, intensity) {
    const pulse = intensity + Math.sin(t * 3) * intensity * 0.3;
    ctx.shadowColor = color;
    ctx.shadowBlur = pulse;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawDiamond(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.6, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.6, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export class UISystem {
    constructor() {
        this.gameOverScreen = null;
        this.levelUpScreen = null;
        this.chestRewardScreen = null;
        this.shopScreen = null;
        this.announcement = null;
        this.hudTimer = 0;
        this.menuBg = new MenuBackground();
        this.mouseX = 0;
        this.mouseY = 0;
        this._toggleAnim = { mute: 0, fullscreen: 0 };
        this._resetNotify = 0;
        this._muteNotify = { active: false, muted: false, timer: 0 };
        this.particles = [];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * GAME.WIDTH,
                y: Math.random() * GAME.HEIGHT,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: 1 + Math.random() * 2,
                alpha: 0.1 + Math.random() * 0.2,
                color: ['#c4a23a', '#8b3a62', '#5a8f7c', '#7c9a6e', '#7b5ea7'][Math.floor(Math.random() * 5)]
            });
        }
    }

    setMousePos(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    setPassiveLevels(levels) {
        setPassiveLevels(levels);
    }

    showResetNotify() {
        this._resetNotify = 4.5;
    }

    hideResetConfirm() {
        this._settingsResetConfirm = false;
        this._settingsResetConfirmRects = null;
    }

    isResetConfirmButtonAt(mx, my, buttonId) {
        if (!this._settingsResetConfirmRects || !this._settingsResetConfirmRects[buttonId]) return false;
        const r = this._settingsResetConfirmRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    showMuteNotify(isMuted) {
        this._muteNotify = { active: true, muted: isMuted, timer: 4.0 };
    }

    updateParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.x < 0) p.x = GAME.WIDTH;
            if (p.x > GAME.WIDTH) p.x = 0;
            if (p.y < 0) p.y = GAME.HEIGHT;
            if (p.y > GAME.HEIGHT) p.y = 0;
        }
    }

    drawBackgroundParticles(ctx, t) {
        for (const p of this.particles) {
            const flicker = 0.5 + Math.sin(t * 2 + p.x * 0.01) * 0.5;
            ctx.fillStyle = `rgba(${hexToRgb(p.color).r},${hexToRgb(p.color).g},${hexToRgb(p.color).b},${p.alpha * flicker})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawMenuAnimatedEffects(ctx, t, W, H) {
        ctx.save();

        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) {
            const x = (Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * W;
            const y = (Math.cos(t * 0.2 + i * 2.3) * 0.5 + 0.5) * H * 0.6;
            const alpha = 0.02 + Math.sin(t * 1.5 + i) * 0.01;
            const r = 2 + Math.sin(t + i * 0.8) * 1;
            ctx.fillStyle = `rgba(184,217,78,${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < 8; i++) {
            const x = W * 0.5 + Math.sin(t * 0.15 + i * 2.5) * W * 0.4;
            const y = H * 0.5 + Math.cos(t * 0.1 + i * 1.8) * H * 0.3;
            const alpha = 0.015 + Math.sin(t * 0.8 + i * 1.3) * 0.008;
            const r = 30 + Math.sin(t * 0.5 + i) * 10;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, `rgba(200,100,50,${alpha})`);
            grad.addColorStop(1, 'rgba(200,100,50,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // --- Wave Announcement ---

    showAnnouncement(name, message) {
        this.announcement = { name, message, timer: UI.ANNOUNCE_DURATION, enterT: 0 };
    }

    updateAnnouncement(dt) {
        if (this.announcement) {
            this.announcement.timer -= dt;
            this.announcement.enterT = Math.min(this.announcement.enterT + dt * 4, 1);
            if (this.announcement.timer <= 0) this.announcement = null;
        }
    }

    drawAnnouncement(ctx) {
        if (!this.announcement) return;
        const a = this.announcement;
        const fadeIn = a.enterT;
        const fadeOut = Math.min(1, a.timer / 0.5);
        const alpha = fadeIn * fadeOut;
        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        const cy = 180;
        const W = GAME.WIDTH;

        // Animated background band
        const bandH = 80;
        const bandGrad = ctx.createLinearGradient(0, cy - bandH / 2, 0, cy + bandH / 2);
        bandGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bandGrad.addColorStop(0.2, 'rgba(0,0,0,0.55)');
        bandGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
        bandGrad.addColorStop(0.8, 'rgba(0,0,0,0.55)');
        bandGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, cy - bandH / 2, W, bandH);

        // Animated side lines
        const lineLen = 250 * fadeIn;
        const lineY = cy + 28;
        const lineGrad = ctx.createLinearGradient(W / 2 - lineLen, 0, W / 2, 0);
        lineGrad.addColorStop(0, 'rgba(196,162,58,0)');
        lineGrad.addColorStop(1, 'rgba(196,162,58,0.6)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineLen, lineY);
        ctx.lineTo(W / 2 - 10, lineY);
        ctx.stroke();
        const lineGrad2 = ctx.createLinearGradient(W / 2, 0, W / 2 + lineLen, 0);
        lineGrad2.addColorStop(0, 'rgba(196,162,58,0.6)');
        lineGrad2.addColorStop(1, 'rgba(196,162,58,0)');
        ctx.strokeStyle = lineGrad2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + 10, lineY);
        ctx.lineTo(W / 2 + lineLen, lineY);
        ctx.stroke();

        // Diamond decorations
        drawDiamond(ctx, W / 2 - lineLen - 8, lineY, 5, '#c4a23a', alpha * 0.7);
        drawDiamond(ctx, W / 2 + lineLen + 8, lineY, 5, '#c4a23a', alpha * 0.7);

        // Title
        const titleScale = 0.8 + fadeIn * 0.2;
        ctx.save();
        ctx.translate(W / 2, cy - 4);
        ctx.scale(titleScale, titleScale);
        ctx.shadowColor = '#c4a23a';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 42px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.name, 0, 0);
        ctx.shadowBlur = 10;
        ctx.fillText(a.name, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Sub-message
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `500 18px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(a.message, W / 2, cy + 12);

        ctx.restore();
    }

    // --- HUD ---

    drawHUD(ctx, kills, elapsedTime, hp, maxHp, xp, xpToNext, level, passives, stageName, runCoins, weaponManager, synergies, charName) {
        this.hudTimer += 0.016;
        this.updateParticles(0.016);
        const t = this.hudTimer;
        const pad = 20;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        this.drawBackgroundParticles(ctx, t);

        // ===== TOP LEFT: Timer =====
        const timerPillW = 190;
        const timerPillH = 64;
        const tx = pad;
        const ty = pad;
        const timerPulse = 1 + Math.sin(t * 2) * 0.015;

        drawGlassPanel(ctx, tx - 4, ty - 4, timerPillW + 8, timerPillH + 8, 20, { r: 124, g: 154, b: 110 });

        // Animated accent line at bottom of timer pill
        const accentProgress = (Math.sin(t * 1.5) + 1) / 2;
        const accentGrad = ctx.createLinearGradient(tx + 15, 0, tx + timerPillW - 15, 0);
        accentGrad.addColorStop(0, 'rgba(124,154,110,0)');
        accentGrad.addColorStop(accentProgress, 'rgba(124,154,110,0.6)');
        accentGrad.addColorStop(1, 'rgba(124,154,110,0)');
        ctx.strokeStyle = accentGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx + 15, ty + timerPillH + 3);
        ctx.lineTo(tx + timerPillW - 15, ty + timerPillH + 3);
        ctx.stroke();

        const mins = Math.floor(elapsedTime / 60);
        const secs = Math.floor(elapsedTime % 60);
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        ctx.save();
        ctx.translate(tx + timerPillW / 2, ty + timerPillH / 2 - 2);
        ctx.scale(timerPulse, timerPulse);
        ctx.shadowColor = '#7c9a6e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 40px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeStr, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        if (stageName) {
            ctx.fillStyle = 'rgba(196,162,58,0.5)';
            ctx.font = `600 13px ${FB}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(stageName, tx + 6, ty + timerPillH + 10);
        }

        // ===== TOP RIGHT: Kills =====
        const killsPillW = 160;
        const killsPillH = 64;
        const kx = W - pad - killsPillW;
        const ky = pad;
        const killsPulse = 1 + Math.sin(t * 3 + 1) * 0.02;

        drawGlassPanel(ctx, kx - 4, ky - 4, killsPillW + 8, killsPillH + 8, 20, { r: 139, g: 58, b: 98 });

        // Red accent
        const kAccent = ctx.createLinearGradient(kx + 15, 0, kx + killsPillW - 15, 0);
        kAccent.addColorStop(0, 'rgba(139,58,98,0)');
        kAccent.addColorStop((Math.sin(t * 1.8) + 1) / 2, 'rgba(139,58,98,0.6)');
        kAccent.addColorStop(1, 'rgba(139,58,98,0)');
        ctx.strokeStyle = kAccent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(kx + 15, ky + killsPillH + 3);
        ctx.lineTo(kx + killsPillW - 15, ky + killsPillH + 3);
        ctx.stroke();

        // Skull
        ctx.font = `bold 24px ${FD}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#8b3a62';
        ctx.fillText('\u2620', kx + 14, ky + killsPillH / 2 - 2);

        ctx.save();
        ctx.translate(kx + killsPillW / 2 + 8, ky + killsPillH / 2 - 2);
        ctx.scale(killsPulse, killsPulse);
        ctx.shadowColor = '#8b3a62';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 34px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${kills}`, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.font = `600 11px ${FB}`;
        ctx.fillStyle = 'rgba(139,58,98,0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ELIMINATIONS', kx + killsPillW / 2, ky + killsPillH + 10);

        // ===== TOP RIGHT: Coins (below kills) =====
        if (runCoins !== undefined) {
            const coinPillW = 140;
            const coinPillH = 40;
            const coinX = W - pad - coinPillW;
            const coinY = ky + killsPillH + 28;

            drawGlassPanel(ctx, coinX, coinY, coinPillW, coinPillH, 14, { r: 196, g: 162, b: 58 });

            ctx.font = `bold 18px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#c4a23a';
            ctx.fillText('\uD83D\uDCB0', coinX + 22, coinY + coinPillH / 2);
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `bold 20px ${FD}`;
            ctx.fillText(`${runCoins}`, coinX + coinPillW / 2 + 10, coinY + coinPillH / 2);
        }

        // ===== BOTTOM LEFT: HP + XP + Level =====
        const bottomY = H - pad;
        const hpBarW = 340;
        const hpBarH = 34;
        const xpBarW = 340;
        const xpBarH = 22;
        const barX = pad;
        const panelH = 155;
        const panelW = hpBarW + 30;

        drawGlassPanel(ctx, barX - 14, bottomY - panelH - 6, panelW, panelH + 12, 14, { r: 100, g: 100, b: 180 });

        // HP
        const hpY = bottomY - panelH + 6;
        ctx.font = `bold 15px ${FB}`;
        ctx.fillStyle = '#e74c3c';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('HEALTH', barX, hpY);

        const hpPct = Math.max(0, hp / maxHp);
        this.drawBar(ctx, barX, hpY + 20, hpBarW, hpBarH, hpPct, '#2ecc71', '#f39c12', '#e74c3c', t);

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 17px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(hp)} / ${maxHp}`, barX + hpBarW / 2, hpY + 20 + hpBarH / 2);
        ctx.shadowBlur = 0;

        // XP
        const xpY = hpY + 20 + hpBarH + 10;
        ctx.font = `bold 13px ${FB}`;
        ctx.fillStyle = '#9b59b6';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('EXPERIENCE', barX, xpY);

        const xpPct = Math.max(0, xp / xpToNext);
        this.drawBar(ctx, barX, xpY + 16, xpBarW, xpBarH, xpPct, '#9b59b6', '#8e44ad', '#7d3c98', t);

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.fillStyle = '#fff';
        ctx.font = `600 13px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${xp} / ${xpToNext}`, barX + xpBarW / 2, xpY + 16 + xpBarH / 2);
        ctx.shadowBlur = 0;

        // Level badge
        const lvlY = xpY + 16 + xpBarH + 10;
        const badgePulse = 1 + Math.sin(t * 2.5) * 0.03;
        const badgeW = 120;
        const badgeH = 36;

        const badgeGrad = ctx.createLinearGradient(barX, lvlY, barX + badgeW, lvlY);
        badgeGrad.addColorStop(0, '#5a8f7c');
        badgeGrad.addColorStop(1, '#3d6b52');
        ctx.fillStyle = badgeGrad;
        ctx.beginPath();
        ctx.roundRect(barX, lvlY, badgeW, badgeH, 15);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.roundRect(barX + 2, lvlY + 2, badgeW - 4, badgeH * 0.45, [13, 13, 0, 0]);
        ctx.fill();

        ctx.save();
        ctx.translate(barX + badgeW / 2, lvlY + badgeH / 2);
        ctx.scale(badgePulse, badgePulse);
        ctx.shadowColor = '#5a8f7c';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#e8e4dc';
        ctx.font = `bold 18px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Lv. ${level}`, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Character name next to level badge
        if (charName) {
            const chInfo = Object.values(CHARACTERS).find(c => c.name === charName);
            ctx.fillStyle = chInfo ? chInfo.color : '#d8d4cc';
            ctx.font = `600 13px ${FB}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(charName, barX + badgeW + 10, lvlY + badgeH / 2);
        }

        // ===== BOTTOM CENTER: Weapons =====
        if (weaponManager && weaponManager.weapons.length > 1) {
            const otherWeapons = weaponManager.weapons.filter(w => w.typeId !== 'arcane_bolt');
            if (otherWeapons.length > 0) {
                this.drawWeapons(ctx, W / 2, bottomY - 114, otherWeapons, t);
            }
        }

        // ===== BOTTOM CENTER: Passives =====
        this.drawPassiveBar(ctx, W / 2, bottomY - 54, passives, t);

        // Mute notification
        if (this._muteNotify.active) {
            this._muteNotify.timer -= 0.016;
            if (this._muteNotify.timer <= 0) {
                this._muteNotify.active = false;
            } else {
                const alpha = this._muteNotify.timer > 0.3 ? 1 : this._muteNotify.timer / 0.3;
                const notifW = 280;
                const notifH = 48;
                const notifX = (W - notifW) / 2;
                const notifY = 90;

                ctx.save();
                ctx.globalAlpha = alpha;

                const nGrad = ctx.createLinearGradient(notifX, notifY, notifX, notifY + notifH);
                nGrad.addColorStop(0, this._muteNotify.muted ? 'rgba(139,58,98,0.9)' : 'rgba(124,154,110,0.9)');
                nGrad.addColorStop(1, this._muteNotify.muted ? 'rgba(107,42,72,0.9)' : 'rgba(80,110,60,0.9)');
                ctx.fillStyle = nGrad;
                ctx.beginPath();
                ctx.roundRect(notifX, notifY, notifW, notifH, 12);
                ctx.fill();

                ctx.shadowColor = this._muteNotify.muted ? '#8b3a62' : '#7c9a6e';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = this._muteNotify.muted ? '#8b3a62' : '#7c9a6e';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(notifX, notifY, notifW, notifH, 12);
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#fff';
                ctx.font = `bold 16px ${FD}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icon = this._muteNotify.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
                const text = this._muteNotify.muted ? 'Sound Muted' : 'Sound On';
                ctx.fillText(`${icon}  ${text}`, notifX + notifW / 2, notifY + notifH / 2);

                ctx.restore();
            }
        }

        // Controls hint
        ctx.font = `500 12px ${FB}`;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('WASD / Arrow Keys to move', W / 2, H - 6);

        // Active synergies
        if (synergies && synergies.length > 0) {
            const synAlpha = 0.5 + Math.sin(t * 3) * 0.15;
            ctx.fillStyle = `rgba(184,217,78,${synAlpha})`;
            ctx.font = `bold 12px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const synText = synergies.map(s => `${s.icon} ${s.name}`).join('  \u2022  ');
            ctx.fillText(synText, W / 2, H - 22);
        }
    }

    drawBar(ctx, x, y, w, h, pct, high, mid, low, t) {
        const r = h / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(x - 1, y - 1, w + 2, h + 2, r + 1);
        ctx.fill();

        const color = pct > 0.5 ? high : pct > 0.25 ? mid : low;
        const fillGrad = ctx.createLinearGradient(x, y, x, y + h);
        fillGrad.addColorStop(0, lerpColor(color, 0.2));
        fillGrad.addColorStop(0.5, color);
        fillGrad.addColorStop(1, darkColor(color, 0.25));
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(h, w * pct), h, r);
        ctx.fill();

        // Animated shine sweep
        const sweepX = x + ((t * 80) % (w + 60)) - 30;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(h, w * pct), h, r);
        ctx.clip();
        const shineGrad = ctx.createLinearGradient(sweepX - 30, y, sweepX + 30, y);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
        shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineGrad;
        ctx.fillRect(sweepX - 30, y, 60, h);
        ctx.restore();

        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(h, w * pct), h * 0.45, [r, r, 0, 0]);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.stroke();
    }

    drawPassives(ctx, centerX, y, passives, time) {
        if (!passives || passives.length === 0) return;

        const size = 46;
        const gap = 12;
        const totalW = passives.length * size + (passives.length - 1) * gap;
        const startX = centerX - totalW / 2;

        for (let i = 0; i < passives.length; i++) {
            const p = passives[i];
            const ix = startX + i * (size + gap);
            const iy = y;
            const bob = Math.sin(time * 2 + i * 0.8) * 3;
            const scale = 1 + Math.sin(time * 2.5 + i * 1.2) * 0.03;

            ctx.save();
            ctx.translate(ix + size / 2, iy + size / 2 + bob);
            ctx.scale(scale, scale);
            ctx.translate(-size / 2, -size / 2);

            // Glass background
            drawGlassPanel(ctx, 0, 0, size, size, 10, hexToRgb(p.color));

            // Animated glow border
            drawGlowBorder(ctx, 0, 0, size, size, 10, p.color, time + i, 6);

            // Icon
            ctx.font = `26px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(p.icon, size / 2, size / 2 - 1);

            // Level badge
            const badgeR = 10;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(size / 2, size + 6, badgeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold 10px ${FD}`;
            ctx.fillText(`${p.level}`, size / 2, size + 7);

            ctx.restore();
        }
    }

    drawPassiveBar(ctx, centerX, y, passives, time) {
        if (!passives || passives.length === 0) return;

        const size = 46;
        const gap = 12;
        const padX = 20;
        const padY = 12;
        const totalW = passives.length * size + (passives.length - 1) * gap + padX * 2;
        const barH = size + padY * 2 + 16;
        const barX = centerX - totalW / 2;
        const barY = y - padY;

        drawGlassPanel(ctx, barX, barY, totalW, barH, 14, { r: 50, g: 40, b: 70 }, 0.25);

        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(barX, barY, totalW, barH, 14);
        ctx.stroke();

        this._passiveRects = [];
        let hoveredIdx = -1;

        for (let i = 0; i < passives.length; i++) {
            const p = passives[i];
            const ix = barX + padX + i * (size + gap);
            const iy = y + 4;
            const bob = Math.sin(time * 2 + i * 0.8) * 2;
            const scale = 1 + Math.sin(time * 2.5 + i * 1.2) * 0.02;

            const isHovered = this.mouseX >= ix && this.mouseX <= ix + size &&
                              this.mouseY >= iy + bob && this.mouseY <= iy + bob + size;
            if (isHovered) hoveredIdx = i;

            this._passiveRects.push({ x: ix, y: iy, w: size, h: size, passive: p });

            ctx.save();
            ctx.translate(ix + size / 2, iy + size / 2 + bob);
            ctx.scale(scale, scale);
            ctx.translate(-size / 2, -size / 2);

            drawGlassPanel(ctx, 0, 0, size, size, 10, hexToRgb(p.color));
            drawGlowBorder(ctx, 0, 0, size, size, 10, p.color, time + i, 6);

            ctx.font = `26px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(p.icon, size / 2, size / 2 - 1);

            const badgeR = 10;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(size / 2, size + 6, badgeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold 10px ${FD}`;
            ctx.fillText(`${p.level}`, size / 2, size + 7);

            ctx.restore();
        }

        if (hoveredIdx >= 0) {
            const p = passives[hoveredIdx];
            const rect = this._passiveRects[hoveredIdx];
            const tipW = 220;
            const tipH = 72;
            let tipX = this.mouseX + 16;
            let tipY = this.mouseY - tipH - 8;
            if (tipX + tipW > GAME.WIDTH - 10) tipX = this.mouseX - tipW - 16;
            if (tipY < 10) tipY = this.mouseY + 20;

            ctx.fillStyle = 'rgba(20,18,30,0.92)';
            ctx.beginPath();
            ctx.roundRect(tipX, tipY, tipW, tipH, 10);
            ctx.fill();

            ctx.strokeStyle = p.color + '80';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(tipX, tipY, tipW, tipH, 10);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = `bold 15px ${FD}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${p.icon}  ${p.name}`, tipX + 12, tipY + 10);

            ctx.fillStyle = '#e8e4dc';
            ctx.font = `13px ${FB}`;
            ctx.fillText(p.description, tipX + 12, tipY + 32);

            ctx.fillStyle = p.color;
            ctx.font = `bold 12px ${FD}`;
            ctx.fillText(`Level ${p.level} / ${p.maxLevel}`, tipX + 12, tipY + 52);
        }
    }

    drawWeapons(ctx, centerX, y, weapons, time) {
        if (!weapons || weapons.length === 0) return;

        const size = 46;
        const gap = 10;
        const totalW = weapons.length * size + (weapons.length - 1) * gap;
        const startX = centerX - totalW / 2;

        for (let i = 0; i < weapons.length; i++) {
            const w = weapons[i];
            const ix = startX + i * (size + gap);
            const iy = y;
            const bob = Math.sin(time * 2.2 + i * 1.1) * 2;
            const scale = 1 + Math.sin(time * 2.8 + i * 0.9) * 0.02;

            ctx.save();
            ctx.translate(ix + size / 2, iy + size / 2 + bob);
            ctx.scale(scale, scale);
            ctx.translate(-size / 2, -size / 2);

            const color = w.config.color;
            const tint = hexToRgb(color);

            drawGlassPanel(ctx, 0, 0, size, size, 10, tint);

            if (w.isEvolved) {
                drawGlowBorder(ctx, -1, -1, size + 2, size + 2, 11, '#f1c40f', time + i, 10);
            } else {
                drawGlowBorder(ctx, 0, 0, size, size, 10, color, time + i, 5);
            }

            ctx.shadowColor = color;
            ctx.shadowBlur = w.isEvolved ? 12 : 6;
            ctx.font = `${w.isEvolved ? 'bold ' : ''}20px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = w.isEvolved ? '#f1c40f' : '#fff';
            const icon = w.isEvolved ? '\u2B50' : this.getWeaponIcon(w.typeId);
            ctx.fillText(icon, size / 2, size / 2 - 2);
            ctx.shadowBlur = 0;

            const lvlBadgeY = size + 6;
            ctx.fillStyle = w.isEvolved ? '#f1c40f' : color;
            ctx.beginPath();
            ctx.arc(size / 2, lvlBadgeY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = w.isEvolved ? '#000' : '#fff';
            ctx.font = `bold 9px ${FD}`;
            ctx.fillText(`${w.level}`, size / 2, lvlBadgeY + 1);

            ctx.restore();
        }
    }

    getWeaponIcon(typeId) {
        const icons = {
            arcane_bolt: '\u2728',
            orbiting_blade: '\uD83D\uDD2E',
            holy_pulse: '\u2764\uFE0F',
            lightning_mark: '\u26A1'
        };
        return icons[typeId] || '\u2694\uFE0F';
    }

    // --- Level-Up Screen ---

    showLevelUp(choices) {
        this.levelUpScreen = { choices, selectedIndex: -1, animTimer: 0, enterProgress: 0 };
    }

    hideLevelUp() { this.levelUpScreen = null; }
    isLevelUpVisible() { return this.levelUpScreen !== null; }

    drawLevelUp(ctx) {
        if (!this.levelUpScreen) return;
        const { choices } = this.levelUpScreen;
        this.levelUpScreen.animTimer += 0.016;
        this.levelUpScreen.enterProgress = Math.min(this.levelUpScreen.enterProgress + 0.04, 1);
        const t = this.levelUpScreen.animTimer;
        const ep = this.levelUpScreen.enterProgress;
        const ease = 1 - Math.pow(1 - ep, 3);
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        ctx.save();

        // Dark overlay with vignette
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        // Floating particles
        this.drawBackgroundParticles(ctx, t);

        // Title with animated glow
        ctx.save();
        ctx.translate(W / 2, 185);
        ctx.scale(0.7 + ease * 0.3, 0.7 + ease * 0.3);
        ctx.globalAlpha = ease;

        ctx.shadowColor = '#c4a23a';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 64px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEVEL UP', 0, 0);
        ctx.shadowBlur = 15;
        ctx.fillText('LEVEL UP', 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();

        // Decorative line under title
        const lineLen = 200 * ease;
        ctx.globalAlpha = ease;
        const lineGrad = ctx.createLinearGradient(W / 2 - lineLen, 0, W / 2 + lineLen, 0);
        lineGrad.addColorStop(0, 'rgba(196,162,58,0)');
        lineGrad.addColorStop(0.3, 'rgba(196,162,58,0.5)');
        lineGrad.addColorStop(0.5, 'rgba(196,162,58,0.8)');
        lineGrad.addColorStop(0.7, 'rgba(196,162,58,0.5)');
        lineGrad.addColorStop(1, 'rgba(196,162,58,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineLen, 215);
        ctx.lineTo(W / 2 + lineLen, 215);
        ctx.stroke();

        drawDiamond(ctx, W / 2, 215, 6, '#c4a23a', ease * 0.8);
        drawDiamond(ctx, W / 2 - lineLen - 5, 215, 4, '#c4a23a', ease * 0.4);
        drawDiamond(ctx, W / 2 + lineLen + 5, 215, 4, '#c4a23a', ease * 0.4);

        ctx.fillStyle = `rgba(255,255,255,${0.5 * ease})`;
        ctx.font = `500 20px ${FB}`;
        ctx.textAlign = 'center';
        if (choices.length > 6) {
            ctx.fillStyle = `rgba(184,217,78,${0.7 * ease})`;
            ctx.fillText(`DEBUG: ALL ${choices.length} UPGRADES  (press number to select)`, W / 2, 242);
        } else {
            ctx.fillText('Choose an upgrade', W / 2, 242);
        }

        // Cards - adaptive sizing based on count
        const totalH = GAME.HEIGHT - 290;
        let cardW, cardH, cardGap, maxPerRow;
        if (choices.length <= 3) {
            cardW = 270; cardH = 320; cardGap = 28; maxPerRow = choices.length;
        } else if (choices.length <= 6) {
            cardW = 220; cardH = 260; cardGap = 18; maxPerRow = choices.length;
        } else if (choices.length <= 12) {
            cardW = 180; cardH = 210; cardGap = 14; maxPerRow = 5;
        } else if (choices.length <= 24) {
            cardW = 150; cardH = 170; cardGap = 10; maxPerRow = 8;
        } else {
            cardW = 130; cardH = 150; cardGap = 8; maxPerRow = 10;
        }
        const rows = Math.ceil(choices.length / maxPerRow);
        const baseY = 270;

        for (let i = 0; i < choices.length; i++) {
            const ch = choices[i];
            const cardDelay = i * 0.04;
            const cardEase = Math.min(1, Math.max(0, (ep - cardDelay) / (1 - cardDelay)));
            const cardScale = 0.6 + cardEase * 0.4;
            const cardAlpha = cardEase;
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const rowCount = Math.min(maxPerRow, choices.length - row * maxPerRow);
            const rowW = cardW * rowCount + cardGap * (rowCount - 1);
            const rowStartX = (W - rowW) / 2;
            const cx = rowStartX + col * (cardW + cardGap);
            const cy = baseY + row * (cardH + cardGap) + (1 - cardScale) * 40;
            const isHovered = this.levelUpScreen.selectedIndex === i;

            const accentColor = ch.kind === 'passive' ? ch.color
                : ch.kind === 'heal' ? '#7c9a6e'
                : ch.kind === 'weapon_unlock' ? '#7c9a6e'
                : ch.kind === 'weapon_levelup' ? (ch.color || '#f1c40f')
                : '#f1c40f';

            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(cardScale, cardScale);
            ctx.translate(-cardW / 2, -cardH / 2);
            ctx.globalAlpha = cardAlpha;

            // Card shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.roundRect(6, 6, cardW, cardH, 18);
            ctx.fill();

            // Card glass background
            drawGlassPanel(ctx, 0, 0, cardW, cardH, 18, hexToRgb(accentColor));

            // Hover: bright glow border
            if (isHovered) {
                drawGlowBorder(ctx, -2, -2, cardW + 4, cardH + 4, 20, '#b8d94e', t, 18);
                drawParticles(ctx, t, cardW / 2, cardH / 2, 6, cardW * 0.5, '#b8d94e', 1.5);
            } else {
                ctx.strokeStyle = `${accentColor}66`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(0, 0, cardW, cardH, 18);
                ctx.stroke();
            }

            // Top accent gradient bar
            const topGrad = ctx.createLinearGradient(0, 0, cardW, 0);
            topGrad.addColorStop(0, `${accentColor}00`);
            topGrad.addColorStop(0.5, accentColor);
            topGrad.addColorStop(1, `${accentColor}00`);
            ctx.fillStyle = topGrad;
            ctx.beginPath();
            ctx.roundRect(0, 0, cardW, 5, [18, 18, 0, 0]);
            ctx.fill();

            // Number badge
            const badgeR = Math.max(9, Math.min(14, cardW * 0.06));
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.arc(cardW - badgeR - 6, badgeR + 6, badgeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(9, Math.round(badgeR * 0.9))}px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, cardW - badgeR - 6, badgeR + 6);
            ctx.textBaseline = 'top';

            // Scale content based on card size
            const cs = cardW / 270;

            // Kind label
            ctx.fillStyle = accentColor;
            ctx.font = `bold ${Math.max(8, Math.round(11 * cs))}px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const kindLabel = ch.kind === 'passive' ? 'PASSIVE'
                : ch.kind === 'heal' ? 'HEAL'
                : ch.kind === 'weapon_unlock' ? 'NEW WEAPON'
                : ch.kind === 'weapon_levelup' ? 'WEAPON'
                : 'UPGRADE';
            ctx.fillText(kindLabel, cardW / 2, Math.round(16 * cs));

            // Icon / number
            ctx.textBaseline = 'middle';
            const iconY = Math.round(65 * cs);
            const iconSize = Math.max(16, Math.round(40 * cs));
            if (ch.kind === 'passive') {
                ctx.font = `${iconSize}px ${FD}`;
                ctx.fillText(ch.icon, cardW / 2, iconY);
            } else if (ch.kind === 'heal') {
                ctx.font = `${iconSize}px ${FD}`;
                ctx.fillStyle = '#7c9a6e';
                ctx.fillText('\u2764\uFE0F', cardW / 2, iconY);
            } else if (ch.kind === 'weapon_unlock') {
                ctx.shadowColor = ch.color || '#2ecc71';
                ctx.shadowBlur = Math.round(16 * cs);
                ctx.fillStyle = ch.color || '#2ecc71';
                ctx.font = `${Math.round(36 * cs)}px ${FD}`;
                ctx.fillText(ch.icon || '\u2694\uFE0F', cardW / 2, iconY);
                ctx.shadowBlur = 0;
            } else if (ch.kind === 'weapon_levelup') {
                ctx.shadowColor = ch.color || '#f1c40f';
                ctx.shadowBlur = Math.round(14 * cs);
                ctx.fillStyle = ch.color || '#f1c40f';
                ctx.font = `${Math.round(32 * cs)}px ${FD}`;
                ctx.fillText(ch.icon || '\u2694\uFE0F', cardW / 2, iconY);
                ctx.shadowBlur = 0;
            } else {
                ctx.shadowColor = accentColor;
                ctx.shadowBlur = Math.round(12 * cs);
                ctx.fillStyle = accentColor;
                ctx.beginPath();
                ctx.arc(cardW / 2, iconY, Math.round(22 * cs), 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#0d1821';
                ctx.font = `bold ${Math.round(20 * cs)}px ${FD}`;
                ctx.fillText(`${i + 1}`, cardW / 2, iconY);
            }

            // Name
            ctx.shadowColor = '#000';
            ctx.shadowBlur = Math.round(4 * cs);
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(10, Math.round(18 * cs))}px ${FD}`;
            ctx.fillText(ch.name, cardW / 2, Math.round(110 * cs));
            ctx.shadowBlur = 0;

            // Description
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = `500 ${Math.max(8, Math.round(12 * cs))}px ${FB}`;
            ctx.fillText(ch.description, cardW / 2, Math.round(135 * cs));

            // Divider
            const divY = Math.round(155 * cs);
            const divGrad = ctx.createLinearGradient(10, 0, cardW - 10, 0);
            divGrad.addColorStop(0, 'rgba(255,255,255,0)');
            divGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
            divGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = divGrad;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(10, divY);
            ctx.lineTo(cardW - 10, divY);
            ctx.stroke();

            // Level
            ctx.fillStyle = accentColor;
            ctx.font = `600 ${Math.max(9, Math.round(14 * cs))}px ${FB}`;
            ctx.fillText(`Level ${ch.currentLevel} \u2192 ${ch.currentLevel + 1}`, cardW / 2, Math.round(175 * cs));

            // Effect preview
            ctx.fillStyle = '#2ecc71';
            ctx.font = `500 ${Math.max(8, Math.round(12 * cs))}px ${FB}`;
            ctx.fillText(this.getEffectPreview(ch), cardW / 2, Math.round(200 * cs));

            // Evolution preview for weapon cards at level 7
            if (ch.kind === 'weapon_levelup' && ch.currentLevel === 7 && cs > 0.5) {
                const evo = this.getEvolutionPreview(ch.weaponTypeId);
                if (evo) {
                    const evoPulse = 0.7 + Math.sin(t * 4) * 0.3;
                    ctx.fillStyle = `rgba(184,217,78,${evoPulse})`;
                    ctx.font = `bold ${Math.max(8, Math.round(11 * cs))}px ${FB}`;
                    ctx.fillText('\u2B50 EVOLVES AT LV.8', cardW / 2, Math.round(225 * cs));
                    ctx.fillStyle = '#e8e4dc';
                    ctx.font = `600 ${Math.max(8, Math.round(11 * cs))}px ${FB}`;
                    ctx.fillText(`\u2192 ${evo.name}`, cardW / 2, Math.round(240 * cs));
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = `500 ${Math.max(7, Math.round(10 * cs))}px ${FB}`;
                    ctx.fillText(`Requires ${evo.requiredPassiveName} Lv.${evo.requiredPassiveLevel}`, cardW / 2, Math.round(255 * cs));
                }
            }

            // Key hint
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = `500 ${Math.max(8, Math.round(12 * cs))}px ${FB}`;
            ctx.fillText(`[${i + 1}]`, cardW / 2, cardH - Math.round(14 * cs));

            ctx.restore();
        }

        ctx.restore();
    }

    getEvolutionPreview(weaponTypeId) {
        for (const key in EVOLUTIONS) {
            const evo = EVOLUTIONS[key];
            if (evo.baseWeaponId === weaponTypeId) {
                const passiveLvl = getPassiveLevel(evo.requiredPassive);
                const passiveName = SHOP_UPGRADES[evo.requiredPassive]?.name || evo.requiredPassive;
                return {
                    name: evo.name,
                    requiredPassive: evo.requiredPassive,
                    requiredPassiveName: passiveName,
                    requiredPassiveLevel: evo.requiredPassiveLevel,
                    ready: passiveLvl >= evo.requiredPassiveLevel
                };
            }
        }
        return null;
    }

    getEffectPreview(choice) {
        if (choice.kind === 'passive') {
            const map = {
                spellbook: 'Cooldown -12%',
                powerstone: 'Damage +20%',
                windboots: 'Speed +15%',
                magnetcharm: 'Range +80px',
                ironheart: 'Max HP +30',
                clovercoin: 'Luck +20%'
            };
            return map[choice.id] || '';
        }
        if (choice.kind === 'heal') return 'Restore 30 HP';
        if (choice.kind === 'weapon_unlock') return 'Unlock a new weapon!';
        if (choice.kind === 'weapon_levelup') {
            if (choice.weaponTypeId === 'orbiting_blade') {
                const nextLvl = choice.currentLevel + 1;
                return `Rings: ${choice.currentLevel} \u2192 ${nextLvl}`;
            }
            return `Level ${choice.currentLevel} \u2192 ${choice.currentLevel + 1}`;
        }
        const map = {
            damage: 'Thorn Damage +20%',
            firerate: 'Bloom Speed +12%',
            projspeed: 'Seed Velocity +15%',
            movespeed: 'Drift Speed +12%',
            maxhp: 'Vital Sap +20',
            magnet: 'Root Range +40%'
        };
        return map[choice.id] || '';
    }

    getLevelUpChoiceAt(mx, my) {
        if (!this.levelUpScreen) return -1;
        const choices = this.levelUpScreen.choices;
        let cardW, cardH, cardGap, maxPerRow;
        if (choices.length <= 3) {
            cardW = 270; cardH = 320; cardGap = 28; maxPerRow = choices.length;
        } else if (choices.length <= 6) {
            cardW = 220; cardH = 260; cardGap = 18; maxPerRow = choices.length;
        } else if (choices.length <= 12) {
            cardW = 180; cardH = 210; cardGap = 14; maxPerRow = 5;
        } else if (choices.length <= 24) {
            cardW = 150; cardH = 170; cardGap = 10; maxPerRow = 8;
        } else {
            cardW = 130; cardH = 150; cardGap = 8; maxPerRow = 10;
        }
        const startY = 270;
        for (let i = 0; i < choices.length; i++) {
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const rowCount = Math.min(maxPerRow, choices.length - row * maxPerRow);
            const rowW = cardW * rowCount + cardGap * (rowCount - 1);
            const rowStartX = (GAME.WIDTH - rowW) / 2;
            const cx = rowStartX + col * (cardW + cardGap);
            const cy = startY + row * (cardH + cardGap);
            if (mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) return i;
        }
        return -1;
    }

    setLevelUpHover(index) {
        if (this.levelUpScreen) this.levelUpScreen.selectedIndex = index;
    }

    // --- Chest Reward Screen ---

    showChestReward(reward) {
        this.chestRewardScreen = {
            reward, timer: 0, phase: 'shake',
            shakeX: 0, shakeY: 0, revealAlpha: 0, enterProgress: 0
        };
    }

    hideChestReward() { this.chestRewardScreen = null; }
    isChestRewardVisible() { return this.chestRewardScreen !== null; }

    updateChestReward(dt) {
        if (!this.chestRewardScreen) return;
        const s = this.chestRewardScreen;
        s.timer += dt;
        s.enterProgress = Math.min(s.enterProgress + dt * 2, 1);

        if (s.phase === 'shake' && s.timer >= CHEST.ANIM_SHAKE_DURATION) {
            s.phase = 'burst'; s.timer = 0;
        } else if (s.phase === 'burst' && s.timer >= CHEST.ANIM_BURST_DURATION) {
            s.phase = 'reveal'; s.timer = 0;
        }

        if (s.phase === 'shake') {
            const intensity = 10 * (1 - s.timer / CHEST.ANIM_SHAKE_DURATION);
            s.shakeX = (Math.random() - 0.5) * intensity * 2;
            s.shakeY = (Math.random() - 0.5) * intensity * 2;
        } else {
            s.shakeX = 0;
            s.shakeY = 0;
        }

        if (s.phase === 'reveal') s.revealAlpha = Math.min(1, s.timer / 0.3);
    }

    drawChestReward(ctx) {
        if (!this.chestRewardScreen) return;
        const s = this.chestRewardScreen;
        const reward = s.reward;
        const cx = GAME.WIDTH / 2;
        const cy = GAME.HEIGHT / 2;
        const t = s.timer;

        // Dark overlay
        const vigGrad = ctx.createRadialGradient(cx, cy, 100, cx, cy, GAME.WIDTH * 0.6);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.93)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

        this.drawBackgroundParticles(ctx, t);

        ctx.save();
        ctx.translate(s.shakeX, s.shakeY);

        if (s.phase === 'shake') this.drawClosedChest(ctx, cx, cy, t);
        if (s.phase === 'burst') {
            const progress = s.timer / CHEST.ANIM_BURST_DURATION;
            const burstR = 50 + progress * 500;
            const alpha = 1 - progress;

            // Multi-ring burst
            for (let ring = 0; ring < 3; ring++) {
                const ringR = burstR * (0.5 + ring * 0.25);
                const ringAlpha = alpha * (1 - ring * 0.3);
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR);
                grad.addColorStop(0, `rgba(241,196,15,${ringAlpha * 0.8})`);
                grad.addColorStop(0.4, `rgba(255,255,200,${ringAlpha * 0.4})`);
                grad.addColorStop(1, `rgba(241,196,15,0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
                ctx.fill();
            }

            // Radial light rays
            ctx.save();
            ctx.translate(cx, cy);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + t * 2;
                const rayLen = 150 + progress * 250;
                ctx.fillStyle = `rgba(241,196,15,${alpha * 0.15})`;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle - 0.08) * rayLen, Math.sin(angle - 0.08) * rayLen);
                ctx.lineTo(Math.cos(angle + 0.08) * rayLen, Math.sin(angle + 0.08) * rayLen);
                ctx.fill();
            }
            ctx.restore();

            this.drawOpenChest(ctx, cx, cy);
        }

        if (s.phase === 'reveal') {
            this.drawOpenChest(ctx, cx, cy - 60);

            ctx.globalAlpha = s.revealAlpha;
            this.drawRewardCard(ctx, cx, cy + 120, reward, t);
            ctx.globalAlpha = 1;

            if (s.revealAlpha > 0.8) {
                const pulse = 0.3 + Math.sin(t * 3) * 0.15;
                ctx.fillStyle = `rgba(255,255,255,${pulse})`;
                ctx.font = `500 16px ${FB}`;
                ctx.textAlign = 'center';
                ctx.fillText('Press [SPACE] or Click to continue', cx, cy + 310);
            }
        }

        ctx.restore();
    }

    drawClosedChest(ctx, cx, cy, t) {
        const s = CHEST.SIZE * 1.5;
        const drawY = cy - 20;
        const shake = Math.sin(t * 30) * 3;

        drawParticles(ctx, t, cx, drawY, 6, 60, '#c4a23a', 1);

        ctx.fillStyle = CHEST.GLOW_COLOR;
        ctx.beginPath();
        ctx.arc(cx, drawY, CHEST.GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        const bodyGrad = ctx.createLinearGradient(cx - s / 2, drawY - s / 4, cx + s / 2, drawY + s / 2);
        bodyGrad.addColorStop(0, '#f5b041');
        bodyGrad.addColorStop(0.5, '#f39c12');
        bodyGrad.addColorStop(1, '#d68910');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(cx - s / 2 + shake, drawY - s / 4, s, s * 0.65, 6);
        ctx.fill();

        ctx.fillStyle = '#d68910';
        ctx.beginPath();
        ctx.roundRect(cx - s / 2 - 2 + shake, drawY - s / 4 - s * 0.28, s + 4, s * 0.28, [8, 8, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#b8860b';
        ctx.fillRect(cx - s / 2 + shake, drawY - s / 4 - 2, s, 4);
    }

    drawOpenChest(ctx, cx, cy) {
        const s = CHEST.SIZE * 1.5;

        drawParticles(ctx, s.timer || 0, cx, cy, 8, 80, '#c4a23a', 2);

        ctx.fillStyle = 'rgba(241,196,15,0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, CHEST.GLOW_RADIUS * 1.3, 0, Math.PI * 2);
        ctx.fill();

        const bodyGrad = ctx.createLinearGradient(cx - s / 2, cy, cx + s / 2, cy + s * 0.6);
        bodyGrad.addColorStop(0, '#f5b041');
        bodyGrad.addColorStop(1, '#d68910');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(cx - s / 2, cy, s, s * 0.55, 4);
        ctx.fill();

        ctx.fillStyle = '#d68910';
        ctx.save();
        ctx.translate(cx - s / 2 - 2, cy);
        ctx.rotate(-0.5);
        ctx.beginPath();
        ctx.roundRect(0, -s * 0.22, s + 4, s * 0.22, [8, 8, 0, 0]);
        ctx.fill();
        ctx.restore();

        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
        innerGrad.addColorStop(0, 'rgba(241,196,15,0.4)');
        innerGrad.addColorStop(1, 'rgba(241,196,15,0)');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRewardCard(ctx, cx, cy, reward, t) {
        const cardW = 440;
        const cardH = 180;
        const cardX = cx - cardW / 2;
        const cardY = cy - cardH / 2;

        let typeColor = '#f1c40f';
        let typeLabel = '';
        switch (reward.type) {
            case 'evolution': typeColor = '#f1c40f'; typeLabel = 'WEAPON EVOLUTION'; break;
            case 'weapon_levelup': typeColor = '#3498db'; typeLabel = 'WEAPON UPGRADE'; break;
            case 'weapon_upgrade': typeColor = '#3498db'; typeLabel = 'WEAPON UPGRADE'; break;
            case 'passive_upgrade': typeColor = '#e74c3c'; typeLabel = 'PASSIVE UPGRADE'; break;
            case 'heal': typeColor = '#2ecc71'; typeLabel = 'HEAL'; break;
            case 'coins': typeColor = '#f39c12'; typeLabel = 'COINS'; break;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(cardX + 5, cardY + 5, cardW, cardH, 18);
        ctx.fill();

        drawGlassPanel(ctx, cardX, cardY, cardW, cardH, 18, hexToRgb(typeColor));
        drawGlowBorder(ctx, cardX - 1, cardY - 1, cardW + 2, cardH + 2, 19, '#c4a23a', t, 10);

        // Top gradient accent
        const topGrad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
        topGrad.addColorStop(0, `${typeColor}00`);
        topGrad.addColorStop(0.5, typeColor);
        topGrad.addColorStop(1, `${typeColor}00`);
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.roundRect(cardX + 1, cardY + 1, cardW - 2, 5, [18, 18, 0, 0]);
        ctx.fill();

        // Treasure label
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 13px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('\uD83C\uDF81  TREASURE', cx, cardY + 16);

        ctx.fillStyle = typeColor;
        ctx.font = `bold 11px ${FB}`;
        ctx.fillText(typeLabel, cx, cardY + 36);

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 26px ${FD}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(reward.name, cx, cardY + 80);
        ctx.shadowBlur = 0;

        if (reward.currentLevel !== undefined) {
            ctx.fillStyle = typeColor;
            ctx.font = `600 16px ${FB}`;
            ctx.fillText(`Level ${reward.currentLevel} \u2192 ${reward.currentLevel + 1}`, cx, cardY + 115);
        } else if (reward.type === 'evolution') {
            ctx.fillStyle = '#c4a23a';
            ctx.shadowColor = '#c4a23a';
            ctx.shadowBlur = 12;
            ctx.font = `bold 18px ${FD}`;
            ctx.fillText('\u2B50  EVOLVED  \u2B50', cx, cardY + 115);
            ctx.shadowBlur = 0;
        } else if (reward.type === 'heal') {
            ctx.fillStyle = '#7c9a6e';
            ctx.font = `600 16px ${FB}`;
            ctx.fillText(`+${reward.amount} HP`, cx, cardY + 115);
        } else if (reward.type === 'coins') {
            ctx.fillStyle = '#c4a23a';
            ctx.font = `600 16px ${FB}`;
            ctx.fillText(`+${reward.amount} Seeds`, cx, cardY + 115);
        }

        drawDiamond(ctx, cardX + 20, cardY + cardH / 2, 4, '#c4a23a', 0.4);
        drawDiamond(ctx, cardX + cardW - 20, cardY + cardH / 2, 4, '#c4a23a', 0.4);
    }

    // --- Evolution Animation ---

    drawEvolutionAnim(ctx, anim) {
        const t = anim.timer;
        const dur = anim.duration;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const cx = W / 2;
        const cy = H / 2;

        const fadeIn = Math.min(1, t / 0.3);
        const hold = t > 0.3 && t < dur - 0.5 ? 1 : 0;
        const fadeOut = Math.max(0, (dur - t) / 0.5);
        const alpha = fadeIn * fadeOut;

        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        const vigGrad = ctx.createRadialGradient(cx, cy, 100, cx, cy, W * 0.5);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.88)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        const color = anim.color || '#f1c40f';
        const pulse = 0.8 + Math.sin(t * 8) * 0.2;
        const expandR = 50 + Math.min(t * 200, 300);

        for (let ring = 0; ring < 4; ring++) {
            const r = expandR * (0.4 + ring * 0.2);
            const ringAlpha = alpha * (1 - ring * 0.2) * pulse;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, `rgba(255,255,200,${ringAlpha * 0.5})`);
            grad.addColorStop(0.5, `${color}${Math.min(255, Math.floor(ringAlpha * 120)).toString(16).padStart(2, '0')}`);
            grad.addColorStop(1, `${color}00`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + t * 3;
            const rayLen = 100 + Math.sin(t * 5 + i) * 40;
            ctx.fillStyle = `${color}${Math.floor(alpha * 60).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle - 0.06) * rayLen, Math.sin(angle - 0.06) * rayLen);
            ctx.lineTo(Math.cos(angle + 0.06) * rayLen, Math.sin(angle + 0.06) * rayLen);
            ctx.fill();
        }
        ctx.restore();

        const textScale = 0.5 + fadeIn * 0.5;
        ctx.save();
        ctx.translate(cx, cy - 30);
        ctx.scale(textScale, textScale);

        ctx.shadowColor = '#c4a23a';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 52px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EVOLUTION!', 0, 0);
        ctx.shadowBlur = 15;
        ctx.fillText('EVOLUTION!', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        const nameScale = 0.5 + fadeIn * 0.5;
        ctx.save();
        ctx.translate(cx, cy + 40);
        ctx.scale(nameScale, nameScale);

        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.font = `bold 38px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(anim.name, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        drawParticles(ctx, t, cx, cy, 12, 180, color, 2);

        ctx.restore();
    }

    // --- Game Over ---

    showGameOver(stats) { this.gameOverScreen = stats; }
    hideGameOver() { this.gameOverScreen = null; }

    drawGameOver(ctx) {
        if (!this.gameOverScreen) return;
        const stats = this.gameOverScreen;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.65);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.93)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        this.drawBackgroundParticles(ctx, this.hudTimer);

        // Title
        ctx.save();
        ctx.shadowColor = '#8b3a62';
        ctx.shadowBlur = 30;
        const titleGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
        titleGrad.addColorStop(0, '#6b2a48');
        titleGrad.addColorStop(0.5, '#8b3a62');
        titleGrad.addColorStop(1, '#6b2a48');
        ctx.fillStyle = titleGrad;
        ctx.font = `bold 78px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', W / 2, 260);
        ctx.shadowBlur = 15;
        ctx.fillText('GAME OVER', W / 2, 260);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Red accent line
        const lineGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
        lineGrad.addColorStop(0, 'rgba(139,58,98,0)');
        lineGrad.addColorStop(0.5, 'rgba(139,58,98,0.7)');
        lineGrad.addColorStop(1, 'rgba(139,58,98,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 200, 295);
        ctx.lineTo(W / 2 + 200, 295);
        ctx.stroke();

        drawDiamond(ctx, W / 2, 295, 6, '#8b3a62', 0.7);

        // Stats card
        const statW = 380;
        const statH = 400;
        const statX = W / 2 - statW / 2;
        const statY = 310;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(statX + 4, statY + 4, statW, statH, 16);
        ctx.fill();

        drawGlassPanel(ctx, statX, statY, statW, statH, 16, { r: 100, g: 40, b: 65 });
        drawGlowBorder(ctx, statX - 1, statY - 1, statW + 2, statH + 2, 17, '#8b3a62', this.hudTimer, 8);

        // Stat rows
        const rows = [
            { icon: '\u23F1', label: 'Survived', value: `${Math.floor(stats.elapsedTime / 60).toString().padStart(2, '0')}:${Math.floor(stats.elapsedTime % 60).toString().padStart(2, '0')}`, color: '#e8e4dc' },
            { icon: '\u2620', label: 'Blight Slain', value: `${stats.kills}`, color: '#8b3a62' },
            { icon: '\uD83C\uDF3F', label: 'Bloom Bosses', value: `${stats.bossesKilled}`, color: '#5a8f7c' },
            { icon: '\u2B50', label: 'Level', value: `${stats.level}`, color: '#7b5ea7' },
            { icon: '\uD83D\uDCB0', label: 'Seeds Earned', value: `${stats.runCoins}`, color: '#c4a23a' },
            { icon: '\uD83D\uDD25', label: 'Total Seeds', value: `${stats.totalCoins}`, color: '#b8d94e' }
        ];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const ry = statY + 40 + i * 60;

            if (i > 0) {
                const divGrad = ctx.createLinearGradient(statX + 30, 0, statX + statW - 30, 0);
                divGrad.addColorStop(0, 'rgba(255,255,255,0)');
                divGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
                divGrad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.strokeStyle = divGrad;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(statX + 30, ry - 10);
                ctx.lineTo(statX + statW - 30, ry - 10);
                ctx.stroke();
            }

            ctx.font = `22px ${FD}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText(r.icon, statX + 35, ry + 15);

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = `500 14px ${FB}`;
            ctx.fillText(r.label, statX + 65, ry + 8);

            ctx.fillStyle = r.color;
            ctx.shadowColor = r.color;
            ctx.shadowBlur = 6;
            ctx.font = `bold 32px ${FD}`;
            ctx.textAlign = 'right';
            ctx.fillText(r.value, statX + statW - 35, ry + 18);
            ctx.shadowBlur = 0;
        }

        // Buttons
        const btnW = 260;
        const btnH = 50;
        const btnGap = 20;

        // Calculate extra space needed for synergies/achievements
        let extraSpace = 0;
        const hasSynergies = stats.activeSynergies && stats.activeSynergies.length > 0;
        const hasAchievements = stats.newAchievements && stats.newAchievements.length > 0;
        if (hasSynergies) extraSpace += 22;
        if (hasAchievements) extraSpace += 40;
        const btnY = statY + statH + 35 + extraSpace;

        // Active synergies display
        if (hasSynergies) {
            const synY = statY + statH + 10;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = `500 12px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const synText = stats.activeSynergies.map(s => `${s.icon} ${s.name}`).join('  \u2022  ');
            ctx.fillText(synText, W / 2, synY);
        }

        // New achievements
        if (hasAchievements) {
            const achY = statY + statH + 28 + (hasSynergies ? 22 : 0);
            const achAlpha = 0.7 + Math.sin(this.hudTimer * 3) * 0.3;
            ctx.fillStyle = `rgba(196,162,58,${achAlpha})`;
            ctx.font = `bold 13px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('\u2B50 ACHIEVEMENTS UNLOCKED', W / 2, achY);
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `500 12px ${FB}`;
            const achText = stats.newAchievements.map(a => `${a.icon} ${a.name}`).join('  \u2022  ');
            ctx.fillText(achText, W / 2, achY + 18);
        }

        // Store button rects for hit testing
        this._gameOverShopRect = { x: W / 2 - btnW - btnGap / 2, y: btnY, w: btnW, h: btnH };
        this._gameOverRestartRect = { x: W / 2 + btnGap / 2, y: btnY, w: btnW, h: btnH };

        // Hover detection
        const shopHover = this.mouseX >= this._gameOverShopRect.x && this.mouseX <= this._gameOverShopRect.x + btnW &&
                          this.mouseY >= btnY && this.mouseY <= btnY + btnH;
        const restartHover = this.mouseX >= this._gameOverRestartRect.x && this.mouseX <= this._gameOverRestartRect.x + btnW &&
                            this.mouseY >= btnY && this.mouseY <= btnY + btnH;

        // Return to Shop button
        const shopBtnX = W / 2 - btnW - btnGap / 2;
        const shopScale = shopHover ? 1.08 : 1 + Math.sin(this.hudTimer * 3) * 0.015;
        const shopGlow = shopHover ? 16 : 6;

        ctx.save();
        ctx.translate(shopBtnX + btnW / 2, btnY + btnH / 2);
        ctx.scale(shopScale, shopScale);
        ctx.translate(-btnW / 2, -btnH / 2);

        const shopGrad = ctx.createLinearGradient(0, 0, 0, btnH);
        shopGrad.addColorStop(0, shopHover ? '#6aaf8c' : '#5a8f7c');
        shopGrad.addColorStop(1, shopHover ? '#4d7d62' : '#3d6b52');
        ctx.fillStyle = shopGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, btnW, btnH, 25);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(2, 2, btnW - 4, btnH * 0.45, [23, 23, 0, 0]);
        ctx.fill();

        drawGlowBorder(ctx, -1, -1, btnW + 2, btnH + 2, 26, '#5a8f7c', this.hudTimer, shopGlow);

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 18px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uD83D\uDDC2  Sanctum', btnW / 2, btnH / 2);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Quick Restart button
        const restartBtnX = W / 2 + btnGap / 2;
        const restartScale = restartHover ? 1.08 : 1 + Math.sin(this.hudTimer * 3 + 1) * 0.015;
        const restartGlow = restartHover ? 16 : 6;

        ctx.save();
        ctx.translate(restartBtnX + btnW / 2, btnY + btnH / 2);
        ctx.scale(restartScale, restartScale);
        ctx.translate(-btnW / 2, -btnH / 2);

        const restartGrad = ctx.createLinearGradient(0, 0, 0, btnH);
        restartGrad.addColorStop(0, restartHover ? '#8caa7e' : '#7c9a6e');
        restartGrad.addColorStop(1, restartHover ? '#6a8a4c' : '#5a7a3c');
        ctx.fillStyle = restartGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, btnW, btnH, 25);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(2, 2, btnW - 4, btnH * 0.45, [23, 23, 0, 0]);
        ctx.fill();

        drawGlowBorder(ctx, -1, -1, btnW + 2, btnH + 2, 26, '#7c9a6e', this.hudTimer, restartGlow);

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 18px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2788  Restart', btnW / 2, btnH / 2);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // --- Shop Screen ---

    showShop(shopSystem) {
        this.shopScreen = { shopSystem, animTimer: 0 };
        this.gameOverScreen = null;
    }

    hideShop() { this.shopScreen = null; }
    isShopVisible() { return this.shopScreen !== null; }

    drawShop(ctx, shopSystem, sound) {
        this.hudTimer += 0.016;
        this.updateParticles(0.016);
        const t = this.hudTimer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        // Dark background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);

        this.drawBackgroundParticles(ctx, t);

        // Title
        ctx.save();
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 30;
        const titleGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
        titleGrad.addColorStop(0, '#f39c12');
        titleGrad.addColorStop(0.5, '#f1c40f');
        titleGrad.addColorStop(1, '#f39c12');
        ctx.fillStyle = titleGrad;
        ctx.font = `bold 64px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BLOOMKEEPER\'S SANCTUM', W / 2, 100);
        ctx.shadowBlur = 15;
        ctx.fillText('BLOOMKEEPER\'S SANCTUM', W / 2, 100);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Decorative line
        const lineLen = 250;
        const lineGrad = ctx.createLinearGradient(W / 2 - lineLen, 0, W / 2 + lineLen, 0);
        lineGrad.addColorStop(0, 'rgba(243,156,18,0)');
        lineGrad.addColorStop(0.5, 'rgba(243,156,18,0.6)');
        lineGrad.addColorStop(1, 'rgba(243,156,18,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineLen, 135);
        ctx.lineTo(W / 2 + lineLen, 135);
        ctx.stroke();

        drawDiamond(ctx, W / 2, 135, 6, '#f39c12', 0.7);

        // Total coins
        ctx.save();
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#f39c12';
        ctx.font = `bold 32px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`\uD83D\uDCB0  ${shopSystem.totalCoins}`, W / 2, 175);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Upgrade cards - 2 rows of 3
        const keys = Object.keys(SHOP_UPGRADES);
        const cardW = 280;
        const cardH = 160;
        const gapX = 30;
        const gapY = 25;
        const totalW = cardW * 3 + gapX * 2;
        const startX = (W - totalW) / 2;
        const startY = 220;

        this._shopCardRects = {};
        this._shopLevels = shopSystem.upgradeLevels;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const cfg = SHOP_UPGRADES[key];
            const lvl = shopSystem.getLevel(key);
            const cost = shopSystem.getCost(key);
            const canBuy = shopSystem.canAfford(key);
            const maxed = shopSystem.isMaxed(key);

            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = startX + col * (cardW + gapX);
            const cy = startY + row * (cardH + gapY);

            this._shopCardRects[key] = { x: cx, y: cy, w: cardW, h: cardH };

            const isHovered = this.mouseX >= cx && this.mouseX <= cx + cardW &&
                              this.mouseY >= cy && this.mouseY <= cy + cardH;
            const locked = !canBuy && !maxed;

            const tint = hexToRgb(cfg.color);

            if (locked) {
                ctx.save();
                ctx.globalAlpha = 0.35;
                drawGlassPanel(ctx, cx, cy, cardW, cardH, 16, tint);

                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cx, cy, cardW, cardH, 16);
                ctx.stroke();
                ctx.restore();
            } else if (isHovered) {
                const pulse = 1 + Math.sin(t * 4) * 0.02;
                ctx.save();
                ctx.translate(cx + cardW / 2, cy + cardH / 2);
                ctx.scale(pulse, pulse);
                ctx.translate(-cardW / 2, -cardH / 2);
                drawGlassPanel(ctx, 0, 0, cardW, cardH, 16, tint);
                drawGlowBorder(ctx, -2, -2, cardW + 4, cardH + 4, 18, cfg.color, t, 14);
                ctx.restore();
            } else {
                drawGlassPanel(ctx, cx, cy, cardW, cardH, 16, tint);
                drawGlowBorder(ctx, cx - 1, cy - 1, cardW + 2, cardH + 2, 17, cfg.color, t, 10);
            }

            ctx.save();
            if (locked) ctx.globalAlpha = 0.35;

            // Icon
            ctx.font = `36px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(cfg.icon, cx + cardW / 2, cy + 35);

            // Name
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#fff';
            ctx.font = `bold 18px ${FD}`;
            ctx.fillText(cfg.name, cx + cardW / 2, cy + 70);
            ctx.shadowBlur = 0;

            // Description
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = `500 12px ${FB}`;
            ctx.fillText(cfg.description, cx + cardW / 2, cy + 92);

            // Level
            ctx.fillStyle = cfg.color;
            ctx.font = `600 14px ${FB}`;
            ctx.fillText(`Lv. ${lvl} / ${cfg.maxLevel}`, cx + cardW / 2, cy + 115);

            // Cost or MAXED
            if (maxed) {
                ctx.fillStyle = '#7c9a6e';
                ctx.font = `bold 16px ${FD}`;
                ctx.fillText('MAXED', cx + cardW / 2, cy + 142);
            } else {
                ctx.fillStyle = canBuy ? '#f39c12' : '#666';
                ctx.font = `bold 16px ${FD}`;
                ctx.fillText(`${cost} coins`, cx + cardW / 2, cy + 142);
            }

            ctx.restore();
        }

        // Buttons row
        const btnH = 56;
        const btnGap = 20;
        const backW = 260;
        const resetW = 220;
        const totalBtnW = backW + resetW + btnGap;
        const btnStartX = (W - totalBtnW) / 2;
        const btnY = startY + 2 * (cardH + gapY) + 20;

        // Back to Menu button
        const backX = btnStartX;
        this._shopBackRect = { x: backX, y: btnY, w: backW, h: btnH };
        const backHover = this.mouseX >= backX && this.mouseX <= backX + backW &&
                          this.mouseY >= btnY && this.mouseY <= btnY + btnH;

        ctx.save();
        ctx.translate(backX + backW / 2, btnY + btnH / 2);
        const backPulse = backHover ? 1 + Math.sin(t * 4) * 0.03 : 1;
        ctx.scale(backPulse, backPulse);
        ctx.translate(-backW / 2, -btnH / 2);

        const backGrad = ctx.createLinearGradient(0, 0, 0, btnH);
        backGrad.addColorStop(0, '#4a4a50');
        backGrad.addColorStop(1, '#3a3a40');
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, backW, btnH, 16);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(2, 2, backW - 4, btnH * 0.45, [14, 14, 0, 0]);
        ctx.fill();

        if (backHover) {
            drawGlowBorder(ctx, -2, -2, backW + 4, btnH + 4, 18, '#7b5ea7', t, 12);
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-1, -1, backW + 2, btnH + 2, 17);
            ctx.stroke();
        }

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#e8e4dc';
        ctx.font = `bold 20px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2190  Back to Menu', backW / 2, btnH / 2);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Reset button
        const resetX = backX + backW + btnGap;
        this._shopResetRect = { x: resetX, y: btnY, w: resetW, h: btnH };
        const resetHover = this.mouseX >= resetX && this.mouseX <= resetX + resetW &&
                           this.mouseY >= btnY && this.mouseY <= btnY + btnH;

        const hasUpgrades = Object.values(this._shopLevels || {}).some(v => v > 0);

        ctx.save();
        ctx.translate(resetX + resetW / 2, btnY + btnH / 2);
        const resetPulse = (resetHover && hasUpgrades) ? 1 + Math.sin(t * 4) * 0.03 : 1;
        ctx.scale(resetPulse, resetPulse);
        ctx.translate(-resetW / 2, -btnH / 2);

        const resetGrad = ctx.createLinearGradient(0, 0, 0, btnH);
        resetGrad.addColorStop(0, hasUpgrades ? '#6a3030' : '#3a3a3a');
        resetGrad.addColorStop(1, hasUpgrades ? '#4a1818' : '#2a2a2a');
        ctx.fillStyle = resetGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, resetW, btnH, 16);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(2, 2, resetW - 4, btnH * 0.45, [14, 14, 0, 0]);
        ctx.fill();

        if (resetHover && hasUpgrades) {
            drawGlowBorder(ctx, -2, -2, resetW + 4, btnH + 4, 18, '#c44444', t, 12);
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-1, -1, resetW + 2, btnH + 2, 17);
            ctx.stroke();
        }

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = hasUpgrades ? '#e8a0a0' : '#666';
        ctx.font = `bold 20px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u21BB  Reset All', resetW / 2, btnH / 2);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    getShopUpgradeAt(mx, my) {
        if (!this._shopCardRects) return null;
        for (const [key, rect] of Object.entries(this._shopCardRects)) {
            if (mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h) {
                return key;
            }
        }
        return null;
    }

    isShopButtonAt(mx, my, buttonId) {
        if (buttonId === 'back' && this._shopBackRect) {
            const r = this._shopBackRect;
            return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
        }
        if (buttonId === 'reset' && this._shopResetRect) {
            const r = this._shopResetRect;
            return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
        }
        if (buttonId === 'shop' && this._gameOverShopRect) {
            const r = this._gameOverShopRect;
            return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
        }
        if (buttonId === 'restart' && this._gameOverRestartRect) {
            const r = this._gameOverRestartRect;
            return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
        }
        return false;
    }

    // --- Shop Reset Confirm ---

    showShopResetConfirm(refundAmount) { this.shopResetConfirm = { refundAmount }; }
    hideShopResetConfirm() { this.shopResetConfirm = null; }

    drawSettingsResetConfirm(ctx) {
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const t = this.hudTimer;

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);

        const boxW = 440;
        const boxH = 240;
        const boxX = (W - boxW) / 2;
        const boxY = (H - boxH) / 2;

        ctx.fillStyle = 'rgba(18,18,24,0.95)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();

        ctx.strokeStyle = 'rgba(196,68,68,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.stroke();

        ctx.fillStyle = '#c44444';
        ctx.font = `bold 32px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Reset All Progress?', W / 2, boxY + 50);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.fillText('This will erase all save data,', W / 2, boxY + 90);
        ctx.fillText('upgrades, coins, achievements, and run history.', W / 2, boxY + 112);

        const btnW = 170;
        const btnH = 48;
        const btnGap = 24;
        const btnY = boxY + boxH - btnH - 24;

        const yesX = W / 2 - btnW - btnGap / 2;
        const noX = W / 2 + btnGap / 2;

        this._settingsResetConfirmRects = {
            yes: { x: yesX, y: btnY, w: btnW, h: btnH },
            no: { x: noX, y: btnY, w: btnW, h: btnH }
        };

        const yesHover = this.mouseX >= yesX && this.mouseX <= yesX + btnW &&
                         this.mouseY >= btnY && this.mouseY <= btnY + btnH;
        const noHover = this.mouseX >= noX && this.mouseX <= noX + btnW &&
                        this.mouseY >= btnY && this.mouseY <= btnY + btnH;

        const drawBtn = (x, y, w, h, label, color1, color2, glow, hovered) => {
            const pulse = hovered ? 1 + Math.sin(t * 4) * 0.03 : 1;
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-w / 2, -h / 2);

            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, 14);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(2, 2, w - 4, h * 0.45, [12, 12, 0, 0]);
            ctx.fill();

            if (hovered) {
                drawGlowBorder(ctx, -2, -2, w + 4, h + 4, 16, glow, t, 12);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(-1, -1, w + 2, h + 2, 15);
                ctx.stroke();
            }

            ctx.fillStyle = hovered ? '#fff' : '#e8e4dc';
            ctx.font = `bold 18px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, w / 2, h / 2);
            ctx.restore();
        };

        drawBtn(yesX, btnY, btnW, btnH, '\u2714  Reset', '#6a3030', '#4a1818', '#c44444', yesHover);
        drawBtn(noX, btnY, btnW, btnH, '\u2716  Cancel', '#4a4a50', '#3a3a40', '#7b5ea7', noHover);
    }

    drawShopResetConfirm(ctx) {
        if (!this.shopResetConfirm) return;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const t = this.hudTimer;

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);

        const boxW = 460;
        const boxH = 280;
        const boxX = (W - boxW) / 2;
        const boxY = (H - boxH) / 2;

        ctx.fillStyle = 'rgba(18,18,24,0.95)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();

        ctx.strokeStyle = 'rgba(196,68,68,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.stroke();

        ctx.shadowColor = '#c44444';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#c44444';
        ctx.font = `bold 36px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Reset All Upgrades?', W / 2, boxY + 55);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `500 18px ${FB}`;
        ctx.fillText('All upgrades will be reset to Lv.0', W / 2, boxY + 100);
        ctx.fillStyle = '#f39c12';
        ctx.font = `bold 20px ${FD}`;
        ctx.fillText(`\uD83D\uDCB0  ${this.shopResetConfirm.refundAmount} coins refunded`, W / 2, boxY + 132);

        const btnW = 180;
        const btnH = 52;
        const btnGap = 30;
        const btnY = boxY + boxH - btnH - 30;

        const yesX = W / 2 - btnW - btnGap / 2;
        const noX = W / 2 + btnGap / 2;

        this._shopResetConfirmRects = {
            yes: { x: yesX, y: btnY, w: btnW, h: btnH },
            no: { x: noX, y: btnY, w: btnW, h: btnH }
        };

        const yesHover = this.mouseX >= yesX && this.mouseX <= yesX + btnW &&
                         this.mouseY >= btnY && this.mouseY <= btnY + btnH;
        const noHover = this.mouseX >= noX && this.mouseX <= noX + btnW &&
                        this.mouseY >= btnY && this.mouseY <= btnY + btnH;

        const drawBtn = (x, y, w, h, label, color1, color2, glow, hovered) => {
            const pulse = hovered ? 1 + Math.sin(t * 4) * 0.03 : 1;
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-w / 2, -h / 2);

            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, 14);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(2, 2, w - 4, h * 0.45, [12, 12, 0, 0]);
            ctx.fill();

            if (hovered) {
                drawGlowBorder(ctx, -2, -2, w + 4, h + 4, 16, glow, t, 12);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(-1, -1, w + 2, h + 2, 15);
                ctx.stroke();
            }

            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillStyle = hovered ? '#fff' : '#e8e4dc';
            ctx.font = `bold 20px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, w / 2, h / 2);
            ctx.shadowBlur = 0;
            ctx.restore();
        };

        drawBtn(yesX, btnY, btnW, btnH, '\u2714  Reset', '#6a3030', '#4a1818', '#c44444', yesHover);
        drawBtn(noX, btnY, btnW, btnH, '\u2716  Cancel', '#4a4a50', '#3a3a40', '#7b5ea7', noHover);
    }

    isShopResetConfirmButtonAt(mx, my, buttonId) {
        if (!this._shopResetConfirmRects || !this._shopResetConfirmRects[buttonId]) return false;
        const r = this._shopResetConfirmRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    // --- Low Health Warning ---

    drawLowHealthWarning(ctx, pulse) {
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const alpha = 0.2 + Math.sin(pulse) * 0.12;

        // Main red vignette
        const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.6, `rgba(120,20,30,${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(140,20,30,${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Edge pulse ring
        const ringAlpha = 0.08 + Math.sin(pulse * 1.5) * 0.06;
        const ringGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.55);
        ringGrad.addColorStop(0, 'rgba(0,0,0,0)');
        ringGrad.addColorStop(0.5, `rgba(200,30,40,${ringAlpha})`);
        ringGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ringGrad;
        ctx.fillRect(0, 0, W, H);
    }

    // --- Mute Button ---

    drawMuteButton(ctx, isMuted) {
        const size = 36;
        const x = GAME.WIDTH - 50;
        const y = 10;

        this._muteRect = { x, y, w: size, h: size };

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 10);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 10);
        ctx.stroke();

        ctx.fillStyle = isMuted ? '#e74c3c' : '#fff';
        ctx.font = `18px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A', x + size / 2, y + size / 2);
    }

    isMuteButtonAt(mx, my) {
        if (!this._muteRect) return false;
        const r = this._muteRect;
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    // --- Main Menu ---

    showMenu() {
        this.menuScreen = { animTimer: 0 };
    }

    hideMenu() { this.menuScreen = null; }

    showCharacters() {
        this.charScreen = { animTimer: 0 };
    }
    hideCharacters() { this.charScreen = null; }

    showPause() { this.pauseScreen = {}; }
    hidePause() { this.pauseScreen = null; }

    drawPause(ctx) {
        if (!this.pauseScreen) return;
        const t = this.hudTimer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        // Dim overlay
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.save();
        ctx.shadowColor = '#c4a23a';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 64px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', W / 2, H * 0.32);
        ctx.shadowBlur = 15;
        ctx.fillText('PAUSED', W / 2, H * 0.32);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Decorative line
        const lineLen = 180;
        const lineGrad = ctx.createLinearGradient(W / 2 - lineLen, 0, W / 2 + lineLen, 0);
        lineGrad.addColorStop(0, 'rgba(196,162,58,0)');
        lineGrad.addColorStop(0.5, 'rgba(196,162,58,0.5)');
        lineGrad.addColorStop(1, 'rgba(196,162,58,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineLen, H * 0.32 + 40);
        ctx.lineTo(W / 2 + lineLen, H * 0.32 + 40);
        ctx.stroke();

        // Buttons
        const btnW = 300;
        const btnH = 60;
        const btnGap = 20;
        const btnStartY = H * 0.48;
        const btnX = (W - btnW) / 2;

        const buttons = [
            { id: 'resume', label: '\u25B6  Resume', color1: '#7c9a6e', color2: '#5a7a3c', glow: '#7c9a6e' },
            { id: 'settings', label: '\u2699  Settings', color1: '#4a4a50', color2: '#3a3a40', glow: '#c4a23a' },
            { id: 'menu', label: '\u2190  Main Menu', color1: '#4a4a50', color2: '#3a3a40', glow: '#7b5ea7' }
        ];

        this._pauseRects = {};

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const by = btnStartY + i * (btnH + btnGap);
            const hovered = this.mouseX >= btnX && this.mouseX <= btnX + btnW &&
                            this.mouseY >= by && this.mouseY <= by + btnH;
            const pulse = hovered ? 1 + Math.sin(t * 4) * 0.03 : 1;

            this._pauseRects[btn.id] = { x: btnX, y: by, w: btnW, h: btnH };

            ctx.save();
            ctx.translate(btnX + btnW / 2, by + btnH / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-btnW / 2, -btnH / 2);

            const grad = ctx.createLinearGradient(0, 0, 0, btnH);
            grad.addColorStop(0, btn.color1);
            grad.addColorStop(1, btn.color2);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(0, 0, btnW, btnH, 16);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(2, 2, btnW - 4, btnH * 0.45, [14, 14, 0, 0]);
            ctx.fill();

            if (hovered) {
                drawGlowBorder(ctx, -1, -1, btnW + 2, btnH + 2, 17, btn.glow, t, 14);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(-1, -1, btnW + 2, btnH + 2, 17);
                ctx.stroke();
            }

            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillStyle = hovered ? '#fff' : '#e8e4dc';
            ctx.font = `bold 22px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btnW / 2, btnH / 2);
            ctx.shadowBlur = 0;

            ctx.restore();
        }

        // Hint
        ctx.fillStyle = 'rgba(232,228,220,0.2)';
        ctx.font = `500 13px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Press [ESC] to resume', W / 2, H * 0.78);
    }

    isPauseButtonAt(mx, my, buttonId) {
        if (!this._pauseRects || !this._pauseRects[buttonId]) return false;
        const r = this._pauseRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    showPauseConfirm(coins) { this.pauseConfirmScreen = {}; this._pauseConfirmCoins = coins || 0; }
    hidePauseConfirm() { this.pauseConfirmScreen = null; }

    drawPauseConfirm(ctx) {
        if (!this.pauseConfirmScreen) return;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const t = this.hudTimer;

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);

        const boxW = 460;
        const boxH = 280;
        const boxX = (W - boxW) / 2;
        const boxY = (H - boxH) / 2;

        ctx.fillStyle = 'rgba(18,18,24,0.95)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();

        ctx.strokeStyle = 'rgba(196,162,58,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.stroke();

        ctx.shadowColor = '#c4a23a';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 36px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Quit to Menu?', W / 2, boxY + 55);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `500 18px ${FB}`;
        ctx.fillText('Your current seeds will be saved.', W / 2, boxY + 100);
        ctx.fillText(`${this._pauseConfirmCoins || 0} seeds earned this run.`, W / 2, boxY + 128);

        const btnW = 180;
        const btnH = 52;
        const btnGap = 30;
        const btnY = boxY + boxH - btnH - 30;

        const yesX = W / 2 - btnW - btnGap / 2;
        const noX = W / 2 + btnGap / 2;

        this._pauseConfirmRects = {
            yes: { x: yesX, y: btnY, w: btnW, h: btnH },
            no: { x: noX, y: btnY, w: btnW, h: btnH }
        };

        const yesHover = this.mouseX >= yesX && this.mouseX <= yesX + btnW &&
                         this.mouseY >= btnY && this.mouseY <= btnY + btnH;
        const noHover = this.mouseX >= noX && this.mouseX <= noX + btnW &&
                        this.mouseY >= btnY && this.mouseY <= btnY + btnH;

        const drawBtn = (x, y, w, h, label, color1, color2, glow, hovered) => {
            const pulse = hovered ? 1 + Math.sin(t * 4) * 0.03 : 1;
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-w / 2, -h / 2);

            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, 14);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(2, 2, w - 4, h * 0.45, [12, 12, 0, 0]);
            ctx.fill();

            if (hovered) {
                drawGlowBorder(ctx, -1, -1, w + 2, h + 2, 15, glow, t, 12);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(-1, -1, w + 2, h + 2, 15);
                ctx.stroke();
            }

            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillStyle = hovered ? '#fff' : '#e8e4dc';
            ctx.font = `bold 20px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, w / 2, h / 2);
            ctx.shadowBlur = 0;
            ctx.restore();
        };

        drawBtn(yesX, btnY, btnW, btnH, '\u2714  Yes', '#7c3a3a', '#5a2020', '#c44444', yesHover);
        drawBtn(noX, btnY, btnW, btnH, '\u2716  No', '#4a4a50', '#3a3a40', '#7b5ea7', noHover);
    }

    isPauseConfirmButtonAt(mx, my, buttonId) {
        if (!this._pauseConfirmRects || !this._pauseConfirmRects[buttonId]) return false;
        const r = this._pauseConfirmRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    drawMenu(ctx, sound, debug, updateChecker, updatePopupActive) {
        if (!this.menuScreen) return;
        this.hudTimer += 0.016;
        this.updateParticles(0.016);
        this._menuPopupActive = !!updatePopupActive;
        const t = this.hudTimer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        this.menuBg.render();
        ctx.drawImage(this.menuBg.canvas, 0, 0);

        this._drawMenuAnimatedEffects(ctx, t, W, H);

        // Vignette overlay
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7);
        vigGrad.addColorStop(0, 'rgba(10,14,8,0.3)');
        vigGrad.addColorStop(1, 'rgba(10,14,8,0.75)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        this.drawBackgroundParticles(ctx, t);

        // --- Title block ---
        const titleY = H * 0.22;

        // Glow behind title
        ctx.save();
        const glowPulse = 0.6 + Math.sin(t * 0.8) * 0.15;
        ctx.shadowColor = '#7c9a6e';
        ctx.shadowBlur = 60 * glowPulse;
        ctx.fillStyle = '#7c9a6e';
        ctx.font = `bold 88px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GRAVE BLOOM', W / 2, titleY);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Title text with gradient
        ctx.save();
        const titleGrad = ctx.createLinearGradient(W / 2 - 280, 0, W / 2 + 280, 0);
        titleGrad.addColorStop(0, '#3d6b52');
        titleGrad.addColorStop(0.2, '#7c9a6e');
        titleGrad.addColorStop(0.35, '#c8e87a');
        titleGrad.addColorStop(0.5, '#b8d94e');
        titleGrad.addColorStop(0.65, '#c8e87a');
        titleGrad.addColorStop(0.8, '#7c9a6e');
        titleGrad.addColorStop(1, '#3d6b52');
        ctx.fillStyle = titleGrad;
        ctx.font = `bold 88px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GRAVE BLOOM', W / 2, titleY);
        ctx.restore();

        // Subtitle
        const subAlpha = 0.35 + Math.sin(t * 1.2) * 0.1;
        ctx.fillStyle = `rgba(184,217,78,${subAlpha})`;
        ctx.font = `italic 500 18px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Tend the garden. Hold back the Blight.', W / 2, titleY + 52);

        // Decorative divider
        const divY = titleY + 88;
        const divLen = 220;
        const divGrad = ctx.createLinearGradient(W / 2 - divLen, 0, W / 2 + divLen, 0);
        divGrad.addColorStop(0, 'rgba(184,217,78,0)');
        divGrad.addColorStop(0.5, 'rgba(184,217,78,0.35)');
        divGrad.addColorStop(1, 'rgba(184,217,78,0)');
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W / 2 - divLen, divY);
        ctx.lineTo(W / 2 + divLen, divY);
        ctx.stroke();
        drawDiamond(ctx, W / 2, divY, 4, '#b8d94e', 0.5);

        // --- Button layout: two columns ---
        this._menuRects = {};

        // Primary column (left) — bigger buttons
        const primBtns = [
            { id: 'begin', label: '\u2728  Begin Bloom', color1: '#7c9a6e', color2: '#4a6e3a', glow: '#7c9a6e' },
        ];

        // Secondary column (right) — smaller buttons
        const secBtns = [
            { id: 'shop', label: '\uD83C\uDF3F  Bloomkeeper\'s Sanctum', color1: '#5a8f7c', color2: '#3d6b52', glow: '#5a8f7c' },
            { id: 'tutorial', label: '\uD83D\uDCD6  Tutorial', color1: '#5a6f8c', color2: '#3d5270', glow: '#5a8fcf' },
            { id: 'settings', label: '\u2699\uFE0F  Settings', color1: '#4a4a50', color2: '#3a3a40', glow: '#7b5ea7' },
            { id: 'debug', label: debug ? '\u2705  Debug: ON' : '\u26AA  Debug: OFF', color1: debug ? '#3a5a3a' : '#2a2a30', color2: debug ? '#2a4a2a' : '#1a1a22', glow: debug ? '#4caf50' : '#666' },
            { id: 'exit', label: '\uD83D\uDEAA  Exit', color1: '#3a2a30', color2: '#2a1a22', glow: '#8b3a62' },
        ];

        // Column positions
        const colGap = 30;
        const primBtnW = 360;
        const primBtnH = 72;
        const secBtnW = 310;
        const secBtnH = 52;
        const btnGap = 14;

        const totalW = primBtnW + colGap + secBtnW;
        const colStartX = (W - totalW) / 2;
        const primColX = colStartX;
        const secColX = colStartX + primBtnW + colGap;

        // Center buttons vertically in available space (between div and bottom hint)
        const topMargin = divY + 30;
        const bottomMargin = H - 90;
        const availH = bottomMargin - topMargin;

        // Primary column
        const primTotalH = primBtns.length * primBtnH + (primBtns.length - 1) * btnGap;
        const primStartY = topMargin + (availH - primTotalH) / 2;

        for (let i = 0; i < primBtns.length; i++) {
            const btn = primBtns[i];
            const bx = primColX;
            const by = primStartY + i * (primBtnH + btnGap);
            this._drawMenuButton(ctx, bx, by, primBtnW, primBtnH, btn, t, true);
        }

        // Secondary column
        const secTotalH = secBtns.length * secBtnH + (secBtns.length - 1) * (btnGap - 2);
        const secStartY = topMargin + (availH - secTotalH) / 2;

        for (let i = 0; i < secBtns.length; i++) {
            const btn = secBtns[i];
            const bx = secColX;
            const by = secStartY + i * (secBtnH + btnGap - 2);
            this._drawMenuButton(ctx, bx, by, secBtnW, secBtnH, btn, t, false);
        }

        // Bottom hint
        ctx.fillStyle = 'rgba(232,228,220,0.12)';
        ctx.font = `500 12px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('WASD / Arrow Keys to move  \u2022  Auto-attack enemies  \u2022  Survive the Blight', W / 2, H - 30);

        // Version text
        const version = updateChecker ? updateChecker.currentVersion : '?';
        const status = updateChecker ? updateChecker.getStatus() : 'idle';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.font = `500 13px ${FB}`;

        if (status === 'update') {
            ctx.fillStyle = '#f39c12';
            ctx.fillText(`v${version}  \u2022  Update available!`, W - 20, H - 12);
        } else if (status === 'checking') {
            ctx.fillStyle = 'rgba(232,228,220,0.2)';
            ctx.fillText(`v${version}  \u2022  Checking for updates...`, W - 20, H - 12);
        } else if (status === 'latest') {
            ctx.fillStyle = '#7c9a6e';
            ctx.fillText(`v${version}  \u2022  Up to date`, W - 20, H - 12);
        } else {
            ctx.fillStyle = 'rgba(232,228,220,0.2)';
            ctx.fillText(`v${version}`, W - 20, H - 12);
        }

        if (this._menuPopupActive) {
            if (!this._blurCanvas) {
                this._blurCanvas = document.createElement('canvas');
                this._blurCanvas.width = W;
                this._blurCanvas.height = H;
            }
            this._blurCanvas.getContext('2d').drawImage(ctx.canvas, 0, 0);
            ctx.save();
            ctx.filter = 'blur(6px)';
            ctx.drawImage(this._blurCanvas, 0, 0);
            ctx.restore();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, W, H);
        }
    }

    drawUpdatePopup(ctx, latestVersion, updateUrl) {
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const t = this.hudTimer;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        const boxW = 460;
        const boxH = 240;
        const boxX = (W - boxW) / 2;
        const boxY = (H - boxH) / 2;

        ctx.fillStyle = 'rgba(18,18,24,0.95)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();

        ctx.strokeStyle = 'rgba(243,156,18,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.stroke();

        const iconPulse = 0.8 + Math.sin(t * 3) * 0.2;
        ctx.fillStyle = `rgba(243,156,18,${iconPulse})`;
        ctx.font = `700 36px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u26A0', W / 2, boxY + 40);

        ctx.fillStyle = '#e8e4dc';
        ctx.font = `700 20px ${FB}`;
        ctx.fillText('Update Available', W / 2, boxY + 80);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `400 15px ${FB}`;
        ctx.fillText(`Version ${latestVersion} is now available`, W / 2, boxY + 112);

        const btnW = 160;
        const btnH = 44;
        const btnY = boxY + boxH - 70;
        const gap = 20;
        const updateBtnX = W / 2 - btnW - gap / 2;
        const cancelBtnX = W / 2 + gap / 2;

        this._updatePopupUpdateBtn = { x: updateBtnX, y: btnY, w: btnW, h: btnH };
        this._updatePopupCancelBtn = { x: cancelBtnX, y: btnY, w: btnW, h: btnH };

        const mx = this._mouseX || 0;
        const my = this._mouseY || 0;

        const updateHover = mx >= updateBtnX && mx <= updateBtnX + btnW && my >= btnY && my <= btnY + btnH;
        const cancelHover = mx >= cancelBtnX && mx <= cancelBtnX + btnW && my >= btnY && my <= btnY + btnH;

        ctx.fillStyle = updateHover ? '#f39c12' : '#b8860b';
        ctx.beginPath();
        ctx.roundRect(updateBtnX, btnY, btnW, btnH, 10);
        ctx.fill();
        if (updateHover) {
            drawGlowBorder(ctx, updateBtnX - 2, btnY - 2, btnW + 4, btnH + 4, 12, '#f39c12', t, 8);
        }
        ctx.fillStyle = updateHover ? '#fff' : '#e8e4dc';
        ctx.font = `700 15px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Download', updateBtnX + btnW / 2, btnY + btnH / 2);

        ctx.fillStyle = cancelHover ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(cancelBtnX, btnY, btnW, btnH, 10);
        ctx.fill();
        if (cancelHover) {
            drawGlowBorder(ctx, cancelBtnX - 2, btnY - 2, btnW + 4, btnH + 4, 12, '#666', t, 6);
        }
        ctx.fillStyle = cancelHover ? '#e8e4dc' : 'rgba(255,255,255,0.45)';
        ctx.font = `500 15px ${FB}`;
        ctx.textAlign = 'center';
        ctx.fillText('Cancel', cancelBtnX + btnW / 2, btnY + btnH / 2);
    }

    isUpdatePopupButtonAt(mx, my, id) {
        const btn = id === 'update' ? this._updatePopupUpdateBtn : this._updatePopupCancelBtn;
        if (!btn) return false;
        return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
    }

    drawDebugPassword(ctx, input, wrong) {
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const t = this.hudTimer;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);

        const boxW = 400;
        const boxH = 200;
        const boxX = (W - boxW) / 2;
        const boxY = (H - boxH) / 2;

        ctx.fillStyle = 'rgba(18,18,24,0.95)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Enter access code:', W / 2, boxY + 40);

        const inputW = 300;
        const inputH = 44;
        const inputX = (W - inputW) / 2;
        const inputY = boxY + 60;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(inputX, inputY, inputW, inputH, 8);
        ctx.fill();

        ctx.strokeStyle = 'rgba(124,154,110,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(inputX, inputY, inputW, inputH, 8);
        ctx.stroke();

        const displayText = input.length > 0 ? '\u2022'.repeat(input.length) : '';
        const cursor = Math.sin(t * 4) > 0 ? '|' : '';

        ctx.fillStyle = input.length > 0 ? '#e8e4dc' : 'rgba(255,255,255,0.25)';
        ctx.font = `400 18px ${FB}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText + cursor, inputX + 14, inputY + inputH / 2);

        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = `400 13px ${FB}`;
        ctx.textAlign = 'center';
        ctx.fillText('Press Enter to confirm  \u2022  Esc to cancel', W / 2, boxY + boxH - 24);

        if (wrong) {
            ctx.fillStyle = '#e85050';
            ctx.font = `700 15px ${FB}`;
            ctx.textAlign = 'center';
            ctx.fillText('Wrong password', W / 2, inputY + inputH + 22);
        }
    }

    _drawMenuButton(ctx, bx, by, bw, bh, btn, t, primary) {
        const hovered = !this._menuPopupActive &&
                        this.mouseX >= bx && this.mouseX <= bx + bw &&
                        this.mouseY >= by && this.mouseY <= by + bh;
        const pulse = hovered ? 1 + Math.sin(t * 4) * 0.02 : 1;

        ctx.save();
        ctx.translate(bx + bw / 2, by + bh / 2);
        ctx.scale(pulse, pulse);
        ctx.translate(-bw / 2, -bh / 2);

        // Button background
        const grad = ctx.createLinearGradient(0, 0, 0, bh);
        grad.addColorStop(0, hovered ? lerpColor(btn.color1, 0.15) : btn.color1);
        grad.addColorStop(1, hovered ? lerpColor(btn.color2, 0.10) : btn.color2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(0, 0, bw, bh, primary ? 14 : 10);
        ctx.fill();

        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath();
        ctx.roundRect(2, 2, bw - 4, bh * 0.4, primary ? [12, 12, 0, 0] : [8, 8, 0, 0]);
        ctx.fill();

        // Border
        if (hovered) {
            drawGlowBorder(ctx, -2, -2, bw + 4, bh + 4, primary ? 16 : 12, btn.glow, t, 12);
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-1, -1, bw + 2, bh + 2, primary ? 14 : 10);
            ctx.stroke();
        }

        // Text
        ctx.shadowColor = '#000';
        ctx.shadowBlur = primary ? 6 : 3;
        ctx.fillStyle = hovered ? '#fff' : (primary ? '#f0ece4' : '#d8d4cc');
        ctx.font = `${primary ? 'bold' : '600'} ${primary ? 24 : 17}px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, bw / 2, bh / 2);
        ctx.shadowBlur = 0;

        ctx.restore();

        this._menuRects[btn.id] = { x: bx, y: by, w: bw, h: bh };
    }

    isMenuButtonAt(mx, my, buttonId) {
        if (!this._menuRects || !this._menuRects[buttonId]) return false;
        const r = this._menuRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    // --- Character Selection ---
    drawCharacterSelect(ctx, sound, selectedChar) {
        if (!this.charScreen) return;
        const t = this.hudTimer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        this.charScreen.animTimer += 0.016;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.save();
        ctx.shadowColor = '#7b5ea7';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 48px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Choose Your Guardian', W / 2, 70);
        ctx.shadowBlur = 10;
        ctx.fillText('Choose Your Guardian', W / 2, 70);
        ctx.restore();

        // Character cards — 2 rows, centered
        const chars = Object.values(CHARACTERS);
        const cardW = 280;
        const cardH = 360;
        const gap = 20;
        const row1Count = Math.ceil(chars.length / 2);
        const row2Count = chars.length - row1Count;
        const maxPerRow = Math.max(row1Count, row2Count);
        const totalRowW = maxPerRow * cardW + (maxPerRow - 1) * gap;
        const startX = (W - totalRowW) / 2;
        const startY = 110;

        this._charRects = {};

        for (let i = 0; i < chars.length; i++) {
            const row = i < row1Count ? 0 : 1;
            const col = row === 0 ? i : i - row1Count;
            const rowCount = row === 0 ? row1Count : row2Count;
            const rowOffset = (maxPerRow - rowCount) * (cardW + gap) / 2;
            const cx = startX + col * (cardW + gap) + rowOffset;
            const cy = startY + row * (cardH + gap);
            const ch = chars[i];
            const isSelected = selectedChar === ch.id;
            const isHovered = this.mouseX >= cx && this.mouseX <= cx + cardW &&
                              this.mouseY >= cy && this.mouseY <= cy + cardH;

            this._charRects[ch.id] = { x: cx, y: cy, w: cardW, h: cardH };

            // Card background
            const bgAlpha = isHovered ? 0.15 : 0.08;
            ctx.fillStyle = `rgba(255,255,255,${bgAlpha})`;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 12);
            ctx.fill();

            // Selected border
            if (isSelected) {
                drawGlowBorder(ctx, cx - 1, cy - 1, cardW + 2, cardH + 2, 13, ch.color, t, 8);
            } else {
                ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cx, cy, cardW, cardH, 12);
                ctx.stroke();
            }

            // Character icon (drawn procedurally)
            this._drawCharIcon(ctx, cx + cardW / 2, cy + 55, ch, t);

            // Character name
            ctx.fillStyle = isSelected ? '#fff' : '#d8d4cc';
            ctx.font = `bold 18px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ch.name, cx + cardW / 2, cy + 108);

            // Role/description (word-wrapped)
            ctx.fillStyle = 'rgba(232,228,220,0.5)';
            ctx.font = `12px ${FB}`;
            ctx.textAlign = 'center';
            const maxTextW = cardW - 30;
            const descLines = this._wrapText(ctx, ch.description, maxTextW);
            for (let d = 0; d < descLines.length; d++) {
                ctx.fillText(descLines[d], cx + cardW / 2, cy + 126 + d * 16);
            }

            // Stats
            const statY = cy + 126 + descLines.length * 16 + 10;
            const stats = [
                { label: 'HP', value: 120 + ch.hpBonus, base: 120 },
                { label: 'Speed', value: 220 + ch.speedBonus, base: 220 },
                { label: 'Magnet', value: 40 + ch.magnetBonus, base: 40 },
            ];
            if (ch.damageBonus > 0) {
                stats.push({ label: 'DMG', value: Math.round((1 + ch.damageBonus) * 100) + '%', base: '100%' });
            }

            for (let s = 0; s < stats.length; s++) {
                const sy = statY + s * 28;
                const st = stats[s];

                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.beginPath();
                ctx.roundRect(cx + 20, sy, cardW - 40, 22, 4);
                ctx.fill();

                // Label
                ctx.fillStyle = 'rgba(232,228,220,0.5)';
                ctx.font = `600 11px ${FB}`;
                ctx.textAlign = 'left';
                ctx.fillText(st.label, cx + 28, sy + 11);

                // Value
                const diff = typeof st.value === 'number' ? st.value - st.base : 0;
                if (diff > 0) {
                    ctx.fillStyle = '#7c9a6e';
                } else if (diff < 0) {
                    ctx.fillStyle = '#e74c3c';
                } else {
                    ctx.fillStyle = '#d8d4cc';
                }
                ctx.font = `bold 12px ${FB}`;
                ctx.textAlign = 'right';
                ctx.fillText(st.value, cx + cardW - 28, sy + 11);
            }

            // Selected badge
            if (isSelected) {
                ctx.fillStyle = ch.color;
                ctx.font = `bold 13px ${FD}`;
                ctx.textAlign = 'center';
                ctx.fillText('✓ SELECTED', cx + cardW / 2, cy + cardH - 16);
            }
        }

        // Back button (centered below cards)
        const backW = 180;
        const backH = 48;
        const backX = (W - backW) / 2;
        const backY = H - 80;
        this._charBackRect = { x: backX, y: backY, w: backW, h: backH };
        this._drawMenuButton(ctx, backX, backY, backW, backH,
            { id: 'charback', label: '\u2190  Back', color1: '#4a4a50', color2: '#3a3a40', glow: '#7b5ea7' }, t, false);
    }

    _wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    _drawCharIcon(ctx, cx, cy, ch, t) {
        const pal = ch.palette;
        ctx.save();
        ctx.translate(cx, cy);

        // Cape
        const capeGrad = ctx.createLinearGradient(-8, -12, -8, 24);
        capeGrad.addColorStop(0, pal.cape1);
        capeGrad.addColorStop(1, pal.cape3);
        ctx.fillStyle = capeGrad;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.quadraticCurveTo(-14, 10, -16, 24);
        ctx.lineTo(-6, 22);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -6);
        ctx.quadraticCurveTo(14, 10, 16, 24);
        ctx.lineTo(6, 22);
        ctx.closePath();
        ctx.fill();

        // Body
        const bodyGrad = ctx.createLinearGradient(-12, -10, 12, 12);
        bodyGrad.addColorStop(0, pal.body1);
        bodyGrad.addColorStop(1, pal.body3);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-12, -10, 24, 24, 3);
        ctx.fill();

        // Belt
        ctx.fillStyle = pal.belt;
        ctx.fillRect(-12, 6, 24, 3);
        ctx.fillStyle = pal.buckle;
        ctx.beginPath();
        ctx.ellipse(0, 7.5, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        const hoodGrad = ctx.createLinearGradient(0, -32, 0, -6);
        hoodGrad.addColorStop(0, pal.hood);
        hoodGrad.addColorStop(1, pal.body2);
        ctx.fillStyle = hoodGrad;
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.quadraticCurveTo(-16, -18, -10, -28);
        ctx.quadraticCurveTo(0, -34, 10, -28);
        ctx.quadraticCurveTo(16, -18, 14, -6);
        ctx.closePath();
        ctx.fill();

        // Face shadow
        ctx.fillStyle = '#c9a882';
        ctx.beginPath();
        ctx.ellipse(0, -12, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        const faceShadow = ctx.createLinearGradient(0, -18, 0, -8);
        faceShadow.addColorStop(0, 'rgba(0,0,0,0.4)');
        faceShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = faceShadow;
        ctx.beginPath();
        ctx.ellipse(0, -12, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const rgb = hexToRgb(pal.visor);
        const eyeGlow = ctx.createRadialGradient(-4, -13, 0.5, -4, -13, 5);
        eyeGlow.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
        eyeGlow.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(-4, -13, 5, 0, Math.PI * 2);
        ctx.fill();
        const eyeGlow2 = ctx.createRadialGradient(4, -13, 0.5, 4, -13, 5);
        eyeGlow2.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
        eyeGlow2.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = eyeGlow2;
        ctx.beginPath();
        ctx.arc(4, -13, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = pal.buckle;
        ctx.beginPath();
        ctx.arc(-4, -13, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -13, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    isCharSelectAt(mx, my, charId) {
        if (!this._charRects || !this._charRects[charId]) return false;
        const r = this._charRects[charId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    isCharBackAt(mx, my) {
        if (!this._charBackRect) return false;
        const r = this._charBackRect;
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    // --- Loadout Select ---

    showLoadoutSelect() { this._loadoutSelectVisible = true; }
    hideLoadoutSelect() { this._loadoutSelectVisible = false; this._loadoutRects = []; }

    drawLoadoutSelect(ctx, selectedLoadout, shopSystem) {
        this._loadoutRects = [];
        ctx.fillStyle = '#141416';
        ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

        const unlocked = shopSystem.getUnlockedLoadouts();

        ctx.font = `bold 48px ${FD}`;
        ctx.fillStyle = '#e8e0d4';
        ctx.textAlign = 'center';
        ctx.fillText('Choose Your Loadout', GAME.WIDTH / 2, 80);

        ctx.font = `18px ${FB}`;
        ctx.fillStyle = '#8a7a6a';
        ctx.fillText('Select a starting weapon and passive bonus', GAME.WIDTH / 2, 115);

        const cardW = 320;
        const cardH = 200;
        const gap = 30;
        const cols = 3;
        const totalW = cols * cardW + (cols - 1) * gap;
        const startX = (GAME.WIDTH - totalW) / 2;
        const startY = 160;

        LOADOUTS.forEach((loadout, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * (cardW + gap);
            const cy = startY + row * (cardH + gap);
            const isUnlocked = unlocked.includes(loadout.id);
            const isSelected = selectedLoadout === loadout.id;
            const isHovered = this._loadoutHover === loadout.id;

            this._loadoutRects.push({ x: cx, y: cy, w: cardW, h: cardH, id: loadout.id, unlocked: isUnlocked });

            const bgAlpha = isHovered && isUnlocked ? 0.35 : 0.2;
            ctx.fillStyle = isSelected ? `rgba(180,140,80,${bgAlpha + 0.15})` : `rgba(30,25,20,${bgAlpha})`;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 10);
            ctx.fill();

            if (isSelected) {
                ctx.strokeStyle = '#b48c50';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (isHovered && isUnlocked) {
                ctx.strokeStyle = 'rgba(180,140,80,0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            if (!isUnlocked) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.beginPath();
                ctx.roundRect(cx, cy, cardW, cardH, 10);
                ctx.fill();
            }

            ctx.textAlign = 'left';
            ctx.font = `bold 22px ${FD}`;
            ctx.fillStyle = isUnlocked ? '#e8e0d4' : '#5a5040';
            ctx.fillText(loadout.name, cx + 16, cy + 35);

            ctx.font = `14px ${FB}`;
            ctx.fillStyle = isUnlocked ? '#a09080' : '#4a4030';
            this._wrapText(ctx, loadout.description, cx + 16, cy + 60, cardW - 32, 18);

            if (loadout.weapon) {
                const wt = WEAPON_TYPES[loadout.weapon];
                if (wt) {
                    ctx.font = `bold 13px ${FD}`;
                    ctx.fillStyle = isUnlocked ? wt.color : '#4a4030';
                    ctx.fillText(`Weapon: ${wt.name}`, cx + 16, cy + 120);
                }
            } else {
                ctx.font = `bold 13px ${FD}`;
                ctx.fillStyle = isUnlocked ? '#7c9a6e' : '#4a4030';
                ctx.fillText('Weapon: Seeds of Sorrow', cx + 16, cy + 120);
            }

            if (loadout.passive) {
                const p = SHOP_UPGRADES[loadout.passive];
                if (p) {
                    ctx.font = `13px ${FB}`;
                    ctx.fillStyle = isUnlocked ? '#8ab060' : '#4a4030';
                    ctx.fillText(`Passive: ${p.name}`, cx + 16, cy + 145);
                }
            }

            if (!isUnlocked && loadout.unlockCost > 0) {
                ctx.font = `bold 16px ${FD}`;
                ctx.fillStyle = '#c4a23a';
                ctx.textAlign = 'center';
                ctx.fillText(`${loadout.unlockCost} coins to unlock`, cx + cardW / 2, cy + 175);
                ctx.textAlign = 'left';
            }

            if (isSelected) {
                ctx.font = `bold 14px ${FD}`;
                ctx.fillStyle = '#b48c50';
                ctx.textAlign = 'center';
                ctx.fillText('SELECTED', cx + cardW / 2, cy + cardH - 12);
                ctx.textAlign = 'left';
            }
        });

        const backX = GAME.WIDTH / 2 - 80;
        const backY = startY + 2 * (cardH + gap) + 20;
        this._loadoutBackRect = { x: backX, y: backY, w: 160, h: 44 };

        const backHover = this._loadoutHover === 'back';
        ctx.fillStyle = backHover ? 'rgba(180,140,80,0.25)' : 'rgba(30,25,20,0.3)';
        ctx.beginPath();
        ctx.roundRect(backX, backY, 160, 44, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,140,80,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `bold 18px ${FD}`;
        ctx.fillStyle = '#e8e0d4';
        ctx.textAlign = 'center';
        ctx.fillText('Back', backX + 80, backY + 28);
        ctx.textAlign = 'left';
    }

    setLoadoutHover(id) { this._loadoutHover = id; }

    isLoadoutSelectAt(mx, my) {
        if (this._loadoutBackRect) {
            const b = this._loadoutBackRect;
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return 'back';
        }
        for (const r of this._loadoutRects) {
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return r.id;
            }
        }
        return null;
    }

    // --- Intro Movie ---

    showIntro() {
        this.introScreen = {
            scene: 0,
            timer: 0,
            scenes: [
                { text: 'In a world consumed by the Blight...', sub: '', dur: 3.5, size: 38 },
                { text: 'The land rots. The trees wither. The dead stir.', sub: '', dur: 3.5, size: 30 },
                { text: 'But one guardian remains...', sub: '', dur: 3.0, size: 34 },
                { text: 'The Bloomkeeper', sub: '', dur: 3.5, size: 64, glow: true },
                { text: 'Tend the garden.', sub: 'Hold back the darkness.', dur: 3.5, size: 34 },
                { text: 'Survive.', sub: '', dur: 2.0, size: 56, glow: true },
            ],
            totalDur: 0,
            skipHovered: false,
        };
        for (const s of this.introScreen.scenes) this.introScreen.totalDur += s.dur;
    }

    hideIntro() { this.introScreen = null; }

    updateIntro(dt) {
        if (!this.introScreen) return false;
        this.introScreen.timer += dt;
        let elapsed = 0;
        for (let i = 0; i < this.introScreen.scenes.length; i++) {
            elapsed += this.introScreen.scenes[i].dur;
            if (this.introScreen.timer < elapsed) {
                this.introScreen.scene = i;
                return false;
            }
        }
        return true;
    }

    drawIntro(ctx) {
        if (!this.introScreen) return;
        const t = this.introScreen.timer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const scenes = this.introScreen.scenes;

        // Black background
        ctx.fillStyle = '#080a06';
        ctx.fillRect(0, 0, W, H);

        // Atmospheric particles
        this.drawBackgroundParticles(ctx, t);

        // Vignette
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.65);
        vigGrad.addColorStop(0, 'rgba(8,10,6,0.0)');
        vigGrad.addColorStop(1, 'rgba(8,10,6,0.7)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        // Find current scene and compute alpha
        let elapsed = 0;
        for (let i = 0; i < scenes.length; i++) {
            const s = scenes[i];
            const sceneStart = elapsed;
            const sceneEnd = elapsed + s.dur;
            elapsed = sceneEnd;

            if (t < sceneStart || t >= sceneEnd) continue;

            const sceneT = t - sceneStart;
            const fadeIn = Math.min(1, sceneT / 0.6);
            const fadeOut = Math.min(1, (s.dur - sceneT) / 0.8);
            const alpha = fadeIn * fadeOut;

            if (alpha <= 0) continue;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Main text
            const textY = s.sub ? H * 0.44 : H * 0.48;

            if (s.glow) {
                ctx.shadowColor = '#7c9a6e';
                ctx.shadowBlur = 40;
            }

            ctx.fillStyle = s.glow ? '#b8d94e' : '#c8c0b0';
            ctx.font = `bold ${s.size}px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.text, W / 2, textY);

            if (s.glow) {
                ctx.shadowBlur = 20;
                ctx.fillText(s.text, W / 2, textY);
                ctx.shadowBlur = 0;
            }

            // Sub text
            if (s.sub) {
                ctx.fillStyle = 'rgba(184,217,78,0.6)';
                ctx.font = `500 26px ${FB}`;
                ctx.fillText(s.sub, W / 2, textY + 50);
            }

            ctx.restore();
            break;
        }

        // Decorative line
        const lineAlpha = Math.min(1, t / 1.5) * Math.min(1, (this.introScreen.totalDur - t) / 1);
        if (lineAlpha > 0) {
            const divLen = 150;
            const divGrad = ctx.createLinearGradient(W / 2 - divLen, 0, W / 2 + divLen, 0);
            divGrad.addColorStop(0, `rgba(184,217,78,0)`);
            divGrad.addColorStop(0.5, `rgba(184,217,78,${0.2 * lineAlpha})`);
            divGrad.addColorStop(1, `rgba(184,217,78,0)`);
            ctx.strokeStyle = divGrad;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(W / 2 - divLen, H * 0.58);
            ctx.lineTo(W / 2 + divLen, H * 0.58);
            ctx.stroke();
        }

        // Skip button
        const skipW = 100;
        const skipH = 36;
        const skipX = W - skipW - 30;
        const skipY = H - skipH - 25;
        this.introScreen.skipHovered = this.mouseX >= skipX && this.mouseX <= skipX + skipW &&
                                      this.mouseY >= skipY && this.mouseY <= skipY + skipH;
        this._introSkipRect = { x: skipX, y: skipY, w: skipW, h: skipH };

        ctx.fillStyle = this.introScreen.skipHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(skipX, skipY, skipW, skipH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(skipX, skipY, skipW, skipH, 8);
        ctx.stroke();
        ctx.fillStyle = this.introScreen.skipHovered ? 'rgba(232,228,220,0.7)' : 'rgba(232,228,220,0.3)';
        ctx.font = `500 13px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Skip  \u23E9', skipX + skipW / 2, skipY + skipH / 2);
    }

    isIntroSkipAt(mx, my) {
        if (!this._introSkipRect) return false;
        const r = this._introSkipRect;
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    // --- Tutorial Screen ---

    showTutorial() {
        this.tutorialScreen = { tab: 0 };
    }

    hideTutorial() { this.tutorialScreen = null; }

    isTutorialButtonAt(mx, my, buttonId) {
        if (!this._tutorialRects || !this._tutorialRects[buttonId]) return false;
        const r = this._tutorialRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }

    getTutorialTabAt(mx, my) {
        if (!this._tutorialTabRects) return null;
        for (let i = 0; i < this._tutorialTabRects.length; i++) {
            const r = this._tutorialTabRects[i];
            if (r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
        }
        return null;
    }

    makeTutorialEnemy(type) {
        const cfg = ENEMIES[type];
        if (!cfg) return null;
        const e = new Enemy(0, 0, cfg, type);
        e.animTimer = 0;
        return e;
    }

    drawTutorial(ctx) {
        if (!this.tutorialScreen) return;
        const t = this.hudTimer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const tab = this.tutorialScreen.tab;
        const tabNames = ['Controls', 'Weapons', 'Passives', 'Enemies', 'Evolutions'];

        this.menuBg.render();
        ctx.drawImage(this.menuBg.canvas, 0, 0);
        ctx.fillStyle = 'rgba(10,14,8,0.82)';
        ctx.fillRect(0, 0, W, H);

        this._tutorialRects = {};
        this._tutorialTabRects = [];

        // Title
        ctx.save();
        ctx.shadowColor = '#5a8fcf';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#b8d94e';
        ctx.font = `bold 52px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('How to Play', W / 2, 30);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Tab bar
        const tabY = 95;
        const tabH = 46;
        const tabW = Math.floor((W - 160) / 5);
        const tabXStart = 80;
        for (let i = 0; i < 5; i++) {
            const tx = tabXStart + i * tabW;
            this._tutorialTabRects[i] = { x: tx, y: tabY, w: tabW, h: tabH };
            const active = i === tab;
            ctx.fillStyle = active ? 'rgba(124,154,110,0.25)' : 'rgba(40,44,36,0.4)';
            ctx.beginPath();
            ctx.roundRect(tx + 1, tabY, tabW - 2, tabH, i === 0 ? [8, 0, 0, 8] : i === 4 ? [0, 8, 8, 0] : 0);
            ctx.fill();
            if (active) {
                ctx.fillStyle = '#b8d94e';
                ctx.fillRect(tx + tabW * 0.2, tabY + tabH - 3, tabW * 0.6, 3);
            }
            ctx.fillStyle = active ? '#b8d94e' : 'rgba(232,228,220,0.45)';
            ctx.font = `${active ? 'bold' : '500'} 17px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tabNames[i], tx + tabW / 2, tabY + tabH / 2);
        }

        // Main content panel
        const panelX = 60;
        const panelY = 158;
        const panelW = W - 120;
        const panelH = H - 240;

        ctx.fillStyle = 'rgba(20,24,18,0.6)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(124,154,110,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.clip();

        if (tab === 0) this.drawTutorialControls(ctx, panelX, panelY, panelW, panelH, t);
        else if (tab === 1) this.drawTutorialWeapons(ctx, panelX, panelY, panelW, panelH, t);
        else if (tab === 2) this.drawTutorialPassives(ctx, panelX, panelY, panelW, panelH, t);
        else if (tab === 3) this.drawTutorialEnemies(ctx, panelX, panelY, panelW, panelH, t);
        else if (tab === 4) this.drawTutorialEvolutions(ctx, panelX, panelY, panelW, panelH, t);

        ctx.restore();

        // Back button
        const backW = 140;
        const backH = 48;
        const backX = panelX;
        const backY = H - 80;
        this._tutorialRects.back = { x: backX, y: backY, w: backW, h: backH };
        const hovered = this.mouseX >= backX && this.mouseX <= backX + backW &&
                        this.mouseY >= backY && this.mouseY <= backY + backH;
        const pulse = hovered ? 1 + Math.sin(t * 4) * 0.03 : 1;
        ctx.save();
        ctx.translate(backX + backW / 2, backY + backH / 2);
        ctx.scale(pulse, pulse);
        ctx.translate(-backW / 2, -backH / 2);
        const backGrad = ctx.createLinearGradient(0, 0, 0, backH);
        backGrad.addColorStop(0, hovered ? '#5a5a60' : '#4a4a50');
        backGrad.addColorStop(1, '#3a3a40');
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, backW, backH, 12);
        ctx.fill();
        if (hovered) drawGlowBorder(ctx, -1, -1, backW + 2, backH + 2, 13, '#7b5ea7', t, 8);
        ctx.fillStyle = hovered ? '#fff' : '#e8e4dc';
        ctx.font = `bold 18px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2190  Back', backW / 2, backH / 2);
        ctx.restore();

        // Tab page indicator
        ctx.fillStyle = 'rgba(232,228,220,0.25)';
        ctx.font = `500 14px ${FB}`;
        ctx.textAlign = 'center';
        ctx.fillText(`Page ${tab + 1} of 5`, W / 2, H - 60);
    }

    drawTutorialControls(ctx, px, py, pw, ph, t) {
        const cx = px + pw / 2;

        // Section title
        ctx.fillStyle = '#b8d94e';
        ctx.font = `bold 30px ${FD}`;
        ctx.textAlign = 'center';
        ctx.fillText('Controls & Basics', cx, py + 40);

        ctx.fillStyle = 'rgba(232,228,220,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.fillText('Move with WASD or Arrow Keys \u2022 Weapons fire automatically', cx, py + 72);

        // Keyboard diagram
        const keySize = 52;
        const keyGap = 6;
        const kbX = cx - keySize * 1.7;
        const kbY = py + 110;

        const keys = [
            { label: 'W', x: 1, y: 0, color: '#5a8f7c' },
            { label: 'A', x: 0, y: 1, color: '#5a8f7c' },
            { label: 'S', x: 1, y: 1, color: '#5a8f7c' },
            { label: 'D', x: 2, y: 1, color: '#5a8f7c' },
        ];

        for (const key of keys) {
            const kx = kbX + key.x * (keySize + keyGap);
            const ky = kbY + key.y * (keySize + keyGap);
            ctx.fillStyle = key.color;
            ctx.beginPath();
            ctx.roundRect(kx, ky, keySize, keySize, 8);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold 22px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(key.label, kx + keySize / 2, ky + keySize / 2);
        }

        ctx.fillStyle = 'rgba(232,228,220,0.35)';
        ctx.font = `500 14px ${FB}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('or Arrow Keys', kbX + keySize * 1.5, kbY + keySize * 2 + keyGap + 8);

        // Game concepts
        const concepts = [
            { icon: '\u2764\uFE0F', title: 'Health', desc: 'Your HP. Reach zero and the Blight claims you.' },
            { icon: '\u2B50', title: 'XP Gems', desc: 'Defeated enemies drop gems. Collect them to level up.' },
            { icon: '\u2B50', title: 'Level Up', desc: 'Choose a new weapon, upgrade, or passive item.' },
            { icon: '\uD83C\uDFC6', title: 'Chests', desc: 'Open treasure chests for bonus rewards and evolutions.' },
            { icon: '\uD83D\uDCB0', title: 'Coins', desc: 'Enemies drop coins. Spend them in the Bloomkeeper\'s Sanctum.' },
            { icon: '\u23F1\uFE0F', title: 'Survive', desc: 'The Blight grows stronger over time. How long can you last?' },
        ];

        const startY = py + 270;
        const rowH = 58;
        for (let i = 0; i < concepts.length; i++) {
            const cy = startY + i * rowH;
            ctx.fillStyle = 'rgba(124,154,110,0.08)';
            ctx.beginPath();
            ctx.roundRect(px + 60, cy, pw - 120, 48, 10);
            ctx.fill();
            ctx.fillStyle = '#b8d94e';
            ctx.font = `26px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(concepts[i].icon, px + 100, cy + 24);
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `bold 18px ${FD}`;
            ctx.textAlign = 'left';
            ctx.fillText(concepts[i].title, px + 130, cy + 16);
            ctx.fillStyle = 'rgba(232,228,220,0.5)';
            ctx.font = `14px ${FB}`;
            ctx.fillText(concepts[i].desc, px + 130, cy + 36);
        }
    }

    drawTutorialWeapons(ctx, px, py, pw, ph, t) {
        const cx = px + pw / 2;

        ctx.fillStyle = '#b8d94e';
        ctx.font = `bold 30px ${FD}`;
        ctx.textAlign = 'center';
        ctx.fillText('Weapons', cx, py + 40);

        ctx.fillStyle = 'rgba(232,228,220,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.fillText('All weapons fire automatically \u2022 Upgrade them on level up', cx, py + 72);

        const weaponKeys = Object.keys(WEAPON_TYPES);
        const cardW = (pw - 100) / 2;
        const cardH = 155;
        const gapX = 24;
        const gapY = 20;
        const startY = py + 105;

        for (let i = 0; i < weaponKeys.length; i++) {
            const w = WEAPON_TYPES[weaponKeys[i]];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx2 = px + 40 + col * (cardW + gapX);
            const cy2 = startY + row * (cardH + gapY);

            ctx.fillStyle = 'rgba(30,34,28,0.6)';
            ctx.beginPath();
            ctx.roundRect(cx2, cy2, cardW, cardH, 12);
            ctx.fill();
            ctx.strokeStyle = w.color + '55';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cx2, cy2, cardW, cardH, 12);
            ctx.stroke();

            // Weapon icon
            const iconSize = 55;
            const iconX = cx2 + 22;
            const iconY = cy2 + (cardH - iconSize) / 2;
            ctx.save();
            ctx.shadowColor = w.color;
            ctx.shadowBlur = 10;

            if (weaponKeys[i] === 'arcane_bolt') {
                const grad = ctx.createLinearGradient(iconX, iconY - iconSize / 2, iconX, iconY + iconSize / 2);
                grad.addColorStop(0, w.secondaryColor);
                grad.addColorStop(1, w.color);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(iconX + iconSize / 2, iconY + iconSize / 2, 10, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.ellipse(iconX + iconSize / 2 + 2, iconY + iconSize / 2 - 3, 3, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else if (weaponKeys[i] === 'orbiting_blade') {
                ctx.strokeStyle = w.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, 18, 0, Math.PI * 2);
                ctx.stroke();
                for (let a = 0; a < 4; a++) {
                    const angle = (a / 4) * Math.PI * 2 + t * 1.5;
                    const bx = iconX + iconSize / 2 + Math.cos(angle) * 18;
                    const by = iconY + iconSize / 2 + Math.sin(angle) * 18;
                    ctx.fillStyle = w.color;
                    ctx.beginPath();
                    ctx.moveTo(bx, by - 8);
                    ctx.lineTo(bx - 4, by + 2);
                    ctx.lineTo(bx + 4, by + 2);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (weaponKeys[i] === 'holy_pulse') {
                const pr = 12 + Math.sin(t * 3) * 3;
                const grad = ctx.createRadialGradient(iconX + iconSize / 2, iconY + iconSize / 2, 0, iconX + iconSize / 2, iconY + iconSize / 2, pr + 8);
                grad.addColorStop(0, '#fff');
                grad.addColorStop(0.3, w.secondaryColor);
                grad.addColorStop(1, w.color + '00');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, pr + 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (weaponKeys[i] === 'lightning_mark') {
                ctx.strokeStyle = w.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(iconX + iconSize / 2, iconY + 2);
                ctx.lineTo(iconX + iconSize / 2 + 5, iconY + iconSize / 2 - 5);
                ctx.lineTo(iconX + iconSize / 2 - 3, iconY + iconSize / 2);
                ctx.lineTo(iconX + iconSize / 2 + 2, iconY + iconSize - 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.restore();

            // Weapon info
            const infoX = cx2 + iconSize + 38;
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `bold 20px ${FD}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(w.name, infoX, cy2 + 18);

            ctx.fillStyle = w.color;
            ctx.font = `500 13px ${FB}`;
            ctx.fillText(w.category.toUpperCase(), infoX, cy2 + 44);

            ctx.fillStyle = 'rgba(232,228,220,0.6)';
            ctx.font = `13px ${FB}`;
            const desc = w.description;
            const maxW = cardW - iconSize - 50;
            const words = desc.split(' ');
            let line = '';
            let lineY = cy2 + 66;
            for (const word of words) {
                const test = line + (line ? ' ' : '') + word;
                if (ctx.measureText(test).width > maxW && line) {
                    ctx.fillText(line, infoX, lineY);
                    line = word;
                    lineY += 17;
                } else {
                    line = test;
                }
            }
            if (line) ctx.fillText(line, infoX, lineY);

            // Stats
            const statY = cy2 + cardH - 34;
            const stats = [
                { label: 'DMG', value: w.baseDamage, color: '#e74c3c' },
                { label: 'SPD', value: w.baseCooldown === 0 ? 'Auto' : w.baseCooldown.toFixed(1) + 's', color: '#f1c40f' },
            ];
            for (let s = 0; s < stats.length; s++) {
                const sx = infoX + s * 85;
                const boxW = 75;
                const boxH = 22;
                ctx.fillStyle = 'rgba(124,154,110,0.1)';
                ctx.beginPath();
                ctx.roundRect(sx, statY, boxW, boxH, 4);
                ctx.fill();
                ctx.font = `bold 11px ${FB}`;
                const labelW = ctx.measureText(stats[s].label + ': ').width;
                const valW = ctx.measureText(String(stats[s].value)).width;
                const fullW = labelW + valW;
                const textX = sx + (boxW - fullW) / 2;
                ctx.fillStyle = stats[s].color;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(stats[s].label + ': ', textX, statY + boxH / 2);
                ctx.fillStyle = '#e8e4dc';
                ctx.fillText(String(stats[s].value), textX + labelW, statY + boxH / 2);
            }
        }
    }

    drawTutorialPassives(ctx, px, py, pw, ph, t) {
        const cx = px + pw / 2;

        ctx.fillStyle = '#b8d94e';
        ctx.font = `bold 30px ${FD}`;
        ctx.textAlign = 'center';
        ctx.fillText('Passive Items', cx, py + 40);

        ctx.fillStyle = 'rgba(232,228,220,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.fillText('Passively boost your stats \u2022 Choose on level up', cx, py + 72);

        const passiveKeys = Object.keys(PASSIVES);
        const cardW = (pw - 100) / 3;
        const cardH = 165;
        const gapX = 20;
        const gapY = 18;
        const startY = py + 105;

        for (let i = 0; i < passiveKeys.length; i++) {
            const p = PASSIVES[passiveKeys[i]];
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx2 = px + 40 + col * (cardW + gapX);
            const cy2 = startY + row * (cardH + gapY);

            ctx.fillStyle = 'rgba(30,34,28,0.6)';
            ctx.beginPath();
            ctx.roundRect(cx2, cy2, cardW, cardH, 12);
            ctx.fill();
            ctx.strokeStyle = p.color + '55';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cx2, cy2, cardW, cardH, 12);
            ctx.stroke();

            // Icon
            const iconSize = 50;
            const iconX = cx2 + (cardW - iconSize) / 2;
            const iconY = cy2 + 16;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.roundRect(iconX, iconY, iconSize, iconSize, 10);
            ctx.fill();
            ctx.font = `28px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.icon, iconX + iconSize / 2, iconY + iconSize / 2);

            // Name
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `bold 17px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(p.name, cx2 + cardW / 2, iconY + iconSize + 12);

            // Description
            ctx.fillStyle = 'rgba(232,228,220,0.6)';
            ctx.font = `13px ${FB}`;
            const desc = p.description;
            const maxW = cardW - 24;
            const words = desc.split(' ');
            let line = '';
            let lineY = iconY + iconSize + 36;
            for (const word of words) {
                const test = line + (line ? ' ' : '') + word;
                if (ctx.measureText(test).width > maxW && line) {
                    ctx.fillText(line, cx2 + cardW / 2, lineY);
                    line = word;
                    lineY += 17;
                } else {
                    line = test;
                }
            }
            if (line) ctx.fillText(line, cx2 + cardW / 2, lineY);

            // Max level badge
            ctx.fillStyle = 'rgba(124,154,110,0.15)';
            ctx.beginPath();
            ctx.roundRect(cx2 + cardW / 2 - 30, cy2 + cardH - 28, 60, 20, 6);
            ctx.fill();
            ctx.fillStyle = '#b8d94e';
            ctx.font = `bold 11px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Max Lv.${p.maxLevel}`, cx2 + cardW / 2, cy2 + cardH - 18);
        }
    }

    drawTutorialEnemies(ctx, px, py, pw, ph, t) {
        const cx = px + pw / 2;

        ctx.fillStyle = '#b8d94e';
        ctx.font = `bold 30px ${FD}`;
        ctx.textAlign = 'center';
        ctx.fillText('Blighted Foes', cx, py + 40);

        ctx.fillStyle = 'rgba(232,228,220,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.fillText('Each enemy type has different stats and behavior', cx, py + 72);

        const enemies = [
            { type: 'spore', name: 'Spore', role: 'Swarm', roleColor: '#7c9a6e', spawn: '0:00', desc: 'Slow-moving fungal blob. Weak alone but dangerous in groups.' },
            { type: 'wisp', name: 'Wisp', role: 'Scout', roleColor: '#7b5ea7', spawn: '0:30', desc: 'Fast, fragile spirit. Darts toward you quickly but goes down easy.' },
            { type: 'rootcrawler', name: 'Rootcrawler', role: 'Stalker', roleColor: '#c0703a', spawn: '1:15', desc: 'Wiry root creature with moderate speed. Tricky to dodge in crowds.' },
            { type: 'barkfell', name: 'Barkfell', role: 'Brute', roleColor: '#8b4513', spawn: '1:15', desc: 'Massive bark-covered brute. Slow but hits extremely hard.' },
            { type: 'revenant', name: 'Revenant', role: 'Elite', roleColor: '#b8d94e', spawn: '2:00', desc: 'Armored knight with high HP and damage. Mini-boss tier foe.' },
            { type: 'leech', name: 'Leech', role: 'Healer', roleColor: '#ff6b9d', spawn: '5:00', desc: 'Heals nearby Blighted over time. Kill it first to stop its support!' },
            { type: 'mimic', name: 'Mimic', role: 'Trickster', roleColor: '#e74c3c', spawn: '6:00', desc: 'Disguised as an XP gem. Reveals its true form when you approach.' },
            { type: 'hive', name: 'Hive', role: 'Splitter', roleColor: '#c4a23a', spawn: '6:00', desc: 'Honeycomb body that bursts into 3 smaller foes when slain.' },
            { type: 'warden', name: 'Warden', role: 'Guardian', roleColor: '#a0d0ff', spawn: '6:00', desc: 'Shields nearby enemies, reducing their damage taken by 50%.' },
        ];

        const rowH = 82;
        const startY = py + 98;
        const padX = 30;
        const spriteAreaW = 100;

        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const cfg = ENEMIES[e.type];
            const ry = startY + i * rowH;
            const rowW = pw - padX * 2;

            // Row background with left accent
            ctx.fillStyle = i % 2 === 0 ? 'rgba(30,36,26,0.35)' : 'rgba(25,30,22,0.25)';
            ctx.beginPath();
            ctx.roundRect(px + padX, ry, rowW, rowH - 8, 10);
            ctx.fill();

            // Left accent bar
            ctx.fillStyle = e.roleColor;
            ctx.beginPath();
            ctx.roundRect(px + padX, ry + 6, 4, rowH - 20, 2);
            ctx.fill();

            // Enemy sprite
            ctx.save();
            ctx.translate(px + padX + spriteAreaW / 2 + 8, ry + (rowH - 8) / 2);
            const spriteScale = 36 / (cfg.collisionRadius + 4);
            ctx.scale(spriteScale, spriteScale);
            const enemy = this.makeTutorialEnemy(e.type);
            if (enemy) enemy.draw(ctx);
            ctx.restore();

            // Info area
            const infoX = px + padX + spriteAreaW + 18;
            const infoW = rowW - spriteAreaW - 36;

            // Name + role
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `bold 17px ${FD}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(e.name, infoX, ry + 8);

            const nameW = ctx.measureText(e.name).width;
            const roleTextW = ctx.measureText(e.role).width;
            const roleBoxW = roleTextW + 14;
            const roleBoxX = infoX + nameW + 10;
            ctx.fillStyle = e.roleColor + '30';
            ctx.beginPath();
            ctx.roundRect(roleBoxX, ry + 8, roleBoxW, 18, 5);
            ctx.fill();
            ctx.fillStyle = e.roleColor;
            ctx.font = `bold 10px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.role, roleBoxX + roleBoxW / 2, ry + 17);

            // Description
            ctx.fillStyle = 'rgba(232,228,220,0.5)';
            ctx.font = `12px ${FB}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const maxDescW = infoW;
            const words = e.desc.split(' ');
            let line = '';
            let lineY = ry + 30;
            for (const word of words) {
                const test = line + (line ? ' ' : '') + word;
                if (ctx.measureText(test).width > maxDescW && line) {
                    ctx.fillText(line, infoX, lineY);
                    line = word;
                    lineY += 14;
                } else {
                    line = test;
                }
            }
            if (line) ctx.fillText(line, infoX, lineY);

            // Stats row
            const statY = ry + rowH - 28;
            const stats = [
                { label: 'HP', value: cfg.hp, color: '#e74c3c' },
                { label: 'SPD', value: cfg.speed, color: '#f1c40f' },
                { label: 'DMG', value: cfg.damage, color: '#e67e22' },
            ];
            const pillH = 22;
            const pillGap = 10;
            const availW = infoW - 90;
            const pills = [];
            let totalPillW = 0;
            for (let s = 0; s < stats.length; s++) {
                ctx.font = `bold 11px ${FB}`;
                const lw = ctx.measureText(stats[s].label).width;
                ctx.font = `600 11px ${FB}`;
                const vw = ctx.measureText(String(stats[s].value)).width;
                const pw = lw + vw + 24;
                pills.push({ lw, vw, pw });
                totalPillW += pw;
                if (s < stats.length - 1) totalPillW += pillGap;
            }
            let pillX = infoX + (availW - totalPillW) / 2;
            for (let s = 0; s < stats.length; s++) {
                const pw = pills[s].pw;
                // Pill background
                ctx.fillStyle = stats[s].color + '1a';
                ctx.beginPath();
                ctx.roundRect(pillX, statY, pw, pillH, 6);
                ctx.fill();
                // Left color dot
                ctx.fillStyle = stats[s].color;
                ctx.beginPath();
                ctx.arc(pillX + 10, statY + pillH / 2, 3, 0, Math.PI * 2);
                ctx.fill();
                // Label
                ctx.fillStyle = stats[s].color;
                ctx.font = `bold 11px ${FB}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(stats[s].label, pillX + 18, statY + pillH / 2);
                // Value
                ctx.fillStyle = '#e8e4dc';
                ctx.font = `600 11px ${FB}`;
                ctx.fillText(String(stats[s].value), pillX + 18 + pills[s].lw + 4, statY + pillH / 2);
                pillX += pw + pillGap;
            }

            // Spawn time on far right
            const spawnBoxX = px + padX + rowW - 82;
            const spawnBoxY = statY - 4;
            const spawnBoxW = 72;
            const spawnBoxH = 22;
            ctx.fillStyle = 'rgba(124,154,110,0.12)';
            ctx.beginPath();
            ctx.roundRect(spawnBoxX, spawnBoxY, spawnBoxW, spawnBoxH, 5);
            ctx.fill();
            ctx.fillStyle = 'rgba(232,228,220,0.4)';
            ctx.font = `500 11px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`\u23F1 ${e.spawn}`, spawnBoxX + spawnBoxW / 2, spawnBoxY + spawnBoxH / 2);
        }
    }

    drawTutorialEvolutions(ctx, px, py, pw, ph, t) {
        const cx = px + pw / 2;

        ctx.fillStyle = '#b8d94e';
        ctx.font = `bold 30px ${FD}`;
        ctx.textAlign = 'center';
        ctx.fillText('Weapon Evolutions', cx, py + 40);

        ctx.fillStyle = 'rgba(232,228,220,0.5)';
        ctx.font = `500 16px ${FB}`;
        ctx.fillText('Reach Weapon Level 8 + Passive Level 3 to evolve', cx, py + 72);

        const evoKeys = Object.keys(EVOLUTIONS);
        const cardW = (pw - 100) / 2;
        const cardH = 175;
        const gapX = 24;
        const gapY = 20;
        const startY = py + 105;

        for (let i = 0; i < evoKeys.length; i++) {
            const evo = EVOLUTIONS[evoKeys[i]];
            const baseW = WEAPON_TYPES[evo.baseWeaponId];
            const reqPassive = PASSIVES[evo.requiredPassive];
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx2 = px + 40 + col * (cardW + gapX);
            const cy2 = startY + row * (cardH + gapY);

            ctx.fillStyle = 'rgba(30,34,28,0.6)';
            ctx.beginPath();
            ctx.roundRect(cx2, cy2, cardW, cardH, 12);
            ctx.fill();
            ctx.strokeStyle = evo.color + '55';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cx2, cy2, cardW, cardH, 12);
            ctx.stroke();

            // Arrow from base to evolved
            const arrowX1 = cx2 + 48;
            const arrowY = cy2 + 44;
            const arrowX2 = cx2 + cardW - 48;

            // Base weapon icon (left)
            ctx.fillStyle = baseW.color;
            ctx.beginPath();
            ctx.roundRect(cx2 + 18, cy2 + 14, 60, 60, 8);
            ctx.fill();
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            if (evo.baseWeaponId === 'arcane_bolt') ctx.fillText('\uD83C\uDF31', cx2 + 48, cy2 + 44);
            else if (evo.baseWeaponId === 'orbiting_blade') ctx.fillText('\uD83C\uDF39', cx2 + 48, cy2 + 44);
            else if (evo.baseWeaponId === 'holy_pulse') ctx.fillText('\uD83C\uDF3B', cx2 + 48, cy2 + 44);
            else if (evo.baseWeaponId === 'lightning_mark') ctx.fillText('\u26A1', cx2 + 48, cy2 + 44);

            // Arrow
            ctx.strokeStyle = '#b8d94e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx2 + 86, cy2 + 44);
            ctx.lineTo(cx2 + cardW - 86, cy2 + 44);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx2 + cardW - 92, cy2 + 38);
            ctx.lineTo(cx2 + cardW - 82, cy2 + 44);
            ctx.lineTo(cx2 + cardW - 92, cy2 + 50);
            ctx.fillStyle = '#b8d94e';
            ctx.fill();

            // Evolved weapon icon (right)
            ctx.fillStyle = evo.color;
            ctx.beginPath();
            ctx.roundRect(cx2 + cardW - 78, cy2 + 14, 60, 60, 8);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            if (evoKeys[i] === 'arcane_storm') ctx.fillText('\uD83C\uDF3F', cx2 + cardW - 48, cy2 + 44);
            else if (evoKeys[i] === 'celestial_blades') ctx.fillText('\uD83C\uDFF4', cx2 + cardW - 48, cy2 + 44);
            else if (evoKeys[i] === 'divine_nova') ctx.fillText('\uD83C\uDF2C\uFE0F', cx2 + cardW - 48, cy2 + 44);
            else if (evoKeys[i] === 'thunder_crown') ctx.fillText('\uD83D\uDC51', cx2 + cardW - 48, cy2 + 44);

            // Names
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `bold 15px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(baseW.name, cx2 + 48, cy2 + 82);
            ctx.fillStyle = evo.color;
            ctx.fillText(evo.name, cx2 + cardW - 48, cy2 + 82);

            // Description
            ctx.fillStyle = 'rgba(232,228,220,0.6)';
            ctx.font = `12px ${FB}`;
            ctx.textAlign = 'center';
            ctx.fillText(evo.description, cx2 + cardW / 2, cy2 + 108);

            // Requirements
            const reqY = cy2 + 132;
            const reqBoxW = cardW - 40;
            ctx.fillStyle = 'rgba(124,154,110,0.1)';
            ctx.beginPath();
            ctx.roundRect(cx2 + 20, reqY, reqBoxW, 36, 6);
            ctx.fill();
            ctx.fillStyle = 'rgba(232,228,220,0.7)';
            ctx.font = `500 11px ${FB}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const reqText = `${baseW.name} Lv.${evo.requiredWeaponLevel}  +  ${reqPassive.name} Lv.${evo.requiredPassiveLevel}`;
            const reqWords = reqText.split('  ');
            if (ctx.measureText(reqText).width > reqBoxW - 16) {
                ctx.fillText(reqWords[0], cx2 + cardW / 2, reqY + 6);
                ctx.fillText(reqWords[1] || '', cx2 + cardW / 2, reqY + 21);
            } else {
                ctx.fillText(reqText, cx2 + cardW / 2, reqY + 16);
            }
        }
    }

    // --- Settings Screen ---

    showSettings(sound) {
        this.settingsScreen = { sound };
    }

    hideSettings() { this.settingsScreen = null; }

    drawSettings(ctx, sound) {
        this.hudTimer += 0.016;
        this.updateParticles(0.016);
        const t = this.hudTimer;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;

        this.menuBg.render();
        ctx.drawImage(this.menuBg.canvas, 0, 0);

        // Dark overlay
        ctx.fillStyle = 'rgba(10,14,8,0.7)';
        ctx.fillRect(0, 0, W, H);

        this.drawBackgroundParticles(ctx, t);

        // Title
        ctx.save();
        ctx.shadowColor = '#7b5ea7';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#7b5ea7';
        ctx.font = `bold 56px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SETTINGS', W / 2, 120);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Decorative line
        const lineLen = 200;
        const lineGrad = ctx.createLinearGradient(W / 2 - lineLen, 0, W / 2 + lineLen, 0);
        lineGrad.addColorStop(0, 'rgba(123,94,167,0)');
        lineGrad.addColorStop(0.5, 'rgba(123,94,167,0.5)');
        lineGrad.addColorStop(1, 'rgba(123,94,167,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineLen, 152);
        ctx.lineTo(W / 2 + lineLen, 152);
        ctx.stroke();

        const padSide = 30;
        const isMuted = sound ? sound.isMuted() : false;
        const isFullscreen = !!document.fullscreenElement || (typeof nw !== 'undefined' && nw.Window.get().isFullscreen);
        const togW = 80;
        const togH = 36;
        const circR = togH / 2 - 4;
        const rowGap = 18;

        // Animate toggles toward target
        const muteTarget = isMuted ? 0 : 1;
        const fsTarget = isFullscreen ? 1 : 0;
        this._toggleAnim.mute += (muteTarget - this._toggleAnim.mute) * 0.15;
        this._toggleAnim.fullscreen += (fsTarget - this._toggleAnim.fullscreen) * 0.15;
        if (Math.abs(this._toggleAnim.mute - muteTarget) < 0.01) this._toggleAnim.mute = muteTarget;
        if (Math.abs(this._toggleAnim.fullscreen - fsTarget) < 0.01) this._toggleAnim.fullscreen = fsTarget;

        const drawSettingsRow = (label, icon, y, content) => {
            const rowW = 460;
            const rowH = 80;
            const rowX = (W - rowW) / 2;
            const t = this.hudTimer;

            // Row background
            const rowGrad = ctx.createLinearGradient(rowX, y, rowX, y + rowH);
            rowGrad.addColorStop(0, 'rgba(60,50,80,0.2)');
            rowGrad.addColorStop(0.5, 'rgba(60,50,80,0.08)');
            rowGrad.addColorStop(1, 'rgba(60,50,80,0.15)');
            ctx.fillStyle = rowGrad;
            ctx.beginPath();
            ctx.roundRect(rowX, y, rowW, rowH, 14);
            ctx.fill();

            // Row border
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(rowX, y, rowW, rowH, 14);
            ctx.stroke();

            // Row top highlight
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.roundRect(rowX + 1, y + 1, rowW - 2, rowH * 0.35, [13, 13, 0, 0]);
            ctx.fill();

            // Label
            ctx.fillStyle = '#e8e4dc';
            ctx.font = `600 20px ${FD}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${icon}  ${label}`, rowX + padSide, y + 28);

            content(rowX, y, rowW, rowH);
        };

        // --- Row 1: Sound ---
        const r1y = 195;
        drawSettingsRow('Sound', '\uD83D\uDD0A', r1y, (rx, ry, rw, rh) => {
            const togX = rx + rw - padSide - togW;
            const togY = ry + 22;

            // Animated background color
            const muteA = this._toggleAnim.mute;
            const muteGrad = ctx.createLinearGradient(0, togY, 0, togY + togH);
            muteGrad.addColorStop(0, `rgb(${Math.round(139 - muteA * 49)},${Math.round(90 + muteA * 53)},${Math.round(98 + muteA * 12)})`);
            muteGrad.addColorStop(1, `rgb(${Math.round(111 - muteA * 50)},${Math.round(46 + muteA * 52)},${Math.round(48 + muteA * 18)})`);
            ctx.fillStyle = muteGrad;
            ctx.beginPath();
            ctx.roundRect(togX, togY, togW, togH, togH / 2);
            ctx.fill();

            // Animated circle position (lerp between off and on)
            const muteCircX = togX + circR + 4 + muteA * (togW - circR * 2 - 8);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(muteCircX, togY + togH / 2, circR, 0, Math.PI * 2);
            ctx.fill();

            // Circle shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(muteCircX, togY + togH / 2, circR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = 'rgba(232,228,220,0.35)';
            ctx.font = `500 12px ${FB}`;
            ctx.textAlign = 'left';
            ctx.fillText('Press [M] during gameplay', rx + padSide, ry + 56);

            this._settingsRects = this._settingsRects || {};
            this._settingsRects.mute = { x: togX, y: togY, w: togW, h: togH };
        });

        // --- Row 2: Fullscreen ---
        const r2y = r1y + 80 + rowGap;
        drawSettingsRow('Fullscreen', '\u26F6', r2y, (rx, ry, rw, rh) => {
            const fsX = rx + rw - padSide - togW;
            const fsY = ry + 22;

            // Animated background color
            const fsA = this._toggleAnim.fullscreen;
            const fsGrad = ctx.createLinearGradient(0, fsY, 0, fsY + togH);
            fsGrad.addColorStop(0, `rgb(${Math.round(74 - fsA * 13)},${Math.round(74 + fsA * 69)},${Math.round(80 + fsA * 30)})`);
            fsGrad.addColorStop(1, `rgb(${Math.round(58 - fsA * 19)},${Math.round(58 + fsA * 40)},${Math.round(64 + fsA * 18)})`);
            ctx.fillStyle = fsGrad;
            ctx.beginPath();
            ctx.roundRect(fsX, fsY, togW, togH, togH / 2);
            ctx.fill();

            // Animated circle position
            const fsCircX = fsX + circR + 4 + fsA * (togW - circR * 2 - 8);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(fsCircX, fsY + togH / 2, circR, 0, Math.PI * 2);
            ctx.fill();

            // Circle shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(fsCircX, fsY + togH / 2, circR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = 'rgba(232,228,220,0.35)';
            ctx.font = `500 12px ${FB}`;
            ctx.textAlign = 'left';
            ctx.fillText(isFullscreen ? 'Currently fullscreen' : 'Currently windowed', rx + padSide, ry + 56);

            this._settingsRects.fullscreen = { x: fsX, y: fsY, w: togW, h: togH };
        });

        // --- Row 3: Reset Save ---
        const r3y = r2y + 80 + rowGap;
        drawSettingsRow('Reset Save', '\uD83D\uDDD1', r3y, (rx, ry, rw, rh) => {
            const rstW = 120;
            const rstX = rx + rw - padSide - rstW;
            const rstY = ry + 22;

            const rstGrad = ctx.createLinearGradient(0, rstY, 0, rstY + togH);
            rstGrad.addColorStop(0, '#8b3a62');
            rstGrad.addColorStop(1, '#6b2a48');
            ctx.fillStyle = rstGrad;
            ctx.beginPath();
            ctx.roundRect(rstX, rstY, rstW, togH, togH / 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = `600 14px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Reset', rstX + rstW / 2, rstY + togH / 2);

            ctx.fillStyle = 'rgba(232,228,220,0.35)';
            ctx.font = `500 12px ${FB}`;
            ctx.textAlign = 'left';
            ctx.fillText('Erases all progress', rx + padSide, ry + 56);

            this._settingsRects.reset = { x: rstX, y: rstY, w: rstW, h: togH };
        });

        // Back button
        const backW = 260;
        const backH = 56;
        const backX = (W - backW) / 2;
        const backY = r3y + 80 + rowGap + 10;

        this._settingsRects.back = { x: backX, y: backY, w: backW, h: backH };

        const backHovered = this.mouseX >= backX && this.mouseX <= backX + backW &&
                            this.mouseY >= backY && this.mouseY <= backY + backH;
        const backPulse = backHovered ? 1 + Math.sin(t * 4) * 0.03 : 1;

        ctx.save();
        ctx.translate(backX + backW / 2, backY + backH / 2);
        ctx.scale(backPulse, backPulse);
        ctx.translate(-backW / 2, -backH / 2);

        const backGrad = ctx.createLinearGradient(0, 0, 0, backH);
        backGrad.addColorStop(0, '#4a4a50');
        backGrad.addColorStop(1, '#3a3a40');
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, backW, backH, 16);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(2, 2, backW - 4, backH * 0.45, [14, 14, 0, 0]);
        ctx.fill();

        if (backHovered) {
            drawGlowBorder(ctx, -1, -1, backW + 2, backH + 2, 17, '#7b5ea7', t, 14);
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-1, -1, backW + 2, backH + 2, 17);
            ctx.stroke();
        }

        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillStyle = backHovered ? '#fff' : '#e8e4dc';
        ctx.font = `bold 20px ${FD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2190  Back to Menu', backW / 2, backH / 2);
        ctx.shadowBlur = 0;

        ctx.restore();

        // Reset notification popup
        if (this._resetNotify > 0) {
            this._resetNotify -= 0.016;
            const alpha = this._resetNotify > 0.3 ? 1 : this._resetNotify / 0.3;
            const popW = 380;
            const popH = 80;
            const popX = (W - popW) / 2;
            const popY = r3y - 100;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Background
            const popGrad = ctx.createLinearGradient(popX, popY, popX, popY + popH);
            popGrad.addColorStop(0, 'rgba(124,154,110,0.92)');
            popGrad.addColorStop(1, 'rgba(80,110,60,0.92)');
            ctx.fillStyle = popGrad;
            ctx.beginPath();
            ctx.roundRect(popX, popY, popW, popH, 14);
            ctx.fill();

            // Border glow
            ctx.shadowColor = '#7c9a6e';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#7c9a6e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(popX, popY, popW, popH, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Checkmark icon
            ctx.fillStyle = '#fff';
            ctx.font = `bold 28px ${FD}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u2713', popX + 35, popY + popH / 2);

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = `bold 18px ${FD}`;
            ctx.textAlign = 'left';
            ctx.fillText('Save Reset', popX + 60, popY + 30);

            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = `500 13px ${FB}`;
            ctx.fillText('All progress has been erased', popX + 60, popY + 55);

            ctx.restore();
        }
    }

    isSettingsButtonAt(mx, my, buttonId) {
        if (!this._settingsRects || !this._settingsRects[buttonId]) return false;
        const r = this._settingsRects[buttonId];
        return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
    }
}
