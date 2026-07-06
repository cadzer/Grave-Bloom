import { GAME } from '../config/GameConfig.js';

const TILE_SIZE = 128;

const BIOMES = [
    {
        name: 'Grave Garden',
        minTime: 0,
        baseColor: '#1e1e22',
        noiseColors: [[30, 30, 34], [35, 28, 32]],
        patchColor: 'rgba(90, 70, 50, 0.15)',
        grassColor: 'rgba(70, 80, 55, 0.35)',
        sporeColor: 'rgba(124, 154, 110, 0.25)',
        sporeCount: 3,
        leafCount: 6,
        grassCount: 12
    },
    {
        name: 'Dead Forest',
        minTime: 120,
        baseColor: '#1a1816',
        noiseColors: [[26, 22, 20], [30, 25, 22]],
        patchColor: 'rgba(60, 45, 30, 0.18)',
        grassColor: 'rgba(50, 55, 40, 0.3)',
        sporeColor: 'rgba(180, 120, 60, 0.2)',
        sporeCount: 2,
        leafCount: 10,
        grassCount: 8
    },
    {
        name: 'Ash Wastes',
        minTime: 300,
        baseColor: '#1c1a1a',
        noiseColors: [[28, 26, 26], [24, 22, 22]],
        patchColor: 'rgba(80, 70, 60, 0.12)',
        grassColor: 'rgba(90, 85, 80, 0.25)',
        sporeColor: 'rgba(200, 100, 50, 0.18)',
        sporeCount: 4,
        leafCount: 3,
        grassCount: 6
    }
];

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.tiles = {};
        this.currentBiomeIdx = 0;
        this.hitStopTimer = 0;
        this.screenFlash = { r: 255, g: 255, b: 255, alpha: 0, timer: 0 };
        this.biomeTint = { r: 0, g: 0, b: 0 };
        this._cachedTime = 0;
        for (let i = 0; i < BIOMES.length; i++) {
            this.tiles[i] = this.createGrassTile(BIOMES[i]);
        }
        this.setupCanvas();
        this._initPostProcess();
    }

    getBiomeIndex(elapsedTime) {
        let idx = 0;
        for (let i = BIOMES.length - 1; i >= 0; i--) {
            if (elapsedTime >= BIOMES[i].minTime) {
                idx = i;
                break;
            }
        }
        return idx;
    }

    createGrassTile(biome) {
        const tc = document.createElement('canvas');
        tc.width = TILE_SIZE;
        tc.height = TILE_SIZE;
        const ctx = tc.getContext('2d');

        ctx.fillStyle = biome.baseColor;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

        for (let i = 0; i < 300; i++) {
            const x = Math.random() * TILE_SIZE;
            const y = Math.random() * TILE_SIZE;
            const s = 1 + Math.random() * 3;
            const c = biome.noiseColors[Math.floor(Math.random() * biome.noiseColors.length)];
            const brightness = Math.random() > 0.5 ? 1 : -1;
            ctx.fillStyle = `rgb(${c[0] + brightness * (5 + Math.random() * 8)},${c[1] + brightness * (5 + Math.random() * 8)},${c[2] + brightness * (5 + Math.random() * 8)})`;
            ctx.fillRect(x, y, s, s);
        }

        for (let i = 0; i < biome.leafCount; i++) {
            const x = Math.random() * TILE_SIZE;
            const y = Math.random() * TILE_SIZE;
            const r = 4 + Math.random() * 8;
            ctx.fillStyle = biome.patchColor;
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < biome.grassCount; i++) {
            const x = Math.random() * TILE_SIZE;
            const y = Math.random() * TILE_SIZE;
            const h = 4 + Math.random() * 7;
            const lean = (Math.random() - 0.5) * 3;
            ctx.strokeStyle = biome.grassColor;
            ctx.lineWidth = 1 + Math.random();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + lean, y - h * 0.6, x + lean * 1.5, y - h);
            ctx.stroke();
        }

        for (let i = 0; i < biome.sporeCount; i++) {
            const x = Math.random() * TILE_SIZE;
            const y = Math.random() * TILE_SIZE;
            ctx.fillStyle = biome.sporeColor;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        return tc;
    }

    setupCanvas() {
        this.canvas.width = GAME.WIDTH;
        this.canvas.height = GAME.HEIGHT;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _initPostProcess() {
        const w = GAME.WIDTH;
        const h = GAME.HEIGHT;
        const halfW = w >> 1;
        const halfH = h >> 1;

        this.bloomCanvas = document.createElement('canvas');
        this.bloomCanvas.width = halfW;
        this.bloomCanvas.height = halfH;
        this.bloomCtx = this.bloomCanvas.getContext('2d');

        this._vignetteCanvas = null;
        this._vignetteW = 0;
        this._vignetteH = 0;

        this._gradingFill = null;

        this._grainCanvas = document.createElement('canvas');
        this._grainCanvas.width = w;
        this._grainCanvas.height = h;
        this._grainCtx = this._grainCanvas.getContext('2d');
        this._grainFrames = [];
        this._grainFrameIdx = 0;
        this._generateGrainFrames(6);

        this.levelUpFlash = 0;
        this.chromaticStrength = 0;
        this.colorShiftAmount = 0;
    }

    _generateGrainFrames(count) {
        const w = this._grainCanvas.width;
        const h = this._grainCanvas.height;
        for (let f = 0; f < count; f++) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const gctx = c.getContext('2d');
            const imgData = gctx.createImageData(w, h);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                const v = Math.random() * 255;
                d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
            }
            gctx.putImageData(imgData, 0, 0);
            this._grainFrames.push(c);
        }
    }

    _ensureVignette(w, h) {
        if (this._vignetteCanvas && this._vignetteW === w && this._vignetteH === h) return;
        const vc = document.createElement('canvas');
        vc.width = w;
        vc.height = h;
        const vctx = vc.getContext('2d');
        const grad = vctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.6, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.55)');
        vctx.fillStyle = grad;
        vctx.fillRect(0, 0, w, h);
        this._vignetteCanvas = vc;
        this._vignetteW = w;
        this._vignetteH = h;
    }

    applyBloom(ctx, w, h, strength) {
        const halfW = w >> 1;
        const halfH = h >> 1;

        const bctx = this.bloomCtx;
        bctx.clearRect(0, 0, halfW, halfH);
        bctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, halfW, halfH);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = strength || 0.12;
        ctx.drawImage(this.bloomCanvas, 0, 0, halfW, halfH, 0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    applyVignette(ctx, w, h) {
        this._ensureVignette(w, h);
        ctx.drawImage(this._vignetteCanvas, 0, 0);
    }

    applyColorGrading(ctx, w, h, biomeIdx) {
        const tints = [
            [8, 20, 8],
            [15, 8, 0],
            [18, 6, 0]
        ];
        const t = tints[biomeIdx] || tints[0];
        const key = `${t[0]}_${t[1]}_${t[2]}`;
        if (this._gradingFill !== key) {
            this._gradingFill = key;
            this._gradingColor = `rgb(${255 - t[0]},${255 - t[1]},${255 - t[2]})`;
        }
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = this._gradingColor;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    flashScreen(r, g, b, alpha, duration) {
        this.screenFlash = { r, g, b, alpha, timer: duration, maxTimer: duration };
    }

    flashLevelUp() {
        this.levelUpFlash = 0.15;
    }

    setChromaticStrength(s) {
        this.chromaticStrength = Math.max(this.chromaticStrength, s);
    }

    setColorShift(amount) {
        this.colorShiftAmount = Math.max(this.colorShiftAmount, amount);
    }

    hitStop(duration) {
        this.hitStopTimer = Math.max(this.hitStopTimer, duration);
    }

    resize() {
        const winRatio = window.innerWidth / window.innerHeight;
        const gameRatio = GAME.WIDTH / GAME.HEIGHT;
        let w, h;

        if (winRatio > gameRatio) {
            h = window.innerHeight;
            w = h * gameRatio;
        } else {
            w = window.innerWidth;
            h = w / gameRatio;
        }

        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${(window.innerWidth - w) / 2}px`;
        this.canvas.style.top = `${(window.innerHeight - h) / 2}px`;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    updateShake(dt) {
        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            return true;
        }
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
        if (this.screenFlash.timer > 0) {
            this.screenFlash.timer -= dt;
        }
        if (this.levelUpFlash > 0) {
            this.levelUpFlash -= dt * 3;
        }
        if (this.chromaticStrength > 0) {
            this.chromaticStrength -= dt * 2;
        }
        if (this.colorShiftAmount > 0) {
            this.colorShiftAmount -= dt * 0.5;
        }
        return false;
    }

    clear() {
        this.ctx.fillStyle = '#141416';
        this.ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    }

    drawBackground(playerX, playerY, elapsedTime) {
        const ctx = this.ctx;
        const ox = ((playerX % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
        const oy = ((playerY % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
        const biomeIdx = elapsedTime !== undefined ? this.getBiomeIndex(elapsedTime) : 0;
        const tile = this.tiles[biomeIdx] || this.tiles[0];

        for (let x = -TILE_SIZE; x < GAME.WIDTH + TILE_SIZE; x += TILE_SIZE) {
            for (let y = -TILE_SIZE; y < GAME.HEIGHT + TILE_SIZE; y += TILE_SIZE) {
                ctx.drawImage(tile, x - ox, y - oy);
            }
        }
    }

    drawScreenFlash(ctx) {
        const sf = this.screenFlash;
        if (sf.timer <= 0) return;
        const alpha = sf.alpha * (sf.timer / sf.maxTimer);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(${sf.r},${sf.g},${sf.b},${alpha})`;
        ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
        ctx.restore();
    }

    drawLight(ctx, sx, sy, radius, color, intensity) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
        grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${intensity})`);
        grad.addColorStop(0.4, `rgba(${color[0]},${color[1]},${color[2]},${intensity * 0.4})`);
        grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawDynamicLighting(ctx, cx, cy, player, weaponManager, bosses) {
        this._cachedTime = Date.now();
        this.drawLight(ctx, cx, cy, 200, [124, 154, 110], 0.06);

        if (player.hp > 0 && player.hp / player.maxHp < 0.25) {
            const pulse = 0.03 + Math.sin(this._cachedTime * 0.005) * 0.015;
            this.drawLight(ctx, cx, cy, 180, [180, 50, 50], pulse);
        }

        if (weaponManager) {
            for (const w of weaponManager.weapons) {
                if (w.config.category === 'pulse') {
                    const pulse = 0.02 + Math.sin(this._cachedTime * 0.003) * 0.01;
                    this.drawLight(ctx, cx, cy, 130 + (w.level - 1) * 10, [184, 217, 78], pulse);
                }
            }
        }

        if (bosses) {
            for (const b of bosses) {
                if (b.dead) continue;
                const bx = cx + (b.x - player.x);
                const by = cy + (b.y - player.y);
                const pulse = 0.06 + Math.sin(this._cachedTime * 0.002) * 0.02;
                this.drawLight(ctx, bx, by, 200, [200, 100, 50], pulse);
                this.drawLight(ctx, bx, by, 120, [255, 150, 80], pulse * 0.5);
            }
        }
    }

    drawPostProcess(ctx, elapsedTime, playerHpPct) {
        const w = GAME.WIDTH;
        const h = GAME.HEIGHT;
        const biomeIdx = elapsedTime !== undefined ? this.getBiomeIndex(elapsedTime) : 0;
        this.applyBloom(ctx, w, h, 0.1);
        this.applyColorGrading(ctx, w, h, biomeIdx);
        this.applyVignette(ctx, w, h);

        if (this.levelUpFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.levelUpFlash * 4;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        if (playerHpPct !== undefined && playerHpPct < 0.25 && playerHpPct > 0) {
            const intensity = (0.25 - playerHpPct) / 0.25;
            ctx.save();
            const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
            vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
            vigGrad.addColorStop(1, `rgba(120,20,20,${0.35 * intensity})`);
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        if (this.chromaticStrength > 0.05) {
            const offset = Math.round(this.chromaticStrength * 3);
            if (offset > 0) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(ctx.canvas, -offset, 0);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.5;
                ctx.drawImage(ctx.canvas, offset, 0);
                ctx.restore();
            }
        }

        if (this.colorShiftAmount > 0.01) {
            ctx.save();
            ctx.globalAlpha = this.colorShiftAmount * 0.3;
            ctx.fillStyle = '#1a0a0a';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        const grainAlpha = 0.04;
        if (this._grainFrames.length > 0) {
            this._grainFrameIdx = (this._grainFrameIdx + 1) % this._grainFrames.length;
            ctx.save();
            ctx.globalAlpha = grainAlpha;
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(this._grainFrames[this._grainFrameIdx], 0, 0);
            ctx.restore();
        }

        this.drawScreenFlash(ctx);
    }

    getBiomeName(elapsedTime) {
        return BIOMES[this.getBiomeIndex(elapsedTime)].name;
    }

    getContext() {
        return this.ctx;
    }
}
