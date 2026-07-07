// Central config for all game constants.
// Change values here instead of hunting through multiple files.

export const VERSION = '1.3.4';
export const GITHUB_REPO = 'cadzer/Grave-Bloom';

export const GAME = {
    WIDTH: 1920,
    HEIGHT: 1080,
    BACKGROUND_COLOR: '#141416',
    GRID_SIZE: 60,
    GRID_COLOR: '#1e1e22',
    SPRITE_SIZE: 182
};

export const PLAYER = {
    SPEED: 220,
    MAX_HP: 120,
    COLLISION_RADIUS: 18,
    INVINCIBLE_DURATION: 0.5,
    PICKUP_RADIUS: 40,
    COLOR: '#7c9a6e',
    HEAD_COLOR: '#2c3e50',
    BODY_COLOR: '#34495e',
    EYE_COLOR: '#ecf0f1',
    MOUTH_COLOR: '#e74c3c',
    DASH_SPEED: 500,
    DASH_DURATION: 0.2,
    DASH_COOLDOWN: 1.2,
    DASH_TRAIL_COUNT: 5
};

export const CHARACTERS = {
    bloomkeeper: {
        id: 'bloomkeeper',
        name: 'Bloomkeeper',
        description: 'Balanced guardian of the garden. A well-rounded starter.',
        icon: '\uD83C\uDF3F',
        color: '#7c9a6e',
        hpBonus: 0,
        speedBonus: 0,
        magnetBonus: 0,
        damageBonus: 0,
        palette: {
            cape1: '#3a1020', cape2: '#4a1828', cape3: '#2a0818',
            body1: '#1e1a28', body2: '#161220', body3: '#1a1624',
            armor: '#22202e', belt: '#1a1420', buckle: '#b8d94e',
            hood: '#16121e', visor: '#7c9a6e',
        }
    },
    thornGuard: {
        id: 'thornGuard',
        name: 'Thorn Guard',
        description: 'Slow but enduring. Takes hits like ancient roots.',
        icon: '\uD83E\uDE93',
        color: '#8b4513',
        hpBonus: 60,
        speedBonus: -30,
        magnetBonus: 0,
        damageBonus: 0,
        palette: {
            cape1: '#3a2010', cape2: '#4a3018', cape3: '#2a1808',
            body1: '#2a1e14', body2: '#1e1610', body3: '#221a12',
            armor: '#3a2e22', belt: '#2a1e14', buckle: '#d4a04a',
            hood: '#2a1e14', visor: '#d4a04a',
        }
    },
    windDancer: {
        id: 'windDancer',
        name: 'Wind Dancer',
        description: 'Swift as the wind. Fragile but hard to catch.',
        icon: '\uD83C\uDF2C\uFE0F',
        color: '#5a8fcf',
        hpBonus: -40,
        speedBonus: 60,
        magnetBonus: 30,
        damageBonus: 0,
        palette: {
            cape1: '#1a2840', cape2: '#203858', cape3: '#102030',
            body1: '#1a2838', body2: '#142030', body3: '#182434',
            armor: '#2a3848', belt: '#1a2838', buckle: '#7cc8ef',
            hood: '#142030', visor: '#7cc8ef',
        }
    },
    rootWalker: {
        id: 'rootWalker',
        name: 'Root Walker',
        description: 'Walks with the roots. Attacks with greater force.',
        icon: '\uD83C\uDF33',
        color: '#5a7a3c',
        hpBonus: -20,
        speedBonus: -10,
        magnetBonus: 0,
        damageBonus: 0.15,
        palette: {
            cape1: '#1a2a10', cape2: '#2a3a18', cape3: '#122008',
            body1: '#1a2414', body2: '#141e10', body3: '#182212',
            armor: '#2a3422', belt: '#1a2414', buckle: '#8bc47a',
            hood: '#141e10', visor: '#8bc47a',
        }
    },
    soulWarden: {
        id: 'soulWarden',
        name: 'Soul Warden',
        description: 'Sees beyond. Draws essence from fallen foes.',
        icon: '\uD83D\uDD2E',
        color: '#7b5ea7',
        hpBonus: -20,
        speedBonus: 0,
        magnetBonus: 80,
        damageBonus: 0,
        palette: {
            cape1: '#2a1840', cape2: '#3a2858', cape3: '#1a0830',
            body1: '#221a30', body2: '#1a1228', body3: '#1e1634',
            armor: '#2e2240', belt: '#221a30', buckle: '#b894e8',
            hood: '#1a1228', visor: '#b894e8',
        }
    },
    emberWitch: {
        id: 'emberWitch',
        name: 'Ember Witch',
        description: 'Burns bright but fast. Devastating power, fragile body.',
        icon: '\uD83D\uDD25',
        color: '#e8723a',
        hpBonus: -60,
        speedBonus: 20,
        magnetBonus: 0,
        damageBonus: 0.30,
        palette: {
            cape1: '#4a1808', cape2: '#6a2810', cape3: '#3a1005',
            body1: '#3a1a10', body2: '#2a1208', body3: '#30160c',
            armor: '#4a2218', belt: '#3a1a10', buckle: '#ff8c42',
            hood: '#2a1208', visor: '#ff8c42',
        }
    },
    stoneWarden: {
        id: 'stoneWarden',
        name: 'Stone Warden',
        description: 'Immovable. Absorbs punishment that would shatter others.',
        icon: '\uD83E\uDEA8',
        color: '#8a8a7a',
        hpBonus: 100,
        speedBonus: -60,
        magnetBonus: -20,
        damageBonus: -0.10,
        palette: {
            cape1: '#3a3830', cape2: '#4a4838', cape3: '#2a2820',
            body1: '#3a3630', body2: '#2e2c28', body3: '#343230',
            armor: '#5a5850', belt: '#3a3630', buckle: '#c0b898',
            hood: '#2e2c28', visor: '#c0b898',
        }
    },
    shadowStep: {
        id: 'shadowStep',
        name: 'Shadow Step',
        description: 'Moves between worlds. Hard to pin down, deadly up close.',
        icon: '\uD83D\uDC64',
        color: '#4a4a6a',
        hpBonus: -30,
        speedBonus: 50,
        magnetBonus: 40,
        damageBonus: 0.10,
        palette: {
            cape1: '#18182a', cape2: '#22223a', cape3: '#10101e',
            body1: '#1a1a2a', body2: '#121220', body3: '#161624',
            armor: '#282840', belt: '#1a1a2a', buckle: '#7070aa',
            hood: '#121220', visor: '#7070aa',
        }
    },
    bloomSentinel: {
        id: 'bloomSentinel',
        name: 'Bloom Sentinel',
        description: 'Garden\'s watchful guardian. Balanced with a wider reach.',
        icon: '\uD83C\uDF3F',
        color: '#5a9a5c',
        hpBonus: 20,
        speedBonus: 10,
        magnetBonus: 50,
        damageBonus: 0,
        palette: {
            cape1: '#2a3a20', cape2: '#3a4a28', cape3: '#1a2a10',
            body1: '#2a3420', body2: '#1e2a18', body3: '#242e1c',
            armor: '#3a4a30', belt: '#2a3420', buckle: '#8ac47a',
            hood: '#1e2a18', visor: '#8ac47a',
        }
    },
};

