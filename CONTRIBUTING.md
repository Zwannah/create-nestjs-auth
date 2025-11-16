# Contributing to create-nestjs-auth

Thank you for your interest in contributing! This document provides guidelines for contributing to the create-nestjs-auth CLI tool.

## Development Setup

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/masabinhok/create-nestjs-auth.git
cd create-nestjs-auth/cli

# Install dependencies
npm install

# Link for local testing
npm link

# Now you can test with
create-nestjs-auth my-test-app
```

## Project Structure

```
cli/
├── index.js           # Main CLI logic
├── package.json       # CLI package configuration
├── README.md          # User-facing documentation
├── .npmignore         # Files to exclude from npm package
└── template/          # Template files copied to new projects
    ├── src/           # NestJS application source
    ├── prisma/        # Database schema and migrations
    ├── test/          # E2E tests
    ├── setup.js       # Interactive setup helper
    └── ...            # Other template files
```

## Making Changes

### Code Style

- Use consistent formatting (2 spaces for indentation)
- Add comments for complex logic
- Use meaningful variable names
- Follow existing code patterns

### Testing Your Changes

1. **Test basic creation:**
```bash
npm test
# This runs: node index.js test-output --skip-install
```

2. **Test with full installation:**
```bash
node index.js test-full-app
cd test-full-app
npm run start:dev
```

3. **Test all CLI options:**
```bash
# Test skip-install
node index.js test-skip --skip-install

# Test skip-git
node index.js test-nogit --skip-git

# Test package manager selection
node index.js test-pnpm --package-manager pnpm
```

4. **Verify template integrity:**
```bash
# Check that all files were copied
cd test-output
ls -la

# Verify .env was created
cat .env

# Check package.json name was updated
grep '"name"' package.json
```

### Before Submitting

- [ ] Test CLI on clean environment
- [ ] Verify all options work (--skip-install, --skip-git, --package-manager)
- [ ] Check that template files are complete
- [ ] Update README.md if adding new features
- [ ] Clean up test directories
- [ ] Run `npm run prepublishOnly` to verify

## Common Development Tasks

### Updating the Template

When you need to update the template files:

```bash
# Make changes in template/ directory
cd template/
# ... make your changes ...

# Test the changes
cd ..
npm test
```

**Important**: Never commit these files to the template:
- `node_modules/`
- `dist/`
- `.env` (keep `.env.example`)
- `.git/`
- `generated/`

### Adding New CLI Options

1. Add option to `program` in `index.js`:
```javascript
.option('--my-option', 'Description of my option')
```

2. Handle the option in the action callback:
```javascript
.action(async (appName, options) => {
  if (options.myOption) {
    // Your logic here
  }
})
```

3. Update README.md with the new option
4. Test thoroughly

### Adding Validation

Add validation functions at the top of `index.js`:

```javascript
function validateMyInput(input) {
  if (!isValid(input)) {
    console.error(chalk.red('❌ Invalid input'));
    process.exit(1);
  }
}
```

## Pull Request Process

1. **Fork and Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
- Write clear, concise commit messages
- One feature/fix per pull request
- Include tests if applicable

3. **Test Thoroughly**
```bash
# Test the CLI
npm test
npm run test:full

# Clean up
rm -rf test-*
```

4. **Submit PR**
- Clear title describing the change
- Description of what changed and why
- Screenshots/examples if applicable
- Reference any related issues

### Commit Message Format

```
type: brief description

Longer description if needed

Fixes #123
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

Examples:
- `feat: add --skip-git option`
- `fix: handle missing .env.example gracefully`
- `docs: update README with new options`

## Reporting Issues

### Bug Reports

Include:
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Command you ran
- Expected behavior
- Actual behavior
- Error messages (full output)

### Feature Requests

Include:
- Clear description of the feature
- Use case (why is it needed?)
- Proposed implementation (if you have ideas)
- Examples from similar tools

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the issue, not the person
- Assume good intentions

## Questions?

- Open an issue for questions
- Tag with `question` label
- Check existing issues first

## Publishing (Maintainers Only)

```bash
# Verify version in package.json
# Ensure all tests pass
npm test

# Publish to npm
npm login
npm publish

# Create git tag
git tag v1.0.0
git push origin v1.0.0
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
