# Changelog

All notable changes to create-nestjs-auth will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-16

### Added
- Initial release of create-nestjs-auth CLI
- Comprehensive error handling and validation
- App name validation (npm naming conventions)
- Node.js version checking (requires >= 20.x)
- Package manager auto-detection (npm, pnpm, yarn, bun)
- Multiple CLI options:
  - `--skip-install` - Skip dependency installation
  - `--package-manager` - Choose specific package manager
  - `--skip-git` - Skip git initialization
- Automatic .env file creation from .env.example
- Git repository initialization with initial commit
- Interactive setup script (`npm run setup`) in generated projects
- Comprehensive README with usage examples
- .npmignore for clean npm package
- Proper package.json metadata for npm

### Changed
- Improved user feedback with better console messages
- Enhanced error messages with actionable solutions
- Better handling of missing template files
- Excluded .git directory from template copying

### Fixed
- Silent failures during file operations
- Missing validation for app names
- Hardcoded npm commands (now respects package manager)
- Template's .git directory being copied to new projects
- No timeout on dependency installation
- Missing documentation for CLI usage

### Security
- Secrets generation using cryptographically secure methods
- Validation to prevent directory traversal attacks
- Proper handling of environment variables

## [Unreleased]

### Planned
- Support for custom templates
- Progress indicators for long-running operations
- Option to use SQLite or MongoDB instead of PostgreSQL
- Template customization wizard
- Automatic Docker setup option
- CI/CD configuration templates

---

## Version History

- **1.0.0** - Major refactor with comprehensive improvements (2025-11-16)
- **0.1.0** - Initial basic version (pre-refactor)