export const ENEMIES = {
    MAX_ON_SCREEN: 60,
    KNOCKBACK_RESISTANCE: 0.85,
    FLASH_DURATION: 0.1,
    HEALTH_BAR_WIDTH: 50,
    HEALTH_BAR_HEIGHT: 6,

    spore: {
        hp: 20,
        speed: 55,
        damage: 8,
        color: '#5a7a3c',
        eyeColor: '#000',
        collisionRadius: 28
    },
    wisp: {
        hp: 10,
        speed: 130,
        damage: 6,
        color: '#7b5ea7',
        eyeColor: '#e74c3c',
        collisionRadius: 20
    },
    barkfell: {
        hp: 100,
        speed: 38,
        damage: 18,
        color: '#8b4513',
        eyeColor: '#f1c40f',
        collisionRadius: 38
    },
    rootcrawler: {
        hp: 16,
        speed: 85,
        damage: 10,
        color: '#6b3a2a',
        eyeColor: '#000',
        collisionRadius: 18
    },
    revenant: {
        hp: 200,
        speed: 50,
        damage: 22,
        color: '#3d3449',
        eyeColor: '#b8d94e',
        collisionRadius: 42
    },
    leech: {
        hp: 30,
        speed: 70,
        damage: 6,
        color: '#8b2252',
        eyeColor: '#ff6b9d',
        collisionRadius: 18,
        healRadius: 80,
        healAmount: 3
    },
    mimic: {
        hp: 50,
        speed: 100,
        damage: 14,
        color: '#b8d94e',
        eyeColor: '#e74c3c',
        collisionRadius: 16,
        aggroRange: 120,
        disguiseAs: 'gem'
    },
    hive: {
        hp: 60,
        speed: 45,
        damage: 12,
        color: '#c4a23a',
        eyeColor: '#2c1810',
        collisionRadius: 24,
        splitCount: 3
    },
    warden: {
        hp: 120,
        speed: 40,
        damage: 10,
        color: '#4a6a8a',
        eyeColor: '#a0d0ff',
        collisionRadius: 34,
        shieldRadius: 100,
        shieldAmount: 0.5
    }
};

