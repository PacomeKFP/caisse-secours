const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning all generated files...\n');

const projectRoot = process.cwd();
const foldersToClean = [
  'built-app',
  'portable-app', 
  'dist-electron',
  'dist-electron-new',
  'dist-final',
  'single-exe',
  '.next'
];

let cleanedCount = 0;

foldersToClean.forEach(folderName => {
  const folderPath = path.join(projectRoot, folderName);
  
  if (fs.existsSync(folderPath)) {
    try {
      console.log(`🗑️  Removing ${folderName}/`);
      fs.rmSync(folderPath, { recursive: true, force: true });
      cleanedCount++;
    } catch (error) {
      console.error(`❌ Failed to remove ${folderName}: ${error.message}`);
    }
  } else {
    console.log(`⏭️  ${folderName}/ (not found)`);
  }
});

// Also clean any package-lock files in build directories
const buildLockFiles = [
  'built-app/package-lock.json',
  'built-app/node_modules'
];

buildLockFiles.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`🗑️  Removing ${filePath}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
      cleanedCount++;
    } catch (error) {
      console.error(`❌ Failed to remove ${filePath}: ${error.message}`);
    }
  }
});

console.log(`\n✨ Cleanup completed! Removed ${cleanedCount} items.`);
console.log('📁 Your project is now clean and ready for a fresh build.');
console.log('\n💡 To rebuild:');
console.log('   1. npm run build:app');
console.log('   2. npm run create:portable');
