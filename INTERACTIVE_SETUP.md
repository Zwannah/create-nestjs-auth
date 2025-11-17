# Interactive Post-Setup Features

## Overview
The CLI now includes **interactive post-setup** that automates the entire configuration process after project creation. No more manual copy-pasting of secrets or running database commands!

## What's New

### 🎯 Automatic Post-Setup Flow

After creating your project and installing dependencies, the CLI offers to complete the setup:

```
✅ Success! Created my-awesome-app

🎉 Your project is ready!

? Would you like to complete the setup now? (JWT secrets, database, etc.)
```

### ✨ Features

#### 1. **JWT Secret Generation**
- Automatically generates cryptographically secure JWT secrets
- Uses Node.js `crypto.randomBytes(32).toString('base64')`
- No need to run `openssl` commands manually
- Secrets are 44 characters long (base64 encoded)

#### 2. **Database Configuration**
- Prompts for PostgreSQL connection string
- Validates URL format (must start with `postgresql://` or `postgres://`)
- Auto-updates `.env` file with provided URL
- Configures both JWT secrets automatically

#### 3. **Database Setup**
- Runs `prisma:generate` - Creates Prisma client
- Runs `prisma:migrate` - Applies database migrations
- Runs `prisma:seed` - Seeds default admin user
- Shows progress for each step
- Displays default credentials after completion

#### 4. **Dev Server Launch**
- Optionally starts the development server
- Shows API URL: `http://localhost:8080/api/v1`
- Runs in foreground (Ctrl+C to stop)

## Interactive Prompts

### Prompt 1: Continue Setup
```
? Would you like to complete the setup now? (JWT secrets, database, etc.) (Y/n)
```
- **Default**: Yes
- **If No**: Shows manual instructions and exits
- **If Yes**: Continues to next prompt

### Prompt 2: Database URL
```
? Enter your PostgreSQL database URL: (postgresql://user:password@localhost:5432/mydb)
```
- **Default**: `postgresql://user:password@localhost:5432/mydb`
- **Validation**: Must start with `postgresql://` or `postgres://`
- **Purpose**: Connects to your PostgreSQL database

### Prompt 3: Setup Database
```
? Set up the database now? (generate Prisma client, run migrations, seed) (Y/n)
```
- **Default**: Yes
- **If No**: Skips database setup (can run manually later)
- **If Yes**: Runs all Prisma commands automatically

### Prompt 4: Start Dev Server
```
? Start the development server now? (y/N)
```
- **Default**: No (to let user review setup first)
- **If No**: Exits gracefully
- **If Yes**: Launches dev server with `npm run start:dev`

## When Interactive Setup Runs

### ✅ Interactive setup IS offered when:
- User runs without `--yes` flag
- Dependencies were installed (not `--skip-install`)
- In interactive terminal session

### ❌ Interactive setup is SKIPPED when:
- `--yes` flag is used (non-interactive mode)
- `--skip-install` flag is used
- Running in CI/CD environment
- Any error occurs during project creation

## Example: Complete Interactive Flow

```bash
$ npx create-nestjs-auth

⚡️ create-nestjs-auth

Production-ready NestJS authentication with Prisma + PostgreSQL

? What is your project name? my-api
? Which package manager would you like to use? npm (detected)
? Install dependencies? Yes
? Initialize git repository? Yes

🚀 Creating my-api...

   Copying template files...
   Updating package.json...
   Setting up environment variables...

📦 Installing dependencies with npm...

   added 1234 packages in 30s

🔧 Initializing git repository...
   Git repository initialized with initial commit

✅ Success! Created my-api

🎉 Your project is ready!

? Would you like to complete the setup now? (JWT secrets, database, etc.) Yes

🔑 Generating JWT secrets...

   Generated JWT_ACCESS_SECRET
   Generated JWT_REFRESH_SECRET

? Enter your PostgreSQL database URL: postgresql://postgres:password@localhost:5432/myapi

   Updating .env file...
   ✓ Environment variables configured

? Set up the database now? (generate Prisma client, run migrations, seed) Yes

📦 Setting up database...

   Generating Prisma client...
   ✓ Generated Prisma Client

   Running database migrations...
   ✓ Applied 4 migrations

   Seeding database with default admin user...
   ✓ Seeded database

   ✓ Database setup complete!

   📝 Default admin credentials:
      Email:    admin@example.com
      Password: Admin@123

? Start the development server now? Yes

🚀 Starting development server...

   Your API will be available at: http://localhost:8080/api/v1
   Press Ctrl+C to stop the server

[Nest] 12345  - 11/17/2025, 10:30:45 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/17/2025, 10:30:45 AM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] 12345  - 11/17/2025, 10:30:46 AM     LOG Application is running on: http://localhost:8080
```