export const WAVES = {
    stages: [
        {
            start: 0,
            name: 'The Rot Stirs',
            message: 'Something stirs beneath the soil...',
            spawnRate: 1.5,
            hpMul: 1.0,
            spdMul: 1.0,
            types: [
                { key: 'spore', weight: 10 }
            ]
        },
        {
            start: 100,
            name: 'Blighted Awakening',
            message: 'Lost spirits drift through the mist!',
            spawnRate: 1.2,
            hpMul: 1.0,
            spdMul: 1.0,
            types: [
                { key: 'spore', weight: 7 },
                { key: 'wisp', weight: 3 }
            ]
        },
        {
            start: 250,
            name: 'Tangled Roots',
            message: 'The roots reach for you...',
            spawnRate: 1.0,
            hpMul: 1.1,
            spdMul: 1.05,
            types: [
                { key: 'spore', weight: 5 },
                { key: 'wisp', weight: 4 },
                { key: 'rootcrawler', weight: 3 }
            ]
        },
        {
            start: 400,
            name: 'Blighted Thicket',
            message: 'The deadwood awakens!',
            spawnRate: 0.8,
            hpMul: 1.2,
            spdMul: 1.1,
            types: [
                { key: 'spore', weight: 4 },
                { key: 'wisp', weight: 4 },
                { key: 'rootcrawler', weight: 4 },
                { key: 'barkfell', weight: 2 }
            ]
        },
        {
            start: 600,
            name: 'Iron Rot',
            message: 'The ancient treants march!',
            spawnRate: 0.6,
            hpMul: 1.35,
            spdMul: 1.15,
            types: [
                { key: 'spore', weight: 3 },
                { key: 'wisp', weight: 3 },
                { key: 'rootcrawler', weight: 3 },
                { key: 'barkfell', weight: 3 }
            ]
        },
        {
            start: 800,
            name: 'Revenant Vanguard',
            message: 'The armored dead have arrived!',
            spawnRate: 0.5,
            hpMul: 1.5,
            spdMul: 1.2,
            types: [
                { key: 'spore', weight: 2 },
                { key: 'wisp', weight: 3 },
                { key: 'rootcrawler', weight: 3 },
                { key: 'barkfell', weight: 3 },
                { key: 'revenant', weight: 1 }
            ]
        },
        {
            start: 1000,
            name: 'The Unseelie Court',
            message: 'The Blight has no end...',
            spawnRate: 0.4,
            hpMul: 1.7,
            spdMul: 1.25,
            types: [
                { key: 'spore', weight: 2 },
                { key: 'wisp', weight: 3 },
                { key: 'rootcrawler', weight: 3 },
                { key: 'barkfell', weight: 3 },
                { key: 'revenant', weight: 2 },
                { key: 'leech', weight: 1 },
                { key: 'hive', weight: 1 }
            ]
        },
        {
            start: 1200,
            name: 'The Living Swarm',
            message: 'The hive stirs... Wardens lead them!',
            spawnRate: 0.35,
            hpMul: 2.0,
            spdMul: 1.3,
            types: [
                { key: 'spore', weight: 2 },
                { key: 'wisp', weight: 2 },
                { key: 'rootcrawler', weight: 2 },
                { key: 'barkfell', weight: 2 },
                { key: 'revenant', weight: 2 },
                { key: 'leech', weight: 2 },
                { key: 'hive', weight: 2 },
                { key: 'mimic', weight: 1 },
                { key: 'warden', weight: 1 }
            ]
        }
    ],

    SPAWN_MARGIN: 100,
    HP_SCALE_PER_MIN: 0.12,
    SPEED_SCALE_PER_MIN: 0.04,
    RATE_SCALE_PER_MIN: 0.04,
    MIN_SPAWN_RATE: 0.18
};

export const WEAPON = {
    COOLDOWN: 0.8,
    DAMAGE: 12,
    SPEED: 450,
    SIZE: 12,
    KNOCKBACK_FORCE: 180
};

