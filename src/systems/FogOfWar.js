import { GAME } from '../config/GameConfig.js';

export class FogOfWar {
    constructor() {
        this.fogCanvas = document.createElement('canvas');
        this.fogCanvas.width = GAME.WIDTH;
        this.fogCanvas.height = GAME.HEIGHT;
        this.fogCtx = this.fogCanvas.getContext('2d');
        this.enabled = false;
        this.visionRadius = 260;
    }

    setEnabled(enabled) { this.enabled = enabled; }

    drawFog(ctx, cx, cy, playerX, playerY, enemies, bosses) {
        if (!this.enabled) return;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const fctx = this.fogCtx;

        fctx.clearRect(0, 0, W, H);
        fctx.fillStyle = 'rgba(3,3,6,0.95)';
        fctx.fillRect(0, 0, W, H);

        fctx.globalCompositeOperation = 'destination-out';

        const gradient = fctx.createRadialGradient(cx, cy, 0, cx, cy, this.visionRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,1)');
        gradient.addColorStop(0.8, 'rgba(0,0,0,0.6)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        fctx.fillStyle = gradient;
        fctx.beginPath();
        fctx.arc(cx, cy, this.visionRadius, 0, Math.PI * 2);
        fctx.fill();

        fctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.fogCanvas, 0, 0);
    }
}
