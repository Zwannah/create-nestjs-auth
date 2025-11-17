# Interactive CLI Changes

## Overview
Added interactive features to the `create-nestjs-auth` CLI tool while maintaining Prisma + PostgreSQL as the only supported database option.

## What Changed

### 1. **Added Interactive Mode**
- Users can now run `npx create-nestjs-auth` without arguments
- CLI will prompt for all necessary configuration options
- Intelligent defaults with auto-detection (e.g., package manager)

### 2. **New Dependency**
- Added `inquirer@^8.2.6` for interactive prompts

### 3. **Interactive Prompts**
When running without arguments or incomplete options, users are prompted for:

1. **Project Name**
   - Default: `my-nestjs-app`
   - Validates naming conventions (letters, numbers, hyphens, underscores, @, /)
   - Checks for reserved names
   - Enforces npm's 214 character limit

2. **Package Manager Selection**
   - Options: npm, pnpm, yarn, bun
   - Auto-detects installed package managers
   - Shows detected manager in the list
   - Default: detected manager

3. **Install Dependencies**
   - Confirms whether to run package installation
   - Default: Yes

4. **Initialize Git Repository**
   - Confirms whether to initialize git and create initial commit
   - Default: Yes

### 4. **New CLI Option**
- `--yes`: Skip all prompts and use defaults (non-interactive mode)

### 5. **Updated Command Signature**
- Changed `<app-name>` (required) to `[app-name]` (optional)
- App name is now optional - will prompt if not provided

### 6. **Enhanced Description**
- Updated CLI description to explicitly mention "Prisma + PostgreSQL"
- Added note in features list that PostgreSQL + Prisma is the only supported database

## Usage Examples

### Interactive Mode (New)
```bash
# Prompts for all options
npx create-nestjs-auth

# Prompts only for missing options
npx create-nestjs-auth my-app
```

### Non-Interactive Mode (Original behavior)
```bash
# Provide all arguments and options
npx create-nestjs-auth my-app --package-manager pnpm

# Use defaults for everything
npx create-nestjs-auth my-app --yes
```

### Partial Interactive
```bash
# Provide some options, prompt for others
npx create-nestjs-auth --package-manager npm
# Will prompt for: project name, install deps, init git

npx create-nestjs-auth my-app --skip-git
# Will prompt for: package manager, install deps
```

## Benefits

1. **Better User Experience**
   - Guided setup for first-time users
   - Clear validation messages inline
   - Visual feedback with detected tools

2. **Flexible Workflows**
   - Interactive mode for exploration
   - Non-interactive mode for automation/CI
   - Hybrid approach for partial automation

3. **Reduced Errors**
   - Validates input before proceeding
   - Prevents common mistakes (invalid names, etc.)
   - Shows helpful suggestions

4. **Backward Compatible**
   - All existing commands still work
   - Original flags and options preserved
   - Only enhanced, not broken

## Technical Implementation

### Key Functions Added
- `promptForProjectDetails(providedAppName, options)`: Main interactive prompt handler
  - Returns normalized answers object
  - Respects command-line flags
  - Only prompts for missing information

### Modified Logic
- Updated main action handler to check for interactive mode
- Call `promptForProjectDetails()` when app name is missing or `--yes` is not set
- Merge interactive answers with command-line options

### Database Support
- **Only Prisma + PostgreSQL** is supported
- No database selection prompts (intentionally omitted)
- Documentation updated to clarify this constraint

## Documentation Updates

### README.md
- Added "Interactive Mode" section with examples
- Updated Quick Start to show interactive usage first
- Added example interactive session output
- Updated features list to mention interactive CLI
- Clarified PostgreSQL + Prisma only support

### QUICK_REFERENCE.md
- Added interactive mode commands
- Updated options table with `--yes` flag
- Showed both interactive and non-interactive examples

## Testing

Test the implementation:

```bash
# Test help
node index.js --help

# Test interactive mode (will prompt)
node index.js

# Test with app name (partial interactive)
node index.js test-app

# Test non-interactive
node index.js test-app --yes --skip-install
```

## Future Enhancements (Not Implemented)

Possible future additions:
- Prompt for environment variable values
- Database connection string builder/validator
- JWT secret generator (currently shown in next steps)
- Template variations (API-only, with GraphQL, etc.)
- Project type selection (monorepo, standalone, etc.)

However, these are intentionally not included to keep the CLI focused and simple.

## Notes

- Inquirer version 8.x used (not v9+) for better compatibility with CommonJS
- All prompts are conditional - won't show if value already provided
- `--yes` flag completely bypasses interactive mode
- Original behavior preserved for automation/scripting use cases