export const WEAPON_TYPES = {
    arcane_bolt: {
        id: 'arcane_bolt',
        name: 'Seeds of Sorrow',
        description: 'Launches enchanted seeds at the nearest Blighted',
        category: 'projectile',
        unlockChance: 0.55,
        baseCooldown: 0.8,
        baseDamage: 12,
        baseSpeed: 400,
        baseSize: 6,
        baseProjectiles: 1,
        basePierce: 0,
        scale: { damage: 1.12, speed: 1.04, cooldown: 0.97 },
        color: '#7c9a6e',
        secondaryColor: '#a4c48a',
        evolvedId: 'arcane_storm',
    },
    orbiting_blade: {
        id: 'orbiting_blade',
        name: 'Thorn Circle',
        description: 'Each upgrade adds a new ring of thorns',
        category: 'orbit',
        unlockChance: 0.50,
        baseCooldown: 0,
        baseDamage: 8,
        baseSpeed: 2.8,
        baseSize: 16,
        baseProjectiles: 1,
        basePierce: 0,
        baseOrbitRadius: 60,
        projectilesPerLevel: 1,
        scale: { damage: 1.10 },
        color: '#8b3a62',
        secondaryColor: '#c46a8a',
        evolvedId: 'celestial_blades',
    },
    holy_pulse: {
        id: 'holy_pulse',
        name: 'Bursting Pods',
        description: 'Releases a wave of explosive pollen',
        category: 'pulse',
        unlockChance: 0.50,
        baseCooldown: 2.0,
        baseDamage: 15,
        baseSpeed: 0,
        baseSize: 0,
        baseProjectiles: 1,
        basePierce: 0,
        basePulseRadius: 110,
        scale: { damage: 1.15, cooldown: 0.95 },
        color: '#b8d94e',
        secondaryColor: '#d4f082',
        evolvedId: 'divine_nova',
    },
    lightning_mark: {
        id: 'lightning_mark',
        name: 'Withering Hex',
        description: 'Chains blight between enemies',
        category: 'lightning',
        unlockChance: 0.45,
        baseCooldown: 1.5,
        baseDamage: 10,
        baseSpeed: 0,
        baseSize: 4,
        baseProjectiles: 1,
        basePierce: 0,
        baseChainCount: 3,
        baseChainRange: 140,
        scale: { damage: 1.10, cooldown: 0.96 },
        color: '#c4a23a',
        secondaryColor: '#e0c86e',
        evolvedId: 'thunder_crown',
    },
    spore_swarm: {
        id: 'spore_swarm',
        name: 'Spore Swarm',
        description: 'Creates lingering clouds of toxic spores that damage over time',
        category: 'cloud',
        unlockChance: 0.40,
        baseCooldown: 2.5,
        baseDamage: 6,
        baseSpeed: 200,
        baseSize: 8,
        baseProjectiles: 1,
        basePierce: 0,
        baseCloudRadius: 60,
        baseCloudDuration: 3.0,
        baseCloudTick: 0.4,
        scale: { damage: 1.10, cooldown: 0.95 },
        color: '#6a9a3c',
        secondaryColor: '#8bc44a',
        evolvedId: 'blight_plague',
    },
};

export const EVOLUTIONS = {
    arcane_storm: {
        id: 'arcane_storm',
        name: 'Doom Blossom',
        description: 'Seeds pierce through the Blighted',
        baseWeaponId: 'arcane_bolt',
        category: 'projectile',
        requiredPassive: 'spellbook',
        requiredPassiveLevel: 3,
        requiredWeaponLevel: 8,
        scale: { damage: 1.15, speed: 1.2, cooldown: 0.85 },
        addPierce: 1,
        addProjectiles: 1,
        color: '#5a8f50',
        secondaryColor: '#8bc47a',
        trailColor: '#c8e8b4',
        particleCount: 8,
    },
    celestial_blades: {
        id: 'celestial_blades',
        name: 'Storm Sovereign',
        description: 'Lightning rings orbit and strike all nearby foes',
        baseWeaponId: 'orbiting_blade',
        category: 'orbit',
        requiredPassive: 'powerstone',
        requiredPassiveLevel: 3,
        requiredWeaponLevel: 8,
        baseDamage: 120,
        baseSpeed: 3.0,
        baseSize: 18,
        basePulseRadius: 160,
        pulseCooldown: 1.5,
        scale: { damage: 1.15 },
        addProjectiles: 2,
        orbitRadiusBonus: 25,
        color: '#f0e060',
        secondaryColor: '#ffffff',
        trailColor: '#a0d0ff',
        particleCount: 16,
    },
    divine_nova: {
        id: 'divine_nova',
        name: 'Spore Cloud',
        description: 'Wider pollen burst that heals the Bloomkeeper',
        baseWeaponId: 'holy_pulse',
        category: 'pulse',
        requiredPassive: 'ironheart',
        requiredPassiveLevel: 3,
        requiredWeaponLevel: 8,
        scale: { damage: 1.20, cooldown: 0.9 },
        pulseRadiusBonus: 40,
        healAmount: 2,
        color: '#9ab832',
        secondaryColor: '#c8e060',
        trailColor: '#e8f8c0',
        particleCount: 16,
    },
    thunder_crown: {
        id: 'thunder_crown',
        name: 'Storm Cascade',
        description: 'Lightning storm strikes nearly every foe on screen',
        baseWeaponId: 'lightning_mark',
        category: 'lightning',
        requiredPassive: 'clovercoin',
        requiredPassiveLevel: 3,
        requiredWeaponLevel: 8,
        baseDamage: 50,
        baseCooldown: 3.0,
        baseChainCount: 15,
        baseChainRange: 500,
        scale: { damage: 1.10, cooldown: 0.95 },
        addChainCount: 3,
        chainRangeBonus: 60,
        color: '#60c0ff',
        secondaryColor: '#c0e8ff',
        trailColor: '#ffffff',
        particleCount: 18,
    },
    blight_plague: {
        id: 'blight_plague',
        name: 'Blight Plague',
        description: 'Toxic clouds grow larger, last longer, and slow enemies',
        baseWeaponId: 'spore_swarm',
        category: 'cloud',
        requiredPassive: 'magnetcharm',
        requiredPassiveLevel: 3,
        requiredWeaponLevel: 8,
        baseDamage: 7,
        baseCooldown: 2.2,
        baseCloudRadius: 80,
        baseCloudDuration: 4.0,
        baseCloudTick: 0.5,
        scale: { damage: 1.10, cooldown: 0.95 },
        addProjectiles: 1,
        color: '#4a8a2a',
        secondaryColor: '#6ab83a',
        trailColor: '#a0e060',
        particleCount: 14,
    },
};

