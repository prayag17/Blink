const { app, BrowserWindow } = require('electron');
const config = require("./config");
const emitter = require("./common/emitter");
const LoginPage = require("./pages/login");
const MainPage = require("./pages/main");

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
  var mainPage = new MainPage();
  var loginPage = new LoginPage();
  loginPage.window.on('ready-to-show', () => {
    splash.destroy();
    if (config.get('openHome') == false) {
      loginPage.showLogin();
    } else if (config.get('openHome') == true) {
      loginPage.hideLogin();
      mainPage.showMain();
    }
    emitter.on('logged-in', () => {
      loginPage.hideLogin();
      mainPage.showMain();
    });
  });
}

app.whenReady().then(() => {
  createWindow();
});

emitter.on('close-app', () => {
  app.quit();
});