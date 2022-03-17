const { app, BrowserWindow } = require('electron');
const config = require("./config");
const emitter = require("./common/emitter");
const LoginPage = require("./pages/login");
const HomePage = require("./pages/home");

async function createWindow() {
  var splash = new BrowserWindow({
    width: 810,
    height: 610,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  splash.loadFile('./src/render/html/splash.html');
  var homePage = new HomePage();
  var loginPage = new LoginPage();
  loginPage.window.on('ready-to-show', () => {
    splash.destroy();
    if (!config.get('serverUrl')) {
      loginPage.showLogin();
    } else if (config.get('openHome') == false) {
      loginPage.showLogin();
    }
    emitter.on('logged-in', () => {
      loginPage.hideLogin();
      homePage.showHome();
    });
    emitter.on('closeHome', () => {
      homePage.hideHome();
      config.set('openHome', false);
      app.relaunch();
      app.exit(0);
    });
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.exit(0);
  }
});
