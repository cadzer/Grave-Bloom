// Menu background renderer using image assets.
// Loads background and logo images, draws to offscreen canvas once, then blits each frame.

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
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return;
        this.loaded = true;

        const loadImage = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

        this.bgImage = await loadImage('assets/menu-bg.png');
        this.logoImage = await loadImage('assets/menu-logo.png');
    }

    render() {
        if (this.rendered) return;
        const ctx = this.ctx;

        // === BACKGROUND IMAGE ===
        if (this.bgImage) {
            // Scale to cover entire canvas (center crop)
            const imgRatio = this.bgImage.width / this.bgImage.height;
            const canvasRatio = W / H;
            let drawW, drawH, drawX, drawY;

            if (imgRatio > canvasRatio) {
                drawH = H;
                drawW = H * imgRatio;
                drawX = (W - drawW) / 2;
                drawY = 0;
            } else {
                drawW = W;
                drawH = W / imgRatio;
                drawX = 0;
                drawY = (H - drawH) / 2;
            }

            ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);
        } else {
            // Fallback gradient if image fails to load
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#1a1040');
            grad.addColorStop(0.5, '#3a1545');
            grad.addColorStop(1, '#0a1008');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        // === VIGNETTE OVERLAY ===
        this._drawVignette(ctx);

        // === SUBTLE GRAIN ===
        this._drawGrain(ctx);

        this.rendered = true;
    }

    _drawVignette(ctx) {
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.75);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);
    }

    _drawGrain(ctx) {
        const rng = this._seededRandom(123);
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 3000; i++) {
            const x = rng() * W;
            const y = rng() * H;
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

    draw(ctx, time) {
        this.render();
        ctx.drawImage(this.canvas, 0, 0);
    }
}
