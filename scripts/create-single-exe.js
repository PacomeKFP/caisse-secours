const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("📦 Creating single executable with pkg...\n");

const builtAppDir = path.join(process.cwd(), "built-app");
const singleExeDir = path.join(process.cwd(), "single-exe");

// 1. Clean single-exe directory
console.log("🧹 Cleaning single-exe directory...");
if (fs.existsSync(singleExeDir)) {
  fs.rmSync(singleExeDir, { recursive: true, force: true });
}
fs.mkdirSync(singleExeDir, { recursive: true });

// 2. Create launcher script
console.log("📝 Creating launcher script...");
const launcherScript = `
const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let mainWindow;
let serverProcess;
const PROD_PORT = 42424;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  setTimeout(() => {
    mainWindow.loadURL(\`http://localhost:\${PROD_PORT}\`);
  }, 3000);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

function startServer() {
  const standaloneDir = path.join(__dirname, "standalone");
  serverProcess = spawn("node", ["server.js"], {
    cwd: standaloneDir,
    env: { ...process.env, PORT: PROD_PORT.toString() },
    stdio: "inherit",
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});
`;

fs.writeFileSync(path.join(singleExeDir, "launcher.js"), launcherScript);

// 3. Copy standalone app
console.log("📁 Copying standalone app...");
const standaloneSource = path.join(builtAppDir, "standalone");
const standaloneTarget = path.join(singleExeDir, "standalone");
fs.cpSync(standaloneSource, standaloneTarget, { recursive: true });

// 4. Copy database
const dbSource = path.join(builtAppDir, "database.db");
const dbTarget = path.join(singleExeDir, "database.db");
if (fs.existsSync(dbSource)) {
  fs.copyFileSync(dbSource, dbTarget);
}

// 5. Create package.json for pkg
const pkgPackageJson = {
  name: "caisse-secours-launcher",
  version: "1.0.0",
  main: "launcher.js",
  pkg: {
    assets: ["standalone/**/*", "database.db"],
    targets: ["node18-win-x64"],
  },
};
fs.writeFileSync(
  path.join(singleExeDir, "package.json"),
  JSON.stringify(pkgPackageJson, null, 2)
);

// 6. Install pkg
console.log("📥 Installing pkg...");
try {
  execSync("npm install pkg --save-dev", {
    cwd: singleExeDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ Failed to install pkg");
  process.exit(1);
}

// 7. Create executable
console.log("🏗️ Creating single executable...");
try {
  execSync("npx pkg . --output caisse-secours.exe", {
    cwd: singleExeDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ Failed to create executable");
  process.exit(1);
}

console.log("\n🎉 Single executable created successfully!");
console.log(`📍 Location: ${path.join(singleExeDir, "caisse-secours.exe")}`);
console.log("🚀 You have a single .exe file that contains everything!");
