const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let mainWindow;
let nextServer;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1200, height: 800 });
  mainWindow.loadURL("http://localhost:42424");
}

app.whenReady().then(() => {
  // Lancer Next.js en prod sur port 42424
  nextServer = spawn("npx", ["next", "start"], {
    cwd: __dirname + "/../",
    env: { ...process.env, PORT: "42424" },
    stdio: "inherit",
    shell: true,
  });
  // Attendre que le serveur démarre
  setTimeout(createWindow, 5000);
});

app.on("window-all-closed", () => {
  if (nextServer) nextServer.kill();
  app.quit();
});
