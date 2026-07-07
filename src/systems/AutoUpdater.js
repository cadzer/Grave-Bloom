const GITHUB_TOKEN = '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';

export class AutoUpdater {
    constructor() {
        this.downloading = false;
        this.progress = 0;
        this.error = null;
        this.status = 'idle';
    }

    _isNwjs() {
        return typeof nw !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.nw;
    }

    async startUpdate(zipUrl, latestVersion) {
        if (this.downloading) return;
        if (!this._isNwjs()) {
            this.status = 'error';
            this.error = 'Auto-update only available in desktop version';
            return;
        }
        this.downloading = true;
        this.status = 'downloading';
        this.progress = 0;
        this.error = null;

        try {
            const fs = require('fs');
            const path = require('path');
            const { spawn } = require('child_process');
            const https = require('https');
            const os = require('os');

            const installDir = (typeof nw !== 'undefined' && nw.App && nw.App.startPath) || process.cwd();
            const tempDir = path.join(os.tmpdir(), 'GraveBloom_Update');
            const zipPath = path.join(tempDir, `GraveBloom-v${latestVersion}.zip`);
            const extractDir = path.join(tempDir, `extract_v${latestVersion}`);

            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            await this._downloadFile(fs, https, zipUrl, zipPath);

            this.status = 'extracting';
            if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
            fs.mkdirSync(extractDir, { recursive: true });

            const psExtract = `powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`;
            const vbsExtract = this._createVbsScript(psExtract);
            const vbsExtractPath = path.join(tempDir, 'extract.vbs');
            fs.writeFileSync(vbsExtractPath, vbsExtract, 'utf-8');
            await this._runHidden(fs, spawn, vbsExtractPath);

            const gameDir = path.join(extractDir, 'GraveBloom');
            const srcDir = fs.existsSync(gameDir) ? gameDir : extractDir;

            this.status = 'installing';
            const processName = path.basename(process.execPath);
            const batchContent = this._createBatchScript(srcDir, installDir, latestVersion, processName);
            const batchPath = path.join(tempDir, 'update.bat');
            fs.writeFileSync(batchPath, batchContent, 'utf-8');

            const vbsUpdate = this._createVbsScript(`cmd /c "${batchPath}"`);
            const vbsUpdatePath = path.join(tempDir, 'update.vbs');
            fs.writeFileSync(vbsUpdatePath, vbsUpdate, 'utf-8');
            spawn('wscript.exe', [vbsUpdatePath], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true
            }).unref();

            this.status = 'restarting';
            const procName = path.basename(process.execPath);
            setTimeout(() => {
                try { nw.Window.get().close(true); } catch(e) {}
                setTimeout(() => {
                    try { require('child_process').execSync('taskkill /F /IM "' + procName + '"', { stdio: 'ignore' }); } catch(e) {}
                    setTimeout(() => {
                        try { process.exit(); } catch(e) {}
                    }, 200);
                }, 500);
            }, 500);

        } catch (e) {
            this.downloading = false;
            this.status = 'error';
            this.error = e.message || 'Update failed';
        }
    }

    _createVbsScript(command) {
        const safeCmd = command.replace(/"/g, '""');
        return `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "${safeCmd}", 0, True
Set WshShell = Nothing`;
    }

    _runHidden(fs, spawn, scriptPath) {
        return new Promise((resolve, reject) => {
            const proc = spawn('wscript.exe', [scriptPath], {
                stdio: 'ignore',
                windowsHide: true
            });
            proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Script exited with code ${code}`));
            });
            proc.on('error', reject);
        });
    }

    _downloadFile(fs, https, url, dest) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            const request = (downloadUrl) => {
                const headers = { 'User-Agent': 'GraveBloom-Updater' };
                if (GITHUB_TOKEN && GITHUB_TOKEN !== 'YOUR_TOKEN_HERE') {
                    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
                }
                https.get(downloadUrl, { headers }, (response) => {
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        request(response.headers.location);
                        return;
                    }
                    if (response.statusCode !== 200) {
                        reject(new Error(`Download failed: HTTP ${response.statusCode}`));
                        return;
                    }
                    const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
                    let downloaded = 0;
                    response.on('data', (chunk) => {
                        downloaded += chunk.length;
                        this.progress = totalBytes > 0 ? Math.round((downloaded / totalBytes) * 100) : 0;
                    });
                    response.pipe(file);
                    file.on('finish', () => { file.close(resolve); });
                    file.on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
                }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
            };
            request(url);
        });
    }

    _createBatchScript(srcDir, installDir, version, processName) {
        const safeSrc = srcDir.replace(/"/g, '""');
        const safeDst = installDir.replace(/"/g, '""');
        const safeProcess = processName.replace(/"/g, '""');
        return `@echo off
title Grave Bloom Updater
echo Waiting for game to close...
:wait_loop
timeout /t 1 /nobreak >nul
tasklist /FI "IMAGENAME eq ${safeProcess}" 2>nul | find /I "${safeProcess}" >nul
if %errorlevel%==0 goto wait_loop
xcopy "${safeSrc}\\*" "${safeDst}\\" /E /Y /Q >nul
start "" "${safeDst}\\GraveBloom.exe"
rmdir /s /q "%TEMP%\\GraveBloom_Update" 2>nul
`;
    }
}
