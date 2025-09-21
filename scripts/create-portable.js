const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Creating portable executable...\n');

const builtAppDir = path.join(process.cwd(), 'built-app');
const portableDir = path.join(process.cwd(), 'portable-app');

// 1. Verify built-app exists
if (!fs.existsSync(builtAppDir)) {
  console.error('❌ built-app directory not found!');
  console.log('💡 Run "npm run build:app" first');
  process.exit(1);
}

// 2. Clean portable directory
console.log('🧹 Cleaning portable directory...');
if (fs.existsSync(portableDir)) {
  fs.rmSync(portableDir, { recursive: true, force: true });
}

// 3. Check if dependencies are already installed
const packageJsonPath = path.join(builtAppDir, 'package.json');
let needsInstall = true;

if (fs.existsSync(path.join(builtAppDir, 'node_modules'))) {
  console.log('✅ Dependencies already installed, skipping...');
  needsInstall = false;
}

// 4. Install dependencies only if needed
if (needsInstall) {
  console.log('📥 Installing dependencies...');
  try {
    execSync('npm install electron electron-packager --save-dev', { 
      cwd: builtAppDir, 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// 5. Package the app
console.log('📦 Packaging application...');
try {
  const command = `npx electron-packager . "Caisse Secours" --platform=win32 --arch=x64 --out="../portable-app" --overwrite --ignore="node_modules/electron-packager"`;
  execSync(command, { 
    cwd: builtAppDir, 
    stdio: 'inherit' 
  });
} catch (error) {
  console.error('❌ Failed to package application');
  process.exit(1);
}

// 6. Create quick launch script in portable-app root
const launchScript = `@echo off
echo 🚀 Starting Caisse Secours...
cd "Caisse Secours-win32-x64"
"Caisse Secours.exe"
pause`;

fs.writeFileSync(path.join(portableDir, 'Launch Caisse Secours.bat'), launchScript);

console.log('\n🎉 Portable executable created successfully!');
console.log(`📍 Location: ${portableDir}`);
console.log('🚀 Double-click "Launch Caisse Secours.bat" to run the app');
console.log('💾 You can copy the entire portable-app folder to any Windows PC');
