const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const GITHUB_REPO = 'cadzer/Grave-Bloom';
const GAME_NAME = 'Grave Bloom';
const EXE_NAME = 'GraveBloom.exe';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const doRequest = (u) => {
            https.get(u, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    res.resume();
                    return doRequest(res.headers.location);
                }
                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                const total = parseInt(res.headers['content-length'] || '0', 10);
                let downloaded = 0;
                const file = fs.createWriteStream(dest);
                res.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (total > 0) {
                        const pct = ((downloaded / total) * 100).toFixed(0);
                        process.stdout.write(`\r  Downloading: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)}MB)`);
                    }
                });
                res.pipe(file);
                file.on('finish', () => { file.close(); console.log(''); resolve(); });
            }).on('error', reject);
        };
        doRequest(url);
    });
}

function createShortcut(targetPath, shortcutPath, iconPath) {
    const ps = `New-Object -ComObject WScript.Shell | ForEach-Object {
        $s = $_.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
        $s.TargetPath = '${targetPath.replace(/'/g, "''")}'
        $s.WorkingDirectory = '${path.dirname(targetPath).replace(/'/g, "''")}'
        ${iconPath ? `$s.IconLocation = '${iconPath.replace(/'/g, "''")}'` : ''}
        $s.Save()
    }`;
    execSync(`powershell -Command "${ps}"`, { stdio: 'pipe' });
}

(async () => {
    console.log('');
    console.log('  ==============================');
    console.log(`  ${GAME_NAME} Installer`);
    console.log('  ==============================');
    console.log('');

    // Check for GitHub CLI or fall back to API
    let latestRelease;
    try {
        console.log('Checking for latest release...');
        const data = await new Promise((resolve, reject) => {
            const req = https.get(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
                headers: { 'User-Agent': 'GraveBloom-Installer' }
            }, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    if (res.statusCode !== 200) reject(new Error(`GitHub API: ${res.statusCode}`));
                    else resolve(JSON.parse(body));
                });
            });
            req.on('error', reject);
        });
        latestRelease = data;
        console.log(`  Latest version: ${data.tag_name}`);
        console.log(`  Release: ${data.name || data.tag_name}`);
    } catch (e) {
        console.log(`  Could not check for updates: ${e.message}`);
        console.log('  Proceeding with manual download URL.');
        console.log('');
    }

    // Find the zip asset
    let zipAsset = null;
    if (latestRelease && latestRelease.assets) {
        zipAsset = latestRelease.assets.find(a => a.name.endsWith('.zip'));
    }

    // Ask install location
    console.log('');
    const defaultDir = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE, GAME_NAME);
    const installDir = (await ask(`  Install location [${defaultDir}]: `)).trim() || defaultDir;
    console.log(`  Installing to: ${installDir}`);
    console.log('');

    // Download
    if (zipAsset) {
        console.log(`  Downloading ${zipAsset.name}...`);
        const zipPath = path.join(installDir, '_temp.zip');
        fs.mkdirSync(installDir, { recursive: true });
        await download(zipAsset.browser_download_url, zipPath);

        console.log('  Extracting...');
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${installDir}' -Force"`, { stdio: 'pipe' });
        fs.unlinkSync(zipPath);
    } else {
        console.log('  No automatic download available.');
        console.log(`  Please download the game from:`);
        console.log(`  https://github.com/${GITHUB_REPO}/releases`);
        console.log('');
        console.log(`  Extract the zip to: ${installDir}`);
        console.log('');
        await ask('  Press Enter after extracting...');
    }

    // Find the exe
    let gameExe = path.join(installDir, EXE_NAME);
    if (!fs.existsSync(gameExe)) {
        // Search in subdirectories
        const dirs = fs.readdirSync(installDir).filter(d => fs.statSync(path.join(installDir, d)).isDirectory());
        for (const d of dirs) {
            const candidate = path.join(installDir, d, EXE_NAME);
            if (fs.existsSync(candidate)) {
                gameExe = candidate;
                break;
            }
        }
    }

    // Create desktop shortcut
    console.log('');
    try {
        const desktop = path.join(process.env.USERPROFILE || process.env.HOMEPROFILE, 'Desktop');
        const shortcutPath = path.join(desktop, `${GAME_NAME}.lnk`);
        createShortcut(gameExe, shortcutPath, gameExe);
        console.log(`  Desktop shortcut created!`);
    } catch (e) {
        console.log(`  Could not create desktop shortcut: ${e.message}`);
    }

    // Create start menu shortcut
    try {
        const startMenu = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', GAME_NAME);
        fs.mkdirSync(startMenu, { recursive: true });
        const shortcutPath = path.join(startMenu, `${GAME_NAME}.lnk`);
        createShortcut(gameExe, shortcutPath, gameExe);
        console.log(`  Start menu shortcut created!`);
    } catch (e) {
        console.log(`  Could not create start menu shortcut: ${e.message}`);
    }

    console.log('');
    console.log('  ==============================');
    console.log(`  Installation complete!`);
    console.log(`  ${GAME_NAME} installed to:`);
    console.log(`  ${installDir}`);
    console.log('  ==============================');
    console.log('');

    const launchNow = (await ask('  Launch the game now? [Y/n]: ')).trim().toLowerCase();
    if (launchNow !== 'n' && fs.existsSync(gameExe)) {
        execSync(`start "" "${gameExe}"`, { stdio: 'pipe' });
    }

    rl.close();
})().catch(e => {
    console.error('\n  Installation failed:', e.message);
    rl.close();
    process.exit(1);
});
