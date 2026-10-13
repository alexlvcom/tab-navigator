// Publishes the current version to Firefox Add-ons, the Chrome Web Store and GitHub Releases.
//
// Usage: node release/publish.js [firefox] [chrome] [github] [--dry-run] [--status]
// With no store names it publishes to all three. Each store is skipped when it already has the version.
// Credentials are read from ~/.config/tab-navigator/.env (see README "Releasing").

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = process.env.TAB_NAVIGATOR_ENV || path.join(os.homedir(), '.config', 'tab-navigator', '.env');
const ARTIFACTS = path.join(ROOT, 'web-ext-artifacts');
const AMO_API = 'https://addons.mozilla.org/api/v5';
const AMO_SLUG = 'tab-navigator';
const CWS_API = 'https://chromewebstore.googleapis.com';
const GITHUB_REPO = 'alexlvcom/tab-navigator';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const statusOnly = args.includes('--status');
const requested = args.filter(a => !a.startsWith('--'));
const stores = requested.length ? requested : ['firefox', 'chrome', 'github'];
for (const store of stores) {
    if (!['firefox', 'chrome', 'github'].includes(store)) fail(`Unknown store: ${store}`);
}

function fail(message) {
    console.error(`Error: ${message}`);
    process.exit(1);
}

function log(message) {
    console.log(`[release] ${message}`);
}

function run(cmd, cmdArgs, options = {}) {
    return execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', ...options });
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function loadEnv() {
    if (!fs.existsSync(ENV_FILE)) fail(`Credentials file not found: ${ENV_FILE}`);
    require('dotenv').config({ path: ENV_FILE });
    const env = {};
    for (const key of ['AMO_JWT_ISSUER', 'AMO_JWT_SECRET', 'CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID', 'CWS_SERVICE_ACCOUNT_KEY']) {
        env[key] = process.env[key];
    }
    env.CWS_SERVICE_ACCOUNT_KEY ||= path.join(path.dirname(ENV_FILE), 'chrome-service-account.json');
    return env;
}

function requireEnv(env, keys) {
    const missing = keys.filter(key => !env[key]);
    if (missing.length) fail(`Missing in ${ENV_FILE}: ${missing.join(', ')}`);
}

// Returns the bullet lists of the version's CHANGELOG section, without the Tests subsection.
function changelogNotes(version) {
    const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
    const start = changelog.indexOf(`## [${version}]`);
    if (start === -1) fail(`CHANGELOG.md has no section for ${version}`);
    const next = changelog.indexOf('\n## [', start + 1);
    const section = changelog.slice(start, next === -1 ? undefined : next);

    const groups = [];
    let current = null;
    for (const line of section.split('\n').slice(1)) {
        const heading = line.match(/^### (.+)/);
        if (heading) {
            current = { title: heading[1].trim(), items: [] };
            groups.push(current);
        } else if (current && line.startsWith('- ')) {
            current.items.push(line.slice(2).trim());
        }
    }
    const userFacing = groups.filter(g => g.title !== 'Tests' && g.items.length);
    if (!userFacing.length) fail(`CHANGELOG.md section ${version} has no release notes`);
    return userFacing;
}

function notesAsMarkdown(groups) {
    return groups.map(g => `**${g.title}**\n\n${g.items.map(i => `- ${i}`).join('\n')}`).join('\n\n');
}

function checkVersions() {
    const version = readJson('package.json').version;
    for (const browser of ['firefox', 'chrome']) {
        const manifestVersion = readJson(`src/${browser}/manifest.json`).version;
        if (manifestVersion !== version) {
            fail(`src/${browser}/manifest.json has version ${manifestVersion}, package.json has ${version}`);
        }
    }
    changelogNotes(version);
    return version;
}

function amoToken(env) {
    const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
        iss: env.AMO_JWT_ISSUER, jti: crypto.randomUUID(), iat: now, exp: now + 60,
    })}`;
    const signature = crypto.createHmac('sha256', env.AMO_JWT_SECRET).update(unsigned).digest('base64url');
    return `${unsigned}.${signature}`;
}

async function amoVersion(env, version) {
    const response = await fetch(`${AMO_API}/addons/addon/${AMO_SLUG}/versions/${version}/`, {
        headers: { Authorization: `JWT ${amoToken(env)}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) fail(`AMO version lookup failed: ${response.status} ${await response.text()}`);
    return response.json();
}

async function publishFirefox(env, version) {
    requireEnv(env, ['AMO_JWT_ISSUER', 'AMO_JWT_SECRET']);
    const existing = await amoVersion(env, version);
    if (existing) {
        log(`Firefox: ${version} is already on AMO (${existing.channel}, ${existing.file.status}).`);
        return;
    }
    if (statusOnly) {
        log(`Firefox: ${version} is not on AMO yet.`);
        return;
    }

    const metadata = {
        version: {
            release_notes: { 'en-US': notesAsMarkdown(changelogNotes(version)) },
            approval_notes: fs.readFileSync(path.join(__dirname, 'amo-reviewer-notes.txt'), 'utf8')
                .replaceAll('{version}', version).trim(),
        },
    };
    const metadataFile = path.join(os.tmpdir(), `tab-navigator-amo-${version}.json`);
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    if (dryRun) {
        log(`Firefox: would sign ${version} on the listed channel with metadata:\n${JSON.stringify(metadata, null, 2)}`);
        return;
    }
    log(`Firefox: uploading ${version} to the listed channel.`);
    // --channel=listed is required. Without it the version is signed for self-distribution and never appears on AMO.
    run('npx', [
        'web-ext', 'sign', '--channel=listed', '--source-dir', 'dist/firefox', '--artifacts-dir', 'web-ext-artifacts',
        '--amo-metadata', metadataFile, '--approval-timeout', '0',
        '--api-key', env.AMO_JWT_ISSUER, '--api-secret', env.AMO_JWT_SECRET,
    ]);
    log(`Firefox: submitted. Review status: https://addons.mozilla.org/en-US/developers/addon/${AMO_SLUG}/versions`);
}

