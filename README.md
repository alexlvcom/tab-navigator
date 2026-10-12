# Tab Navigator

Browser extension for navigating through tab history using keyboard shortcuts.

![Tab Navigator Logo](assets/tab_navigator_400x300.jpg)

## Features

- Cross-browser support (Firefox and Chrome)
- Navigate through previously visited tabs using keyboard shortcuts
- Restore saved history against currently open tabs after a background restart
- Handle closed tabs and separate tabs sharing the same URL
- Lightweight with minimal permissions

### Keyboard Shortcuts
- Firefox: `Ctrl+Alt+Left/Right` to navigate back/forward. Can be changed in `about:addons` -> `Gear icon` -> `Manage Extension Shortcuts`.
- Chrome: `Ctrl+Left/Right` to navigate back/forward (Chrome doesn't support `Ctrl+Alt` combination). Can be changed in `chrome://extensions/shortcuts`.

## Installation

### Mozilla Firefox
[Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tab-navigator/)

### Google Chrome
[Install from Chrome Web Store](https://chromewebstore.google.com/detail/tab-navigator/cbcmijeggfhmklcmochhjgnhpdgcdblc)

### Local release builds

Download the browser ZIP from [GitHub Releases](https://github.com/alexlvcom/tab-navigator/releases) and extract it into a folder you will keep.

- Chrome: open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the extracted Chrome folder.
- Firefox testing: open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select the extracted Firefox `manifest.json`. Temporary add-ons are removed when Firefox restarts. The GitHub Firefox ZIP is unsigned; a permanent installation requires Mozilla signing.

### Optional Windows Ctrl+Alt shortcuts for Chrome

Install AutoHotkey v2 and copy [ChromeOpenInFirefox.ahk](integrations/autohotkey/ChromeOpenInFirefox.ahk) into your Windows Startup folder. Run it once to activate it immediately.

- `Ctrl+Alt+Left/Right` sends Chrome's native `Ctrl+Left/Right` Tab Navigator shortcuts.
- `Ctrl+Alt+left click` sends `Ctrl+Shift+left click`. Configure the separate **Open in Firefox** Chrome extension for that click shortcut and install its native client.

The script only runs its mappings while Chrome is active and physical Ctrl and Alt are held. It must remain running for the mappings to work. Its diagnostic log is `%TEMP%\ChromeOpenInFirefox.log`, including startup, exit reason, errors, and hotkey events. Firefox uses its own Ctrl+Alt commands directly.

## Development

```sh
npm install
npm test
npm run build
```

Browser packages are written to `web-ext-artifacts/`. The tests cover restored tab IDs, closed tabs, and separate tabs sharing a URL.


## Privacy

- All data is stored locally
- No external connections
- No data collection
- No analytics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Alex LV ([alex@alexlv.com](mailto:alex@alexlv.com))
