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

## Releasing

`npm run release` publishes the version in `package.json` to Firefox Add-ons, the Chrome Web Store and GitHub Releases. It runs the tests, builds both packages, and skips any store that already has the version.

1. Bump the version in `package.json`, `src/firefox/manifest.json` and `src/chrome/manifest.json`.
2. Add a `## [x.y.z]` section to `CHANGELOG.md`. Its bullets, except the Tests subsection, become the Firefox version notes and the GitHub release notes. Firefox reviewer notes come from `release/amo-reviewer-notes.txt`.
3. Commit and push to `origin/master`.
4. Run `npm run release:dry-run` to preview, then `npm run release`.
5. Run `npm run release:status` to see each store's review state.

Single stores: `node release/publish.js firefox`, `chrome` or `github`.

Credentials live outside the repo in `~/.config/tab-navigator/.env`:

```sh
AMO_JWT_ISSUER=user:...           # https://addons.mozilla.org/en-US/developers/addon/api/key/
AMO_JWT_SECRET=...
CWS_PUBLISHER_ID=...              # Chrome Web Store dashboard URL, or Settings
CWS_EXTENSION_ID=cbcmijeggfhmklcmochhjgnhpdgcdblc
```

The Chrome service account key goes next to it as `~/.config/tab-navigator/chrome-service-account.json`. Set `CWS_SERVICE_ACCOUNT_KEY` to use another path.

To create the Chrome key: in a Google Cloud project, enable the Chrome Web Store API, create a service account without roles, and download a JSON key for it. Then add the service account's email in the Chrome Web Store dashboard under **Settings** → **Service account**. GitHub releases use the `gh` CLI login.

Firefox versions must be signed with `--channel=listed` to appear on the public Add-ons page. The release script always does this. Versions 1.0.1, 1.0.2 and 1.1.1 went to the unlisted channel, so the public page stayed on 1.0.0 until 1.1.2.

### Store review times

| Version | Store | Submitted (UTC) | Approved (UTC) | Wait |
|---|---|---|---|---|
| 1.1.2 | Firefox Add-ons (listed) | 2026-10-13 11:12 | 2026-10-13 11:16 | about 5 minutes, automatic review |
| 1.1.2 | Chrome Web Store | 2026-10-13 12:07 | pending | |


## Privacy

- All data is stored locally
- No external connections
- No data collection
- No analytics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Alex LV ([alex@alexlv.com](mailto:alex@alexlv.com))
