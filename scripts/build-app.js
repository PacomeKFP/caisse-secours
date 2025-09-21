const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Building Caisse Secours App...\n');

const projectRoot = process.cwd();
const buildDir = path.join(projectRoot, 'built-app');

// 1. Clean build directory
console.log('🧹 Cleaning build directory...');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// 2. Build Next.js
console.log('📦 Building Next.js application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Next.js build failed');
  process.exit(1);
}

// 3. Copy files to build directory
console.log('📁 Copying files to build directory...');

// Copy standalone Next.js build
const standaloneSource = path.join(projectRoot, '.next', 'standalone');
const standaloneTarget = path.join(buildDir, 'standalone');
if (fs.existsSync(standaloneSource)) {
  fs.cpSync(standaloneSource, standaloneTarget, { recursive: true });
  console.log('✅ Copied standalone build');
} else {
  console.error('❌ Standalone build not found. Make sure next.config.js has output: "standalone"');
  process.exit(1);
}

// Copy static files
const staticSource = path.join(projectRoot, '.next', 'static');
const staticTarget = path.join(standaloneTarget, '.next', 'static');
if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, staticTarget, { recursive: true });
  console.log('✅ Copied static files');
}

// Copy public files
const publicSource = path.join(projectRoot, 'public');
const publicTarget = path.join(standaloneTarget, 'public');
if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, publicTarget, { recursive: true });
  console.log('✅ Copied public files');
}

// Copy electron files
const electronSource = path.join(projectRoot, 'electron');
const electronTarget = path.join(buildDir, 'electron');
fs.cpSync(electronSource, electronTarget, { recursive: true });
console.log('✅ Copied electron files');

// Copy database
const dbSource = path.join(projectRoot, 'database.db');
const dbTarget = path.join(buildDir, 'database.db');
if (fs.existsSync(dbSource)) {
  fs.copyFileSync(dbSource, dbTarget);
  console.log('✅ Copied database');
}

// Copy package.json (only needed fields)
const packageJson = {
  name: "caisse-secours-app",
  version: "1.2.0",
  main: "electron/main.js",
  scripts: {
    start: "electron ."
  }
};
fs.writeFileSync(
  path.join(buildDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
console.log('✅ Created package.json');

// Create start script
const startScript = `@echo off
echo Starting Caisse Secours...
electron .
pause`;
fs.writeFileSync(path.join(buildDir, 'start.bat'), startScript);
console.log('✅ Created start.bat');

// Create README
const readme = `# Caisse Secours - Built Application

## Installation
1. Make sure Node.js is installed
2. Run: npm install electron -g
3. Double-click start.bat or run: electron .

## Files Structure
- electron/          → Electron main process
- standalone/        → Next.js application
- database.db        → Application database
- start.bat          → Quick start script
`;
fs.writeFileSync(path.join(buildDir, 'README.md'), readme);
console.log('✅ Created README.md');

console.log('\n🎉 Build completed successfully!');
console.log(`📍 Build location: ${buildDir}`);
console.log('🚀 To run: cd built-app && electron .');
