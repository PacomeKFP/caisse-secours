const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let mainWindow;
let serverProcess;
const isDev = process.env.NODE_ENV === "development";

// Configuration
const DEV_PORT = 3000;
const PROD_PORT = 42424;
const STARTUP_DELAY = isDev ? 5000 : 3000; // Plus de temps en dev pour la compilation

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Masquer jusqu'au chargement
  });

  const port = isDev ? DEV_PORT : PROD_PORT;
  const url = `http://localhost:${port}`;

  console.log(`🚀 Loading app from: ${url}`);

  // Charger l'URL après délai
  setTimeout(() => {
    mainWindow.loadURL(url);
  }, STARTUP_DELAY);

  // Afficher la fenêtre quand elle est prête
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
}

function startServer() {
  if (isDev) {
    // MODE DEV: npm run dev
    console.log("🔧 Starting Next.js development server...");
    serverProcess = spawn("npm", ["run", "dev"], {
      stdio: "inherit",
      shell: true,
    });
  } else {
    // MODE PROD: node server.js depuis standalone
    console.log("🏭 Starting Next.js production server...");
    const standaloneDir = path.join(__dirname, "../.next/standalone");
    serverProcess = spawn("node", ["server.js"], {
      cwd: standaloneDir,
      env: { ...process.env, PORT: PROD_PORT.toString() },
      stdio: "inherit",
      shell: true,
    });
  }

  serverProcess.on("error", (error) => {
    console.error("❌ Server failed to start:", error);
  });

  serverProcess.on("close", (code) => {
    console.log(`📴 Server process exited with code ${code}`);
  });
}

// Démarrage de l'app
app.whenReady().then(() => {
  startServer();
  createWindow();
});

// Gestion de la fermeture
app.on("window-all-closed", () => {
  if (serverProcess) {
    console.log("🛑 Stopping server...");
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestion des erreurs
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
});

console.log(`🎯 Electron starting in ${isDev ? "DEVELOPMENT" : "PRODUCTION"} mode`);
