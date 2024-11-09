# Changelog

All notable changes to this project will be documented in this file.

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