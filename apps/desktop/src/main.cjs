const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#282b30",
    autoHideMenuBar: true,
    title: "Relay Desktop",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  const startUrl =
    process.env.RELAY_WEB_URL ||
    `file://${path.join(__dirname, "..", "..", "web", "dist", "index.html")}`;

  window.loadURL(startUrl);
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