export const XP_GEMS = {
    SMALL_VALUE: 2,
    MEDIUM_VALUE: 8,
    LARGE_VALUE: 20,
    SMALL_CHANCE: 0.55,
    MEDIUM_CHANCE: 0.35,
    LARGE_CHANCE: 0.10,
    MAGNET_SPEED: 350,
    MAGNET_RADIUS: 200,
    BOB_SPEED: 3,
    BOB_HEIGHT: 3,
    PICKUP_RADIUS: 40
};

export const LEVELING = {
    BASE_XP: 15,
    EXPONENT: 1.15,
    LEVEL_UP_CHOICES: 3
};

export const PASSIVES = {
    spellbook: {
        name: 'Herbal Grimoire',
        description: 'Reduces weapon cooldowns',
        icon: '\uD83D\uDCD6',
        color: '#5a8f7c',
        maxLevel: 5,
        apply: (player, weapons, lvl) => {
            if (weapons._baseCooldownMulti === undefined) weapons._baseCooldownMulti = weapons.globalCooldownMulti;
            weapons.passiveCooldownLevel = lvl;
            weapons.globalCooldownMulti = weapons._baseCooldownMulti * Math.pow(0.88, lvl) * (weapons._upgradeCooldownMulti || 1);
        }
    },
    powerstone: {
        name: 'Death Cap',
        description: 'Increases all weapon damage',
        icon: '\uD83C\uDF44',
        color: '#8b3a62',
        maxLevel: 5,
        apply: (player, weapons, lvl) => {
            if (weapons._baseDamageMulti === undefined) weapons._baseDamageMulti = weapons.globalDamageMulti;
            weapons.passiveDamageLevel = lvl;
            weapons.globalDamageMulti = weapons._baseDamageMulti * (1 + lvl * 0.18) * (weapons._upgradeDamageMulti || 1);
        }
    },
    windboots: {
        name: 'Windstep Boots',
        description: 'Increases movement speed',
        icon: '\uD83D\uDCA8',
        color: '#5a8f7c',
        maxLevel: 5,
        apply: (player, weapons, lvl) => {
            if (player._baseSpeed === undefined) player._baseSpeed = player.speed;
            player.passiveSpeedLevel = lvl;
            player.speed = Math.floor(player._baseSpeed * (1 + lvl * 0.12) * (player._upgradeSpeedMulti || 1));
        }
    },
    magnetcharm: {
        name: 'Soulstone Charm',
        description: 'Increases XP pickup range',
        icon: '\uD83D\uDD2E',
        color: '#7b5ea7',
        maxLevel: 5,
        apply: (player, weapons, lvl) => {
            if (player._baseMagnetRadius === undefined) player._baseMagnetRadius = player.magnetRadius;
            player.passiveMagnetLevel = lvl;
            player.magnetRadius = Math.floor(player._baseMagnetRadius * (1 + (player._upgradeMagnetMulti || 0)) + lvl * 70);
        }
    },
    ironheart: {
        name: 'Ironbark Heart',
        description: 'Increases max HP',
        icon: '\u2764\uFE0F',
        color: '#8b4513',
        maxLevel: 5,
        apply: (player, weapons, lvl) => {
            if (player._baseMaxHp === undefined) player._baseMaxHp = player.maxHp;
            player.passiveHpBonus = lvl * 25;
            player.maxHp = player._baseMaxHp + player.passiveHpBonus + (player._upgradeHpBonus || 0);
            player.hp = player.maxHp;
        }
    },
    clovercoin: {
        name: 'Four-Leaf Clover',
        description: 'Increases chest luck',
        icon: '\uD83C\uDF3F',
        color: '#7c9a6e',
        maxLevel: 5,
        apply: (player, weapons, lvl) => {
            player.luck = 1 + lvl * 0.2;
        }
    }
};

