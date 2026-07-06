import { GAME } from '../config/GameConfig.js';

export class FogOfWar {
    constructor() {
        this.enabled = false;
        this.visionRadius = 260;
        this._scale = 2;
        const sw = GAME.WIDTH >> 1;
        const sh = GAME.HEIGHT >> 1;
        this.fogCanvas = document.createElement('canvas');
        this.fogCanvas.width = sw;
        this.fogCanvas.height = sh;
        this.fogCtx = this.fogCanvas.getContext('2d');
        this._lastCx = -9999;
        this._lastCy = -9999;
        this._dirty = true;
    }

    setEnabled(enabled) { this.enabled = enabled; this._dirty = true; }

    drawFog(ctx, cx, cy) {
        if (!this.enabled) return;
        const W = GAME.WIDTH;
        const H = GAME.HEIGHT;
        const sw = W >> 1;
        const sh = H >> 1;
        const fctx = this.fogCtx;

        const dcx = cx - this._lastCx;
        const dcy = cy - this._lastCy;
        if (dcx * dcx + dcy * dcy > 9) {
            this._dirty = true;
            this._lastCx = cx;
            this._lastCy = cy;
        }

        if (this._dirty) {
            this._dirty = false;
            fctx.clearRect(0, 0, sw, sh);
            fctx.fillStyle = 'rgba(3,3,6,0.95)';
            fctx.fillRect(0, 0, sw, sh);

            fctx.globalCompositeOperation = 'destination-out';

            const scx = cx >> 1;
            const scy = cy >> 1;
            const sr = this.visionRadius >> 1;
            const gradient = fctx.createRadialGradient(scx, scy, 0, scx, scy, sr);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(0.5, 'rgba(0,0,0,1)');
            gradient.addColorStop(0.8, 'rgba(0,0,0,0.6)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            fctx.fillStyle = gradient;
            fctx.beginPath();
            fctx.arc(scx, scy, sr, 0, Math.PI * 2);
            fctx.fill();

            fctx.globalCompositeOperation = 'source-over';
        }

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.fogCanvas, 0, 0, W, H);
        ctx.imageSmoothingEnabled = true;
    }
}
