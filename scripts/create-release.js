const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Creating release package...\n");

// 1. Lire la version depuis package.json
const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

console.log(`📦 Building version ${version}...`);

// 2. Build l'application
console.log("🏗️ Building application...");
try {
  execSync("npm run build:app", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Build failed");
  process.exit(1);
}

// 3. Créer l'exécutable portable
console.log("📱 Creating portable executable...");
try {
  execSync("npm run create:portable", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Portable creation failed");
  process.exit(1);
}

// 4. Créer l'archive de release
const releaseDir = path.join(process.cwd(), "release");
const portableDir = path.join(process.cwd(), "portable-app");

console.log("📦 Creating release archive...");

// Nettoyer le dossier release
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// Copier l'app portable dans release
const appSource = path.join(portableDir, "Caisse Secours-win32-x64");
const appTarget = path.join(releaseDir, "Caisse Secours");

if (fs.existsSync(appSource)) {
  fs.cpSync(appSource, appTarget, { recursive: true });
} else {
  console.error("❌ Portable app not found");
  process.exit(1);
}

// Copier le lanceur
const launcherSource = path.join(portableDir, "Launch Caisse Secours.bat");
const launcherTarget = path.join(releaseDir, "Launch Caisse Secours.bat");

if (fs.existsSync(launcherSource)) {
  fs.copyFileSync(launcherSource, launcherTarget);
}

// Créer le fichier README de release
const releaseReadme = `# Caisse Secours v${version}

## Installation

1. Extraire tous les fichiers dans un dossier
2. Double-cliquer sur "Launch Caisse Secours.bat"
3. Ou naviguer vers le dossier "Caisse Secours" et lancer "Caisse Secours.exe"

## Mise à jour

1. Fermez l'ancienne version
2. Sauvegardez votre fichier database.db si nécessaire
3. Remplacez l'ancien dossier par le nouveau
4. Relancez l'application

## Support

Pour toute question ou problème, contactez le support technique.

Version: ${version}
Date de build: ${new Date().toLocaleDateString("fr-FR")}
`;

fs.writeFileSync(path.join(releaseDir, "README.txt"), releaseReadme);

// 5. Créer l'archive ZIP
const archiveName = `Caisse-Secours-v${version}-portable.zip`;

console.log(`🗜️ Creating ZIP archive: ${archiveName}`);

try {
  // Utiliser PowerShell pour créer le ZIP
  const command = `powershell -Command "Compress-Archive -Path 'release\\*' -DestinationPath '${archiveName}' -Force"`;
  execSync(command, { stdio: "inherit" });
} catch (error) {
  console.error("❌ ZIP creation failed");
  process.exit(1);
}

console.log("\n🎉 Release package created successfully!");
console.log(`📍 Archive: ${archiveName}`);
console.log(`📁 Contents: ${releaseDir}`);
console.log("\n💡 Next steps:");
console.log("1. Test the release package");
console.log("2. Create a GitHub release");
console.log("3. Upload the ZIP file as an asset");
console.log(`4. Tag the release as v${version}`);

// 6. Nettoyer les dossiers temporaires
console.log("\n🧹 Cleaning temporary files...");
setTimeout(() => {
  try {
    fs.rmSync(releaseDir, { recursive: true, force: true });
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.log("⚠️ Manual cleanup may be needed");
  }
}, 1000);