async function chromeToken(env) {
    const key = JSON.parse(fs.readFileSync(env.CWS_SERVICE_ACCOUNT_KEY, 'utf8'));
    const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/chromewebstore',
        aud: key.token_uri,
        iat: now,
        exp: now + 3600,
    })}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), key.private_key).toString('base64url');
    const response = await fetch(key.token_uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${unsigned}.${signature}`,
        }),
    });
    const body = await response.json();
    if (!response.ok) fail(`Google token request failed: ${JSON.stringify(body)}`);
    return body.access_token;
}

async function chromeRequest(env, token, method, url, body) {
    const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
        duplex: body ? 'half' : undefined,
    });
    const text = await response.text();
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch {
        json = { raw: text };
    }
    if (!response.ok) fail(`Chrome Web Store ${method} ${url} failed: ${response.status} ${text}`);
    return json;
}

async function publishChrome(env, version) {
    requireEnv(env, ['CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID', 'CWS_SERVICE_ACCOUNT_KEY']);
    const item = `publishers/${env.CWS_PUBLISHER_ID}/items/${env.CWS_EXTENSION_ID}`;
    const token = await chromeToken(env);

    const status = await chromeRequest(env, token, 'GET', `${CWS_API}/v2/${item}:fetchStatus`);
    const revisions = { published: status.publishedItemRevisionStatus, submitted: status.submittedItemRevisionStatus };
    for (const [name, revision] of Object.entries(revisions)) {
        if (revision) {
            const versions = (revision.distributionChannels || []).map(c => c.crxVersion).join(', ');
            log(`Chrome: ${name} revision ${versions || '?'} is ${revision.state}.`);
        }
    }
    if (statusOnly) return;
    const hasVersion = revision => (revision?.distributionChannels || []).some(c => c.crxVersion === version);
    if (hasVersion(revisions.published) || hasVersion(revisions.submitted)) {
        log(`Chrome: ${version} is already published or in review. Nothing to do.`);
        return;
    }

    const zip = path.join(ARTIFACTS, `chrome_tab_navigator-${version}.zip`);
    if (dryRun) {
        log(`Chrome: would upload ${zip} and submit it for review.`);
        return;
    }
    log(`Chrome: uploading ${path.basename(zip)}.`);
    let upload = await chromeRequest(env, token, 'POST', `${CWS_API}/upload/v2/${item}:upload`, fs.readFileSync(zip));
    for (let i = 0; upload.uploadState === 'UPLOAD_IN_PROGRESS' && i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        upload = await chromeRequest(env, token, 'GET', `${CWS_API}/v2/${item}:fetchStatus`);
    }
    log(`Chrome: upload result ${JSON.stringify(upload)}`);
    if (upload.uploadState && upload.uploadState !== 'SUCCEEDED') fail('Chrome upload did not succeed.');

    const published = await chromeRequest(env, token, 'POST', `${CWS_API}/v2/${item}:publish`);
    log(`Chrome: submitted for review ${JSON.stringify(published)}`);
}

function publishGithub(version) {
    try {
        execFileSync('gh', ['release', 'view', version, '-R', GITHUB_REPO], { stdio: 'ignore' });
        log(`GitHub: release ${version} already exists.`);
        return;
    } catch {
        // The release does not exist yet.
    }
    if (statusOnly) {
        log(`GitHub: release ${version} does not exist yet.`);
        return;
    }

    const notes = notesAsMarkdown(changelogNotes(version)).replaceAll(/^\*\*(.+)\*\*$/gm, '### $1');
    const assets = [
        path.join(ARTIFACTS, `firefox_tab_navigator-${version}.zip`),
        path.join(ARTIFACTS, `chrome_tab_navigator-${version}.zip`),
        path.join(ROOT, 'integrations', 'autohotkey', 'ChromeOpenInFirefox.ahk'),
    ];
    if (dryRun) {
        log(`GitHub: would create release ${version} with ${assets.map(a => path.basename(a)).join(', ')} and notes:\n${notes}`);
        return;
    }
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    run('gh', [
        'release', 'create', version, ...assets, '-R', GITHUB_REPO,
        '--title', `Tab Navigator ${version}`, '--notes', notes, '--target', head,
    ]);
}

async function main() {
    const version = checkVersions();
    const env = loadEnv();
    log(`Version ${version}, stores: ${stores.join(', ')}${dryRun ? ' (dry run)' : ''}${statusOnly ? ' (status only)' : ''}`);

    if (!statusOnly) {
        if (stores.includes('github') && !dryRun) {
            const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim();
            if (dirty) fail('The working tree has uncommitted changes. Commit and push before releasing.');
            run('git', ['fetch', 'origin', 'master']);
            const ahead = execFileSync('git', ['rev-list', '--count', 'origin/master..HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
            if (ahead !== '0') fail('HEAD has commits that are not on origin/master. Push before releasing.');
        }
        run('npm', ['test']);
        run('npm', ['run', 'build']);
    }

    if (stores.includes('firefox')) await publishFirefox(env, version);
    if (stores.includes('chrome')) await publishChrome(env, version);
    if (stores.includes('github')) publishGithub(version);
}

main().catch(error => fail(error.stack || String(error)));
