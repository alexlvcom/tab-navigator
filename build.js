const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const browser = process.argv[2];
if (!browser || !['firefox', 'chrome'].includes(browser)) {
    console.error('Please specify browser: firefox or chrome');
    process.exit(1);
}

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist', browser);
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Check and copy background script for specific browser
const backgroundScriptPath = path.join(__dirname, 'src', browser, 'background.js');
if (!fs.existsSync(backgroundScriptPath)) {
    console.error(`Background script not found for ${browser}: ${backgroundScriptPath}`);
    process.exit(1);
}
fs.copyFileSync(
    backgroundScriptPath,
    path.join(distDir, 'background.js')
);

// Copy and rename appropriate manifest
const manifestSourcePath = path.join(__dirname, 'src', browser, 'manifest.json');
if (!fs.existsSync(manifestSourcePath)) {
    console.error(`Manifest file not found for ${browser}: ${manifestSourcePath}`);
    process.exit(1);
}
fs.copyFileSync(
    manifestSourcePath,
    path.join(distDir, 'manifest.json')
);

// Build for specific browser
if (browser === 'firefox') {
    console.log('Building Firefox extension...');
    execSync('npx web-ext build --source-dir dist/firefox --artifacts-dir web-ext-artifacts/firefox', { stdio: 'inherit' });
} else {
    console.log('Building Chrome extension...');
    execSync('npx web-ext build --source-dir dist/chrome --artifacts-dir web-ext-artifacts/chrome', { stdio: 'inherit' });
}

console.log(`${browser} build completed!`);