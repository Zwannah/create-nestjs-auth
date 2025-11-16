#!/usr/bin/env node
/**
 * Interactive setup helper for create-nestjs-auth projects
 * This script helps users configure their environment interactively
 * 
 * Usage: node setup.js (run inside created project)
 */

const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret() {
  try {
    const secret = execSync('openssl rand -base64 32', { encoding: 'utf8' }).trim();
    return secret;
  } catch (error) {
    // Fallback if openssl is not available
    return require('crypto').randomBytes(32).toString('base64');
  }
}

async function updateEnvFile(config) {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!await fs.pathExists(envPath)) {
    console.error(chalk.red('❌ .env file not found'));
    console.error(chalk.yellow('   Make sure you run this from your project root'));
    process.exit(1);
  }

  let envContent = await fs.readFile(envPath, 'utf8');

  // Update each value
  Object.entries(config).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  await fs.writeFile(envPath, envContent);
}

async function main() {
  console.log(chalk.cyan('\n⚡️ NestJS Auth Project Setup\n'));
  console.log(chalk.white('This wizard will help you configure your project.\n'));

  const config = {};

  // Database URL
  console.log(chalk.yellow('📊 Database Configuration\n'));
  const useDefaultDb = await question(chalk.white('Use default PostgreSQL (localhost:5432)? (Y/n): '));
  
  if (useDefaultDb.toLowerCase() === 'n') {
    const dbHost = await question(chalk.gray('  Database host (localhost): ')) || 'localhost';
    const dbPort = await question(chalk.gray('  Database port (5432): ')) || '5432';
    const dbUser = await question(chalk.gray('  Database user (postgres): ')) || 'postgres';
    const dbPassword = await question(chalk.gray('  Database password: '));
    const dbName = await question(chalk.gray('  Database name: '));
    
    config.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  } else {
    const dbName = await question(chalk.gray('  Database name (nest_auth_db): ')) || 'nest_auth_db';
    config.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${dbName}`;
  }

  // JWT Secrets
  console.log(chalk.yellow('\n🔐 JWT Configuration\n'));
  const autoGenerateSecrets = await question(chalk.white('Auto-generate secure JWT secrets? (Y/n): '));
  
  if (autoGenerateSecrets.toLowerCase() === 'n') {
    config.JWT_ACCESS_SECRET = await question(chalk.gray('  JWT Access Secret (min 32 chars): '));
    config.JWT_REFRESH_SECRET = await question(chalk.gray('  JWT Refresh Secret (min 32 chars): '));
  } else {
    console.log(chalk.gray('  Generating secure secrets...'));
    config.JWT_ACCESS_SECRET = generateSecret();
    config.JWT_REFRESH_SECRET = generateSecret();
    console.log(chalk.green('  ✓ Secrets generated'));
  }

  // Token expiry
  config.JWT_ACCESS_EXPIRY = await question(chalk.gray('  Access token expiry (60m): ')) || '60m';
  config.JWT_REFRESH_EXPIRY = await question(chalk.gray('  Refresh token expiry (30d): ')) || '30d';

  // Server Configuration
  console.log(chalk.yellow('\n🌐 Server Configuration\n'));
  config.PORT = await question(chalk.gray('  Server port (8080): ')) || '8080';
  config.NODE_ENV = await question(chalk.gray('  Environment (development): ')) || 'development';
  config.CORS_ORIGIN = await question(chalk.gray('  CORS origin (http://localhost:3000): ')) || 'http://localhost:3000';

  // Log level
  config.LOG_LEVEL = await question(chalk.gray('  Log level (info): ')) || 'info';

  // Update .env file
  console.log(chalk.yellow('\n💾 Saving configuration...\n'));
  await updateEnvFile(config);
  console.log(chalk.green('✅ Configuration saved to .env\n'));

  // Show secrets (important!)
  console.log(chalk.cyan('🔑 Your JWT Secrets (SAVE THESE!):\n'));
  console.log(chalk.white(`  Access Secret:  ${chalk.yellow(config.JWT_ACCESS_SECRET)}`));
  console.log(chalk.white(`  Refresh Secret: ${chalk.yellow(config.JWT_REFRESH_SECRET)}\n`));

  // Database setup
  console.log(chalk.yellow('📦 Next Steps:\n'));
  const setupDb = await question(chalk.white('Setup database now? (Y/n): '));
  
  if (setupDb.toLowerCase() !== 'n') {
    try {
      console.log(chalk.gray('\n  Running: npm run prisma:generate'));
      execSync('npm run prisma:generate', { stdio: 'inherit' });
      
      console.log(chalk.gray('\n  Running: npm run prisma:migrate'));
      execSync('npm run prisma:migrate', { stdio: 'inherit' });
      
      console.log(chalk.gray('\n  Running: npm run prisma:seed'));
      execSync('npm run prisma:seed', { stdio: 'inherit' });
      
      console.log(chalk.green('\n✅ Database setup complete!\n'));
      console.log(chalk.white('Default admin credentials:'));
      console.log(chalk.cyan('  Email:    admin@example.com'));
      console.log(chalk.cyan('  Password: Admin@123\n'));
      
      const startServer = await question(chalk.white('Start development server? (Y/n): '));
      if (startServer.toLowerCase() !== 'n') {
        console.log(chalk.green('\n🚀 Starting development server...\n'));
        execSync('npm run start:dev', { stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Setup failed'));
      console.error(chalk.yellow('   You can run these commands manually:'));
      console.error(chalk.gray('   npm run prisma:generate'));
      console.error(chalk.gray('   npm run prisma:migrate'));
      console.error(chalk.gray('   npm run prisma:seed'));
      console.error(chalk.gray('   npm run start:dev\n'));
    }
  } else {
    console.log(chalk.white('\nRun these commands when ready:'));
    console.log(chalk.cyan('  npm run prisma:generate'));
    console.log(chalk.cyan('  npm run prisma:migrate'));
    console.log(chalk.cyan('  npm run prisma:seed'));
    console.log(chalk.cyan('  npm run start:dev\n'));
  }

  rl.close();
  console.log(chalk.magenta('Happy coding! 🎉\n'));
}

main().catch(error => {
  console.error(chalk.red('\n❌ Setup failed:'));
  console.error(chalk.red(`   ${error.message}\n`));
  rl.close();
  process.exit(1);
});
