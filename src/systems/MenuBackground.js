// Menu background renderer using image assets.
// Loads background and logo images, draws animated background with fireflies.

const W = 1920;
const H = 1080;

export class MenuBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = W;
        this.canvas.height = H;
        this.ctx = this.canvas.getContext('2d');
        this.rendered = false;
        this.bgImage = null;
        this.logoImage = null;
        this._ready = false;
        this._loadStarted = false;
        this._time = 0;
        this._fireflies = [];
        this._baseCanvas = null;
        this._baseCtx = null;
    }

    load() {
        if (this._loadStarted) return;
        this._loadStarted = true;
        const loadImage = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
        Promise.all([
            loadImage('assets/menu-bg.jpg'),
            loadImage('assets/menu-logo.png')
        ]).then(([bg, logo]) => {
            this.bgImage = bg;
            this.logoImage = logo;
            this._ready = true;
            this.rendered = false;
            this._initFireflies();
            this._renderBase();
        });
    }

    _initFireflies() {
        this._fireflies = [];
        const layers = [
            { count: 10, sizeMin: 0.8, sizeMax: 1.5, brightMin: 0.12, brightMax: 0.3, speed: 0.12, drift: 40, depth: 0.3 },
            { count: 14, sizeMin: 1.5, sizeMax: 2.8, brightMin: 0.25, brightMax: 0.55, speed: 0.22, drift: 65, depth: 0.65 },
            { count: 8, sizeMin: 2.8, sizeMax: 4.2, brightMin: 0.45, brightMax: 0.8, speed: 0.32, drift: 85, depth: 1.0 },
            { count: 3, sizeMin: 5.0, sizeMax: 7.0, brightMin: 0.6, brightMax: 0.9, speed: 0.08, drift: 30, depth: 1.0 },
        ];
        for (const layer of layers) {
            for (let i = 0; i < layer.count; i++) {
                const isGold = Math.random() > 0.25;
                const hue = isGold ? 65 + Math.random() * 30 : 195 + Math.random() * 45;
                const sat = isGold ? 55 + Math.random() * 35 : 40 + Math.random() * 30;
                const lit = isGold ? 70 + Math.random() * 15 : 75 + Math.random() * 15;
                this._fireflies.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    baseX: Math.random() * W,
                    baseY: Math.random() * H,
                    size: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
                    speed: layer.speed * (0.6 + Math.random() * 0.8),
                    phase: Math.random() * Math.PI * 2,
                    phaseY: Math.random() * Math.PI * 2,
                    drift: layer.drift * (0.5 + Math.random() * 1.0),
                    driftY: layer.drift * (0.3 + Math.random() * 0.5),
                    brightness: 0,
                    maxBrightness: layer.brightMin + Math.random() * (layer.brightMax - layer.brightMin),
                    depth: layer.depth,
                    trail: [],
                    trailLen: Math.floor(5 + Math.random() * 8),
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 1.2 + Math.random() * 2.5,
                    hue,
                    sat,
                    lit,
                    wanderAngle: Math.random() * Math.PI * 2,
                    wanderSpeed: 0.3 + Math.random() * 0.5,
                });
            }
        }
    }

    _updateFireflies(dt) {
        for (const f of this._fireflies) {
            f.phase += f.speed * dt;
            f.phaseY += f.speed * 0.7 * dt;
            f.pulsePhase += f.pulseSpeed * dt;

            f.wanderAngle += (Math.sin(f.phase * 1.3 + f.wanderAngle) * 0.5) * dt;
            const wanderX = Math.cos(f.wanderAngle) * f.drift * 0.15;
            const wanderY = Math.sin(f.wanderAngle * 0.7) * f.driftY * 0.15;
            const wobbleX = Math.sin(f.phase) * f.drift + Math.sin(f.phase * 2.3 + 0.5) * f.drift * 0.25;
            const wobbleY = Math.cos(f.phaseY) * f.driftY + Math.cos(f.phaseY * 1.8 + 1.1) * f.driftY * 0.2;
            f.x = f.baseX + wobbleX + wanderX;
            f.y = f.baseY + wobbleY + wanderY;

            f.baseX += wanderX * dt * 10;
            f.baseY += wanderY * dt * 10;

            const baseFlicker = 0.5 + 0.5 * Math.sin(f.phase * 3.8 + f.phaseY * 2.1);
            const deepFlicker = 0.3 + 0.7 * Math.pow(baseFlicker, 1.5);
            const pulse = 0.6 + 0.4 * Math.sin(f.pulsePhase);
            const micro = 0.88 + 0.12 * Math.sin(f.phase * 9.7);
            const breath = 0.75 + 0.25 * Math.sin(f.phase * 0.4 + f.phaseY * 0.3);
            f.brightness = f.maxBrightness * deepFlicker * pulse * micro * breath;

            f.trail.unshift({ x: f.x, y: f.y, a: f.brightness * 0.5 });
            if (f.trail.length > f.trailLen) f.trail.length = f.trailLen;

            const margin = f.drift + 40;
            if (f.x < -margin) f.baseX += W + margin * 2;
            if (f.x > W + margin) f.baseX -= W + margin * 2;
            if (f.y < -margin) f.baseY += H + margin * 2;
            if (f.y > H + margin) f.baseY -= H + margin * 2;
        }
    }

    _drawFireflies(ctx) {
        for (const f of this._fireflies) {
            const trail = f.trail;
            for (let i = 1; i < trail.length; i++) {
                const t = trail[i];
                const frac = i / trail.length;
                const alpha = t.a * (1 - frac) * 0.45;
                if (alpha < 0.005) continue;
                const sz = f.size * (1 - frac * 0.7) * 0.5;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = `hsla(${f.hue},${f.sat}%,${f.lit}%,1)`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, sz, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            if (f.brightness < 0.02) continue;

            ctx.save();

            ctx.globalAlpha = f.brightness * 0.12;
            ctx.shadowColor = `hsla(${f.hue},${f.sat}%,${f.lit}%,1)`;
            ctx.shadowBlur = f.size * 28;
            ctx.fillStyle = `hsla(${f.hue},${f.sat}%,${f.lit}%,1)`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = f.brightness * 0.35;
            ctx.shadowBlur = f.size * 14;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = f.brightness * 0.7;
            ctx.shadowBlur = f.size * 6;
            ctx.fillStyle = `hsla(${f.hue},${f.sat}%,${Math.min(95, f.lit + 15)}%,1)`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * 0.55, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = Math.min(1, f.brightness * 1.2);
            ctx.shadowBlur = 0;
            ctx.fillStyle = `hsla(${f.hue},${Math.min(100, f.sat + 20)}%,97%,1)`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * 0.22, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    _renderBase() {
        const PAD = 1.08;
        const BW = Math.ceil(W * PAD);
        const BH = Math.ceil(H * PAD);
        this._baseCanvas = document.createElement('canvas');
        this._baseCanvas.width = BW;
        this._baseCanvas.height = BH;
        this._baseCtx = this._baseCanvas.getContext('2d');
        const ctx = this._baseCtx;

        if (this.bgImage) {
            const imgRatio = this.bgImage.width / this.bgImage.height;
            const canvasRatio = BW / BH;
            let drawW, drawH, drawX, drawY;

            if (imgRatio > canvasRatio) {
                drawH = BH;
                drawW = BH * imgRatio;
                drawX = (BW - drawW) / 2;
                drawY = 0;
            } else {
                drawW = BW;
                drawH = BW / imgRatio;
                drawX = 0;
                drawY = (BH - drawH) / 2;
            }

            ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, BH);
            grad.addColorStop(0, '#1a1040');
            grad.addColorStop(0.5, '#3a1545');
            grad.addColorStop(1, '#0a1008');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, BW, BH);
        }

        ctx.fillStyle = 'rgba(10,8,20,0.3)';
        ctx.fillRect(0, 0, BW, BH);

        this._drawVignette(ctx, BW, BH);
        this._drawGrain(ctx, BW, BH);
    }

    _drawVignette(ctx, w, h) {
        const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w * 0.65);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
        vigGrad.addColorStop(0.8, 'rgba(0,0,0,0.45)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.75)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, w, h);
    }

    _drawGrain(ctx, w, h) {
        const rng = this._seededRandom(123);
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 3000; i++) {
            const x = rng() * w;
            const y = rng() * h;
            ctx.fillStyle = rng() > 0.5 ? '#fff' : '#000';
            ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    _seededRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 16807 + 0) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    draw(ctx, dt) {
        if (!this._baseCanvas) {
            this._renderBase();
        }

        this._time += dt || 0;
        this._updateFireflies(dt || 0.016);

        ctx.save();
        ctx.drawImage(this._baseCanvas, (W - this._baseCanvas.width) / 2, (H - this._baseCanvas.height) / 2);
        ctx.restore();

        this._drawFireflies(ctx);
    }
}
