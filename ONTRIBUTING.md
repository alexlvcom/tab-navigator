# Contributing to Tab Navigator

Here are the guidelines to help you get started.

## Prerequisites
Before you start, ensure you have the necessary dependencies installed:
```bash
npm install
```

## Building the Extension

To build the extensions for both browsers (Firefox and Chrome), or for a specific browser, use the commands below.

```bash
npm run build
npm run build:firefox
npm run build:chrome
```

## Testing the Extension

### Firefox
To test in Firefox:
```bash
npx web-ext run --source-dir dist/firefox
```
Or load in Firefox Developer Edition (only after building the package in Development section):
   - Go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the `dist/firefox` directory

### Chrome
To test in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/chrome` directory

## Project Structure

Understanding the project structure will help you navigate the codebase:
```plaintext
project/
├── dist/
│   ├── chrome/         # Chrome distribution directory
│   └── firefox/        # Firefox distribution directory
├── src/                # Source files
│   ├── chrome/         # Chrome-specific source files
│   │   ├── background.js
│   │   └── manifest.json
│   └── firefox/        # Firefox-specific source files
│       ├── background.js
│       └── manifest.json
├── build.js            # Build script
└── package.json        # NPM package file
```

## Workflow

Before submitting a pull request, ensure your branch is updated with the latest `origin/master`. If you have local commits, rebase your branch onto the latest `origin/master`.

-----

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
For any questions or discussions, please contact me:
Alex LV ([alex@alexlv.com](mailto:alex@alexlv.com))