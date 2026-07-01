// Procedural pixel art menu background renderer.
// Draws to an offscreen canvas once, then blits each frame.
// Scene: Castle on mountain, pine forest, knight, sunset, fog.

const W = 1920;
const H = 1080;
const PX = 3; // pixel scale

export class MenuBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = W;
        this.canvas.height = H;
        this.ctx = this.canvas.getContext('2d');
        this.rendered = false;
        this.fogOffset = 0;
    }

    render() {
        if (this.rendered) return;
        const ctx = this.ctx;

        // === SKY GRADIENT (sunset) ===
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
        skyGrad.addColorStop(0, '#0b0e1a');
        skyGrad.addColorStop(0.2, '#1a1040');
        skyGrad.addColorStop(0.4, '#3a1545');
        skyGrad.addColorStop(0.55, '#6b2040');
        skyGrad.addColorStop(0.7, '#c45020');
        skyGrad.addColorStop(0.85, '#e89030');
        skyGrad.addColorStop(1.0, '#f0c060');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.55);

        // === STARS (upper sky) ===
        this._drawStars(ctx);

        // === SUN GLOW (behind mountains) ===
        const sunX = W * 0.65;
        const sunY = H * 0.42;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 300);
        sunGrad.addColorStop(0, 'rgba(255,220,120,0.6)');
        sunGrad.addColorStop(0.3, 'rgba(255,180,80,0.3)');
        sunGrad.addColorStop(0.7, 'rgba(200,100,40,0.1)');
        sunGrad.addColorStop(1, 'rgba(200,100,40,0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, W, H * 0.6);

        // === DISTANT MOUNTAINS ===
        this._drawMountainRange(ctx, H * 0.42, 0.15, '#1a1028', 0.6);
        this._drawMountainRange(ctx, H * 0.45, 0.2, '#1e1430', 0.8);
        this._drawMountainRange(ctx, H * 0.48, 0.25, '#221838', 1.0);

        // === CASTLE ON MOUNTAIN ===
        this._drawCastle(ctx);

        // === MID MOUNTAINS ===
        this._drawMountainRange(ctx, H * 0.52, 0.3, '#1a2018', 1.0);
        this._drawMountainRange(ctx, H * 0.55, 0.35, '#1e281c', 1.0);

        // === ROLLING HILLS ===
        this._drawHills(ctx);

        // === PINE TREES (mid-ground) ===
        this._drawPineForest(ctx, H * 0.56, 100, 0.4, '#0e1a0e');
        this._drawPineForest(ctx, H * 0.6, 70, 0.6, '#122212');
        this._drawPineForest(ctx, H * 0.64, 50, 0.8, '#162a16');

        // === FOREGROUND HILL ===
        this._drawForegroundHill(ctx);

        // === FOREGROUND PINE TREES ===
        this._drawPineTree(ctx, 80, H * 0.62, 2.2, '#0a140a');
        this._drawPineTree(ctx, 200, H * 0.64, 1.8, '#0c180c');
        this._drawPineTree(ctx, W - 120, H * 0.6, 2.5, '#0a140a');
        this._drawPineTree(ctx, W - 280, H * 0.63, 1.6, '#0c180c');
        this._drawPineTree(ctx, W - 400, H * 0.65, 1.2, '#0e1c0e');

        // === CLIFF EDGE (foreground) ===
        this._drawCliffEdge(ctx);

        // === GROUND ===
        this._drawGround(ctx);

        // === KNIGHT ===
        this._drawKnight(ctx);

        // === ATMOSPHERIC FOG LAYERS ===
        this._drawFogLayers(ctx);

        // === VIGNETTE ===
        this._drawVignette(ctx);

        // === SUBTLE GRAIN ===
        this._drawGrain(ctx);

        this.rendered = true;
    }

    _drawStars(ctx) {
        const rng = this._seededRandom(42);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 80; i++) {
            const x = rng() * W;
            const y = rng() * H * 0.35;
            const s = rng() * 1.5 + 0.5;
            const a = rng() * 0.6 + 0.2;
            ctx.globalAlpha = a;
            ctx.fillRect(Math.floor(x / PX) * PX, Math.floor(y / PX) * PX, s, s);
        }
        ctx.globalAlpha = 1;
    }

    _drawMountainRange(ctx, baseY, peakHeight, color, alpha) {
        const rng = this._seededRandom(Math.floor(baseY * 100));
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(0, H);

        let x = -50;
        while (x < W + 50) {
            const segW = 80 + rng() * 200;
            const peakH = baseY - (rng() * H * peakHeight + 20);
            ctx.lineTo(x, baseY + rng() * 30);
            ctx.lineTo(x + segW * 0.5, peakH);
            ctx.lineTo(x + segW, baseY + rng() * 20);
            x += segW;
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    _drawCastle(ctx) {
        const cx = W * 0.62;
        const baseY = H * 0.38;

        // Mountain base for castle
        ctx.fillStyle = '#2a1e3a';
        ctx.beginPath();
        ctx.moveTo(cx - 180, baseY + 80);
        ctx.lineTo(cx - 60, baseY - 60);
        ctx.lineTo(cx, baseY - 100);
        ctx.lineTo(cx + 60, baseY - 50);
        ctx.lineTo(cx + 180, baseY + 80);
        ctx.closePath();
        ctx.fill();

        // Mountain highlight
        ctx.fillStyle = '#3a2848';
        ctx.beginPath();
        ctx.moveTo(cx - 40, baseY - 30);
        ctx.lineTo(cx, baseY - 100);
        ctx.lineTo(cx + 40, baseY - 20);
        ctx.closePath();
        ctx.fill();

        // Castle body
        const castleColor = '#2a2035';
        const castleLight = '#3a2e48';
        const windowGlow = '#f0b840';

        // Main wall
        ctx.fillStyle = castleColor;
        ctx.fillRect(cx - 50, baseY - 80, 100, 60);

        // Wall highlight (left face)
        ctx.fillStyle = castleLight;
        ctx.fillRect(cx - 50, baseY - 80, 8, 60);

        // Left tower
        ctx.fillStyle = castleColor;
        ctx.fillRect(cx - 65, baseY - 120, 30, 100);
        ctx.fillStyle = castleLight;
        ctx.fillRect(cx - 65, baseY - 120, 5, 100);

        // Right tower
        ctx.fillStyle = castleColor;
        ctx.fillRect(cx + 35, baseY - 110, 30, 90);
        ctx.fillStyle = castleLight;
        ctx.fillRect(cx + 35, baseY - 110, 5, 90);

        // Center tower (tallest)
        ctx.fillStyle = castleColor;
        ctx.fillRect(cx - 15, baseY - 150, 30, 130);
        ctx.fillStyle = castleLight;
        ctx.fillRect(cx - 15, baseY - 150, 5, 130);

        // Battlements (crenellations)
        const bSize = 6;
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = castleColor;
            ctx.fillRect(cx - 50 + i * 14, baseY - 88, bSize, 8);
        }
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(cx - 65 + i * 12, baseY - 128, bSize, 8);
            ctx.fillRect(cx + 35 + i * 12, baseY - 118, bSize, 8);
        }
        // Center tower battlement
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(cx - 15 + i * 12, baseY - 158, bSize, 8);
        }

        // Tower caps (conical roofs)
        ctx.fillStyle = '#1a1025';
        ctx.beginPath();
        ctx.moveTo(cx - 65, baseY - 120);
        ctx.lineTo(cx - 50, baseY - 145);
        ctx.lineTo(cx - 35, baseY - 120);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 35, baseY - 110);
        ctx.lineTo(cx + 50, baseY - 132);
        ctx.lineTo(cx + 65, baseY - 110);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - 15, baseY - 150);
        ctx.lineTo(cx, baseY - 175);
        ctx.lineTo(cx + 15, baseY - 150);
        ctx.fill();

        // Windows with warm glow
        const drawWindow = (wx, wy, ww, wh) => {
            // Glow around window
            const glowGrad = ctx.createRadialGradient(wx + ww / 2, wy + wh / 2, 2, wx + ww / 2, wy + wh / 2, 20);
            glowGrad.addColorStop(0, 'rgba(240,184,64,0.4)');
            glowGrad.addColorStop(1, 'rgba(240,184,64,0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(wx - 10, wy - 10, ww + 20, wh + 20);

            ctx.fillStyle = windowGlow;
            ctx.fillRect(wx, wy, ww, wh);

            // Window cross
            ctx.fillStyle = castleColor;
            ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
            ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2);
        };

        // Left tower windows
        drawWindow(cx - 58, baseY - 110, 6, 8);
        drawWindow(cx - 58, baseY - 95, 6, 8);

        // Right tower windows
        drawWindow(cx + 42, baseY - 100, 6, 8);
        drawWindow(cx + 42, baseY - 85, 6, 8);

        // Center tower windows
        drawWindow(cx - 8, baseY - 140, 6, 8);
        drawWindow(cx + 2, baseY - 140, 6, 8);
        drawWindow(cx - 8, baseY - 125, 6, 8);
        drawWindow(cx + 2, baseY - 125, 6, 8);
        drawWindow(cx - 8, baseY - 110, 6, 8);
        drawWindow(cx + 2, baseY - 110, 6, 8);

        // Main wall windows
        drawWindow(cx - 30, baseY - 65, 8, 10);
        drawWindow(cx - 10, baseY - 65, 8, 10);
        drawWindow(cx + 10, baseY - 65, 8, 10);
        drawWindow(cx + 30, baseY - 65, 8, 10);

        // Gate
        ctx.fillStyle = '#1a1020';
        ctx.beginPath();
        ctx.arc(cx, baseY - 20, 15, Math.PI, 0);
        ctx.fillRect(cx - 15, baseY - 20, 30, 20);
        ctx.fill();

        // Gate arch highlight
        ctx.strokeStyle = '#3a2e48';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, baseY - 20, 15, Math.PI, 0);
        ctx.stroke();
    }

    _drawHills(ctx) {
        const rng = this._seededRandom(77);
        const layers = [
            { y: H * 0.62, color: '#162a14', h: 60 },
            { y: H * 0.66, color: '#1a3018', h: 50 },
            { y: H * 0.7, color: '#1e341c', h: 40 }
        ];

        for (const layer of layers) {
            ctx.fillStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(0, H);
            let x = 0;
            while (x < W + 100) {
                const w = 200 + rng() * 400;
                const h = rng() * layer.h;
                ctx.lineTo(x, layer.y + h);
                ctx.quadraticCurveTo(x + w * 0.5, layer.y - h * 0.3, x + w, layer.y + h * 0.5);
                x += w;
            }
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawPineForest(ctx, baseY, count, scale, color) {
        const rng = this._seededRandom(Math.floor(baseY * 10 + count));
        for (let i = 0; i < count; i++) {
            const x = rng() * W;
            const s = (0.3 + rng() * 0.5) * scale;
            this._drawPineTree(ctx, x, baseY + rng() * 20, s, color);
        }
    }

    _drawPineTree(ctx, x, y, scale, color) {
        const h = 60 * scale;
        const w = 20 * scale;

        ctx.fillStyle = color;

        // Trunk
        ctx.fillRect(x - 2 * scale, y, 4 * scale, h * 0.4);

        // Foliage layers
        for (let i = 0; i < 4; i++) {
            const ly = y - i * h * 0.22;
            const lw = w * (1 - i * 0.2);
            ctx.beginPath();
            ctx.moveTo(x - lw, ly);
            ctx.lineTo(x, ly - h * 0.3);
            ctx.lineTo(x + lw, ly);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawForegroundHill(ctx) {
        const grad = ctx.createLinearGradient(0, H * 0.72, 0, H);
        grad.addColorStop(0, '#142210');
        grad.addColorStop(0.3, '#101a0c');
        grad.addColorStop(1, '#0a1008');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, H * 0.75);

        // Rolling curve
        ctx.quadraticCurveTo(W * 0.15, H * 0.7, W * 0.3, H * 0.73);
        ctx.quadraticCurveTo(W * 0.5, H * 0.78, W * 0.65, H * 0.72);
        ctx.quadraticCurveTo(W * 0.8, H * 0.68, W, H * 0.74);
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
    }

    _drawCliffEdge(ctx) {
        // Rocky cliff in foreground
        const cliffColor = '#1a1a14';
        const cliffLight = '#2a2a20';

        ctx.fillStyle = cliffColor;
        ctx.beginPath();
        ctx.moveTo(W * 0.15, H * 0.82);
        ctx.lineTo(W * 0.12, H * 0.78);
        ctx.lineTo(W * 0.2, H * 0.76);
        ctx.lineTo(W * 0.35, H * 0.78);
        ctx.lineTo(W * 0.4, H * 0.82);
        ctx.lineTo(W * 0.4, H);
        ctx.lineTo(W * 0.15, H);
        ctx.closePath();
        ctx.fill();

        // Cliff highlight
        ctx.fillStyle = cliffLight;
        ctx.beginPath();
        ctx.moveTo(W * 0.2, H * 0.76);
        ctx.lineTo(W * 0.25, H * 0.75);
        ctx.lineTo(W * 0.35, H * 0.78);
        ctx.lineTo(W * 0.3, H * 0.8);
        ctx.closePath();
        ctx.fill();

        // Right side cliff
        ctx.fillStyle = cliffColor;
        ctx.beginPath();
        ctx.moveTo(W * 0.7, H * 0.8);
        ctx.lineTo(W * 0.72, H * 0.75);
        ctx.lineTo(W * 0.85, H * 0.73);
        ctx.lineTo(W * 0.9, H * 0.76);
        ctx.lineTo(W * 0.88, H * 0.82);
        ctx.lineTo(W * 0.88, H);
        ctx.lineTo(W * 0.7, H);
        ctx.closePath();
        ctx.fill();
    }

    _drawGround(ctx) {
        const grad = ctx.createLinearGradient(0, H * 0.82, 0, H);
        grad.addColorStop(0, '#0e1408');
        grad.addColorStop(0.5, '#0a0e06');
        grad.addColorStop(1, '#060a04');
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.82, W, H * 0.18);

        // Ground texture dots
        const rng = this._seededRandom(99);
        ctx.fillStyle = '#1a2012';
        for (let i = 0; i < 200; i++) {
            const x = rng() * W;
            const y = H * 0.85 + rng() * H * 0.15;
            const s = 1 + rng() * 3;
            ctx.globalAlpha = 0.3 + rng() * 0.3;
            ctx.fillRect(Math.floor(x / PX) * PX, Math.floor(y / PX) * PX, s, s);
        }
        ctx.globalAlpha = 1;
    }

    _drawKnight(ctx) {
        const kx = W * 0.38;
        const ky = H * 0.78;
        const s = 1.8; // pixel scale for the knight

        // Shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(kx, ky + 52 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        const px = (x, y, w, h, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(
                Math.floor(kx + x * s),
                Math.floor(ky + y * s),
                Math.ceil(w * s),
                Math.ceil(h * s)
            );
        };

        // === CAPE ===
        // Main cape body
        const capeColors = ['#4a1a2a', '#5a2030', '#3a1020'];
        for (let i = 0; i < 3; i++) {
            px(-8 + i * 1, -20 + i * 2, 16 - i * 2, 45, capeColors[i]);
        }
        // Cape flutter right
        px(6, -18, 8, 12, '#5a2030');
        px(10, -14, 6, 10, '#4a1a2a');
        px(12, -10, 4, 8, '#3a1020');
        // Cape highlight
        px(-6, -18, 2, 30, '#6a2838');

        // === LEGS ===
        px(-6, 20, 5, 18, '#2a2030');
        px(1, 20, 5, 18, '#2a2030');
        // Boots
        px(-7, 35, 7, 8, '#1a1018');
        px(1, 35, 7, 8, '#1a1018');
        // Boot highlights
        px(-7, 35, 7, 2, '#2a2028');
        px(1, 35, 7, 2, '#2a2028');

        // === BODY (ARMOR) ===
        // Main torso
        px(-9, -18, 18, 22, '#3a3040');
        // Armor plate highlight (left)
        px(-9, -18, 4, 22, '#4a4050');
        // Armor center line
        px(-1, -18, 2, 22, '#2a2030');
        // Belt
        px(-9, 0, 18, 3, '#2a1820');
        px(-1, 0, 2, 3, '#c4a23a');
        // Shoulder pads
        px(-12, -20, 6, 5, '#4a4050');
        px(6, -20, 6, 5, '#4a4050');
        px(-12, -20, 6, 2, '#5a5060');
        px(6, -20, 6, 2, '#5a5060');

        // === LEFT ARM ===
        px(-12, -15, 4, 14, '#3a3040');
        px(-13, -15, 2, 14, '#4a4050');
        // Hand
        px(-12, -1, 4, 4, '#8a7060');

        // === RIGHT ARM (holding sword) ===
        px(8, -16, 4, 12, '#3a3040');
        px(10, -16, 2, 12, '#4a4050');
        // Hand gripping sword
        px(8, -4, 5, 5, '#8a7060');

        // === SWORD ===
        const swordColor = '#c0c0d0';
        const swordDark = '#808090';
        const swordGlow = '#e0e0f0';
        // Blade
        px(9, -38, 2, 34, swordColor);
        px(10, -38, 1, 34, swordGlow);
        // Blade tip
        px(9, -40, 2, 2, swordColor);
        px(9, -42, 2, 2, swordDark);
        // Crossguard
        px(6, -4, 8, 2, '#c4a23a');
        px(7, -5, 6, 1, '#d4b24a');
        // Grip
        px(9, -2, 2, 4, '#5a3020');
        // Pommel
        px(8, 2, 4, 2, '#c4a23a');

        // Sword glow
        ctx.save();
        const swordGlowGrad = ctx.createRadialGradient(
            kx + 10 * s, ky - 20 * s, 2,
            kx + 10 * s, ky - 20 * s, 30 * s
        );
        swordGlowGrad.addColorStop(0, 'rgba(200,200,240,0.15)');
        swordGlowGrad.addColorStop(1, 'rgba(200,200,240,0)');
        ctx.fillStyle = swordGlowGrad;
        ctx.fillRect(kx - 20 * s, ky - 55 * s, 60 * s, 60 * s);
        ctx.restore();

        // === HEAD ===
        // Helmet base
        px(-5, -30, 10, 10, '#3a3040');
        px(-6, -28, 12, 8, '#4a4050');
        // Helmet visor
        px(-4, -26, 8, 4, '#2a2030');
        // Eye slit glow
        px(-3, -25, 3, 1, '#b8d94e');
        px(1, -25, 2, 1, '#b8d94e');
        // Helmet crest
        px(-1, -33, 2, 4, '#5a2030');
        px(0, -35, 1, 2, '#6a2838');
        // Helmet highlight
        px(-5, -30, 2, 6, '#5a5060');
        // Chin guard
        px(-4, -21, 8, 2, '#3a3040');
    }

    _drawFogLayers(ctx) {
        // Distant fog
        const fog1 = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.6);
        fog1.addColorStop(0, 'rgba(180,160,120,0)');
        fog1.addColorStop(0.5, 'rgba(180,160,120,0.08)');
        fog1.addColorStop(1, 'rgba(180,160,120,0)');
        ctx.fillStyle = fog1;
        ctx.fillRect(0, H * 0.45, W, H * 0.15);

        // Mid fog
        const fog2 = ctx.createLinearGradient(0, H * 0.6, 0, H * 0.72);
        fog2.addColorStop(0, 'rgba(150,140,100,0)');
        fog2.addColorStop(0.4, 'rgba(150,140,100,0.06)');
        fog2.addColorStop(0.7, 'rgba(150,140,100,0.1)');
        fog2.addColorStop(1, 'rgba(150,140,100,0)');
        ctx.fillStyle = fog2;
        ctx.fillRect(0, H * 0.6, W, H * 0.12);

        // Foreground haze
        const fog3 = ctx.createLinearGradient(0, H * 0.75, 0, H * 0.85);
        fog3.addColorStop(0, 'rgba(20,30,15,0)');
        fog3.addColorStop(0.5, 'rgba(20,30,15,0.3)');
        fog3.addColorStop(1, 'rgba(10,15,8,0.6)');
        ctx.fillStyle = fog3;
        ctx.fillRect(0, H * 0.75, W, H * 0.1);
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
        this.fogOffset = Math.sin(time * 0.3) * 5;
        ctx.drawImage(this.canvas, 0, 0);
    }
}
