const MAX_PARTICLES = 800;

export class ParticleSystem {
    constructor() {
        this.pool = [];
        this.active = 0;
    }

    _get(cfg) {
        if (this.active < this.pool.length) {
            const p = this.pool[this.active];
            Object.assign(p, cfg);
            p.dead = false;
            p.prevX = cfg.x;
            p.prevY = cfg.y;
        } else {
            this.pool.push({ ...cfg, dead: false, prevX: cfg.x, prevY: cfg.y });
        }
        this.active++;
    }

    burst(x, y, count, colors, speed, life, size, opts) {
        const shape = (opts && opts.shape) || 'circle';
        const additive = (opts && opts.additive) || false;
        const gravity = (opts && opts.gravity) || 0;
        const drag = (opts && opts.drag) || 0;
        const canSpawn = Math.min(count, MAX_PARTICLES - this.active);
        for (let i = 0; i < canSpawn; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * 0.3 + Math.random() * speed * 0.7;
            const l = life * 0.5 + Math.random() * life * 0.5;
            const s = size * 0.5 + Math.random() * size * 0.5;
            const c = colors[Math.floor(Math.random() * colors.length)];
            const rot = Math.random() * Math.PI * 2;
            this._get({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: l, maxLife: l, size: s, color: c,
                gravity, shrink: true,
                shape, additive, rotation: rot,
                rotSpeed: (Math.random() - 0.5) * 8,
                drag
            });
        }
    }

    ring(x, y, radius, count, color, life, size) {
        const canSpawn = Math.min(count, MAX_PARTICLES - this.active);
        for (let i = 0; i < canSpawn; i++) {
            const angle = (i / canSpawn) * Math.PI * 2;
            const spd = radius / life;
            this._get({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life, maxLife: life, size, color,
                gravity: 0, shrink: true,
                shape: 'circle', additive: true, rotation: 0, rotSpeed: 0, drag: 0
            });
        }
    }

    trail(x, y, vx, vy, count, color, life, size) {
        const canSpawn = Math.min(count, MAX_PARTICLES - this.active);
        for (let i = 0; i < canSpawn; i++) {
            const spread = 20;
            this._get({
                x: x + (Math.random() - 0.5) * spread,
                y: y + (Math.random() - 0.5) * spread,
                vx: -vx * 0.1 + (Math.random() - 0.5) * 15,
                vy: -vy * 0.1 + (Math.random() - 0.5) * 15,
                life: life * (0.3 + Math.random() * 0.7),
                maxLife: life,
                size: size * (0.5 + Math.random() * 0.5),
                color,
                gravity: 0, shrink: true,
                shape: 'smoke', additive: false,
                rotation: 0, rotSpeed: 0, drag: 0.92
            });
        }
    }

    enemyDeath(x, y, color) {
        this.burst(x, y, 12, [color, '#fff', '#ffe0b2'], 130, 0.4, 3, { shape: 'spark', additive: true });
        this.ring(x, y, 40, 8, color, 0.3, 2);
    }