## Technical Details

### Environment File Updates

The `.env` file is automatically updated with:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
JWT_ACCESS_SECRET="base64EncodedSecretHere..."
JWT_REFRESH_SECRET="differentBase64SecretHere..."
```

### Commands Executed

When database setup is confirmed, these commands run:
1. `npm run prisma:generate` (or equivalent for other package managers)
2. `npm run prisma:migrate`
3. `npm run prisma:seed`

### Error Handling

If any step fails:
- Error is displayed with details
- Manual commands are shown as fallback
- Process exits gracefully
- Partial progress is preserved (e.g., if migrations succeed but seed fails)

## Skipping Interactive Setup

### Using `--yes` Flag
```bash
npx create-nestjs-auth my-app --yes
```
Skips ALL prompts, including post-setup. Shows manual instructions only.

### Declining Post-Setup
If you decline the post-setup prompt, you'll see manual instructions:

```
📚 Next steps:

   cd my-app

   # Generate secure JWT secrets (save these!):
   openssl rand -base64 32  # For JWT_ACCESS_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET

   # Edit .env with your database URL and JWT secrets
   # Then setup the database:
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed

   # Start development server:
   npm run start:dev
```

## Benefits

### For Beginners
- 🎓 **Guided experience** - No guessing what to do next
- 🚫 **Fewer errors** - Validation prevents typos
- ⚡ **Faster setup** - From zero to running in minutes
- 📖 **Educational** - See what each step does

### For Experienced Users
- 🚀 **Speed** - Skip manual copy-paste
- 🔧 **Convenience** - One command setup
- 🎯 **Consistency** - Same setup every time
- 💻 **Efficiency** - More time coding, less time configuring

### For Teams
- 📋 **Standardized** - Everyone uses same setup
- 🤝 **Onboarding** - New developers get started quickly
- 🔒 **Secure** - Proper secrets automatically generated
- 📊 **Predictable** - Same environment for all

## Comparison: Before vs After

### Before (Manual)
```bash
npx create-nestjs-auth my-app
cd my-app

# Generate secrets
openssl rand -base64 32    # Copy to .env
openssl rand -base64 32    # Copy to .env

# Edit .env file manually
vim .env

# Run 3 separate commands
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start server
npm run start:dev
```
**Time**: ~5-10 minutes, prone to errors

### After (Interactive)
```bash
npx create-nestjs-auth
# Answer 7 questions
# Everything done automatically
```
**Time**: ~2-3 minutes, error-free

## Troubleshooting

### Issue: Database connection fails
**Solution**: Check your PostgreSQL is running and URL is correct
```bash
# Test connection
psql postgresql://user:pass@localhost:5432/mydb
```

### Issue: Prisma commands fail
**Solution**: Ensure DATABASE_URL is valid in .env
```bash
# Check .env file
cat .env | grep DATABASE_URL
```

### Issue: Port 8080 in use
**Solution**: Change PORT in .env or stop the conflicting process
```bash
# Find process on port 8080
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID <process_id> /F
```

### Issue: Want to re-run setup
**Solution**: Run Prisma commands manually
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Future Enhancements

Potential additions (not yet implemented):
- [ ] Test database connection before proceeding
- [ ] Offer to create database if it doesn't exist
- [ ] Multiple environment setups (dev, staging, prod)
- [ ] Custom admin credentials during seed
- [ ] Database provider selection (currently PostgreSQL only)
- [ ] Docker Compose setup option
- [ ] API testing after server starts

## Feedback

We'd love to hear your thoughts on the interactive setup!

- 🌟 Like it? Star the repo!
- 🐛 Found a bug? [Open an issue](https://github.com/masabinhok/create-nestjs-auth/issues)
- 💡 Have ideas? [Start a discussion](https://github.com/masabinhok/create-nestjs-auth/discussions)

---

**Note**: Interactive setup requires an active terminal session. For CI/CD pipelines, use `--yes` flag to skip all prompts.
