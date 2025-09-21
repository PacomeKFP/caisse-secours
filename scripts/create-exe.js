const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("📦 Creating executable from built-app...\n");

const builtAppDir = path.join(process.cwd(), "built-app");
const distDir = path.join(process.cwd(), "dist-final");

// 1. Clean dist directory
console.log("🧹 Cleaning dist directory...");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Add electron-builder config to built-app
console.log("⚙️ Adding electron-builder configuration...");
const packageJsonPath = path.join(builtAppDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

packageJson.build = {
  appId: "com.caisse-secours.app",
  productName: "Caisse Secours",
  directories: {
    output: "../dist-final",
  },
  files: ["**/*"],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
    icon: "icon.ico",
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// 3. Create a simple icon (you can replace with a real one)
console.log("🎨 Creating default icon...");
const iconContent = `@echo off
rem This is a placeholder for icon.ico
rem Please replace with a real .ico file for better results`;
fs.writeFileSync(path.join(builtAppDir, "icon.txt"), iconContent);

// 4. Install electron-builder in built-app
console.log("📥 Installing electron-builder...");
try {
  execSync("npm install electron-builder --save-dev", {
    cwd: builtAppDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ Failed to install electron-builder");
  process.exit(1);
}

// 5. Build executable
console.log("🏗️ Building executable...");
try {
  execSync("npx electron-builder --win", {
    cwd: builtAppDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ Failed to build executable");
  process.exit(1);
}

console.log("\n🎉 Executable created successfully!");
console.log(`📍 Location: ${distDir}`);
console.log("🚀 Look for the .exe installer in dist-final folder");
