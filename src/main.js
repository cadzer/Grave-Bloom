import { Input } from './core/Input.js';
import { GAME, SCREEN_SHAKE, LEVELING, BOSS, COINS, CHARACTERS, LOADOUTS, SHOP_UPGRADES } from './config/GameConfig.js';

const FD = 'Rajdhani';
const FB = 'Inter';
import { Player } from './entities/Player.js';
import { createGemDrop } from './entities/XPGem.js';
import { TreasureChest } from './entities/TreasureChest.js';
import { Renderer } from './systems/Renderer.js';
import { Spawner } from './systems/Spawner.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { WeaponManager } from './systems/WeaponManager.js';
import { UISystem } from './systems/UISystem.js';
import { DamageNumbers } from './systems/DamageNumbers.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';
import { PassiveSystem } from './systems/PassiveSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { SoundSystem } from './systems/SoundSystem.js';
import { Structures } from './systems/Structures.js';
import { HealingPotion, tryCreatePotionDrop, spawnRandomPotion } from './entities/HealingPotion.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { WeaponSynergySystem } from './systems/WeaponSynergySystem.js';
import { RunHistorySystem } from './systems/RunHistorySystem.js';
import { AmbientSystem } from './systems/AmbientSystem.js';
import { UpdateChecker } from './systems/UpdateChecker.js';
import { AutoUpdater } from './systems/AutoUpdater.js';
import { RelicSystem } from './systems/RelicSystem.js';
import { WeatherSystem } from './systems/WeatherSystem.js';
import { ScreenBorderEffects } from './systems/ScreenBorderEffects.js';
import { FogOfWar } from './systems/FogOfWar.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.ctx = this.renderer.getContext();
        this.input = new Input();
        this.ui = new UISystem();
        this.ui.setSound(this.sound);
        this.shopSystem = new ShopSystem();
        this.particles = new ParticleSystem();
        this.sound = new SoundSystem();
        this.structures = new Structures();
        this.achievementSystem = new AchievementSystem();
        this.synergySystem = new WeaponSynergySystem();
        this.runHistory = new RunHistorySystem();
        this.ambient = new AmbientSystem();
        this.relicSystem = new RelicSystem();
        this.weather = new WeatherSystem();
        this.screenBorders = new ScreenBorderEffects();
        this.fogOfWar = new FogOfWar();
        this._fogEnabled = localStorage.getItem('gravebloom_fog') === '1';
        this.fogOfWar.setEnabled(this._fogEnabled);
        this.updateChecker = new UpdateChecker();
        this.autoUpdater = new AutoUpdater();
        this.updateChecker.checkForUpdates().then(() => {
            if (this.updateChecker.updateAvailable && this.gameState === 'menu') {
                this._showUpdatePopup = true;
            }
        });

        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.lastTime = 0;

        this.gameState = 'menu';
        this.selectedChar = 'bloomkeeper';
        this.selectedLoadout = 'default';
        this.debug = false;
        this._weaponDamageLog = {};
        this.ui.showMenu();

        this.setupEvents();
        this._fullscreenQueued = (localStorage.getItem('gravebloom_fullscreen') === '1');
        this.gameLoop(0);
    }

    _saveFullscreen() {
        try {
            const isFs = !!document.fullscreenElement || (typeof nw !== 'undefined' && nw.Window.get().isFullscreen);
            localStorage.setItem('gravebloom_fullscreen', isFs ? '1' : '0');
        } catch {}
    }

    _saveSettings() {
        try {
            localStorage.setItem('gravebloom_fog', this._fogEnabled ? '1' : '0');
        } catch {}
    }

    _loadSettings() {
        try {
            this._fogEnabled = localStorage.getItem('gravebloom_fog') === '1';
            this.fogOfWar.setEnabled(this._fogEnabled);
        } catch {}
    }

    _hashString(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        h ^= str.length;
        h = Math.imul(h, 0x85ebca6b);
        h ^= h >>> 13;
        h = Math.imul(h, 0xc2b2ae35);
        h ^= h >>> 16;
        return (h >>> 0).toString(16).padStart(8, '0');
    }

    _enterFullscreen() {
        try {
            if (typeof nw !== 'undefined') {
                nw.Window.get().enterFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        } catch {}
    }

    _exitFullscreen() {
        try {
            if (typeof nw !== 'undefined') {
                nw.Window.get().leaveFullscreen();
            } else if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        } catch {}
    }

    xpForLevel(level) {
        return Math.floor(LEVELING.BASE_XP * Math.pow(level, LEVELING.EXPONENT));
    }

    _resolveRectCollision(entity, rect) {
        const r = entity.radius || 15;
        const ex = entity.x;
        const ey = entity.y;
        const closestX = Math.max(rect.x, Math.min(ex, rect.x + rect.w));
        const closestY = Math.max(rect.y, Math.min(ey, rect.y + rect.h));
        const dx = ex - closestX;
        const dy = ey - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < r * r) {
            if (distSq > 0) {
                const d = Math.sqrt(distSq);
                const overlap = r - d;
                entity.x += (dx / d) * overlap;
                entity.y += (dy / d) * overlap;
            } else {
                const distLeft = ex - rect.x;
                const distRight = rect.x + rect.w - ex;
                const distTop = ey - rect.y;
                const distBottom = rect.y + rect.h - ey;
                const minDist = Math.min(distLeft, distRight, distTop, distBottom);
                if (minDist === distLeft) entity.x = rect.x - r - 1;
                else if (minDist === distRight) entity.x = rect.x + rect.w + r + 1;
                else if (minDist === distTop) entity.y = rect.y - r - 1;
                else entity.y = rect.y + rect.h + r + 1;
            }
        }
    }

    _renderPlaying(ctx, cx, cy) {
        ctx.save();
        ctx.translate(this.renderer.shakeX, this.renderer.shakeY);

        this.renderer.clear();
        const camOffX = this.bossIntroCamX || 0;
        const camOffY = this.bossIntroCamY || 0;
        this.renderer.drawBackground(this.player.x + camOffX, this.player.y + camOffY, this.elapsedTime);

        this.ambient.draw(ctx, this.player.x + camOffX, this.player.y + camOffY);

        this.structures.draw(ctx, this.player.x + camOffX, this.player.y + camOffY);

        for (const gem of this.gems) {
            const gx = cx + (gem.x - this.player.x);
            const gy = cy + (gem.y - this.player.y);
            if (gx < -20 || gx > GAME.WIDTH + 20 || gy < -20 || gy > GAME.HEIGHT + 20) continue;
            gem.draw(ctx, gx, gy);
        }

        for (const potion of this.potions) {
            const px = cx + (potion.x - this.player.x);
            const py = cy + (potion.y - this.player.y);
            if (px < -30 || px > GAME.WIDTH + 30 || py < -30 || py > GAME.HEIGHT + 30) continue;
            potion.draw(ctx, px, py);
        }

        for (const chest of this.chests) {
            chest.draw(ctx, cx + (chest.x - this.player.x), cy + (chest.y - this.player.y));
        }

        for (const enemy of this.spawner.getEnemies()) {
            const ex = cx + (enemy.x - this.player.x);
            const ey = cy + (enemy.y - this.player.y);
            if (ex < -100 || ex > GAME.WIDTH + 100 || ey < -100 || ey > GAME.HEIGHT + 100) continue;
            enemy.draw(ctx, ex, ey);
        }

        for (const boss of this.spawner.getBosses()) {
            const bx = cx + (boss.x - this.player.x);
            const by = cy + (boss.y - this.player.y);
            if (bx < -200 || bx > GAME.WIDTH + 200 || by < -200 || by > GAME.HEIGHT + 200) continue;
            boss.draw(ctx, bx, by);
        }

        this.weaponManager.draw(ctx, cx, cy, this.player.x, this.player.y);

        this.particles.draw(ctx);
        this.weather.draw(ctx);

        this.player.draw(ctx, cx, cy);
        this.damageNumbers.draw(ctx, this.player.x, this.player.y);

        this.renderer.drawDynamicLighting(ctx, cx, cy, this.player, this.weaponManager, this.spawner.getBosses());

        ctx.restore();

        this.renderer.drawPostProcess(ctx, this.elapsedTime, this.player.hp / this.player.maxHp);

        this.fogOfWar.drawFog(ctx, cx, cy);

        this.screenBorders.draw(ctx);

        const activeBoss = this.spawner.getLatestBoss();
        if (activeBoss && !activeBoss.dead) {
            activeBoss.drawBossBar(ctx, activeBoss.name);
        }

        const stage = this.spawner.getStage(this.elapsedTime);
        const ownedPassives = this.passiveSystem.getOwned();
        this.ui.drawHUD(ctx, this.kills, this.elapsedTime,
            this.displayHp, this.player.maxHp,
            this.displayXp, this.xpToNext, this.level,
            ownedPassives, stage.name,
            this.displayCoins, this.weaponManager,
            this.synergySystem.getActive(),
            CHARACTERS[this.selectedChar]?.name || 'Bloomkeeper');

        if (this.debug) {
            ctx.fillStyle = 'rgba(76,175,80,0.6)';
            ctx.font = `600 14px Rajdhani`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('DEBUG MODE', GAME.WIDTH / 2, GAME.HEIGHT - 50);
        }


        if (this.player.hp > 0 && this.player.hp / this.player.maxHp < 0.25) {
            this.ui.drawLowHealthWarning(ctx, this.lowHealthPulse);
        }

        this.ui.drawAnnouncement(ctx);
        this.ui.drawWeaponUnlockBanner(ctx);
        this.ui.drawAchievementPopup(ctx);
        this.ui.drawTooltip(ctx);

        if (this.evolutionAnim) {
            this.ui.drawEvolutionAnim(ctx, this.evolutionAnim);
        }

        this.ui.drawLevelUp(ctx);
        this.ui.drawChestReward(ctx);

        if (this.bossIntroTimer > 0) {
            const alpha = Math.min(1, this.bossIntroTimer / 1.5) * 0.3;
            ctx.fillStyle = `rgba(180,50,50,${alpha})`;
            ctx.fillRect(0, 0, GAME.WIDTH, 3);
            ctx.fillRect(0, GAME.HEIGHT - 3, GAME.WIDTH, 3);
            ctx.fillRect(0, 0, 3, GAME.HEIGHT);
            ctx.fillRect(GAME.WIDTH - 3, 0, 3, GAME.HEIGHT);
        }
    }

    startRun() {
        this.sound._init();
        this.spawner = new Spawner();
        this.collision = new CollisionSystem();
        this.weaponManager = new WeaponManager(this.sound);
        this.damageNumbers = new DamageNumbers();
        this.passiveSystem = new PassiveSystem();
        this.upgradeSystem = new UpgradeSystem(this.passiveSystem);

        this.player = new Player(0, 0, this.selectedChar);
        this.gems = [];
        this.chests = [];
        this.potions = [];
        this.pendingChestReward = null;
        this.kills = 0;
        this.bossesKilled = 0;
        this.elapsedTime = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = this.xpForLevel(1);
        this.runCoins = this.shopSystem.getStartCoins();
        this.evolutionsAchieved = [];
        this.relicSystem.clear();
        this.fogOfWar.setEnabled(this._fogEnabled);
        this.evolutionAnim = null;
        this.lowHealthPulse = 0;
        this.bossIntroTimer = 0;
        this.bossIntroPhase = null;
        this._bossFightActive = false;
        this._bossDamageTaken = false;
        this._anyBossNoHit = false;
        this.bossIntroCamX = 0;
        this.bossIntroCamY = 0;
        this.bossIntroName = '';
        this._latestBoss = null;
        this.potionSpawnTimer = 0;

        this.displayHp = this.player.maxHp;
        this.displayXp = 0;
        this.displayCoins = 0;
        this._weaponDamageLog = {};

        this.weaponManager.addWeapon('arcane_bolt', 1);
        const loadout = LOADOUTS.find(l => l.id === this.selectedLoadout);
        if (loadout && loadout.weapon) {
            this.weaponManager.addWeapon(loadout.weapon, 1);
        }
        if (loadout && loadout.passive) {
            const pCfg = SHOP_UPGRADES[loadout.passive];
            if (pCfg && pCfg.apply) {
                this.passiveSystem.add(loadout.passive);
                pCfg.apply(this.player);
            }
        }
        this.shopSystem.applyBonuses(this.player, this.weaponManager);
        this.particles.clear();

        this.setupCallbacks();
        this.gameState = 'playing';
        this.ui.hideShop();
        this.ui.hideGameOver();
        this.ui.hideLevelUp();
        this.ui.hideChestReward();
    }

    setupCallbacks() {
        this.collision.onPlayerHit = (damage) => {
            let finalDamage = damage;
            if (this.relicSystem.hasRelic('doubleDamageDoubleTaken')) finalDamage *= 2;
            if (this.player.takeDamage(finalDamage)) {
                this.renderer.shake(SCREEN_SHAKE.DAMAGE_INTENSITY, SCREEN_SHAKE.DAMAGE_DURATION);
                this.renderer.flashScreen(200, 40, 40, 0.3, 0.2);
                this.renderer.hitStop(0.06);
                this.sound.playPlayerHit();
                if (this._bossFightActive) this._bossDamageTaken = true;

                const thornsDmg = this.player.getThornsDamage();
                if (thornsDmg > 0) {
                    const allTargets = [...this.spawner.getEnemies(), ...this.spawner.getBosses()];
                    let closest = null;
                    let closestDist = 60 * 60;
                    for (const t of allTargets) {
                        if (t.dead) continue;
                        const dx = t.x - this.player.x;
                        const dy = t.y - this.player.y;
                        const dSq = dx * dx + dy * dy;
                        if (dSq < closestDist) {
                            closestDist = dSq;
                            closest = t;
                        }
                    }
                    if (closest) {
                        const kb = 120;
                        const dx = closest.x - this.player.x;
                        const dy = closest.y - this.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        closest.takeDamage(thornsDmg, (dx / dist) * kb, (dy / dist) * kb);
                        this.damageNumbers.addWithColor(closest.x, closest.y - 40, thornsDmg, '#8b3a62');
                        const esx = closest.x - this.player.x + GAME.WIDTH / 2;
                        const esy = closest.y - this.player.y + GAME.HEIGHT / 2;
                        this.particles.ring(esx, esy, 30, 10, '#8b3a62', 0.4, 3);
                        if (closest.dead) {
                            if (closest.isBoss) {
                                this.weaponCallbacks.onBossKilled(closest);
                            } else {
                                this.weaponCallbacks.onEnemyKilled(closest);
                            }
                        }
                    }
                }
            }
        };

        this.weaponCallbacks = {
            onEnemyHit: (enemy, damage, x, y) => {
                this.damageNumbers.add(x, y - 40, damage);
                this.sound.playEnemyHit();
                const lastWeapon = this.weaponManager.getLastHitWeapon();
                if (lastWeapon) {
                    if (!this._weaponDamageLog[lastWeapon]) this._weaponDamageLog[lastWeapon] = 0;
                    this._weaponDamageLog[lastWeapon] += damage;
                }
                if (this.relicSystem.hasRelic('lifesteal')) {
                    this.player.hp = Math.min(this.player.hp + damage * 0.15, this.player.maxHp);
                }
            },
            onEnemyKilled: (enemy) => {
                this.kills++;

                if ([100, 250, 500, 1000, 2500, 5000].includes(this.kills)) {
                    this.ui.showAnnouncement(`${this.kills} Kills!`, 'The Blight trembles!');
                    this.sound.playLevelUp();
                }
                this.spawner.removeEnemy(enemy);
                this.gems.push(createGemDrop(enemy.x, enemy.y));
                const esx = enemy.x - this.player.x + GAME.WIDTH / 2;
                const esy = enemy.y - this.player.y + GAME.HEIGHT / 2;
                this.particles.deathBurst(esx, esy, enemy.type);
                this.sound.playEnemyDeath();
                const relic = this.relicSystem.tryDropRelic(this.level);
                if (relic) {
                    this.ui.showAnnouncement(`Relic Found: ${relic.name}`, relic.desc);
                    this.sound.playChestOpen();
                }
                if (enemy.type === 'barkfell' || enemy.type === 'revenant') {
                    this.renderer.hitStop(0.04);
                }
                if (Math.random() < COINS.DROP_CHANCE) {
                    this.runCoins += enemy.coinValue;
                }
                if (enemy.type === 'hive' && enemy.splitCount > 0) {
                    for (let i = 0; i < enemy.splitCount; i++) {
                        const angle = (i / enemy.splitCount) * Math.PI * 2 + Math.random() * 0.5;
                        const dist = 30 + Math.random() * 20;
                        const sx = enemy.x + Math.cos(angle) * dist;
                        const sy = enemy.y + Math.sin(angle) * dist;
                        this.spawner.spawnSmallHive(sx, sy);
                    }
                }
            },
            onBossKilled: (boss) => {
                this.kills++;
                this.bossesKilled++;
                if (this._bossFightActive && !this._bossDamageTaken) this._anyBossNoHit = true;
                this._bossFightActive = false;
                this.spawner.removeBoss(boss);
                this.chests.push(new TreasureChest(boss.x, boss.y));
                this.runCoins += COINS.BOSS_DROP;
                this.renderer.shake(16, 0.5);
                this.renderer.flashScreen(255, 200, 50, 0.4, 0.3);
                this.renderer.hitStop(0.1);
                const bxs = boss.x - this.player.x + GAME.WIDTH / 2;
                const bys = boss.y - this.player.y + GAME.HEIGHT / 2;
                this.particles.enemyDeath(bxs, bys, '#f1c40f');
                this.particles.ring(bxs, bys, 100, 30, '#f1c40f', 0.6, 4);
                this.particles.ring(bxs, bys, 60, 20, '#fff', 0.4, 3);
                this.ui.showAnnouncement('Boss Defeated!', 'A treasure chest has appeared!');
            },
            onHeal: (amount) => {
                this.player.hp = Math.min(this.player.hp + amount, this.player.maxHp);
            }
        };

        this.collision.onEnemyHit = this.weaponCallbacks.onEnemyHit;
        this.collision.onEnemyKilled = this.weaponCallbacks.onEnemyKilled;
        this.collision.onBossKilled = this.weaponCallbacks.onBossKilled;

        this.collision.onChestPickedUp = (chest) => {
            const reward = this.upgradeSystem.getChestReward(
                this.player, this.weaponManager, this.passiveSystem
            );
            this.pendingChestReward = reward;
            this.gameState = 'chestreward';
            this.ui.showChestReward(reward);
            this.renderer.shake(6, 0.2);
            this.sound.playChestOpen();
        };
    }

    setupEvents() {
        this.canvas.addEventListener('click', (e) => {
            if (this._fullscreenQueued) {
                this._fullscreenQueued = false;
                this._enterFullscreen();
            }
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = GAME.WIDTH / rect.width;
            const scaleY = GAME.HEIGHT / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            if (this.gameState === 'menu') {
                if (this._showUpdatePopup) {
                    if (this.ui.isUpdatePopupButtonAt(mx, my, 'update')) {
                        if (this.autoUpdater.downloading) {
                            this._showUpdatePopup = false;
                            this.autoUpdater.downloading = false;
                            this.autoUpdater.status = 'idle';
                            this.autoUpdater.progress = 0;
                            return;
                        }
                        const zipUrl = this.updateChecker.zipAssetUrl;
                        if (zipUrl && this.updateChecker.latestVersion) {
                            this.autoUpdater.startUpdate(zipUrl, this.updateChecker.latestVersion);
                        } else {
                            window.open(this.updateChecker.updateUrl, '_blank');
                        }
                        return;
                    }
                    if (this.ui.isUpdatePopupButtonAt(mx, my, 'cancel')) {
                        this._showUpdatePopup = false;
                        return;
                    }
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'begin')) {
                    this.gameState = 'charselect';
                    this.ui.showCharacters();
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'shop')) {
                    this.gameState = 'shop';
                    this.ui.showShop(this.shopSystem);
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'settings')) {
                    this.gameState = 'settings';
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'tutorial')) {
                    this.gameState = 'tutorial';
                    this.ui.showTutorial();
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'achievements')) {
                    this.gameState = 'achievements';
                    this.ui.showAchievements(this.achievementSystem);
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'changelog')) {
                    this.gameState = 'changelog';
                    this.ui.showChangelog();
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'exit')) {
                    this.gameState = 'exitconfirm';
                    return;
                }
                if (this.ui.isMenuButtonAt(mx, my, 'discord')) {
                    window.open('https://discord.gg/9rqvtVQKkB', '_blank');
                    return;
                }
                if (this.ui.isVersionTextAt(mx, my)) {
                    if (this.ui.onVersionTextClick()) {
                        if (this.debug) {
                            this.debug = false;
                            this.ui.showMenu();
                        } else {
                            this.gameState = 'debugpassword';
                            this._debugPasswordInput = '';
                        }
                    }
                    return;
                }
                return;
            }

            if (this.gameState === 'charselect') {
                for (const ch of Object.values(CHARACTERS)) {
                    if (this.ui.isCharSelectAt(mx, my, ch.id)) {
                        this.selectedChar = ch.id;
                        this.gameState = 'loadoutselect';
                        this.ui.hideCharacters();
                        this.ui.showLoadoutSelect();
                        return;
                    }
                }
                if (this.ui.isCharBackAt(mx, my)) {
                    this.gameState = 'menu';
                    this.ui.hideCharacters();
                    this.ui.showMenu();
                    return;
                }
                return;
            }

            if (this.gameState === 'loadoutselect') {
                const loadoutResult = this.ui.isLoadoutSelectAt(mx, my);
                if (loadoutResult === 'back') {
                    this.gameState = 'charselect';
                    this.ui.hideLoadoutSelect();
                    this.ui.showCharacters();
                    return;
                }
                if (loadoutResult && loadoutResult !== 'back') {
                    const unlocked = this.shopSystem.getUnlockedLoadouts();
                    if (unlocked.includes(loadoutResult)) {
                        this.selectedLoadout = loadoutResult;
                        this.gameState = 'intro';
                        this.ui.hideLoadoutSelect();
                        this.ui.showIntro();
                    } else {
                        if (this.shopSystem.unlockLoadout(loadoutResult)) {
                            this.ui.showLoadoutSelect(this.selectedLoadout, this.shopSystem);
                        }
                    }
                    return;
                }
                return;
            }

            if (this.gameState === 'settings') {
                if (this.ui.isSettingsButtonAt(mx, my, 'mute')) {
                    this.sound.toggleMute();
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'fullscreen')) {
                    if (document.fullscreenElement || (typeof nw !== 'undefined' && nw.Window.get().isFullscreen)) {
                        this._exitFullscreen();
                    } else {
                        this._enterFullscreen();
                    }
                    setTimeout(() => this._saveFullscreen(), 200);
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'fog')) {
                    this._fogEnabled = !this._fogEnabled;
                    this.fogOfWar.setEnabled(this._fogEnabled);
                    this._saveSettings();
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'reset')) {
                    this.ui._settingsResetConfirm = true;
                    this.gameState = 'resetconfirm';
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'back')) {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                return;
            }

            if (this.gameState === 'resetconfirm') {
                if (this.ui.isResetConfirmButtonAt(mx, my, 'yes')) {
                    this.shopSystem.resetSave();
                    this.achievementSystem.reset();
                    this.runHistory.clear();
                    this.selectedLoadout = 'default';
                    this.ui.hideResetConfirm();
                    this.ui.showResetNotify();
                    this.gameState = 'settings';
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isResetConfirmButtonAt(mx, my, 'no')) {
                    this.ui.hideResetConfirm();
                    this.gameState = 'settings';
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                return;
            }

            if (this.gameState === 'shopresetconfirm') {
                if (this.ui.isShopResetConfirmButtonAt(mx, my, 'yes')) {
                    this.shopSystem.refundUpgrades();
                    this.ui.hideShopResetConfirm();
                    this.gameState = 'shop';
                    this.ui.showShop(this.shopSystem);
                    return;
                }
                if (this.ui.isShopResetConfirmButtonAt(mx, my, 'no')) {
                    this.ui.hideShopResetConfirm();
                    this.gameState = 'shop';
                    return;
                }
                return;
            }

            if (this.gameState === 'shop') {
                const upgradeKey = this.ui.getShopUpgradeAt(mx, my);
                if (upgradeKey) {
                    this.shopSystem.buyUpgrade(upgradeKey);
                    return;
                }
                if (this.ui.isShopButtonAt(mx, my, 'back')) {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                if (this.ui.isShopButtonAt(mx, my, 'reset')) {
                    const refundAmount = this.shopSystem.calcRefundAmount();
                    if (refundAmount > 0) {
                        this.ui.showShopResetConfirm(refundAmount);
                        this.gameState = 'shopresetconfirm';
                    }
                    return;
                }
                return;
            }

            if (this.gameState === 'tutorial') {
                if (this.ui.isTutorialButtonAt(mx, my, 'back')) {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                const tabClicked = this.ui.getTutorialTabAt(mx, my);
                if (tabClicked !== null) {
                    this.ui.tutorialScreen.tab = tabClicked;
                }
                return;
            }

            if (this.gameState === 'achievements') {
                if (this.ui.isAchievementsButtonAt(mx, my, 'back')) {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                return;
            }

            if (this.gameState === 'changelog') {
                if (this.ui.isChangelogButtonAt(mx, my, 'back')) {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                return;
            }

            if (this.gameState === 'exitconfirm') {
                if (this.ui.isExitConfirmButtonAt(mx, my, 'yes')) {
                    window.close();
                    return;
                }
                if (this.ui.isExitConfirmButtonAt(mx, my, 'no')) {
                    this.gameState = 'menu';
                    return;
                }
                return;
            }

            if (this.gameState === 'intro') {
                if (this.ui.isIntroSkipAt(mx, my)) {
                    this.ui.hideIntro();
                    this.gameState = 'playing';
                    this.startRun();
                    return;
                }
                return;
            }

            if (this.gameState === 'gameover') {
                if (this.ui.isShopButtonAt(mx, my, 'shop')) {
                    this.shopSystem.addRunCoins(this.runCoins);
                    this.gameState = 'shop';
                    this.ui.showShop(this.shopSystem);
                    this.ui.hideGameOver();
                    return;
                }
                if (this.ui.isShopButtonAt(mx, my, 'restart')) {
                    this.shopSystem.addRunCoins(this.runCoins);
                    this.startRun();
                    return;
                }
                if (this.ui.isShopButtonAt(mx, my, 'menu')) {
                    this.shopSystem.addRunCoins(this.runCoins);
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    this.ui.hideGameOver();
                    return;
                }
                return;
            }

            if (this.gameState === 'paused') {
                if (this.ui.isPauseButtonAt(mx, my, 'resume')) {
                    this.gameState = 'playing';
                    this.ui.hidePause();
                    return;
                }
                if (this.ui.isPauseButtonAt(mx, my, 'settings')) {
                    this.gameState = 'pausesettings';
                    this.ui.hidePause();
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isPauseButtonAt(mx, my, 'menu')) {
                    this.ui.hidePause();
                    this.gameState = 'pauseconfirm';
                    this.ui.showPauseConfirm(this.runCoins);
                    return;
                }
                return;
            }

            if (this.gameState === 'pausesettings') {
                if (this.ui.isSettingsButtonAt(mx, my, 'mute')) {
                    this.sound.toggleMute();
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'fullscreen')) {
                    if (document.fullscreenElement || (typeof nw !== 'undefined' && nw.Window.get().isFullscreen)) {
                        this._exitFullscreen();
                    } else {
                        this._enterFullscreen();
                    }
                    setTimeout(() => this._saveFullscreen(), 200);
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'fog')) {
                    this._fogEnabled = !this._fogEnabled;
                    this.fogOfWar.setEnabled(this._fogEnabled);
                    this._saveSettings();
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'reset')) {
                    this.ui._settingsResetConfirm = true;
                    this.gameState = 'resetconfirm';
                    return;
                }
                if (this.ui.isSettingsButtonAt(mx, my, 'back')) {
                    this.gameState = 'paused';
                    this.ui.hideSettings();
                    this.ui.showPause();
                    return;
                }
                return;
            }

            if (this.gameState === 'pauseconfirm') {
                if (this.ui.isPauseConfirmButtonAt(mx, my, 'yes')) {
                    this.shopSystem.addRunCoins(this.runCoins);
                    this.ui.hidePauseConfirm();
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                if (this.ui.isPauseConfirmButtonAt(mx, my, 'no')) {
                    this.ui.hidePauseConfirm();
                    this.gameState = 'paused';
                    this.ui.showPause();
                    return;
                }
                return;
            }

            if (this.ui.isChestRewardVisible()) {
                this.dismissChestReward();
                return;
            }

            if (this.ui.isLevelUpVisible()) {
                const idx = this.ui.getLevelUpChoiceAt(mx, my);
                if (idx >= 0) this.chooseUpgrade(idx);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = GAME.WIDTH / rect.width;
            const scaleY = GAME.HEIGHT / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;
            this.ui.setMousePos(mx, my);
            if (this.ui.isLevelUpVisible()) {
                const idx = this.ui.getLevelUpChoiceAt(mx, my);
                this.ui.setLevelUpHover(idx);
            }
            if (this.gameState === 'loadoutselect') {
                let hoverId = null;
                for (const r of this.ui._loadoutRects || []) {
                    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                        hoverId = r.id;
                        break;
                    }
                }
                if (this.ui._loadoutBackRect) {
                    const b = this.ui._loadoutBackRect;
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        hoverId = 'back';
                    }
                }
                this.ui.setLoadoutHover(hoverId);
            }
        });

        this.canvas.addEventListener('mousedown', () => { this.ui._mouseDown = true; });
        this.canvas.addEventListener('mouseup', () => { this.ui._mouseDown = false; });
        this.canvas.addEventListener('wheel', (e) => {
            if (this.gameState === 'changelog') {
                e.preventDefault();
                this.ui.scrollChangelog(e.deltaY * 0.5);
            }
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (this._fullscreenQueued) {
                this._fullscreenQueued = false;
                this._enterFullscreen();
            }
            if (this.gameState === 'debugpassword') {
                if (e.code === 'Escape') {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                if (e.code === 'Enter') {
                    const hash = this._hashString(this._debugPasswordInput);
                    if (hash === 'fcfc4b09') {
                        this.debug = true;
                        this.gameState = 'menu';
                        this.ui.showMenu();
                    } else {
                        this._debugPasswordWrongTimer = 2.0;
                        this._debugPasswordInput = '';
                    }
                    return;
                }
                if (e.code === 'Backspace') {
                    this._debugPasswordInput = this._debugPasswordInput.slice(0, -1);
                    return;
                }
                if (e.key.length === 1) {
                    this._debugPasswordWrongTimer = 0;
                    this._debugPasswordInput += e.key;
                    return;
                }
                return;
            }
            if (e.code === 'Space' && this.gameState === 'chestreward') {
                this.dismissChestReward();
                return;
            }

            if (e.code === 'KeyM') {
                this.sound.toggleMute();
                this.ui.showMuteNotify(this.sound.isMuted());
                return;
            }

            if (e.code === 'Escape') {
                if (this.gameState === 'menu' && this._showUpdatePopup) {
                    this._showUpdatePopup = false;
                    return;
                }
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                    this.ui.showPause();
                    return;
                }
                if (this.gameState === 'paused') {
                    this.gameState = 'playing';
                    this.ui.hidePause();
                    return;
                }
                if (this.gameState === 'pausesettings') {
                    this.gameState = 'paused';
                    this.ui.hideSettings();
                    this.ui.showPause();
                    return;
                }
                if (this.gameState === 'pauseconfirm') {
                    this.ui.hidePauseConfirm();
                    this.gameState = 'paused';
                    this.ui.showPause();
                    return;
                }
                if (this.gameState === 'resetconfirm') {
                    this.ui.hideResetConfirm();
                    this.gameState = 'settings';
                    this.ui.showSettings(this.sound, this._fogEnabled);
                    return;
                }
                if (this.gameState === 'shopresetconfirm') {
                    this.ui.hideShopResetConfirm();
                    this.gameState = 'shop';
                    return;
                }
                if (this.gameState === 'achievements') {
                    this.gameState = 'menu';
                    this.ui.showMenu();
                    return;
                }
                if (this.gameState === 'exitconfirm') {
                    this.gameState = 'menu';
                    return;
                }
            }

            if (this.ui.isLevelUpVisible()) {
                const num = parseInt(e.key);
                const maxChoice = this.debug
                    ? this.ui.levelUpScreen.choices.length
                    : LEVELING.LEVEL_UP_CHOICES;
                if (num >= 1 && num <= maxChoice) {
                    this.chooseUpgrade(num - 1);
                }
            }
        });
    }

    chooseUpgrade(index) {
        const choices = this.ui.levelUpScreen.choices;
        if (index < 0 || index >= choices.length) return;

        const choice = choices[index];

        if (choice.kind === 'weapon_unlock') {
            this.upgradeSystem.applyWeaponUnlock(choice.weaponTypeId, this.weaponManager);
            this.sound.playWeaponUnlock();
            this.ui.showWeaponUnlock(choice.name, choice.icon || '\u2694\uFE0F');
        } else if (choice.kind === 'weapon_levelup') {
            this.upgradeSystem.applyWeaponLevelUp(choice.weaponTypeId, this.weaponManager);
        } else if (choice.kind === 'weapon') {
            this.upgradeSystem.applyWeaponUpgrade(choice.id, this.player, this.weaponManager);
        } else if (choice.kind === 'passive') {
            this.upgradeSystem.applyPassive(choice.id, this.player, this.weaponManager);
        } else if (choice.kind === 'heal') {
            this.upgradeSystem.applyHeal(this.player);
        }

        this.sound.playLevelUp();
        this.ui.hideLevelUp();
        this.gameState = 'playing';
    }

    dismissChestReward() {
        if (this.pendingChestReward) {
            if (this.pendingChestReward.type === 'evolution') {
                this.evolutionAnim = {
                    weaponTypeId: this.pendingChestReward.weaponTypeId,
                    name: this.pendingChestReward.name,
                    color: this.pendingChestReward.color,
                    timer: 0,
                    duration: 2.5
                };
                this.evolutionsAchieved.push(this.pendingChestReward.name);
                this.renderer.shake(10, 0.5);
                this.sound.playEvolution();
            }

            this.upgradeSystem.applyChestReward(
                this.pendingChestReward, this.player, this.weaponManager, this.passiveSystem
            );
            this.pendingChestReward = null;
        }
        this.ui.hideChestReward();
        this.gameState = 'playing';
    }

    addXP(amount) {
        const xpBonus = this.shopSystem.getXPBonusMulti();
        this.xp += Math.floor(amount * xpBonus);

        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = this.xpForLevel(this.level);
            this.triggerLevelUp();
            if (this.gameState !== 'playing') break;
        }
    }

    triggerLevelUp() {
        this.gameState = 'levelup';
        this.renderer.flashLevelUp();
        this.ui.setPassiveLevels(this.passiveSystem.levels);
        const count = this.debug ? 999 : LEVELING.LEVEL_UP_CHOICES;
        const choices = this.upgradeSystem.getChoices(count, this.weaponManager, this.debug);
        this.ui.showLevelUp(choices);
    }

    restart() {
        this.startRun();
    }

    gameLoop(time) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.frameCount++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        this.update(dt);
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        const hitStopped = this.renderer.updateShake(dt);
        this.ui.updateAnnouncement(dt);
        this.sound.updateKillStreak(dt);

        if (this._debugPasswordWrongTimer > 0) {
            this._debugPasswordWrongTimer -= dt;
        }

        if (hitStopped) {
            this.particles.update(dt * 0.2);
            return;
        }

        if (this.bossIntroTimer > 0 && this.bossIntroPhase) {
            this.bossIntroTimer -= dt;
            const totalDuration = this.bossIntroDuration;
            const elapsed = totalDuration - this.bossIntroTimer;
            const halfDur = totalDuration * 0.6;
            if (elapsed < halfDur) {
                const t = Math.min(1, elapsed / 0.8);
                const ease = t * t * (3 - 2 * t);
                this.bossIntroCamX = (this.bossIntroTargetX - this.player.x) * ease;
                this.bossIntroCamY = (this.bossIntroTargetY - this.player.y) * ease;
            } else {
                const t = Math.min(1, (elapsed - halfDur) / 0.8);
                const ease = t * t * (3 - 2 * t);
                this.bossIntroCamX = (this.bossIntroTargetX - this.player.x) * (1 - ease);
                this.bossIntroCamY = (this.bossIntroTargetY - this.player.y) * (1 - ease);
            }
            if (this.bossIntroTimer <= 0) {
                this.bossIntroPhase = null;
                this.bossIntroCamX = 0;
                this.bossIntroCamY = 0;
            }
            this.ui.updateAnnouncement(dt);
            this.particles.update(dt);
            return;
        }

        if (this.gameState === 'chestreward') {
            this.ui.updateChestReward(dt);
            this.particles.update(dt);
            return;
        }

        if (this.gameState === 'deathslowmo') {
            this.deathSlowmoTimer -= dt;
            this.renderer.updateShake(dt);
            this.ui.updateAnnouncement(dt);
            this.particles.update(dt);
            for (const boss of this.spawner.getBosses()) {
                boss.update(dt * 0.15, this.player.x, this.player.y);
            }
            if (this.deathSlowmoTimer <= 0) {
                this.gameState = 'gameover';
                this.ui.showGameOver(this.pendingGameOver);
            }
            return;
        }

        if (this.gameState === 'levelup') return;
        if (this.gameState === 'paused') return;
        if (this.gameState === 'pauseconfirm') return;
        if (this.gameState === 'tutorial') return;
        if (this.gameState === 'charselect') return;
        if (this.gameState === 'loadoutselect') return;
        if (this.gameState === 'intro') {
            const finished = this.ui.updateIntro(dt);
            if (finished) {
                this.ui.hideIntro();
                this.gameState = 'playing';
                this.startRun();
            }
            return;
        }
        if (this.gameState !== 'playing') return;

        if (this.evolutionAnim) {
            this.evolutionAnim.timer += dt;
            if (this.evolutionAnim.timer >= this.evolutionAnim.duration) {
                this.evolutionAnim = null;
            }
        }

        this.elapsedTime += dt;



        const hpDrainSpeed = 3;
        this.displayHp += (this.player.hp - this.displayHp) * hpDrainSpeed * dt;
        if (Math.abs(this.displayHp - this.player.hp) < 0.5) this.displayHp = this.player.hp;

        this.displayXp += (this.xp - this.displayXp) * 5 * dt;
        this.displayCoins += (this.runCoins - this.displayCoins) * 5 * dt;
        if (Math.abs(this.displayCoins - this.runCoins) < 1) this.displayCoins = this.runCoins;

        if (this.relicSystem.hasRelic('doubleDamageDoubleTaken')) {
            this.player.damageMulti = 2;
        }

        if (this.input.isKeyDown('Space') && this.player.canDash()) {
            this.player.startDash();
        }

        this.player.update(dt, this.input);
        this.relicSystem.update(dt);
        this.weather.setBiome(this.renderer.getBiomeIndex(this.elapsedTime));
        this.weather.update(dt);
        this.screenBorders.update(dt, this.player.hp / this.player.maxHp);
        this.structures.update(this.player.x, this.player.y);

        const playerColliders = this.structures.getColliders(this.player.x, this.player.y);
        for (const c of playerColliders) {
            this._resolveRectCollision(this.player, c);
        }

        this.particles.update(dt);
        this.ambient.update(dt, this.player.x, this.player.y, this.elapsedTime);

        const hpPct = this.player.hp / this.player.maxHp;
        if (hpPct < 0.25 && this.player.hp > 0) {
            this.lowHealthPulse += dt * 5;
        } else {
            this.lowHealthPulse = 0;
        }

        if (this.ui._weaponUnlock) {
            this.ui._weaponUnlock.timer -= dt;
            if (this.ui._weaponUnlock.timer <= 0) this.ui._weaponUnlock = null;
        }
        if (this.ui._achievementPopup) {
            this.ui._achievementPopup.timer -= dt;
            if (this.ui._achievementPopup.timer <= 0) this.ui._achievementPopup = null;
        }

        const stage = this.spawner.getStage(this.elapsedTime);

        const announcement = this.spawner.checkAnnouncement(this.elapsedTime);
        if (announcement) {
            this.ui.showAnnouncement(announcement.name, announcement.message);
        }

        const pickupR2 = this.player.pickupRadius * this.player.pickupRadius;

        for (const gem of this.gems) {
            const magnetR = this.relicSystem.hasRelic('globalMagnet') ? GAME.WIDTH : this.player.magnetRadius;
            gem.update(dt, this.player.x, this.player.y, magnetR);

            const dx = this.player.x - gem.x;
            const dy = this.player.y - gem.y;
            if (dx * dx + dy * dy < pickupR2) {
                gem.dead = true;
                const gx = gem.x - this.player.x + GAME.WIDTH / 2;
                const gy = gem.y - this.player.y + GAME.HEIGHT / 2;
                this.particles.xpCollect(gx, gy);
                this.particles.ring(gx, gy, gem.radius * 1.5, 8, gem.color || '#7c9a6e', 0.3, 2);
                this.sound.playXpPickup();
                this.addXP(gem.value);
            }
        }
        let writeIdx = 0;
        for (let i = 0; i < this.gems.length; i++) {
            if (!this.gems[i].dead) this.gems[writeIdx++] = this.gems[i];
        }
        this.gems.length = writeIdx;

        for (const potion of this.potions) {
            potion.update(dt, this.player.x, this.player.y, this.player.magnetRadius);

            const dx = this.player.x - potion.x;
            const dy = this.player.y - potion.y;
            if (dx * dx + dy * dy < pickupR2) {
                potion.dead = true;
                const healAmt = Math.floor(this.player.maxHp * potion.cfg.healPercent);
                this.player.hp = Math.min(this.player.hp + healAmt, this.player.maxHp);
                this.particles.xpCollect(potion.x - this.player.x + GAME.WIDTH / 2, potion.y - this.player.y + GAME.HEIGHT / 2);
                this.sound.playXpPickup();
            }
        }

        this.potionSpawnTimer += dt;
        if (this.potionSpawnTimer >= 30 && this.potions.length < 2 && this.player.hp < this.player.maxHp) {
            this.potionSpawnTimer = 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 400;
            const px = this.player.x + Math.cos(angle) * dist;
            const py = this.player.y + Math.sin(angle) * dist;
            this.potions.push(spawnRandomPotion(px, py));
        }

        writeIdx = 0;
        for (let i = 0; i < this.potions.length; i++) {
            if (!this.potions[i].dead) this.potions[writeIdx++] = this.potions[i];
        }
        this.potions.length = writeIdx;

        for (let i = 0; i < this.chests.length; i++) {
            this.chests[i].update(dt);
        }
        writeIdx = 0;
        for (let i = 0; i < this.chests.length; i++) {
            if (!this.chests[i].dead) this.chests[writeIdx++] = this.chests[i];
        }
        this.chests.length = writeIdx;

        this.spawner.update(dt, this.player.x, this.player.y, this.elapsedTime);
        this.spawner._speedMulti = this.relicSystem.hasRelic('slowEnemies') ? 0.75 : 1;
        this.spawner.updateSpecialBehaviors(dt, this.player.x, this.player.y);
        if (this.spawner.bossJustSpawned) {
            this.spawner.bossJustSpawned = false;
            this._bossFightActive = true;
            this._bossDamageTaken = false;
            const latestBoss = this.spawner.getLatestBoss();
            if (latestBoss) {
                this._latestBoss = latestBoss;
                this.bossIntroTimer = 2.5;
                this.bossIntroDuration = 2.5;
                this.bossIntroTargetX = latestBoss.x;
                this.bossIntroTargetY = latestBoss.y;
                this.bossIntroCamX = 0;
                this.bossIntroCamY = 0;
                this.bossIntroPhase = 'toBoss';
                this.bossIntroName = latestBoss.name || 'Unknown';
                this.ui.showAnnouncement(this.bossIntroName, 'A powerful foe approaches!');
                this.renderer.shake(12, 0.6);
                this.renderer.flashScreen(255, 255, 255, 0.5, 0.3);
                const bx = latestBoss.x - this.player.x + GAME.WIDTH / 2;
                const by = latestBoss.y - this.player.y + GAME.HEIGHT / 2;
                this.particles.ring(bx, by, 80, 24, '#fff', 0.5, 3);
                this.particles.ring(bx, by, 50, 16, latestBoss.config?.auraColor || '#f1c40f', 0.4, 2.5);
            }
        }
        const enemies = this.spawner.getEnemies();
        const bosses = this.spawner.getBosses();
        const totalEnemies = enemies.length + bosses.length;

        for (const e of enemies) {
            if (e.dead) continue;
            if (e.type === 'wisp') {
                if (Math.random() < 0.08) {
                    const cx = e.x - this.player.x + GAME.WIDTH / 2;
                    const cy = e.y - this.player.y + GAME.HEIGHT / 2;
                    this.particles.trail(cx, cy, e.speed, 0, 1, 'rgba(142,68,173,0.25)', 0.6, 4);
                }
            } else if (e.type === 'leech') {
                if (Math.random() < 0.06) {
                    const cx = e.x - this.player.x + GAME.WIDTH / 2;
                    const cy = e.y - this.player.y + GAME.HEIGHT / 2;
                    this.particles.trail(cx, cy, e.speed, 0, 1, 'rgba(139,34,82,0.2)', 0.5, 3);
                }
            } else if (e.type === 'rootcrawler') {
                if (Math.random() < 0.05) {
                    const cx = e.x - this.player.x + GAME.WIDTH / 2;
                    const cy = e.y - this.player.y + GAME.HEIGHT / 2;
                    this.particles.trail(cx, cy, e.speed, 0, 1, 'rgba(90,58,34,0.3)', 0.4, 2.5);
                }
            }
        }

        for (const e of enemies) {
            if (e.dead) continue;
            if (e.type === 'wisp') continue;
            const ec = this.structures.getEnemyColliders(e.x, e.y, 200);
            for (const c of ec) this._resolveRectCollision(e, c);
        }
        for (const b of bosses) {
            if (b.dead) continue;
            const bc = this.structures.getEnemyColliders(b.x, b.y, 200);
            for (const c of bc) this._resolveRectCollision(b, c);
        }

        if (this.spawner.bossSpawned) {
            const latestBoss = this.spawner.getLatestBoss();
            if (latestBoss) {
                this.ui.showAnnouncement(latestBoss.name, 'A mighty foe approaches!');
            }
            this.spawner.bossSpawned = false;
        }

        this.weaponManager.update(
            dt, this.player.x, this.player.y,
            enemies, bosses, this.weaponCallbacks
        );
        this.synergySystem.check(this.weaponManager);
        this.synergySystem.apply(this.weaponManager);

        this.collision.checkEnemyPlayerCollisions(enemies, this.player);
        this.collision.checkBossPlayerCollisions(bosses, this.player);
        this.collision.checkProjectileEnemyCollisions(
            this.weaponManager.getProjectiles(), enemies
        );
        this.collision.checkProjectileBossCollisions(
            this.weaponManager.getProjectiles(), bosses
        );
        this.collision.checkChestPickup(this.chests, this.player);

        this.damageNumbers.update(dt);

        if (!this.player.isAlive()) {
            if (this.player.hasRevive && !this.player.reviveUsed) {
                this.player.reviveUsed = true;
                this.player.hp = Math.floor(this.player.maxHp * 0.3);
                this.player.invincibleTimer = 3;
                this.renderer.shake(10, 0.5);
                this.sound.playLevelUp();
                this.ui.showAnnouncement('Second Bloom!', 'You have been revived!');
                this.particles.deathBurst(GAME.WIDTH / 2, GAME.HEIGHT / 2, 'spore');
            } else {
                this.gameState = 'deathslowmo';
                this.deathSlowmoTimer = 3.5;
                this.sound.playGameOver();

                const runStats = {
                    kills: this.kills,
                    bossesKilled: this.bossesKilled,
                    elapsedTime: this.elapsedTime,
                    level: this.level,
                    runCoins: this.runCoins,
                    totalCoins: this.shopSystem.totalCoins,
                    weaponsOwned: this.weaponManager.weapons.length,
                    evolutions: this.evolutionsAchieved.length,
                    bossKillNoHit: this._anyBossNoHit
                };

                this.runHistory.addRun(runStats);
                const newAchievements = this.achievementSystem.check(runStats);

                this.pendingGameOver = {
                    ...runStats,
                    newAchievements,
                    activeSynergies: this.synergySystem.getActive(),
                    weaponDamageLog: { ...this._weaponDamageLog }
                };
            }
        }
    }

    render() {
        const ctx = this.ctx;

        if (this.gameState === 'menu') {
            this.ui.drawMenu(ctx, this.sound, this.debug, this.updateChecker, this._showUpdatePopup);
            if (this.debug) {
                ctx.fillStyle = 'rgba(76,175,80,0.6)';
                ctx.font = '600 14px Rajdhani';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('DEBUG MODE', GAME.WIDTH / 2, GAME.HEIGHT - 50);
            }
            if (this._showUpdatePopup) {
                this.ui.drawUpdatePopup(ctx, this.updateChecker.latestVersion, this.updateChecker.updateUrl, this.autoUpdater);
            }
            return;
        }

        if (this.gameState === 'debugpassword') {
            this.ui.drawMenu(ctx, this.sound, this.debug, this.updateChecker, true);
            this.ui.drawDebugPassword(ctx, this._debugPasswordInput, this._debugPasswordWrongTimer > 0);
            return;
        }

        if (this.gameState === 'achievements') {
            this.ui.drawAchievements(ctx);
            return;
        }

        if (this.gameState === 'changelog') {
            this.ui.drawChangelog(ctx);
            return;
        }

        if (this.gameState === 'exitconfirm') {
            this.ui.drawMenu(ctx, this.sound, this.debug, this.updateChecker, true);
            this.ui.drawExitConfirm(ctx);
            return;
        }

        if (this.gameState === 'charselect') {
            this.ui.drawCharacterSelect(ctx, this.sound, this.selectedChar);
            return;
        }

        if (this.gameState === 'loadoutselect') {
            this.ui.drawLoadoutSelect(ctx, this.selectedLoadout, this.shopSystem);
            return;
        }

        if (this.gameState === 'settings') {
            this.ui.drawSettings(ctx, this.sound);
            return;
        }

        if (this.gameState === 'shop') {
            this.ui.drawShop(ctx, this.shopSystem, this.sound);
            return;
        }

        if (this.gameState === 'resetconfirm') {
            this.ui.drawSettings(ctx, this.sound);
            this.ui.drawSettingsResetConfirm(ctx);
            return;
        }

        if (this.gameState === 'shopresetconfirm') {
            this.ui.drawShopResetConfirm(ctx, this.shopSystem);
            return;
        }

        if (this.gameState === 'intro') {
            this.ui.drawIntro(ctx);
            return;
        }

        if (this.gameState === 'tutorial') {
            this.ui.drawTutorial(ctx);
            return;
        }

        if (this.gameState === 'pausesettings') {
            this.ui.drawSettings(ctx, this.sound);
            return;
        }

        const cx = GAME.WIDTH / 2 - (this.bossIntroCamX || 0);
        const cy = GAME.HEIGHT / 2 - (this.bossIntroCamY || 0);

        this._renderPlaying(ctx, cx, cy);

        if (this.bossIntroTimer > 0 && this.bossIntroPhase) {
            const elapsed = this.bossIntroDuration - this.bossIntroTimer;
            const totalDuration = this.bossIntroDuration;
            const halfDur = totalDuration * 0.6;
            let bannerAlpha;
            if (elapsed < 0.4) {
                bannerAlpha = Math.min(1, elapsed / 0.4);
            } else if (elapsed < halfDur) {
                bannerAlpha = 1;
            } else {
                bannerAlpha = Math.max(0, 1 - (elapsed - halfDur) / 0.3);
            }
            if (bannerAlpha > 0) {
                const darkAlpha = Math.min(0.7, elapsed * 2) * bannerAlpha;
                ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
                ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

                if (this._latestBoss && elapsed < 0.8) {
                    const bxs = GAME.WIDTH / 2;
                    const bys = GAME.HEIGHT / 2;
                    const silhouetteAlpha = Math.min(1, elapsed / 0.4);
                    ctx.save();
                    ctx.globalAlpha = silhouetteAlpha * 0.6 * bannerAlpha;
                    ctx.fillStyle = '#1a0a1a';
                    ctx.beginPath();
                    ctx.arc(bxs, bys, 80 + elapsed * 20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = silhouetteAlpha * 0.3 * bannerAlpha;
                    ctx.fillStyle = '#2a1a2a';
                    ctx.beginPath();
                    ctx.arc(bxs, bys, 120 + elapsed * 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                ctx.fillStyle = `rgba(0,0,0,${0.4 * bannerAlpha})`;
                ctx.fillRect(0, GAME.HEIGHT / 2 - 60, GAME.WIDTH, 120);
                ctx.save();
                ctx.globalAlpha = bannerAlpha;
                ctx.strokeStyle = `rgba(255,60,60,${0.8 * bannerAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, GAME.HEIGHT / 2 - 60);
                ctx.lineTo(GAME.WIDTH, GAME.HEIGHT / 2 - 60);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, GAME.HEIGHT / 2 + 60);
                ctx.lineTo(GAME.WIDTH, GAME.HEIGHT / 2 + 60);
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = `bold 56px ${FD}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#ff3333';
                ctx.shadowBlur = 20;
                ctx.fillText(this.bossIntroName, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 8);
                ctx.shadowBlur = 10;
                ctx.fillText(this.bossIntroName, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 8);
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,200,200,0.7)';
                ctx.font = `500 20px ${FB}`;
                ctx.fillText('A powerful foe approaches!', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 32);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        }

        if (this.gameState === 'deathslowmo') {
            const alpha = Math.min(0.6, (3.5 - this.deathSlowmoTimer) / 3.5 * 0.6);
            ctx.fillStyle = `rgba(180,30,30,${alpha})`;
            ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
            ctx.font = `bold 64px ${'Rajdhani'}`;
            ctx.fillStyle = `rgba(255,255,255,${alpha * 1.5})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DEFEATED', GAME.WIDTH / 2, GAME.HEIGHT / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        if (this.gameState === 'paused' || this.gameState === 'pauseconfirm') {
            this.ui.drawPause(ctx);
            if (this.gameState === 'pauseconfirm') {
                this.ui.drawPauseConfirm(ctx);
            }
        }

        this.ui.drawGameOver(ctx, {
            kills: this.kills,
            bossesKilled: this.bossesKilled,
            elapsedTime: this.elapsedTime,
            level: this.level,
            runCoins: this.runCoins,
            totalCoins: this.shopSystem.totalCoins,
            weaponsOwned: this.weaponManager.weapons.length,
            evolutions: this.evolutionsAchieved.length
        });

        if (this.debug) this._drawDebugOverlay(ctx);
    }

    _drawDebugOverlay(ctx) {
        const W = GAME.WIDTH;
        const pad = 16;
        const lineH = 20;
        let y = pad;

        ctx.save();

        const panelW = 360;
        const panelH = 460;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(pad - 4, pad - 4, panelW, panelH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(184,217,78,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `bold 14px Rajdhani`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.fillStyle = '#b8d94e';
        ctx.fillText('DEBUG MODE  [` to toggle]', pad, y);
        y += lineH + 4;

        ctx.fillStyle = '#fff';
        ctx.font = `13px Rajdhani`;

        ctx.fillText(`FPS: ${this.fps}`, pad, y); y += lineH;
        ctx.fillText(`Game State: ${this.gameState}`, pad, y); y += lineH;
        ctx.fillText(`Time: ${this.elapsedTime.toFixed(1)}s`, pad, y); y += lineH;
        ctx.fillText(`Level: ${this.level}  XP: ${this.xp}/${this.xpToNext}`, pad, y); y += lineH;

        y += 4;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 13px Rajdhani`;
        ctx.fillText('Player', pad, y); y += lineH - 4;
        ctx.fillStyle = '#fff';
        ctx.font = `13px Rajdhani`;
        ctx.fillText(`HP: ${Math.floor(this.player.hp)}/${this.player.maxHp}`, pad, y); y += lineH;
        ctx.fillText(`Pos: (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})`, pad, y); y += lineH;
        ctx.fillText(`Speed: ${this.player.speed.toFixed(0)}  Magnet: ${this.player.magnetRadius.toFixed(0)}`, pad, y); y += lineH;
        ctx.fillText(`Invincible: ${this.player.invincibleTimer > 0 ? this.player.invincibleTimer.toFixed(1) + 's' : 'no'}`, pad, y); y += lineH;

        y += 4;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 13px Rajdhani`;
        ctx.fillText('Entities', pad, y); y += lineH - 4;
        ctx.fillStyle = '#fff';
        ctx.font = `13px Rajdhani`;
        ctx.fillText(`Enemies: ${this.spawner.enemies.length}  Bosses: ${this.spawner.bosses.length}`, pad, y); y += lineH;
        ctx.fillText(`Projectiles: ${this.weaponManager.projectiles.length}`, pad, y); y += lineH;
        ctx.fillText(`Gems: ${this.gems.length}  Chests: ${this.chests.length}`, pad, y); y += lineH;
        ctx.fillText(`Potions: ${this.potions.length}  Coins: ${this.runCoins}`, pad, y); y += lineH;

        const enemyTypes = {};
        for (const e of this.spawner.enemies) {
            enemyTypes[e.type] = (enemyTypes[e.type] || 0) + 1;
        }
        const typeStr = Object.entries(enemyTypes).map(([k, v]) => `${k}:${v}`).join('  ');
        if (typeStr) {
            ctx.fillStyle = '#aaa';
            ctx.font = `11px Rajdhani`;
            ctx.fillText(typeStr, pad, y);
            y += lineH;
        }

        y += 4;
        ctx.fillStyle = '#c4a23a';
        ctx.font = `bold 13px Rajdhani`;
        ctx.fillText('Weapons', pad, y); y += lineH - 4;
        ctx.fillStyle = '#fff';
        ctx.font = `13px Rajdhani`;
        for (const w of this.weaponManager.weapons) {
            ctx.fillText(`${w.config.name} Lv.${w.level}${w.isEvolved ? ' [EVO]' : ''}`, pad, y);
            y += lineH;
        }

        const passiveLevels = this.passiveSystem.levels;
        const passiveEntries = Object.entries(passiveLevels).filter(([, v]) => v > 0);
        if (passiveEntries.length > 0) {
            y += 4;
            ctx.fillStyle = '#c4a23a';
            ctx.font = `bold 13px Rajdhani`;
            ctx.fillText('Passives', pad, y); y += lineH - 4;
            ctx.fillStyle = '#fff';
            ctx.font = `13px Rajdhani`;
            for (const [k, v] of passiveEntries) {
                ctx.fillText(`${k}: Lv.${v}`, pad, y);
                y += lineH;
            }
        }

        ctx.restore();
    }
}

window.addEventListener('load', () => {
    new Game();
});
