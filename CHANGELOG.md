# Changelog

All notable changes to this project will be documented in this file.

## [1.1.2] - 2026-10-12

### Fixed

- Restore Chrome tab history when its background service worker restarts, without calling a missing function or removing legitimate repeated visits.
- Wait for history restoration before processing tab events and keyboard commands.
- Track separate tabs with the same URL by their tab IDs and retain back/forward history during navigation.
- Remove closed tabs without leaving the history cursor out of range, and skip unavailable navigation targets.
- Migrate Firefox's earlier numeric tab history when the saved tabs still exist.

### Tests

- Add browser API tests for restored tab IDs, closed tabs, and separate tabs sharing a URL.

### Added

- Include the optional AutoHotkey v2 script for Chrome Ctrl+Alt arrow navigation and Ctrl+Alt link clicks, with startup and exit diagnostics.
- Document local release installation, Firefox temporary-install limitations, and Windows shortcut setup.

## [1.1.1] - 2024-11-09

### Added

- Implemented a workaround for an issue in Chrome where, upon browser restart, the tab browsing history was incorrectly appended with two additional existing tabs. The workaround isn't complete; it has partially resolved the issue. The problem with navigating to separate tabs with the same page still exists.

### Updated

- Updated the project file structure. Firefox and Chrome now have separate `background.js` files since Chrome required too many browser-specific code adjustments.

## [1.1.0] - 2024-11-04

### Added

- Chrome support`

## [1.0.0] - 2024-11-05

### Added

- Initial release with Firefox support
