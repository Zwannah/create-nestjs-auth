#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Validation helpers
function validateAppName(name) {
  if (!/^[a-z0-9-_@/]+$/i.test(name)) {
    console.error(chalk.red('❌ App name must contain only letters, numbers, hyphens, underscores, @ and /'));
    console.error(chalk.yellow('   Valid examples: my-app, @myorg/app, my_app_123'));
    process.exit(1);
  }
  
  if (name.length > 214) {
    console.error(chalk.red('❌ App name must be less than 214 characters (npm restriction)'));
    process.exit(1);
  }

  const reservedNames = ['node_modules', 'favicon.ico'];
  if (reservedNames.includes(name.toLowerCase())) {
    console.error(chalk.red(`❌ "${name}" is a reserved name and cannot be used`));
    process.exit(1);
  }
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const major = parseInt(currentVersion.split('.')[0].slice(1));
  
  if (major < 20) {
    console.error(chalk.red(`❌ Node.js ${currentVersion} is not supported`));
    console.error(chalk.yellow('   This template requires Node.js >= 20.x'));
    console.error(chalk.cyan('   Please upgrade: https://nodejs.org/'));
    process.exit(1);
  }
}

function detectPackageManager() {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return 'bun';
  } catch {
    try {
      execSync('pnpm --version', { stdio: 'ignore' });
      return 'pnpm';
    } catch {
      try {
        execSync('yarn --version', { stdio: 'ignore' });
        return 'yarn';
      } catch {
        return 'npm';
      }
    }
  }
}

function getInstallCommand(packageManager) {
  switch (packageManager) {
    case 'npm':
      return 'npm install';
    case 'yarn':
      return 'yarn install';
    case 'pnpm':
      return 'pnpm install';
    case 'bun':
      return 'bun install';
    default:
      return 'npm install';
  }
}

