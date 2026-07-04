import { GAME } from '../config/GameConfig.js';

const WEATHER_CONFIGS = {
    0: {
        type: 'rain',
        particleCount: 80,
        color: 'rgba(120,140,160,0.3)',
        speed: 400,
        angle: 0.15,
        length: 12
    },
    1: {
        type: 'leaves',
        particleCount: 25,
        color: 'rgba(140,100,50,0.4)',
        speed: 60,
        angle: 0.3,
        size: 4
    },
    2: {
        type: 'dust',
        particleCount: 40,
        color: 'rgba(160,140,120,0.2)',
        speed: 100,
        angle: 0.05,
        size: 3
    }
};

export class WeatherSystem {
    constructor() {
        this.particles = [];
        this.currentBiome = 0;
        this.enabled = true;
    }

    setBiome(idx) {
        if (idx !== this.currentBiome) {
            this.currentBiome = idx;
            this.particles = [];
        }
    }

    update(dt) {
        if (!this.enabled) return;
        const config = WEATHER_CONFIGS[this.currentBiome];
        if (!config) return;

        while (this.particles.length < config.particleCount) {
            this.particles.push(this._spawnParticle(config));
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += Math.cos(config.angle) * config.speed * dt;
            p.y += config.speed * dt;
            p.life -= dt;
            if (p.life <= 0 || p.y > GAME.HEIGHT + 20 || p.x > GAME.WIDTH + 20 || p.x < -20) {
                this.particles[i] = this._spawnParticle(config);
            }
        }
    }

    _spawnParticle(config) {
        return {
            x: Math.random() * (GAME.WIDTH + 100) - 50,
            y: -10 - Math.random() * 50,
            life: 2 + Math.random() * 2
        };
    }

    draw(ctx) {
        if (!this.enabled) return;
        const config = WEATHER_CONFIGS[this.currentBiome];
        if (!config) return;

        ctx.save();
        for (const p of this.particles) {
            ctx.fillStyle = config.color;
            if (config.type === 'rain') {
                ctx.fillRect(p.x, p.y, 1.5, config.length);
            } else if (config.type === 'leaves') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 2);
                ctx.beginPath();
                ctx.ellipse(0, 0, config.size, config.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, config.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}
