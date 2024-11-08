# Tab Navigator

Browser extension for navigating through tab history using keyboard shortcuts.

## Features

- Cross-browser support (Firefox and Chrome)
- Navigate through previously visited tabs using keyboard shortcuts
- History persists between browser sessions (Correctly works only in Firefox for now)
- Lightweight with minimal permissions

### Keyboard Shortcuts
- Firefox: `Ctrl+Alt+Left/Right` to navigate back/forward
- Chrome: `Ctrl+Left/Right` to navigate back/forward (as Chrome doesn't support `Ctrl+Alt` combination)

## Installation

### Firefox
Install from Firefox Add-ons: https://addons.mozilla.org/en-US/firefox/addon/tab-navigator/

### Chrome
Load from Chrome Web Store: https://chromewebstore.google.com/detail/tab-navigator/cbcmijeggfhmklcmochhjgnhpdgcdblc


## Development

### Prerequisites
```bash
npm install
```

### Build
Build extensions for both browsers:
```bash
npm run build
```

Or build for specific browser:
```bash
npm run build:firefox
npm run build:chrome
```

### Testing

#### Firefox
```bash
npx web-ext run --source-dir dist/firefox
```

#### Chrome
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/chrome` directory


## Project Structure
```
project/
├── manifests/
│   ├── chrome.json    # Chrome-specific manifest
│   └── firefox.json   # Firefox-specific manifest
├── src/
│   └── background.js  # Shared background script
├── build.js
└── package.json
```

## Privacy

- All data is stored locally
- No external connections
- No data collection
- No analytics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Alex LV (alex@alexlv.com)