    deathBurst(x, y, type) {
        const configs = {
            spore: {
                colors: ['#27ae60', '#82e0aa', '#2ecc71', '#a9dfbf'],
                count: 24, speed: 200, life: 0.6, size: 4,
                extra: (bx, by) => {
                    this.ring(bx, by, 40, 14, '#82e0aa', 0.4, 3);
                    for (let i = 0; i < 10; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const s = 40 + Math.random() * 80;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
                            life: 0.9, maxLife: 0.9, size: 3, color: '#82e0aa',
                            gravity: 80, shrink: true,
                            shape: 'circle', additive: false, rotation: 0, rotSpeed: 0, drag: 0
                        });
                    }
                }
            },
            wisp: {
                colors: ['#7d3c98', '#a569bd', '#d2b4de', '#fff'],
                count: 26, speed: 220, life: 0.5, size: 3,
                extra: (bx, by) => {
                    this.ring(bx, by, 35, 12, '#a569bd', 0.35, 2.5);
                    for (let i = 0; i < 8; i++) {
                        const a = Math.random() * Math.PI * 2;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * 25, vy: -70 - Math.random() * 70,
                            life: 1.4, maxLife: 1.4, size: 7, color: 'rgba(142,68,173,0.5)',
                            gravity: -20, shrink: true,
                            shape: 'smoke', additive: true, rotation: 0, rotSpeed: 0, drag: 0.95
                        });
                    }
                }
            },
            rootcrawler: {
                colors: ['#d35400', '#e67e22', '#f39c12', '#8b4513'],
                count: 22, speed: 170, life: 0.5, size: 4,
                extra: (bx, by) => {
                    this.ring(bx, by, 30, 10, '#e67e22', 0.3, 2.5);
                    for (let i = 0; i < 10; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const s = 50 + Math.random() * 80;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * s, vy: Math.sin(a) * s + 30,
                            life: 0.7, maxLife: 0.7, size: 2.5, color: '#5a3a22',
                            gravity: 120, shrink: true,
                            shape: 'circle', additive: false, rotation: 0, rotSpeed: 0, drag: 0
                        });
                    }
                }
            },
            barkfell: {
                colors: ['#c0392b', '#e74c3c', '#f5b7b1', '#922b21'],
                count: 30, speed: 200, life: 0.6, size: 5,
                extra: (bx, by) => {
                    this.ring(bx, by, 50, 16, '#e74c3c', 0.4, 3.5);
                    for (let i = 0; i < 12; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const s = 25 + Math.random() * 60;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                            life: 0.8, maxLife: 0.8, size: 3.5, color: '#7b241c',
                            gravity: 60, shrink: true,
                            shape: 'debris', additive: false,
                            rotation: Math.random() * 6.28, rotSpeed: (Math.random() - 0.5) * 12, drag: 0
                        });
                    }
                }
            },
            revenant: {
                colors: ['#2c3e50', '#34495e', '#e74c3c', '#c0392b'],
                count: 32, speed: 210, life: 0.7, size: 4.5,
                extra: (bx, by) => {
                    this.ring(bx, by, 55, 18, '#e74c3c', 0.45, 3);
                    for (let i = 0; i < 8; i++) {
                        const a = Math.random() * Math.PI * 2;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * 35, vy: -50 - Math.random() * 70,
                            life: 1.6, maxLife: 1.6, size: 8, color: 'rgba(231,76,60,0.5)',
                            gravity: -10, shrink: true,
                            shape: 'smoke', additive: true, rotation: 0, rotSpeed: 0, drag: 0.94
                        });
                    }
                }
            },
            leech: {
                colors: ['#8b2252', '#ff6b9d', '#c44270', '#ffb3cc'],
                count: 18, speed: 140, life: 0.5, size: 3.5,
                extra: (bx, by) => {
                    this.ring(bx, by, 25, 8, '#ff6b9d', 0.3, 2.5);
                    for (let i = 0; i < 6; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const s = 30 + Math.random() * 50;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                            life: 0.6, maxLife: 0.6, size: 2, color: '#ff6b9d',
                            gravity: 40, shrink: true,
                            shape: 'circle', additive: true, rotation: 0, rotSpeed: 0, drag: 0
                        });
                    }
                }
            },
            mimic: {
                colors: ['#b8d94e', '#e74c3c', '#fff', '#ff6b6b'],
                count: 22, speed: 230, life: 0.4, size: 4,
                extra: (bx, by) => {
                    this.ring(bx, by, 40, 12, '#e74c3c', 0.35, 2.5);
                    for (let i = 0; i < 8; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const s = 50 + Math.random() * 70;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                            life: 0.5, maxLife: 0.5, size: 3, color: '#b8d94e',
                            gravity: 0, shrink: true,
                            shape: 'spark', additive: true, rotation: 0, rotSpeed: 0, drag: 0
                        });
                    }
                }
            },
            hive: {
                colors: ['#c4a23a', '#e8c84a', '#f0d060', '#fff'],
                count: 24, speed: 160, life: 0.55, size: 4.5,
                extra: (bx, by) => {
                    this.ring(bx, by, 35, 12, '#e8c84a', 0.35, 3);
                    for (let i = 0; i < 10; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const s = 30 + Math.random() * 60;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * s, vy: Math.sin(a) * s + 20,
                            life: 0.7, maxLife: 0.7, size: 2.5, color: '#f0d060',
                            gravity: 60, shrink: true,
                            shape: 'circle', additive: false, rotation: 0, rotSpeed: 0, drag: 0
                        });
                    }
                }
            },
            warden: {
                colors: ['#4a6a8a', '#a0d0ff', '#c0e8ff', '#fff'],
                count: 26, speed: 180, life: 0.6, size: 4.5,
                extra: (bx, by) => {
                    this.ring(bx, by, 45, 14, '#a0d0ff', 0.4, 2.5);
                    for (let i = 0; i < 6; i++) {
                        const a = Math.random() * Math.PI * 2;
                        this._get({
                            x: bx, y: by,
                            vx: Math.cos(a) * 20, vy: -40 - Math.random() * 50,
                            life: 1.2, maxLife: 1.2, size: 6, color: 'rgba(160,208,255,0.5)',
                            gravity: -15, shrink: true,
                            shape: 'smoke', additive: true, rotation: 0, rotSpeed: 0, drag: 0.93
                        });
                    }
                }
            }
        };

        const cfg = configs[type] || configs.spore;
        this.burst(x, y, cfg.count, cfg.colors, cfg.speed, cfg.life, cfg.size, { shape: 'spark', additive: true });
        if (cfg.extra) cfg.extra(x, y);
    }

    xpCollect(x, y) {
        this.burst(x, y, 5, ['#c39bd3', '#d2b4de', '#f4ecf7', '#fff'], 60, 0.3, 2.5, { shape: 'circle', additive: true });
    }

    update(dt) {
        let writeIdx = 0;
        for (let i = 0; i < this.active; i++) {
            const p = this.pool[i];
            p.vy += p.gravity * dt;
            if (p.drag) {
                p.vx *= Math.pow(p.drag, dt * 60);
                p.vy *= Math.pow(p.drag, dt * 60);
            }
            p.prevX = p.x;
            p.prevY = p.y;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotSpeed * dt;
            p.life -= dt;
            if (p.life > 0) {
                this.pool[writeIdx++] = p;
            }
        }
        this.active = writeIdx;
    }

    draw(ctx) {
        for (let i = 0; i < this.active; i++) {
            const p = this.pool[i];
            const alpha = Math.min(1, p.life / p.maxLife * 2);
            const lifeRatio = p.life / p.maxLife;
            const r = p.shrink ? p.size * lifeRatio : p.size;
            if (r <= 0.1) continue;

            ctx.save();
            ctx.globalAlpha = alpha;
            if (p.additive) ctx.globalCompositeOperation = 'lighter';

            switch (p.shape) {
                case 'spark': this._drawSpark(ctx, p, r); break;
                case 'smoke': this._drawSmoke(ctx, p, r, alpha); break;
                case 'debris': this._drawDebris(ctx, p, r); break;
                default: this._drawCircle(ctx, p, r); break;
            }

            ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    _drawCircle(ctx, p, r) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSpark(ctx, p, r) {
        const dx = p.x - p.prevX;
        const dy = p.y - p.prevY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        const len = Math.min(r * 2.5, speed * 0.3 + r);
        const w = r * 0.4;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-len, 0);
        ctx.lineTo(-w, -w);
        ctx.lineTo(len, 0);
        ctx.lineTo(-w, w);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.globalAlpha *= 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSmoke(ctx, p, r, alpha) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawDebris(ctx, p, r) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-r, -r * 0.6, r * 2, r * 1.2);
    }

    clear() { this.active = 0; }
    getCount() { return this.active; }
}
