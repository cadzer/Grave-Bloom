const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(__dirname, 'dist');
const BUILD_GAME = path.join(ROOT, 'build', 'GraveBloom');
const NSIS = path.join(__dirname, 'nsis', 'nsis-3.10', 'Bin', 'makensis.exe');
const BUILD_OUT = path.join(ROOT, 'build');

console.log('=== Building Grave Bloom Installer ===\n');

// Step 1: Build the game first
console.log('1. Building game (NW.js)...');
try {
    execSync(`node "${path.join(ROOT, 'build.js')}"`, { stdio: 'inherit', cwd: ROOT });
} catch {
    console.error('Game build failed!');
    process.exit(1);
}

// Step 2: Check that build output exists
if (!fs.existsSync(path.join(BUILD_GAME, 'GraveBloom.exe'))) {
    console.error('build/GraveBloom/GraveBloom.exe not found! Build may have failed.');
    process.exit(1);
}

// Step 3: Clean and populate dist
console.log('\n2. Preparing installer files...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
        const s = path.join(src, item);
        const d = path.join(dest, item);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}
copyDir(BUILD_GAME, DIST);

// Step 4: Build installer with NSIS
console.log('\n3. Building installer with NSIS...');
fs.mkdirSync(BUILD_OUT, { recursive: true });

try {
    execSync(`"${NSIS}" "${path.join(__dirname, 'installer.nsi')}"`, {
        stdio: 'inherit',
        cwd: __dirname
    });
    console.log(`\n4. Installer built: ${path.join(BUILD_OUT, 'GraveBloom-Setup.exe')}`);
} catch (e) {
    console.error('NSIS build failed:', e.message);
    process.exit(1);
} finally {
    // Cleanup dist
    // if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
}

console.log('\nDone!');
