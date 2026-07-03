const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BUILD_DIR = path.join(__dirname, 'build');
const CACHE_DIR = path.join(__dirname, 'cache');
const NW_VERSION = '0.83.0';
const NW_URL = `https://dl.nwjs.io/v${NW_VERSION}/nwjs-sdk-v${NW_VERSION}-win-x64.zip`;
const ZIP_FILE = path.join(CACHE_DIR, `nw-v${NW_VERSION}-win-x64.zip`);

console.log('=== Grave Bloom Build Script ===\n');

// Clean previous build
if (fs.existsSync(BUILD_DIR)) {
    console.log('Cleaning previous build...');
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });
fs.mkdirSync(CACHE_DIR, { recursive: true });

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log('  Using cached NW.js SDK');
            return resolve();
        }
        console.log(`  Downloading: ${url}`);
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                file.close();
                fs.unlinkSync(dest);
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            const total = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;
            response.on('data', (chunk) => {
                downloaded += chunk.length;
                const pct = ((downloaded / total) * 100).toFixed(0);
                process.stdout.write(`\r  Progress: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)}MB)`);
            });
            response.pipe(file);
            file.on('finish', () => { file.close(); console.log('\n  Download complete.'); resolve(); });
        }).on('error', (err) => { fs.unlinkSync(dest); reject(err); });
    });
}

(async () => {
    try {
        // Step 1: Download NW.js SDK
        console.log('Step 1: Getting NW.js SDK...');
        await download(NW_URL, ZIP_FILE);

        // Step 2: Extract
        console.log('\nStep 2: Extracting...');
        const extractDir = path.join(CACHE_DIR, `nwjs-sdk-v${NW_VERSION}-win-x64`);
        if (!fs.existsSync(extractDir)) {
            execSync(`powershell -Command "Expand-Archive -Path '${ZIP_FILE}' -DestinationPath '${CACHE_DIR}' -Force"`, { stdio: 'inherit' });
        }

        // Step 3: Copy NW.js runtime to build
        console.log('\nStep 3: Packaging...');
        const runtimeDir = path.join(BUILD_DIR, 'GraveBloom');
        fs.cpSync(extractDir, runtimeDir, { recursive: true });

        // Step 4: Copy game files
        console.log('Step 4: Copying game files...');
        const filesToCopy = ['index.html', 'styles.css', 'icon.png', 'icon.ico'];
        for (const f of filesToCopy) {
            const src = path.join(__dirname, f);
            if (fs.existsSync(src)) fs.copyFileSync(src, path.join(runtimeDir, f));
        }
        fs.cpSync(path.join(__dirname, 'src'), path.join(runtimeDir, 'src'), { recursive: true });

        // Step 5: Create package.json for NW.js runtime
        const nwPackage = {
            name: 'GraveBloom',
            main: 'index.html',
            window: {
                title: 'Grave Bloom',
                icon: 'icon.png',
                width: 1280,
                height: 720,
                min_width: 800,
                min_height: 450,
                resizable: true,
                fullscreen: false,
                position: 'center'
            },
            'chromium-args': '--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist'
        };
        fs.writeFileSync(
            path.join(runtimeDir, 'package.json'),
            JSON.stringify(nwPackage, null, 2)
        );

        const exePath = path.join(runtimeDir, 'nw.exe');
        const gameExe = path.join(runtimeDir, 'GraveBloom.exe');

        // Rename nw.exe -> GraveBloom.exe
        if (fs.existsSync(exePath)) {
            fs.renameSync(exePath, gameExe);
        }

        // Step 6: Set .exe icon
        console.log('Step 6: Setting .exe icon...');
        const rceditPath = path.join(CACHE_DIR, 'rcedit.exe');
        if (!fs.existsSync(rceditPath)) {
            const rceditUrl = 'https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe';
            try {
                await download(rceditUrl, rceditPath);
            } catch {
                console.log('  Could not download rcedit, skipping .exe icon (window icon still works)');
            }
        }
        if (fs.existsSync(rceditPath) && fs.existsSync(path.join(runtimeDir, 'icon.ico'))) {
            try {
                execSync(`"${rceditPath}" --set-icon "${path.join(runtimeDir, 'icon.ico')}" "${gameExe}"`, { stdio: 'pipe' });
                console.log('  .exe icon set successfully');
            } catch {
                console.log('  Could not set .exe icon (window icon still works)');
            }
        }

        // Step 7: Create launcher batch file
        fs.writeFileSync(
            path.join(runtimeDir, 'Launch Grave Bloom.bat'),
            '@echo off\nstart "" "%~dp0GraveBloom.exe" "%~dp0"\n'
        );

        // Step 8: Build installer exe
        console.log('\nStep 8: Building installer...');
        const installerDir = path.join(__dirname, 'installer');
        if (fs.existsSync(path.join(installerDir, 'install.js'))) {
            try {
                execSync(`cd "${installerDir}" && npx pkg . --targets node18-win-x64 --output "${path.join(BUILD_DIR, 'GraveBloom-Installer.exe')}"`, { stdio: 'pipe' });
                console.log('  Installer built: build/GraveBloom-Installer.exe');
            } catch {
                console.log('  Could not build installer exe (pkg not available)');
                console.log('  To build manually: cd installer && npm run build');
            }
        }

        // Step 9: Create release zip for GitHub
        console.log('\nStep 9: Creating release zip...');
        const zipPath = path.join(BUILD_DIR, `GraveBloom-v${require('./package.json').version}.zip`);
        try {
            execSync(`powershell -Command "Compress-Archive -Path '${runtimeDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'pipe' });
            console.log(`  Release zip: ${zipPath}`);
        } catch {
            console.log('  Could not create release zip');
        }

        console.log('\n========================================');
        console.log('BUILD SUCCESS!');
        console.log(`Output: ${runtimeDir}`);
        console.log('');
        console.log('To run:');
        console.log('  - Double-click GraveBloom.exe');
        console.log('  - Or run Launch Grave Bloom.bat');
        console.log('');
        console.log('Installer:');
        console.log('  - build/GraveBloom-Installer.exe (if pkg is installed)');
        console.log('');
        console.log('To rebuild after edits: npm run build');
        console.log('========================================');

    } catch (err) {
        console.error('\nBUILD FAILED:', err.message || err);
        process.exit(1);
    }
})();