export const UPGRADES = {
    damage: {
        name: '+20% Thorn Damage',
        description: 'Sharpen your thorns',
        type: 'weapon',
        maxLevel: 8,
        apply: (player, weapons) => {
            if (weapons._baseDamageMulti === undefined) weapons._baseDamageMulti = weapons.globalDamageMulti;
            weapons._upgradeDamageMulti = (weapons._upgradeDamageMulti || 1) * 1.20;
            weapons.globalDamageMulti = weapons._baseDamageMulti * (1 + (weapons.passiveDamageLevel || 0) * 0.18) * weapons._upgradeDamageMulti;
        }
    },
    firerate: {
        name: '+12% Bloom Speed',
        description: 'Bloom faster',
        type: 'weapon',
        maxLevel: 8,
        apply: (player, weapons) => {
            if (weapons._baseCooldownMulti === undefined) weapons._baseCooldownMulti = weapons.globalCooldownMulti;
            weapons._upgradeCooldownMulti = (weapons._upgradeCooldownMulti || 1) * 0.88;
            weapons.globalCooldownMulti = weapons._baseCooldownMulti * Math.pow(0.88, weapons.passiveCooldownLevel || 0) * weapons._upgradeCooldownMulti;
        }
    },
    projspeed: {
        name: '+15% Seed Velocity',
        description: 'Seeds fly faster',
        type: 'weapon',
        maxLevel: 8,
        apply: (player, weapons) => {
            weapons.globalSpeedMulti *= 1.15;
        }
    },
    movespeed: {
        name: '+12% Drift Speed',
        description: 'Move faster',
        type: 'weapon',
        maxLevel: 8,
        apply: (player) => {
            if (player._baseSpeed === undefined) player._baseSpeed = player.speed;
            player._upgradeSpeedMulti = (player._upgradeSpeedMulti || 1) * 1.12;
            player.speed = Math.floor(player._baseSpeed * (1 + (player.passiveSpeedLevel || 0) * 0.12) * player._upgradeSpeedMulti);
        }
    },
    maxhp: {
        name: '+20 Vital Sap',
        description: 'Increase maximum health',
        type: 'weapon',
        maxLevel: 8,
        apply: (player) => {
            if (player._baseMaxHp === undefined) player._baseMaxHp = player.maxHp;
            player._upgradeHpBonus = (player._upgradeHpBonus || 0) + 20;
            player.maxHp = player._baseMaxHp + (player.passiveHpBonus || 0) + player._upgradeHpBonus;
            player.hp = player.maxHp;
        }
    },
    heal: {
        name: 'Heal 30 HP',
        description: 'Restore health',
        type: 'heal',
        maxLevel: 99,
        apply: (player) => {
            player.hp = Math.min(player.hp + 30, player.maxHp);
        }
    },
    magnet: {
        name: '+40% Root Range',
        description: 'Attract souls from further away',
        type: 'weapon',
        maxLevel: 8,
        apply: (player) => {
            if (player._baseMagnetRadius === undefined) player._baseMagnetRadius = player.magnetRadius;
            player._upgradeMagnetMulti = (player._upgradeMagnetMulti || 0) + 0.4;
            player.magnetRadius = Math.floor(player._baseMagnetRadius * (1 + player._upgradeMagnetMulti) + (player.passiveMagnetLevel || 0) * 70);
        }
    },
    revive: {
        name: 'Second Bloom',
        description: 'One-time revive on death, restoring 30% HP',
        type: 'passive',
        maxLevel: 1,
        apply: (player) => {
            player.hasRevive = true;
            player.reviveUsed = false;
        }
    }
};

