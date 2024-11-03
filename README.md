# Tab Navigator

Firefox extension for navigating through tab history using keyboard shortcuts.

## Features

- Navigate back through previously visited tabs using Ctrl+Alt+Left
- Navigate forward using Ctrl+Alt+Right
- History persists between browser sessions
- Lightweight with minimal permissions

## Installation

### From Firefox Add-ons
[Add link to your Firefox Add-ons page once published]

### Manual Installation (Development)
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install --global web-ext
   ```
3. Build the extension:
   ```bash
   web-ext build
   ```
4. Load in Firefox Developer Edition:
   - Go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the `src` directory

## Development

To run in development mode with auto-reload:
```bash
web-ext run
```

To create a signed package:
```bash
web-ext sign --channel=listed --api-key=YOUR_API_KEY --api-secret=YOUR_API_SECRET
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