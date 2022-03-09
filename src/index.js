const { app, BrowserWindow } = require('electron');
const config = require("./config");
const emitter = require("./common/emitter");
const LoginPage = require("./pages/login");
const HomePage = require("./pages/home");

async function createWindow() {
  var loginPage = new LoginPage();
  var homePage = new HomePage();
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
    config.set('openHome',false);
    emitter.emit('reauth');
    loginPage.showLogin();
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