export const LOADOUTS = [
    {
        id: 'default',
        name: 'Bloomkeeper',
        description: 'Standard loadout with Seeds of Sorrow',
        weapon: null,
        passive: null,
        unlockCost: 0
    },
    {
        id: 'thorn_guard',
        name: 'Thorn Guard',
        description: 'Start with Thorn Circle and +20 Vital Sap',
        weapon: 'orbiting_blade',
        passive: 'maxhp',
        unlockCost: 500
    },
    {
        id: 'wind_dancer',
        name: 'Wind Dancer',
        description: 'Start with Bursting Pods and +12% Drift Speed',
        weapon: 'holy_pulse',
        passive: 'movespeed',
        unlockCost: 500
    },
    {
        id: 'root_walker',
        name: 'Root Walker',
        description: 'Start with Withering Hex and +30% Damage',
        weapon: 'lightning_mark',
        passive: 'damage',
        unlockCost: 750
    },
    {
        id: 'spore_mage',
        name: 'Spore Mage',
        description: 'Start with Spore Swarm and +40% Root Range',
        weapon: 'spore_swarm',
        passive: 'magnet',
        unlockCost: 750
    }
];

export const DAMAGE_NUMBERS = {
    LIFETIME: 0.6,
    RISE_SPEED: -80,
    GRAVITY: 40,
    FONT_SIZE: 20,
    CRIT_THRESHOLD: 20,
    CRIT_COLOR: '#b8d94e',
    DEFAULT_COLOR: '#fff'
};

export const UI = {
    HP_BAR_WIDTH: 200,
    HP_BAR_HEIGHT: 24,
    XP_BAR_WIDTH: 200,
    XP_BAR_HEIGHT: 16,
    PLAYER_BAR_WIDTH: 60,
    PLAYER_BAR_HEIGHT: 8,
    PLAYER_BAR_OFFSET_Y: 16,
    PADDING: 20,
    HP_COLOR_HIGH: '#7c9a6e',
    HP_COLOR_MED: '#c4a23a',
    HP_COLOR_LOW: '#8b3a62',
    XP_COLOR: '#5a8f7c',
    BG_COLOR: '#1a1a1e',
    TEXT_COLOR: '#e8e4dc',
    SUBTEXT_COLOR: '#9a9688',
    HINT_COLOR: 'rgba(232,228,220,0.4)',
    CARD_BG: '#2a2a2e',
    CARD_BORDER: '#3a3a3e',
    CARD_HIGHLIGHT: '#b8d94e',
    PASSIVE_ICON_SIZE: 32,
    PASSIVE_ICON_GAP: 8,
    ANNOUNCE_DURATION: 3.0
};

export const SCREEN_SHAKE = {
    DAMAGE_INTENSITY: 5,
    DAMAGE_DURATION: 0.12
};

export const BOSS_TYPES = [
    {
        id: 'crowned_knight',
        bodyColor1: '#6c3483',
        bodyColor2: '#8e44ad',
        bodyColor3: '#5b2c6f',
        accentColor: '#f1c40f',
        eyeColor: '#e74c3c',
        auraColor: '142, 68, 173',
        headShape: 'helmet',
        hasCrown: true,
        hasHorns: true
    },
    {
        id: 'spore_giant',
        bodyColor1: '#27ae60',
        bodyColor2: '#1e8449',
        bodyColor3: '#196f3d',
        accentColor: '#82e0aa',
        eyeColor: '#f1c40f',
        auraColor: '39, 174, 96',
        headShape: 'dome',
        hasCrown: false,
        hasHorns: false,
        hasSporePuffs: true,
        hasTendrils: true
    },
    {
        id: 'bark_titan',
        bodyColor1: '#784212',
        bodyColor2: '#935116',
        bodyColor3: '#5b2c0f',
        accentColor: '#27ae60',
        eyeColor: '#2ecc71',
        auraColor: '120, 66, 18',
        headShape: 'flat',
        hasCrown: false,
        hasHorns: false,
        hasBarkPlates: true,
        hasVines: true
    },
    {
        id: 'dread_wraith',
        bodyColor1: '#1a1a2e',
        bodyColor2: '#16213e',
        bodyColor3: '#0f0f23',
        accentColor: '#e74c3c',
        eyeColor: '#e74c3c',
        auraColor: '231, 76, 60',
        headShape: 'skull',
        hasCrown: false,
        hasHorns: true,
        isEthereal: true,
        hasSoulFlame: true
    }
];

