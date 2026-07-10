import { VERSION, GITHUB_REPO } from '../config/GameConfig.js';

function _loadToken() {
    try {
        const fs = require('fs');
        const path = require('path');
        const p = path.join(process.cwd(), 'secrets.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')).githubToken || '';
    } catch(e) {}
    return '';
}
const GITHUB_TOKEN = _loadToken();

export class UpdateChecker {
    constructor() {
        this.currentVersion = VERSION;
        this.latestVersion = null;
        this.updateUrl = null;
        this.zipAssetUrl = null;
        this.updateAvailable = false;
        this.checking = false;
        this.checked = false;
        this.error = false;
    }

    async checkForUpdates() {
        if (this.checked || this.checking) return;
        if (!GITHUB_REPO || GITHUB_REPO.includes('username')) {
            this.checked = true;
            return;
        }

        this.checking = true;
        try {
            const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
            const headers = { 'User-Agent': 'GraveBloom-Updater' };
            if (GITHUB_TOKEN) {
                headers['Authorization'] = `token ${GITHUB_TOKEN}`;
            }
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.latestVersion = data.tag_name?.replace(/^v/, '') || null;
            this.updateUrl = data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;

            const zipAsset = (data.assets || []).find(a => a.name.endsWith('.zip'));
            this.zipAssetUrl = zipAsset ? zipAsset.browser_download_url : null;

            if (this.latestVersion) {
                this.updateAvailable = this._isNewer(this.latestVersion, this.currentVersion);
            }
        } catch (e) {
            this.error = true;
        } finally {
            this.checking = false;
            this.checked = true;
        }
    }

    _isNewer(latest, current) {
        const l = latest.split('.').map(Number);
        const c = current.split('.').map(Number);
        for (let i = 0; i < Math.max(l.length, c.length); i++) {
            const lv = l[i] || 0;
            const cv = c[i] || 0;
            if (lv > cv) return true;
            if (lv < cv) return false;
        }
        return false;
    }

    getStatus() {
        if (this.checking) return 'checking';
        if (this.error) return 'error';
        if (this.updateAvailable) return 'update';
        if (this.checked) return 'latest';
        return 'idle';
    }
}
