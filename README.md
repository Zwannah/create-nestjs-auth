# create-nestjs-auth

> CLI tool to scaffold a production-ready NestJS authentication system with JWT, refresh tokens, and RBAC.

[![npm version](https://img.shields.io/npm/v/create-nestjs-auth.svg)](https://www.npmjs.com/package/create-nestjs-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

✅ **Complete JWT Auth System** - Access tokens, refresh token rotation, multi-device sessions  
✅ **Role-Based Access Control (RBAC)** - Admin/User roles with decorator-based guards  
✅ **Production Security** - HttpOnly cookies, bcrypt (12 rounds), rate limiting  
✅ **Database Ready** - PostgreSQL + Prisma ORM with migrations (only supported database)  
✅ **Developer Experience** - Pino logging, health checks, validation, comprehensive tests  
✅ **Interactive CLI** - Guided setup with prompts for configuration options  

## Quick Start

```bash
# Interactive mode (recommended)
npx create-nestjs-auth

# Or provide app name directly
npx create-nestjs-auth my-app

# Or with pnpm
pnpx create-nestjs-auth my-app

# Or install globally
npm install -g create-nestjs-auth
create-nestjs-auth
```

## Usage

### Interactive Mode (New! 🎉)

Simply run the command without arguments to enter interactive mode:

```bash
npx create-nestjs-auth
```

You'll be prompted for:
- **Project name** - Your application name
- **Package manager** - npm, pnpm, yarn, or bun (auto-detected)
- **Install dependencies** - Whether to install packages automatically
- **Initialize git** - Whether to set up a git repository

**Example interactive session:**
```
⚡️ create-nestjs-auth

Production-ready NestJS authentication with Prisma + PostgreSQL

? What is your project name? my-awesome-app
? Which package manager would you like to use? pnpm (detected)
? Install dependencies? Yes
? Initialize git repository? Yes

🚀 Creating my-awesome-app...
```

### Basic Usage

```bash
npx create-nestjs-auth my-awesome-app
cd my-awesome-app
```

Edit `.env` with your database credentials, then:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Your API will be running at `http://localhost:8080/api/v1`

### With Options

```bash
# Non-interactive mode (skip all prompts)
npx create-nestjs-auth my-app --yes

# Skip dependency installation
npx create-nestjs-auth my-app --skip-install

# Use specific package manager
npx create-nestjs-auth my-app --package-manager pnpm

# Skip git initialization
npx create-nestjs-auth my-app --skip-git

# Combine options
npx create-nestjs-auth my-app --skip-install --skip-git --yes
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip all prompts and use defaults (non-interactive mode) | `false` |
| `--skip-install` | Skip automatic dependency installation | `false` |
| `--package-manager <pm>` | Choose package manager: `npm`, `pnpm`, `yarn`, or `bun` | Auto-detect |
| `--skip-git` | Skip git repository initialization | `false` |
| `--help` | Display help information | - |
| `--version` | Show CLI version | - |

## Requirements

- **Node.js** >= 20.x
- **PostgreSQL** >= 16.x (or connection to a PostgreSQL database)
- **npm** >= 10.x (or pnpm/yarn/bun equivalent)

The CLI will check Node.js version before creating the project.

## What Gets Created

```
my-app/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed data (default admin user)
│   └── migrations/         # Database migrations
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── users/          # User management
│   │   └── health/         # Health check endpoints
│   ├── common/
│   │   ├── decorators/     # @Roles(), @Public(), @GetUser()
│   │   ├── guards/         # JWT guards, RBAC guards
│   │   ├── interceptors/   # Response transformation
│   │   └── validators/     # Custom validators
│   └── config/             # Configuration, logging
├── test/                   # E2E tests
├── .env                    # Environment variables (created from .env.example)
├── .env.example            # Template with all required variables
└── package.json
```

## Post-Creation Steps

After creating your project, follow these steps:

### 1. Configure Environment Variables

Edit `.env` file (already created from `.env.example`):

```bash
# Generate secure JWT secrets
openssl rand -base64 32  # For JWT_ACCESS_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

Update critical values:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_ACCESS_SECRET="your-generated-secret-here"
JWT_REFRESH_SECRET="your-different-secret-here"
```

### 2. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed default admin user
npm run prisma:seed
```

Default credentials: `admin@example.com` / `Admin@123`

### 3. Start Development Server

```bash
npm run start:dev
```

### 4. Test the API

```bash
# Check health
curl http://localhost:8080/api/v1/health

# Login with default admin
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

## What's Included in the Template

### Authentication Features
- JWT access tokens (short-lived, 1 hour)
- Refresh token rotation (30 days)
- Multi-device session support (5 devices/user)
- Secure HttpOnly cookies
- Password hashing with bcrypt (12 rounds)

### Security Features
- Rate limiting (5 auth attempts/min, 10 global/min)
- CORS configuration
- Helmet security headers
- PII-safe logging (passwords/tokens redacted)
- Input validation with class-validator
- Environment variable validation with Zod

### Role-Based Access Control
```typescript
@Roles(UserRole.ADMIN)
@Get('users')
getAllUsers() { }
```

### API Endpoints
- **Auth**: `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- **Users**: `/users` (CRUD with pagination, admin-only)
- **Profile**: `/users/profile` (user's own profile management)
- **Health**: `/health`, `/health/ready`, `/health/live`

### Developer Tools
- Pino structured logging
- Prisma Studio for database UI
- Health check endpoints (Kubernetes-ready)
- E2E test setup with Jest
- ESLint + Prettier configured

## Troubleshooting

### CLI Installation Issues

**Problem**: `command not found: create-nestjs-auth`

**Solution**: 
```bash
# Use npx instead
npx create-nestjs-auth my-app

# Or install globally
npm install -g create-nestjs-auth
```

### Template Creation Issues

**Problem**: "Template directory not found"

**Solution**: Reinstall the package:
```bash
npm uninstall -g create-nestjs-auth
npm install -g create-nestjs-auth
```

### Dependency Installation Fails

**Problem**: npm install fails during creation

**Solution**: 
```bash
# Create without installing, then troubleshoot
npx create-nestjs-auth my-app --skip-install
cd my-app
npm install --verbose
```

### Node Version Issues

**Problem**: "Node.js version X.X is not supported"

**Solution**: Upgrade Node.js:
```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

## Publishing Your Own Fork

If you've customized the template and want to publish your own version:

```bash
# 1. Update package.json name
{
  "name": "@yourname/create-nestjs-auth",
  "version": "1.0.0"
}

# 2. Login to npm
npm login

# 3. Publish
npm publish --access public
```

## Development

Want to contribute or modify the CLI?

```bash
# Clone the repo
git clone https://github.com/masabinhok/create-nestjs-auth.git
cd create-nestjs-auth/cli

# Install dependencies
npm install

# Test locally
npm link
create-nestjs-auth test-app

# Run test script
npm test
```

## Related Projects

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [create-next-app](https://nextjs.org/docs/api-reference/create-next-app) - Similar CLI for Next.js

## Support

- 📖 [Full Template Documentation](https://github.com/masabinhok/nestjs-jwt-rbac-boilerplate)
- 🐛 [Report Issues](https://github.com/masabinhok/create-nestjs-auth/issues)
- 💬 [Discussions](https://github.com/masabinhok/create-nestjs-auth/discussions)

## License

MIT © [Sabin Shrestha](https://sabinshrestha69.com.np)

---

**Built with ❤️ by [masabinhok](https://github.com/masabinhok)**

If this helped you, please ⭐ star the repo!
