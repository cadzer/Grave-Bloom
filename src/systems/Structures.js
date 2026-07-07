import { GAME } from '../config/GameConfig.js';

const CHUNK = 800;
const RENDER_DIST = 1400;

function seededRandom(seed) {
    let s = Math.abs(Math.floor(seed)) + 1;
    if (s === 1) s = 2;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function chunkKey(cx, cy) {
    return `${cx},${cy}`;
}

function drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.beginPath();
        if (typeof r === 'number') r = [r, r, r, r];
        ctx.moveTo(x + r[0], y);
        ctx.lineTo(x + w - r[1], y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        ctx.lineTo(x + w, y + h - r[2]);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        ctx.lineTo(x + r[3], y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        ctx.lineTo(x, y + r[0]);
        ctx.quadraticCurveTo(x, y, x + r[0], y);
        ctx.closePath();
    }
}

export class Structures {
    constructor() {
        this.chunks = new Map();
        this.allStructures = [];
        this.allRoads = [];
        this._houseImages = [];
        this._houseImagesLoaded = false;
        this._castleImage = null;
        this._collisionMasks = new Map();
        this._loadHouseImages();
    }

    _loadHouseImages() {
        const urls = ['assets/house1.png', 'assets/house2.png'];
        let loaded = 0;
        for (const url of urls) {
            const img = new Image();
            img.onload = () => {
                loaded++;
                if (loaded === urls.length) this._houseImagesLoaded = true;
                this._buildCollisionMask(url, img);
            };
            img.src = url;
            this._houseImages.push(img);
        }
        this._castleImage = new Image();
        this._castleImage.onload = () => {
            this._buildCollisionMask('assets/castle1.png', this._castleImage);
        };
        this._castleImage.src = 'assets/castle1.png';
    }

    _buildCollisionMask(url, img) {
        const step = 4;
        const cw = Math.ceil(img.naturalWidth / step);
        const ch = Math.ceil(img.naturalHeight / step);
        const offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth;
        offscreen.height = img.naturalHeight;
        const octx = offscreen.getContext('2d');
        octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
        const grid = [];
        for (let gy = 0; gy < ch; gy++) {
            const row = [];
            for (let gx = 0; gx < cw; gx++) {
                let opaque = false;
                for (let dy = 0; dy < step && !opaque; dy++) {
                    for (let dx = 0; dx < step && !opaque; dx++) {
                        const px = gx * step + dx;
                        const py = gy * step + dy;
                        if (px < img.naturalWidth && py < img.naturalHeight) {
                            const idx = (py * img.naturalWidth + px) * 4;
                            if (data[idx + 3] > 60) opaque = true;
                        }
                    }
                }
                row.push(opaque);
            }
            grid.push(row);
        }
        const rects = this._buildCollisionRects(grid, step, img.naturalWidth, img.naturalHeight);
        this._collisionMasks.set(url, { grid, step, w: cw, h: ch, imgW: img.naturalWidth, imgH: img.naturalHeight, rects });
    }

    _buildCollisionRects(grid, step, imgW, imgH) {
        const visited = [];
        for (let i = 0; i < grid.length; i++) visited.push(new Array(grid[i].length).fill(false));
        const rects = [];
        const blockW = 3;
        const blockH = 3;
        for (let gy = 0; gy < grid.length; gy++) {
            for (let gx = 0; gx < grid[gy].length; gx++) {
                if (visited[gy][gx] || !grid[gy][gx]) continue;
                let endX = gx;
                while (endX < grid[gy].length && !visited[gy][endX] && grid[gy][endX] && endX - gx < blockW) endX++;
                let endY = gy + 1;
                outer:
                while (endY < grid.length && endY - gy < blockH) {
                    for (let cx = gx; cx < endX; cx++) {
                        if (visited[endY][cx] || !grid[endY][cx]) break outer;
                    }
                    endY++;
                }
                for (let ry = gy; ry < endY; ry++) {
                    for (let rx = gx; rx < endX; rx++) {
                        visited[ry][rx] = true;
                    }
                }
                rects.push({
                    x: gx * step,
                    y: gy * step,
                    w: (endX - gx) * step,
                    h: (endY - gy) * step
                });
            }
        }
        return rects;
    }

    getChunk(cx, cy) {
        const key = chunkKey(cx, cy);
        if (this.chunks.has(key)) return this.chunks.get(key);

        const rng = seededRandom(cx * 7919 + cy * 104729);
        const structures = [];
        const roads = [];

        const count = 1 + Math.floor(rng() * 2);
        for (let i = 0; i < count; i++) {
            const roll = rng();
            let type;
            if (roll < 0.20) type = 'castle';
            else if (roll < 0.55) type = 'house';
            else type = 'fence';

            const sx = cx * CHUNK + 80 + rng() * (CHUNK - 160);
            const sy = cy * CHUNK + 80 + rng() * (CHUNK - 160);

            if (type === 'castle' && this._hasNearbyCastle(cx, cy, sx, sy)) {
                type = rng() > 0.5 ? 'house' : 'fence';
            }

            const s = this._createStructure(type, sx, sy, rng);
            if (s) structures.push(s);
        }

        for (let i = 0; i < structures.length; i++) {
            for (let j = i + 1; j < structures.length; j++) {
                const a = structures[i];
                const b = structures[j];
                const dx = (a.x + a.w / 2) - (b.x + b.w / 2);
                const dy = (a.y + a.h / 2) - (b.y + b.h / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CHUNK * 0.5) {
                    const ax = a.x + a.w / 2;
                    const ay = a.y + a.h / 2;
                    const bx = b.x + b.w / 2;
                    const by = b.y + b.h / 2;
                    const mx = (ax + bx) / 2 + (rng() - 0.5) * 80;
                    const my = (ay + by) / 2 + (rng() - 0.5) * 80;
                    const typeRoll = rng();
                    let roadType;
                    if (typeRoll < 0.35) roadType = 'dirt';
                    else if (typeRoll < 0.65) roadType = 'brick';
                    else roadType = 'concrete';
                    roads.push({
                        x1: ax, y1: ay,
                        mx, my,
                        x2: bx, y2: by,
                        width: 10 + rng() * 6,
                        roadType,
                        seed: Math.floor(ax * 7 + ay * 13 + bx * 3)
                    });
                }
            }
        }

        this.chunks.set(key, { structures, roads });
        return this.chunks.get(key);
    }

    _hasNearbyCastle(cx, cy, sx, sy) {
        const minDist = CHUNK * 1.2;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const key = chunkKey(cx + dx, cy + dy);
                const chunk = this.chunks.get(key);
                if (!chunk) continue;
                for (const s of chunk.structures) {
                    if (s.type !== 'castle') continue;
                    const ddx = s.x + s.w / 2 - sx;
                    const ddy = s.y + s.h / 2 - sy;
                    if (ddx * ddx + ddy * ddy < minDist * minDist) return true;
                }
            }
        }
        return false;
    }

    _createStructure(type, x, y, rng) {
        const angle = rng() * Math.PI * 2;
        switch (type) {
            case 'house': {
                const w = 65 + rng() * 40;
                const h = 55 + rng() * 30;
                const wallH = 20 + rng() * 8;
                const wallS = 10 + rng() * 10;
                const roofStyles = ['triangular', 'flat', 'peaked', 'gambrel'];
                const roofStyle = roofStyles[Math.floor(rng() * roofStyles.length)];
                const doorStyles = ['single', 'double', 'arched'];
                const doorStyle = doorStyles[Math.floor(rng() * doorStyles.length)];
                const winLayouts = ['two', 'three', 'one_center', 'asymmetric'];
                const windowLayout = winLayouts[Math.floor(rng() * winLayouts.length)];
                const useImage = this._houseImagesLoaded && this._houseImages.length > 0 && rng() > 0.4;
                const imageIdx = useImage ? Math.floor(rng() * this._houseImages.length) : -1;
                return {
                    type, x, y, w, h, angle,
                    wallColor: `hsl(${30 + rng() * 20}, ${wallS}%, ${wallH}%)`,
                    roofColor: `hsl(${20 + rng() * 20}, ${14 + rng() * 12}%, ${16 + rng() * 10}%)`,
                    winGlow: rng() > 0.4,
                    seedX: x, seedY: y,
                    roofStyle,
                    hasChimney: rng() > 0.55,
                    chimneyX: 0.2 + rng() * 0.2,
                    hasShutters: rng() > 0.5,
                    shutterColor: `hsl(${20 + rng() * 30}, ${15 + rng() * 15}%, ${14 + rng() * 8}%)`,
                    doorStyle,
                    windowLayout,
                    hasSign: rng() > 0.7,
                    signColor: `hsl(${rng() * 360}, ${20 + rng() * 20}%, ${30 + rng() * 15}%)`,
                    hasFlowerBox: rng() > 0.6,
                    flowerColor: `hsl(${80 + rng() * 60}, ${30 + rng() * 20}%, ${30 + rng() * 15}%)`,
                    hasAwning: rng() > 0.65,
                    awningColor: `hsl(${rng() * 360}, ${20 + rng() * 15}%, ${18 + rng() * 10}%)`,
                    imageIdx
                };
            }
            case 'fence': {
                const shape = rng() > 0.35 ? 'rect' : 'circle';
                let w, h, radius;
                if (shape === 'rect') {
                    w = 90 + rng() * 70;
                    h = 80 + rng() * 60;
                    radius = 0;
                } else {
                    radius = 45 + rng() * 35;
                    w = radius * 2;
                    h = radius * 2;
                }
                const contentCount = 2 + Math.floor(rng() * 4);
                const contents = [];
                for (let c = 0; c < contentCount; c++) {
                    const cr = rng();
                    let kind;
                    if (cr < 0.30) kind = 'monument';
                    else if (cr < 0.60) kind = 'tree';
                    else kind = 'garden';
                    let ix, iy;
                    if (shape === 'rect') {
                        ix = 15 + rng() * (w - 30);
                        iy = 15 + rng() * (h - 30);
                    } else {
                        const a = rng() * Math.PI * 2;
                        const d = rng() * (radius - 18);
                        ix = radius + Math.cos(a) * d;
                        iy = radius + Math.sin(a) * d;
                    }
                    contents.push({ kind, ix, iy, seed: Math.floor(rng() * 99999) });
                }
                const hasGate = rng() > 0.3;
                const gateSide = Math.floor(rng() * 4);
                const woodTint = Math.floor(rng() * 20);
                return { type, x, y, w, h, shape, radius, contents, hasGate, gateSide, woodTint };
            }
            case 'castle': {
                const w = 160 + rng() * 80;
                const h = 160 + rng() * 80;
                const towerCount = rng() > 0.5 ? 4 : 6;
                const towerStyles = ['square', 'round'];
                const towerStyle = towerStyles[Math.floor(rng() * towerStyles.length)];
                const gateStyles = ['portcullis', 'arched', 'double'];
                const gateStyle = gateStyles[Math.floor(rng() * gateStyles.length)];
                const wallPatterns = ['brick', 'smooth', 'rough'];
                const wallPattern = wallPatterns[Math.floor(rng() * wallPatterns.length)];
                const battlementStyles = ['square', 'stepped'];
                const battlementStyle = battlementStyles[Math.floor(rng() * battlementStyles.length)];
                const useCastleImage = this._castleImage && this._castleImage.complete && this._castleImage.naturalWidth > 0;
                return {
                    type, x, y, w, h, angle,
                    towerCount, towerStyle, gateStyle, wallPattern, battlementStyle,
                    wallColor: `hsl(${220 + rng() * 20}, ${5 + rng() * 5}%, ${18 + rng() * 6}%)`,
                    winGlow: true,
                    seedX: x, seedY: y,
                    hasBanner: rng() > 0.4,
                    bannerColor: `hsl(${rng() * 360}, ${25 + rng() * 20}%, ${25 + rng() * 15}%)`,
                    hasTorch: rng() > 0.45,
                    hasWell: rng() > 0.6,
                    hasCracks: rng() > 0.5,
                    towerHeight: 28 + rng() * 12,
                    towerWidth: 24 + rng() * 10,
                    useImage: useCastleImage
                };
            }
        }
        return null;
    }

    update(playerX, playerY) {
        const pcx = Math.floor(playerX / CHUNK);
        const pcy = Math.floor(playerY / CHUNK);
        this.allStructures = [];
        this.allRoads = [];

        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const chunk = this.getChunk(pcx + dx, pcy + dy);
                for (const s of chunk.structures) {
                    const cx = s.x + s.w / 2 - playerX;
                    const cy = s.y + s.h / 2 - playerY;
                    if (cx * cx + cy * cy < RENDER_DIST * RENDER_DIST) {
                        this.allStructures.push(s);
                    }
                }
                for (const r of chunk.roads) {
                    const cx = (r.x1 + r.x2) / 2 - playerX;
                    const cy = (r.y1 + r.y2) / 2 - playerY;
                    if (cx * cx + cy * cy < RENDER_DIST * RENDER_DIST) {
                        this.allRoads.push(r);
                    }
                }
            }
        }
    }

    draw(ctx, playerX, playerY) {
        for (const r of this.allRoads) {
            this._drawRoad(ctx, r, playerX, playerY);
        }

        for (const s of this.allStructures) {
            const sx = s.x - playerX + GAME.WIDTH / 2;
            const sy = s.y - playerY + GAME.HEIGHT / 2;

            if (sx + s.w < -200 || sx - s.w > GAME.WIDTH + 200 ||
                sy + s.h < -200 || sy - s.h > GAME.HEIGHT + 200) continue;

            switch (s.type) {
                case 'house': this._drawHouse(ctx, sx, sy, s); break;
                case 'fence': this._drawFence(ctx, sx, sy, s); break;
                case 'castle': this._drawCastle(ctx, sx, sy, s); break;
            }
        }
    }

    _drawRoad(ctx, r, playerX, playerY) {
        const x1 = r.x1 - playerX + GAME.WIDTH / 2;
        const y1 = r.y1 - playerY + GAME.HEIGHT / 2;
        const x2 = r.x2 - playerX + GAME.WIDTH / 2;
        const y2 = r.y2 - playerY + GAME.HEIGHT / 2;
        const mx = r.mx - playerX + GAME.WIDTH / 2;
        const my = r.my - playerY + GAME.HEIGHT / 2;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const w = r.width;
        const rng = seededRandom(r.seed);

        if (r.roadType === 'dirt') {
            ctx.strokeStyle = 'rgba(35,28,20,0.5)';
            ctx.lineWidth = w + 6;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(60,48,35,0.55)';
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(75,60,42,0.3)';
            ctx.lineWidth = w * 0.35;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            const segs = 6 + Math.floor(rng() * 5);
            ctx.fillStyle = 'rgba(50,40,30,0.3)';
            for (let i = 0; i < segs; i++) {
                const t = 0.1 + rng() * 0.8;
                const ct = 1 - t;
                const px = ct * ct * x1 + 2 * ct * t * mx + t * t * x2;
                const py = ct * ct * y1 + 2 * ct * t * my + t * t * y2;
                const offX = (rng() - 0.5) * w * 0.8;
                const offY = (rng() - 0.5) * w * 0.8;
                const size = 1 + rng() * 3;
                ctx.beginPath();
                ctx.arc(px + offX, py + offY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (r.roadType === 'brick') {
            ctx.strokeStyle = 'rgba(30,22,18,0.5)';
            ctx.lineWidth = w + 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(80,50,35,0.5)';
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(65,40,28,0.4)';
            ctx.lineWidth = w * 0.6;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            const segs = 10 + Math.floor(rng() * 6);
            for (let i = 0; i < segs; i++) {
                const t = 0.05 + rng() * 0.9;
                const ct = 1 - t;
                const px = ct * ct * x1 + 2 * ct * t * mx + t * t * x2;
                const py = ct * ct * y1 + 2 * ct * t * my + t * t * y2;
                const offX = (rng() - 0.5) * w * 0.7;
                const offY = (rng() - 0.5) * w * 0.7;
                ctx.fillStyle = `rgba(${90 + rng() * 30},${55 + rng() * 20},${35 + rng() * 15},0.35)`;
                ctx.fillRect(px + offX - 3, py + offY - 1.5, 6, 3);
            }
        } else {
            ctx.strokeStyle = 'rgba(28,28,30,0.45)';
            ctx.lineWidth = w + 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(62,62,66,0.5)';
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(78,78,82,0.25)';
            ctx.lineWidth = w * 0.3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(mx, my, x2, y2);
            ctx.stroke();

            const segs = 8 + Math.floor(rng() * 4);
            ctx.strokeStyle = 'rgba(50,50,54,0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < segs; i++) {
                const t = 0.08 + rng() * 0.84;
                const ct = 1 - t;
                const px = ct * ct * x1 + 2 * ct * t * mx + t * t * x2;
                const py = ct * ct * y1 + 2 * ct * t * my + t * t * y2;
                const offX = (rng() - 0.5) * w * 0.6;
                const cr = 2 + rng() * 4;
                ctx.beginPath();
                ctx.moveTo(px + offX - cr, py - w * 0.3);
                ctx.lineTo(px + offX + cr, py - w * 0.3);
                ctx.stroke();
            }
        }
    }

    _drawHouse(ctx, x, y, s) {
        if (s.imageIdx >= 0 && this._houseImages[s.imageIdx]) {
            const img = this._houseImages[s.imageIdx];
            const drawW = s.w * 1.8;
            const drawH = s.h * 1.8;
            const drawX = x - (drawW - s.w) / 2;
            const drawY = y - (drawH - s.h) - 10;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            return;
        }
        const rng = seededRandom(Math.floor(s.seedX * 7 + s.seedY * 13));

        ctx.fillStyle = s.wallColor;
        ctx.fillRect(x, y + 14, s.w, s.h - 14);

        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(x + 2, y + 16, s.w * 0.35, s.h - 18);

        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        for (let row = 0; row < 3; row++) {
            const by = y + 18 + row * 12;
            if (by > y + s.h - 6) break;
            const offset = (row % 2) * 15;
            for (let bx = x + offset; bx < x + s.w - 5; bx += 30) {
                ctx.strokeRect(bx, by, 30, 12);
            }
        }

        this._drawRoof(ctx, x, y, s, rng);

        if (s.hasChimney) {
            const chimX = x + s.w * s.chimneyX;
            const chimW = 10;
            const chimH = 22;
            const roofTop = s.roofStyle === 'flat' ? y + 10 : y - 4;
            ctx.fillStyle = s.wallColor;
            ctx.fillRect(chimX - chimW / 2, roofTop - chimH, chimW, chimH + 6);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(chimX - chimW / 2, roofTop - chimH, chimW, 3);
            if (rng() > 0.4) {
                ctx.fillStyle = 'rgba(100,90,80,0.15)';
                ctx.beginPath();
                ctx.arc(chimX, roofTop - chimH - 2 - rng() * 4, 3 + rng() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        this._drawDoor(ctx, x, y, s, rng);

        this._drawWindows(ctx, x, y, s, rng);

        if (s.hasSign) {
            const signX = x + s.w * 0.7;
            const signY = y + 18;
            ctx.fillStyle = '#1a1410';
            ctx.fillRect(signX - 1, signY - 1, 2, 10);
            ctx.fillStyle = s.signColor;
            drawRoundRect(ctx, signX - 8, signY, 16, 10, 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        if (s.hasFlowerBox) {
            const boxX = x + s.w / 2 - 12;
            const boxY = y + s.h - 8;
            ctx.fillStyle = '#2a1a10';
            ctx.fillRect(boxX, boxY, 24, 5);
            ctx.fillStyle = s.flowerColor;
            for (let i = 0; i < 4; i++) {
                const fx = boxX + 3 + i * 5.5;
                ctx.beginPath();
                ctx.arc(fx, boxY - 2 - rng() * 2, 2 + rng(), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (s.hasAwning) {
            const awX = x + s.w * 0.25;
            const awW = s.w * 0.5;
            ctx.fillStyle = s.awningColor;
            ctx.beginPath();
            ctx.moveTo(awX, y + 32);
            ctx.lineTo(awX + awW, y + 32);
            ctx.lineTo(awX + awW + 5, y + 38);
            ctx.lineTo(awX - 5, y + 38);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(awX, y + 32);
            ctx.lineTo(awX + awW, y + 32);
            ctx.stroke();
        }
    }

    _drawRoof(ctx, x, y, s, rng) {
        ctx.fillStyle = s.roofColor;

        if (s.roofStyle === 'triangular') {
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 15);
            ctx.lineTo(x + s.w / 2, y - 6);
            ctx.lineTo(x + s.w + 4, y + 15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.beginPath();
            ctx.moveTo(x - 2, y + 14);
            ctx.lineTo(x + s.w / 2, y - 4);
            ctx.lineTo(x + s.w / 2, y + 14);
            ctx.closePath();
            ctx.fill();
        } else if (s.roofStyle === 'flat') {
            ctx.fillRect(x - 3, y + 10, s.w + 6, 6);
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(x - 3, y + 10, s.w + 6, 2);
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 3, y + 10, s.w + 6, 6);
        } else if (s.roofStyle === 'peaked') {
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 15);
            ctx.lineTo(x + s.w * 0.3, y - 8);
            ctx.lineTo(x + s.w * 0.5, y - 2);
            ctx.lineTo(x + s.w * 0.7, y - 10);
            ctx.lineTo(x + s.w + 4, y + 15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.moveTo(x - 2, y + 14);
            ctx.lineTo(x + s.w * 0.3, y - 6);
            ctx.lineTo(x + s.w * 0.5, y);
            ctx.lineTo(x + s.w * 0.5, y + 14);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 15);
            ctx.lineTo(x + s.w * 0.15, y - 2);
            ctx.lineTo(x + s.w * 0.35, y - 8);
            ctx.lineTo(x + s.w * 0.65, y - 8);
            ctx.lineTo(x + s.w * 0.85, y - 2);
            ctx.lineTo(x + s.w + 4, y + 15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.moveTo(x - 2, y + 14);
            ctx.lineTo(x + s.w * 0.15, y);
            ctx.lineTo(x + s.w * 0.35, y - 6);
            ctx.lineTo(x + s.w * 0.5, y - 6);
            ctx.lineTo(x + s.w * 0.5, y + 14);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawDoor(ctx, x, y, s, rng) {
        const dw = s.doorStyle === 'double' ? 18 : 14;
        const dh = s.doorStyle === 'arched' ? 24 : 22;
        const dx = x + s.w / 2 - dw / 2;
        const dy = y + s.h - dh;

        ctx.fillStyle = '#0e0a08';
        if (s.doorStyle === 'arched') {
            drawRoundRect(ctx, dx, dy, dw, dh, [4, 4, 0, 0]);
        } else {
            ctx.fillRect(dx, dy, dw, dh);
        }
        ctx.fill();

        ctx.strokeStyle = '#3a2a18';
        ctx.lineWidth = 1;
        if (s.doorStyle === 'double') {
            ctx.beginPath();
            ctx.moveTo(x + s.w / 2, dy + 2);
            ctx.lineTo(x + s.w / 2, dy + dh);
            ctx.stroke();
        }

        ctx.fillStyle = '#8a7a60';
        const handleOff = s.doorStyle === 'double' ? 5 : 4;
        ctx.beginPath();
        ctx.arc(x + s.w / 2 + handleOff, y + s.h - 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (s.doorStyle === 'double') {
            ctx.beginPath();
            ctx.arc(x + s.w / 2 - handleOff, y + s.h - 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawWindows(ctx, x, y, s, rng) {
        const glow1 = rng() > 0.4;
        const glow2 = rng() > 0.4;
        const glow3 = rng() > 0.5;
        const winColor = 'rgba(240,184,64,0.55)';
        const darkColor = '#0a0808';

        const winW = 12;
        const winH = 10;
        const winY = y + 26;

        if (s.windowLayout === 'two') {
            const positions = [
                [x + 8, winY],
                [x + s.w - 20, winY]
            ];
            const glows = [glow1, glow2];
            for (let i = 0; i < 2; i++) {
                const [wx, wy] = positions[i];
                ctx.fillStyle = glows[i] ? winColor : darkColor;
                ctx.fillRect(wx, wy, winW, winH);
                if (s.hasShutters) {
                    ctx.fillStyle = s.shutterColor;
                    ctx.fillRect(wx - 4, wy, 3, winH);
                    ctx.fillRect(wx + winW + 1, wy, 3, winH);
                }
                this._drawWindowCross(ctx, wx, wy, winW, winH, s.wallColor);
                if (glows[i]) this._drawWindowGlow(ctx, wx + winW / 2, wy + winH / 2);
            }
        } else if (s.windowLayout === 'three') {
            const positions = [
                [x + 6, winY],
                [x + s.w / 2 - winW / 2, winY],
                [x + s.w - 6 - winW, winY]
            ];
            const glows = [glow1, glow2, glow3];
            for (let i = 0; i < 3; i++) {
                const [wx, wy] = positions[i];
                ctx.fillStyle = glows[i] ? winColor : darkColor;
                ctx.fillRect(wx, wy, winW, winH);
                this._drawWindowCross(ctx, wx, wy, winW, winH, s.wallColor);
                if (glows[i]) this._drawWindowGlow(ctx, wx + winW / 2, wy + winH / 2);
            }
        } else if (s.windowLayout === 'one_center') {
            const wx = x + s.w / 2 - winW / 2;
            const wy = winY - 6;
            ctx.fillStyle = glow1 ? winColor : darkColor;
            ctx.fillRect(wx, wy, winW + 2, winH + 4);
            this._drawWindowCross(ctx, wx, wy, winW + 2, winH + 4, s.wallColor);
            if (glow1) this._drawWindowGlow(ctx, wx + (winW + 2) / 2, wy + (winH + 4) / 2);
        } else {
            const leftX = x + 6 + rng() * 10;
            const rightX = x + s.w - 6 - winW - rng() * 10;
            const leftY = winY - rng() * 4;
            const rightY = winY + rng() * 6;
            ctx.fillStyle = glow1 ? winColor : darkColor;
            ctx.fillRect(leftX, leftY, winW, winH);
            ctx.fillStyle = glow2 ? winColor : darkColor;
            ctx.fillRect(rightX, rightY, winW, winH);
            this._drawWindowCross(ctx, leftX, leftY, winW, winH, s.wallColor);
            this._drawWindowCross(ctx, rightX, rightY, winW, winH, s.wallColor);
            if (glow1) this._drawWindowGlow(ctx, leftX + winW / 2, leftY + winH / 2);
            if (glow2) this._drawWindowGlow(ctx, rightX + winW / 2, rightY + winH / 2);
        }
    }

    _drawWindowCross(ctx, wx, wy, ww, wh, wallColor) {
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wx + ww / 2, wy);
        ctx.lineTo(wx + ww / 2, wy + wh);
        ctx.moveTo(wx, wy + wh / 2);
        ctx.lineTo(wx + ww, wy + wh / 2);
        ctx.stroke();
    }

    _drawWindowGlow(ctx, cx, cy) {
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
        g.addColorStop(0, 'rgba(240,184,64,0.12)');
        g.addColorStop(1, 'rgba(240,184,64,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - 18, cy - 18, 36, 36);
    }

    _drawFence(ctx, x, y, s) {
        const rng = seededRandom(s.seedX * 11 + s.seedY * 23);

        if (s.shape === 'rect') {
            this._drawRectEnclosure(ctx, x, y, s, rng);
        } else {
            this._drawCircleEnclosure(ctx, x, y, s, rng);
        }
    }

    _drawRectEnclosure(ctx, x, y, s, rng) {
        const w = s.w;
        const h = s.h;
        const postW = 5;
        const railH = 3;

        ctx.fillStyle = 'rgba(25,20,15,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2 + 5, y + h + 5, w * 0.4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgb(${42 + s.woodTint},${34 + s.woodTint},${24 + s.woodTint})`;
        ctx.fillRect(x, y + 2, w, railH);
        ctx.fillRect(x, y + h - 5, w, railH);
        ctx.fillRect(x, y + 2, railH, h - 3);
        ctx.fillRect(x + w - railH, y + 2, railH, h - 3);

        ctx.fillRect(x, y + h * 0.45, w, railH - 1);

        const topPosts = Math.max(3, Math.floor(w / 30));
        const sidePosts = Math.max(3, Math.floor(h / 30));
        const woodBase = `rgb(${50 + s.woodTint},${40 + s.woodTint},${28 + s.woodTint})`;
        const woodTop = `rgb(${58 + s.woodTint},${48 + s.woodTint},${34 + s.woodTint})`;

        for (let i = 0; i <= topPosts; i++) {
            const px = x + (i / topPosts) * w;
            ctx.fillStyle = woodBase;
            ctx.fillRect(px - postW / 2, y - 3, postW, h + 6);
            ctx.fillStyle = woodTop;
            ctx.beginPath();
            ctx.moveTo(px - postW / 2 - 1, y - 3);
            ctx.lineTo(px, y - 8);
            ctx.lineTo(px + postW / 2 + 1, y - 3);
            ctx.closePath();
            ctx.fill();
        }
        for (let i = 1; i < sidePosts; i++) {
            const py = y + (i / sidePosts) * h;
            ctx.fillStyle = woodBase;
            ctx.fillRect(x - 3, py - postW / 2, postW, h > 50 ? postW : 0);
            ctx.fillRect(x + w - 2, py - postW / 2, postW, h > 50 ? postW : 0);
        }

        if (s.hasGate) {
            const gateW = 18;
            ctx.fillStyle = '#141008';
            if (s.gateSide === 0) {
                ctx.fillRect(x + w / 2 - gateW / 2, y - 2, gateW, 8);
            } else if (s.gateSide === 1) {
                ctx.fillRect(x + w / 2 - gateW / 2, y + h - 6, gateW, 8);
            } else if (s.gateSide === 2) {
                ctx.fillRect(x - 2, y + h / 2 - gateW / 2, 8, gateW);
            } else {
                ctx.fillRect(x + w - 6, y + h / 2 - gateW / 2, 8, gateW);
            }
        }

        for (const item of s.contents) {
            this._drawContentItem(ctx, x + item.ix, y + item.iy, item, rng);
        }
    }

    _drawCircleEnclosure(ctx, x, y, s, rng) {
        const cx = x + s.radius;
        const cy = y + s.radius;
        const r = s.radius;
        const postW = 5;

        ctx.fillStyle = 'rgba(25,20,15,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx + 5, cy + r + 5, r * 0.45, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const woodBase = `rgb(${42 + s.woodTint},${34 + s.woodTint},${24 + s.woodTint})`;
        const woodTop = `rgb(${55 + s.woodTint},${44 + s.woodTint},${32 + s.woodTint})`;

        ctx.strokeStyle = woodBase;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = woodTop;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = woodBase;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        const postCount = Math.max(8, Math.floor(r * 0.5));
        for (let i = 0; i < postCount; i++) {
            const a = (i / postCount) * Math.PI * 2;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            ctx.fillStyle = woodBase;
            ctx.fillRect(px - postW / 2, py - 4, postW, 8);
            ctx.fillStyle = woodTop;
            ctx.beginPath();
            ctx.moveTo(px - postW / 2 - 1, py - 4);
            ctx.lineTo(px, py - 8);
            ctx.lineTo(px + postW / 2 + 1, py - 4);
            ctx.closePath();
            ctx.fill();
        }

        if (s.hasGate) {
            const a = s.gateSide * Math.PI / 2;
            const gx = cx + Math.cos(a) * r;
            const gy = cy + Math.sin(a) * r;
            ctx.fillStyle = '#141008';
            ctx.beginPath();
            ctx.arc(gx, gy, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const item of s.contents) {
            this._drawContentItem(ctx, x + item.ix, y + item.iy, item, rng);
        }
    }

    _drawContentItem(ctx, x, y, item, rng) {
        const s = seededRandom(item.seed);
        if (item.kind === 'monument') {
            this._drawMonument(ctx, x, y, s);
        } else if (item.kind === 'tree') {
            this._drawDeadTree(ctx, x, y, s);
        } else {
            this._drawRottenGarden(ctx, x, y, s);
        }
    }

    _drawMonument(ctx, x, y, rng) {
        const h = 20 + rng() * 25;
        const w = 10 + rng() * 8;
        const tilt = (rng() - 0.5) * 0.15;

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 3, w * 0.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);

        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, '#2e2a26');
        g.addColorStop(0.5, '#3a3632');
        g.addColorStop(1, '#262220');
        ctx.fillStyle = g;

        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(-w / 2, -h + 6);
        ctx.quadraticCurveTo(-w / 2, -h, -w / 2 + 4, -h);
        ctx.lineTo(w / 2 - 4, -h);
        ctx.quadraticCurveTo(w / 2, -h, w / 2, -h + 6);
        ctx.lineTo(w / 2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(-w / 2 + 2, -h + 8, w * 0.3, h - 12);

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -h * 0.3);
        ctx.lineTo(1, -h * 0.6);
        ctx.lineTo(-1, -h * 0.85);
        ctx.stroke();

        if (rng() > 0.4) {
            ctx.fillStyle = 'rgba(124,154,110,0.2)';
            ctx.beginPath();
            ctx.arc(w / 2 - 2, -h * 0.5, 2 + rng() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    _drawDeadTree(ctx, x, y, rng) {
        const h = 25 + rng() * 30;
        const trunkW = 4 + rng() * 3;

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, 6, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const trunkColor = `rgb(${35 + rng() * 15},${28 + rng() * 10},${20 + rng() * 8})`;
        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = trunkW;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rng() - 0.5) * 4, y - h);
        ctx.stroke();

        const branchCount = 2 + Math.floor(rng() * 3);
        ctx.lineWidth = trunkW * 0.5;
        for (let i = 0; i < branchCount; i++) {
            const t = 0.35 + rng() * 0.5;
            const bx = x + (rng() - 0.5) * 4 * t;
            const by = y - h * t;
            const bLen = 8 + rng() * 14;
            const bDir = rng() > 0.5 ? 1 : -1;
            const bAngle = (rng() - 0.5) * 0.8;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(bAngle) * bLen * bDir, by + Math.sin(bAngle) * bLen - 4);
            ctx.stroke();

            if (rng() > 0.5) {
                const sx = bx + Math.cos(bAngle) * bLen * bDir * 0.6;
                const sy = by + Math.sin(bAngle) * bLen * 0.6 - 3;
                ctx.lineWidth = trunkW * 0.3;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + bDir * 5 + (rng() - 0.5) * 3, sy - 5 - rng() * 4);
                ctx.stroke();
            }
        }

        if (rng() > 0.5) {
            const lx = x + (rng() - 0.5) * 8;
            const ly = y - 2 - rng() * 3;
            ctx.fillStyle = `rgba(${40 + rng() * 20},${35 + rng() * 15},${25 + rng() * 10},0.5)`;
            ctx.beginPath();
            ctx.ellipse(lx, ly, 3 + rng() * 3, 1.5, rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawRottenGarden(ctx, x, y, rng) {
        const r = 10 + rng() * 8;

        ctx.fillStyle = 'rgba(35,28,18,0.35)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(60,50,35,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();

        const plantCount = 3 + Math.floor(rng() * 4);
        for (let i = 0; i < plantCount; i++) {
            const a = (i / plantCount) * Math.PI * 2 + rng() * 0.5;
            const d = r * 0.3 + rng() * r * 0.5;
            const px = x + Math.cos(a) * d;
            const py = y + Math.sin(a) * d;

            ctx.strokeStyle = `rgba(${60 + rng() * 30},${50 + rng() * 20},${30 + rng() * 15},0.5)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py + 2);
            ctx.lineTo(px + (rng() - 0.5) * 3, py - 4 - rng() * 5);
            ctx.stroke();

            const fruitRoll = rng();
            if (fruitRoll < 0.4) {
                ctx.fillStyle = `rgba(${80 + rng() * 30},${50 + rng() * 20},${30 + rng() * 15},0.55)`;
                ctx.beginPath();
                ctx.arc(px + (rng() - 0.5) * 2, py - 3 - rng() * 4, 2 + rng(), 0, Math.PI * 2);
                ctx.fill();
            } else if (fruitRoll < 0.7) {
                ctx.fillStyle = `rgba(${60 + rng() * 20},${70 + rng() * 20},${40 + rng() * 15},0.4)`;
                ctx.beginPath();
                ctx.arc(px, py - 2 - rng() * 3, 1.5 + rng(), 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(40,35,25,0.3)`;
                ctx.beginPath();
                ctx.arc(px, py - 2 - rng() * 3, 1, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = `rgba(${50 + rng() * 20},${60 + rng() * 20},${35 + rng() * 15},0.4)`;
                ctx.lineWidth = 1;
                const leafA = rng() * Math.PI * 2;
                const leafR = 2 + rng() * 2;
                ctx.beginPath();
                ctx.ellipse(px + Math.cos(leafA) * 2, py - 5 + Math.sin(leafA) * 2, leafR, leafR * 0.5, leafA, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    _drawCastle(ctx, x, y, s) {
        if (s.useImage && this._castleImage) {
            const img = this._castleImage;
            const drawW = s.w * 1.6;
            const drawH = s.h * 1.6;
            const drawX = x - (drawW - s.w) / 2;
            const drawY = y - (drawH - s.h) - 5;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            return;
        }
        const rng = seededRandom(Math.floor(s.seedX * 3 + s.seedY * 7));

        ctx.fillStyle = s.wallColor;
        ctx.fillRect(x, y, s.w, s.h);

        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.fillRect(x + 4, y + 4, s.w * 0.3, s.h - 8);

        this._drawWallPattern(ctx, x, y, s);

        if (s.hasCracks) {
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 1;
            const cracks = 2 + Math.floor(rng() * 3);
            for (let i = 0; i < cracks; i++) {
                const cx = x + 10 + rng() * (s.w - 20);
                const cy = y + 10 + rng() * (s.h - 20);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                let px = cx, py = cy;
                for (let j = 0; j < 3 + Math.floor(rng() * 3); j++) {
                    px += (rng() - 0.5) * 15;
                    py += rng() * 10;
                    ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
        }

        this._drawBattlements(ctx, x, y, s);

        const tw = s.towerWidth;
        const th = s.towerHeight;
        this._drawTowers(ctx, x, y, s, tw, th, rng);

        this._drawGate(ctx, x, y, s, rng);

        this._drawCastleWindows(ctx, x, y, s, rng);

        if (s.hasBanner) {
            this._drawBanners(ctx, x, y, s, rng);
        }

        if (s.hasTorch) {
            this._drawTorches(ctx, x, y, s, rng);
        }

        if (s.hasWell) {
            this._drawCastleWell(ctx, x, y, s, rng);
        }

        const cornerGlow = ctx.createRadialGradient(
            x + s.w / 2, y + s.h / 2, s.w * 0.15,
            x + s.w / 2, y + s.h / 2, s.w * 0.55
        );
        cornerGlow.addColorStop(0, 'rgba(240,184,64,0.04)');
        cornerGlow.addColorStop(1, 'rgba(240,184,64,0)');
        ctx.fillStyle = cornerGlow;
        ctx.fillRect(x - 20, y - 20, s.w + 40, s.h + 40);
    }

    _drawWallPattern(ctx, x, y, s) {
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;

        if (s.wallPattern === 'brick') {
            const brickH = 12;
            for (let by = y + brickH; by < y + s.h; by += brickH) {
                const offset = ((by / brickH | 0) % 2) * 15;
                for (let bx = x + offset; bx < x + s.w; bx += 30) {
                    ctx.strokeRect(bx, by, 30, brickH);
                }
            }
        } else if (s.wallPattern === 'rough') {
            const rng = seededRandom(Math.floor(s.seedX * 5 + s.seedY * 11));
            for (let i = 0; i < 20; i++) {
                const rx = x + 5 + rng() * (s.w - 10);
                const ry = y + 5 + rng() * (s.h - 10);
                const rw = 8 + rng() * 16;
                const rh = 6 + rng() * 10;
                ctx.strokeRect(rx, ry, rw, rh);
            }
        } else {
            ctx.strokeStyle = 'rgba(0,0,0,0.04)';
            for (let by = y + 20; by < y + s.h; by += 20) {
                ctx.beginPath();
                ctx.moveTo(x + 2, by);
                ctx.lineTo(x + s.w - 2, by);
                ctx.stroke();
            }
        }
    }

    _drawBattlements(ctx, x, y, s) {
        const crenW = 14;
        const crenH = 12;
        ctx.fillStyle = s.wallColor;

        if (s.battlementStyle === 'stepped') {
            for (let i = 0; i < s.w; i += crenW * 2) {
                ctx.fillRect(x + i, y - crenH, crenW, crenH);
                ctx.fillRect(x + i + crenW * 0.5, y - crenH - 5, crenW * 0.5, 5);
            }
        } else {
            for (let i = 0; i < s.w; i += crenW * 2) {
                ctx.fillRect(x + i, y - crenH, crenW, crenH);
            }
        }
    }

    _drawTowers(ctx, x, y, s, tw, th, rng) {
        const positions = [
            [x - tw / 2, y - th / 2],
            [x + s.w - tw / 2, y - th / 2],
            [x - tw / 2, y + s.h - th / 2],
            [x + s.w - tw / 2, y + s.h - th / 2],
            [x + s.w / 2 - tw / 2, y - th / 2],
            [x + s.w / 2 - tw / 2, y + s.h - th / 2]
        ];

        for (let i = 0; i < Math.min(s.towerCount, positions.length); i++) {
            const [tx, ty] = positions[i];

            if (s.towerStyle === 'round') {
                const cx = tx + tw / 2;
                const cy = ty + th / 2;
                const r = tw / 2;

                const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
                g.addColorStop(0, s.wallColor);
                g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
                g.addColorStop(1, 'rgba(0,0,0,0.08)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = s.wallColor;
                ctx.beginPath();
                ctx.arc(cx, cy - 2, r + 2, Math.PI, 0);
                ctx.fill();

                if (rng() > 0.3) {
                    ctx.fillStyle = 'rgba(240,184,64,0.4)';
                    ctx.fillRect(cx - 4, cy - 6, 8, 7);
                    const tg = ctx.createRadialGradient(cx, cy - 3, 2, cx, cy - 3, 16);
                    tg.addColorStop(0, 'rgba(240,184,64,0.1)');
                    tg.addColorStop(1, 'rgba(240,184,64,0)');
                    ctx.fillStyle = tg;
                    ctx.fillRect(cx - 16, cy - 19, 32, 32);
                }
            } else {
                ctx.fillStyle = s.wallColor;
                ctx.fillRect(tx, ty, tw, th);

                ctx.fillStyle = 'rgba(255,255,255,0.02)';
                ctx.fillRect(tx + 2, ty + 2, tw * 0.3, th - 4);

                const tCrenW = 8;
                for (let j = 0; j < tw; j += tCrenW * 2) {
                    ctx.fillRect(tx + j, ty - 6, tCrenW, 6);
                }

                if (rng() > 0.3) {
                    ctx.fillStyle = 'rgba(240,184,64,0.4)';
                    ctx.fillRect(tx + tw / 2 - 4, ty + th / 2 - 6, 8, 7);
                    const tg = ctx.createRadialGradient(tx + tw / 2, ty + th / 2 - 3, 2, tx + tw / 2, ty + th / 2 - 3, 16);
                    tg.addColorStop(0, 'rgba(240,184,64,0.1)');
                    tg.addColorStop(1, 'rgba(240,184,64,0)');
                    ctx.fillStyle = tg;
                    ctx.fillRect(tx + tw / 2 - 16, ty + th / 2 - 19, 32, 32);
                }
            }
        }
    }

    _drawGate(ctx, x, y, s, rng) {
        const gw = 34;
        const gh = 44;
        const gx = x + s.w / 2 - gw / 2;
        const gy = y + s.h - gh;

        ctx.fillStyle = '#080606';
        if (s.gateStyle === 'arched') {
            drawRoundRect(ctx, gx, gy, gw, gh, [8, 8, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillRect(gx, gy, gw, gh);
        }

        if (s.gateStyle === 'portcullis') {
            ctx.strokeStyle = '#3a3030';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const bx = gx + 5 + i * 6;
                ctx.beginPath();
                ctx.moveTo(bx, gy + 10);
                ctx.lineTo(bx, gy + gh);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(gx, gy + 10);
            ctx.lineTo(gx + gw, gy + 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(gx, gy + gh * 0.5);
            ctx.lineTo(gx + gw, gy + gh * 0.5);
            ctx.stroke();
        } else if (s.gateStyle === 'double') {
            ctx.strokeStyle = '#3a3030';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + s.w / 2, gy + 4);
            ctx.lineTo(x + s.w / 2, gy + gh);
            ctx.stroke();
            ctx.fillStyle = '#8a7a60';
            ctx.beginPath();
            ctx.arc(x + s.w / 2 - 5, gy + gh / 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s.w / 2 + 5, gy + gh / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#3a3030';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const bx = gx + 6 + i * 7;
                ctx.beginPath();
                ctx.moveTo(bx, gy + 8);
                ctx.lineTo(bx, gy + gh);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(gx, gy + 8);
            ctx.lineTo(gx + gw, gy + 8);
            ctx.stroke();
        }
    }

    _drawCastleWindows(ctx, x, y, s, rng) {
        const positions = [
            [x + 14, y + 22],
            [x + s.w - 26, y + 22],
            [x + 14, y + s.h - 36],
            [x + s.w - 26, y + s.h - 36],
            [x + s.w / 2 - 50, y + 22],
            [x + s.w / 2 + 40, y + 22]
        ];

        for (let i = 0; i < Math.min(s.towerCount, positions.length); i++) {
            const [wx, wy] = positions[i];
            const glow = rng() > 0.3;
            ctx.fillStyle = glow ? 'rgba(240,184,64,0.45)' : '#0a0808';
            ctx.fillRect(wx, wy, 12, 10);

            ctx.strokeStyle = s.wallColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(wx + 6, wy); ctx.lineTo(wx + 6, wy + 10);
            ctx.moveTo(wx, wy + 5); ctx.lineTo(wx + 12, wy + 5);
            ctx.stroke();

            if (glow) {
                const g = ctx.createRadialGradient(wx + 6, wy + 5, 2, wx + 6, wy + 5, 22);
                g.addColorStop(0, 'rgba(240,184,64,0.1)');
                g.addColorStop(1, 'rgba(240,184,64,0)');
                ctx.fillStyle = g;
                ctx.fillRect(wx - 16, wy - 16, 44, 44);
            }
        }
    }

    _drawBanners(ctx, x, y, s, rng) {
        const bannerCount = 1 + Math.floor(rng() * 3);
        for (let i = 0; i < bannerCount; i++) {
            const side = Math.floor(rng() * 2);
            const bx = side === 0 ? x + 10 + rng() * (s.w * 0.3) : x + s.w * 0.6 + rng() * (s.w * 0.3);
            const by = y + 20 + rng() * (s.h * 0.3);
            const bw = 6 + rng() * 4;
            const bh = 14 + rng() * 10;

            ctx.fillStyle = '#1a1410';
            ctx.fillRect(bx - 1, by - 2, 2, bh + 4);

            ctx.fillStyle = s.bannerColor;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + bw, by);
            ctx.lineTo(bx + bw, by + bh);
            ctx.lineTo(bx + bw / 2, by + bh - 4);
            ctx.lineTo(bx, by + bh);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + bw / 2, by);
            ctx.lineTo(bx + bw / 2, by + bh);
            ctx.lineTo(bx, by + bh);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawTorches(ctx, x, y, s, rng) {
        const torchPositions = [
            [x + s.w / 2 - 24, y + s.h - 30],
            [x + s.w / 2 + 20, y + s.h - 30],
            [x + 8, y + s.h / 2],
            [x + s.w - 12, y + s.h / 2]
        ];

        const torchCount = 2 + Math.floor(rng() * 2);
        for (let i = 0; i < torchCount; i++) {
            const [tx, ty] = torchPositions[i];
            ctx.fillStyle = '#2a1a10';
            ctx.fillRect(tx, ty, 3, 10);
            ctx.fillStyle = '#4a3a28';
            ctx.fillRect(tx - 1, ty, 5, 3);

            ctx.fillStyle = `rgba(${200 + rng() * 55},${140 + rng() * 60},${40 + rng() * 30},0.7)`;
            ctx.beginPath();
            ctx.arc(tx + 1.5, ty - 2, 3 + rng() * 2, 0, Math.PI * 2);
            ctx.fill();

            const fg = ctx.createRadialGradient(tx + 1.5, ty - 2, 1, tx + 1.5, ty - 2, 14);
            fg.addColorStop(0, 'rgba(240,184,64,0.15)');
            fg.addColorStop(1, 'rgba(240,184,64,0)');
            ctx.fillStyle = fg;
            ctx.fillRect(tx - 12, ty - 16, 28, 28);
        }
    }

    _drawCastleWell(ctx, x, y, s, rng) {
        const wx = x + s.w * 0.3 + rng() * (s.w * 0.4);
        const wy = y + s.h * 0.5 + rng() * (s.h * 0.3);
        const r = 8 + rng() * 4;

        ctx.fillStyle = '#2a2828';
        ctx.beginPath();
        ctx.arc(wx, wy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(wx, wy, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wx, wy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(wx - 1, wy - r - 8, 2, 8);
        ctx.fillRect(wx - 8, wy - r - 8, 16, 2);
    }

    getColliders(playerX, playerY) {
        const colliders = [];
        for (const s of this.allStructures) {
            if (s.type !== 'house' && s.type !== 'castle') continue;
            const dx = s.x + s.w / 2 - playerX;
            const dy = s.y + s.h / 2 - playerY;
            if (dx * dx + dy * dy < 400 * 400) {
                const isHouseImage = s.type === 'house' && s.imageIdx >= 0;
                const isCastleImage = s.type === 'castle' && s.useImage;
                if (isHouseImage || isCastleImage) {
                    const maskUrl = s.type === 'castle' ? 'assets/castle1.png' : `assets/house${s.imageIdx + 1}.png`;
                    const mask = this._collisionMasks.get(maskUrl);
                    const scale = s.type === 'castle' ? 1.6 : 1.8;
                    const extraUp = s.type === 'castle' ? 5 : 10;
                    if (mask && mask.rects) {
                        const drawW = s.w * scale;
                        const drawH = s.h * scale;
                        const drawX = s.x - (drawW - s.w) / 2;
                        const drawY = s.y - (drawH - s.h) - extraUp;
                        const scaleX = drawW / mask.imgW;
                        const scaleY = drawH / mask.imgH;
                        for (const r of mask.rects) {
                            colliders.push({
                                x: drawX + r.x * scaleX,
                                y: drawY + r.y * scaleY,
                                w: r.w * scaleX,
                                h: r.h * scaleY
                            });
                        }
                    } else {
                        const cw = s.w * scale;
                        const ch = s.h * scale;
                        const cx = s.x - (cw - s.w) / 2;
                        const cy = s.y - (ch - s.h) - extraUp;
                        colliders.push({ x: cx, y: cy, w: cw, h: ch });
                    }
                } else {
                    colliders.push({ x: s.x, y: s.y, w: s.w, h: s.h });
                }
            }
        }
        return colliders;
    }

    getEnemyColliders(ex, ey, range) {
        const colliders = [];
        for (const s of this.allStructures) {
            if (s.type !== 'house' && s.type !== 'castle') continue;
            const dx = s.x + s.w / 2 - ex;
            const dy = s.y + s.h / 2 - ey;
            if (dx * dx + dy * dy < range * range) {
                const isHouseImage = s.type === 'house' && s.imageIdx >= 0;
                const isCastleImage = s.type === 'castle' && s.useImage;
                if (isHouseImage || isCastleImage) {
                    const maskUrl = s.type === 'castle' ? 'assets/castle1.png' : `assets/house${s.imageIdx + 1}.png`;
                    const mask = this._collisionMasks.get(maskUrl);
                    const scale = s.type === 'castle' ? 1.6 : 1.8;
                    const extraUp = s.type === 'castle' ? 5 : 10;
                    if (mask && mask.rects) {
                        const drawW = s.w * scale;
                        const drawH = s.h * scale;
                        const drawX = s.x - (drawW - s.w) / 2;
                        const drawY = s.y - (drawH - s.h) - extraUp;
                        const scaleX = drawW / mask.imgW;
                        const scaleY = drawH / mask.imgH;
                        for (const r of mask.rects) {
                            colliders.push({
                                x: drawX + r.x * scaleX,
                                y: drawY + r.y * scaleY,
                                w: r.w * scaleX,
                                h: r.h * scaleY
                            });
                        }
                    } else {
                        const cw = s.w * scale;
                        const ch = s.h * scale;
                        const cx = s.x - (cw - s.w) / 2;
                        const cy = s.y - (ch - s.h) - extraUp;
                        colliders.push({ x: cx, y: cy, w: cw, h: ch });
                    }
                } else {
                    colliders.push({ x: s.x, y: s.y, w: s.w, h: s.h });
                }
            }
        }
        return colliders;
    }
}