export const BOSS = {
    BASE_HP: 400,
    SPEED: 42,
    DAMAGE: 25,
    COLLISION_RADIUS: 50,
    VISUAL_SIZE: 200,
    SPAWN_INTERVAL: 90,
    HP_SCALE_PER_BOSS: 1.4,
    ANNOUNCE_DURATION: 3.0,
    HP_BAR_WIDTH: 600,
    HP_BAR_HEIGHT: 24,
    HP_BAR_Y: 40,
    COLOR: '#5a8f7c',
    BODY_COLOR: '#3d6b52',
    EYE_COLOR: '#b8d94e',
    CROWN_COLOR: '#c4a23a',
    MAX_BOSS_COUNT: 1
};

export const CHEST = {
    SIZE: 40,
    PICKUP_RADIUS: 50,
    BOB_SPEED: 2,
    BOB_HEIGHT: 4,
    COLOR: '#c4a23a',
    DARK_COLOR: '#a08020',
    LOCK_COLOR: '#8b3a62',
    GLOW_COLOR: 'rgba(196, 162, 58, 0.3)',
    GLOW_RADIUS: 70,
    COINS_MIN: 8,
    COINS_MAX: 20,
    HEAL_AMOUNT: 40,
    ANIM_SHAKE_DURATION: 0.5,
    ANIM_BURST_DURATION: 0.4,
    ANIM_REVEAL_DURATION: 0.6,
    ANIM_TOTAL_DURATION: 1.5
};

export const COLORS = {
    PROJECTILE_OUTER: '#b8d94e',
    PROJECTILE_INNER: '#e8f8c0',
    ENEMY_HP_BAR_BG: '#2a2a2e',
    ENEMY_HP_BAR_FG: '#8b3a62',
    BOSS_HP_BAR_BG: '#141416',
    BOSS_HP_BAR_FG: '#8b3a62',
    BOSS_HP_BAR_BORDER: '#c4a23a',
    BOSS_HP_BAR_NAME_COLOR: '#c4a23a'
};

export const COINS = {
    DROP_CHANCE: 0.50,
    BOSS_DROP: 25,
    VALUE_PER_TYPE: {
        spore: 1,
        wisp: 2,
        barkfell: 5,
        rootcrawler: 3,
        revenant: 8
    },
    HUD_COLOR: '#c4a23a',
    POPUP_COLOR: '#b8d94e'
};

export const SHOP_UPGRADES = {
    maxhp: {
        name: 'Vitality',
        description: '+5 Max HP per level',
        icon: '\u2764\uFE0F',
        color: '#8b3a62',
        baseCost: 50,
        costMultiplier: 1.8,
        maxLevel: 10,
        effect: (lvl) => ({ maxHpBonus: lvl * 5 })
    },
    damage: {
        name: 'Wrath',
        description: '+5% Damage per level',
        icon: '\u2694\uFE0F',
        color: '#8b3a62',
        baseCost: 75,
        costMultiplier: 2.0,
        maxLevel: 10,
        effect: (lvl) => ({ damageMulti: 1 + lvl * 0.05 })
    },
    movespeed: {
        name: 'Swiftness',
        description: '+3% Move Speed per level',
        icon: '\uD83D\uDCA8',
        color: '#5a8f7c',
        baseCost: 60,
        costMultiplier: 1.9,
        maxLevel: 10,
        effect: (lvl) => ({ speedMulti: 1 + lvl * 0.03 })
    },
    xpgain: {
        name: 'Insight',
        description: '+5% XP Gain per level',
        icon: '\uD83D\uDCD8',
        color: '#7b5ea7',
        baseCost: 80,
        costMultiplier: 2.0,
        maxLevel: 10,
        effect: (lvl) => ({ xpMulti: 1 + lvl * 0.05 })
    },
    pickrange: {
        name: 'Magnetism',
        description: '+5% Pickup Range per level',
        icon: '\uD83D\uDD2E',
        color: '#7b5ea7',
        baseCost: 40,
        costMultiplier: 1.7,
        maxLevel: 10,
        effect: (lvl) => ({ pickupMulti: 1 + lvl * 0.05 })
    },
    startcoins: {
        name: 'Fortune',
        description: '+10 Starting Coins per level',
        icon: '\uD83D\uDCB0',
        color: '#c4a23a',
        baseCost: 100,
        costMultiplier: 2.5,
        maxLevel: 5,
        effect: (lvl) => ({ startCoins: lvl * 10 })
    },
    thorns: {
        name: 'Thorn Guard',
        description: 'Enemies take damage when they hit you',
        icon: '\uD83C\uDF39',
        color: '#8b3a62',
        baseCost: 400,
        costMultiplier: 1.6,
        maxLevel: 3,
        apply: (player, lvl) => { player.thornsDamage = lvl * 10; }
    }
};
