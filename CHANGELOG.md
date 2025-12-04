# Changelog

All notable changes to create-nestjs-auth will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-04

### Added
- ✨ **Multi-ORM Support** - Choose between Prisma, Drizzle, TypeORM, or Mongoose
- 🗄️ **Multi-Database Support** - PostgreSQL, MySQL, SQLite, or MongoDB
- 🏗️ **Modular Template Architecture** - Base + ORM + Database composition
- 🧪 **Comprehensive Test Scripts** - Test each ORM individually
- 📦 **Modular CLI Source Code** - Split into organized modules in `src/`
- 🔄 **GitHub Actions CI/CD** - Automated testing and npm publishing
- 📝 **Open Source Ready** - CODE_OF_CONDUCT.md, SECURITY.md, PR templates

### Changed
- 🔧 **CLI Architecture** - Modularized from single file to `src/` directory
- 📦 **Package Structure** - Added `bin/` and `src/` directories
- 🎯 **Keywords** - Updated for better npm discoverability
- 📚 **Documentation** - Consolidated redundant markdown files

### Removed
- 🗑️ `index.old.js` - Obsolete backup file
- 🗑️ `CHANGES.md` - Merged into CHANGELOG.md
- 🗑️ `INTERACTIVE_SETUP.md` - Merged into CONTRIBUTING.md
- 🗑️ `QUICK_REFERENCE.md` - Content in README.md
- 🗑️ Unnecessary devDependencies (TypeScript not needed for JS CLI)

## [1.1.0] - 2025-11-17

### Added
- ✨ **Interactive Mode** - Run without arguments for guided setup
- 🎯 **Project Name Prompt** - Interactive project name input with validation
- 📦 **Package Manager Selection** - Choose from npm, pnpm, yarn, or bun with auto-detection
- 🔧 **Setup Preferences** - Interactive prompts for git and dependency installation
- 🔑 **Automatic JWT Secret Generation** - No need for manual `openssl` commands
- 🗄️ **Database URL Prompt** - Guided PostgreSQL connection string input
- 📊 **Interactive Database Setup** - Automatic Prisma generate, migrate, and seed
- 🚀 **Dev Server Auto-start** - Option to start development server immediately
- 🎨 **Enhanced User Experience** - Beautiful prompts with defaults and validation
- 📝 **Post-Setup Workflow** - Complete end-to-end interactive configuration
- `--yes` flag - Skip all prompts for CI/CD and automation

### Changed
- Made `app-name` argument optional (prompts if not provided)
- Updated CLI description to emphasize "Prisma + PostgreSQL"
- Improved success messages with interactive setup flow
- Enhanced documentation with interactive mode examples
- Updated README with two setup options (interactive vs manual)
- Reorganized post-creation instructions for clarity

### Dependencies
- Added `inquirer@^8.2.7` for interactive prompts

### Documentation
- Added INTERACTIVE_SETUP.md - Comprehensive interactive mode guide
- Updated README.md with interactive mode section
- Updated QUICK_REFERENCE.md with new commands
- Added example interactive session outputs

## [Unreleased]

### Planned
- Support for custom templates
- Progress indicators for long-running operations
- Template customization wizard
- Automatic Docker setup option
- CI/CD configuration templates

---

## Version History

- **1.1.0** - Added interactive mode and post-setup automation (2025-11-17)
- **1.0.0** - Major refactor with comprehensive improvements (2025-11-16)
- **0.1.0** - Initial basic version (pre-refactor)