program
  .name('create-nestjs-auth')
  .version('1.0.0')
  .description('Create a production-ready NestJS authentication system')
  .argument('<app-name>', 'Name of your application')
  .option('--skip-install', 'Skip automatic dependency installation')
  .option('--package-manager <pm>', 'Package manager to use (npm|pnpm|yarn|bun)')
  .option('--skip-git', 'Skip git repository initialization')
  .action(async (appName, options) => {
    try {
      console.log(chalk.cyan('\n⚡️ create-nestjs-auth\n'));

      // Check Node.js version
      checkNodeVersion();

      // Validate app name
      validateAppName(appName);

      const targetDir = path.join(process.cwd(), appName);
      
      // Check if directory exists
      if (await fs.pathExists(targetDir)) {
        console.error(chalk.red(`❌ Directory "${appName}" already exists`));
        console.error(chalk.yellow('   Please choose a different name or remove the existing directory'));
        process.exit(1);
      }

      console.log(chalk.blue(`🚀 Creating ${chalk.bold(appName)}...\n`));
      
      const templateDir = path.join(__dirname, 'template');
      
      // Verify template exists
      if (!(await fs.pathExists(templateDir))) {
        console.error(chalk.red('❌ Template directory not found'));
        console.error(chalk.yellow('   Please reinstall create-nestjs-auth: npm install -g create-nestjs-auth'));
        process.exit(1);
      }

      // Copy template files (exclude .git directory)
      console.log(chalk.gray('   Copying template files...'));
      await fs.copy(templateDir, targetDir, {
        filter: (src) => {
          const relativePath = path.relative(templateDir, src);
          // Exclude .git directory and node_modules
          return !relativePath.startsWith('.git') && 
                 !relativePath.includes('node_modules') &&
                 !relativePath.includes('dist');
        }
      });

      // Update package.json
      console.log(chalk.gray('   Updating package.json...'));
      const packageJsonPath = path.join(targetDir, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        packageJson.name = appName;
        packageJson.version = '0.0.1';
        delete packageJson.private; // Allow publishing if user wants
        await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
      }

      // Create .env from .env.example
      console.log(chalk.gray('   Setting up environment variables...'));
      const envExamplePath = path.join(targetDir, '.env.example');
      const envPath = path.join(targetDir, '.env');
      
      if (await fs.pathExists(envExamplePath)) {
        const envExample = await fs.readFile(envExamplePath, 'utf8');
        await fs.writeFile(envPath, envExample);
      } else {
        console.warn(chalk.yellow('   ⚠️  .env.example not found, skipping .env creation'));
      }

      // Install dependencies
      if (!options.skipInstall) {
        const pm = options.packageManager || detectPackageManager();
        const installCmd = getInstallCommand(pm);
        
        console.log(chalk.yellow(`\n📦 Installing dependencies with ${chalk.bold(pm)}...`));
        console.log(chalk.gray(`   Running: ${installCmd}\n`));
        
        try {
          execSync(installCmd, { 
            cwd: targetDir, 
            stdio: 'inherit',
            timeout: 300000 // 5 minute timeout
          });
        } catch (error) {
          console.error(chalk.red('\n❌ Dependency installation failed'));
          console.error(chalk.yellow('   You can try installing manually:'));
          console.error(chalk.cyan(`     cd ${appName}`));
          console.error(chalk.cyan(`     ${installCmd}`));
          process.exit(1);
        }
      } else {
        console.log(chalk.gray('\n   Skipping dependency installation (--skip-install)'));
      }

      // Initialize git repository
      if (!options.skipGit) {
        console.log(chalk.yellow('\n🔧 Initializing git repository...'));
        try {
          execSync('git init', { cwd: targetDir, stdio: 'ignore' });
          execSync('git add -A', { cwd: targetDir, stdio: 'ignore' });
          execSync('git commit -m "Initial commit from create-nestjs-auth"', { 
            cwd: targetDir, 
            stdio: 'ignore' 
          });
          console.log(chalk.gray('   Git repository initialized with initial commit'));
        } catch (error) {
          console.warn(chalk.yellow('   ⚠️  Git initialization failed (git may not be installed)'));
        }
      } else {
        console.log(chalk.gray('\n   Skipping git initialization (--skip-git)'));
      }

      // Success message
      console.log(chalk.green('\n✅ Success! Created ' + chalk.bold(appName)));
      console.log(chalk.white('\n📚 Next steps:\n'));
      console.log(chalk.cyan(`   cd ${appName}`));
      
      if (options.skipInstall) {
        const pm = options.packageManager || detectPackageManager();
        console.log(chalk.cyan(`   ${getInstallCommand(pm)}`));
      }
      
      console.log(chalk.cyan('   \n   # Generate secure JWT secrets (save these!):'));
      console.log(chalk.gray('   openssl rand -base64 32  # For JWT_ACCESS_SECRET'));
      console.log(chalk.gray('   openssl rand -base64 32  # For JWT_REFRESH_SECRET'));
      
      console.log(chalk.cyan('\n   # Edit .env with your database URL and JWT secrets'));
      console.log(chalk.cyan('   # Then setup the database:'));
      console.log(chalk.gray('   npm run prisma:generate'));
      console.log(chalk.gray('   npm run prisma:migrate'));
      console.log(chalk.gray('   npm run prisma:seed'));
      
      console.log(chalk.cyan('\n   # Start development server:'));
      console.log(chalk.gray('   npm run start:dev'));
      
      console.log(chalk.white('\n📖 Documentation: https://github.com/masabinhok/nestjs-jwt-rbac-boilerplate'));
      console.log(chalk.white('🐛 Issues: https://github.com/masabinhok/create-nestjs-auth/issues\n'));
      
      console.log(chalk.magenta('Happy coding! 🎉\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ An unexpected error occurred:'));
      console.error(chalk.red(`   ${error.message}`));
      
      if (error.stack) {
        console.error(chalk.gray('\n   Stack trace:'));
        console.error(chalk.gray(error.stack));
      }
      
      console.error(chalk.yellow('\n   If this persists, please report it:'));
      console.error(chalk.cyan('   https://github.com/masabinhok/create-nestjs-auth/issues\n'));
      process.exit(1);
    }
  });

program.parse();