<div align="center">

# Grave Bloom

### Tend the garden. Hold back the Blight.

<img src="https://i.imgur.com/QKHMWm9.png" width="600">

[![Download](https://img.shields.io/badge/Download-GraveBloom--Setup.exe-brightgreen?style=for-the-badge&logo=windows)](https://github.com/cadzer/Grave-Bloom/releases/latest)
![Version](https://img.shields.io/badge/version-1.2.1-blue?style=for-the-badge)

</div>

---

A survivor-style action game where you play as a **Bloomkeeper** — a lone guardian defending your garden against endless waves of corrupted creatures. Auto-attack, level up, evolve your weapons, and survive the Blight.

## Features

- **9 Unique Characters** — Each with their own stats, playstyle, and procedural art. From the balanced Bloomkeeper to the glass-cannon Ember Wraith.
- **5 Weapons with Evolutions** — Arcane Bolt, Orbiting Blade, Holy Pulse, Lightning Mark, and Spore Swarm — each evolves into a devastating ultimate form.
- **6 Passive Upgrades** — Stack your power with Ironheart, Spellbook, Power Stone, Clover Coin, Magnet Charm, and more.
- **Boss Fights** — Massive bosses spawn every 90 seconds with scaling HP, distinct visual types, and entrance cinematics.
- **Permanent Progression** — Earn coins, unlock upgrades in the Bloomkeeper's Sanctum, and carry your power between runs.
- **Weapon Synergies** — Combine weapons for bonus effects. Discover all 4 synergies.
- **16 Achievements** — Test your skill with challenging unlockable milestones.
- **Dynamic Visuals** — Screen shake, hit-stop, vignette, bloom, ambient particles, biome themes, and procedural entity art.
- **Biome Variety** — Fight through Grave Garden, Dead Forest, and Ash Wastes — each with unique atmosphere and enemies.

## Controls

| Key | Action |
|-----|--------|
| `WASD` / `Arrow Keys` | Move |
| `ESC` | Pause |
| `M` | Mute / Unmute |
| `R` | Restart (Game Over) |
| `1` `2` `3` | Select upgrade (Level Up) |

> Combat is **auto-attack** — your weapons fire automatically. Focus on movement and positioning!

## How to Play

1. **Move** through the map to dodge enemies.
2. **Kill enemies** to collect XP gems.
3. **Level up** to choose weapon upgrades and passive items.
4. **Collect coins** from fallen enemies to spend in the Sanctum.
5. **Survive** as long as you can against increasingly difficult waves.
6. **Evolve** your weapons at Level 8 when paired with the right passive.

## Enemies

| Enemy | Behavior |
|-------|----------|
| Spore | Basic creep, weak but numerous |
| Wisp | Fast and evasive |
| Rootcrawler | Tanky with dash attack |
| Barkfell | Heavy hitter with armor |
| Leech | Heals nearby enemies |
| Hive | Splits into larvae on death |
| Warden | Shields nearby allies |
| Mimic | Disguised as XP gems |
| Revenant | Mini-boss with sword and shield |

## Download

Grab the latest release from the [Releases page](https://github.com/cadzer/Grave-Bloom/releases/latest):

- **GraveBloom-Setup.exe** — NSIS installer with desktop shortcut
- **GraveBloom-v1.2.1.zip** — Portable zip (extract and run)

## Changelog

### v1.2.1
- **Boss Intro Camera** — Camera smoothly pans to boss spawn location with cinematic banner, freezing gameplay for 2.5s
- **Menu Backgrounds** — Shop, Achievements, and Tutorial screens now use the graveyard menu background with blur overlay
- **Exit Confirmation** — Menu blur + hover disabled when quit confirmation dialog is open
- **Debug Password** — Menu blur + hover disabled when debug password dialog is open
- **Pause Menu** — ESC opens pause with Resume, Settings, Main Menu; confirmation dialog for quitting
- **Loadout Back Button** — Consistent hover animation matching character select screen
- **Tutorial Updates** — Arrow key diagram, emoji weapon icons matching in-game, updated enemy spawn times, evolution icons with Blight Plague
- **Level-Up Card Fix** — Description text now word-wraps to fit inside card bounds
- **Save Reset** — Now clears achievements, run history, and locked loadouts
- **Potion Spawning** — Potions only spawn when below full health, reduced spawn rate
- **Balance** — Enemy HP doubled, late-game stages pushed to ~20 minutes
- **Performance** — Shadow blur removed from gameplay, batched particle rendering, optimized ambient effects

---

<div align="center">

Made with HTML5 Canvas & Vanilla JavaScript

</div>
