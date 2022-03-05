const { app, BrowserWindow } = require('electron');
const config = require("./config");
const LoginPage = require("./pages/login");

let loginPage;

function createWindow() {
  // mainWindow.webContents.openDevTools();
  if (config.get("server.go") != true) { 
    loginPage = new LoginPage();
  }
  // let window = new BrowserWindow({
  //   width: 800,
  //   height: 700,
  //   center: true,
  //   resizable: true,
  //   maximizable: true,
  //   show: true,
  //   webPreferences: {
  //     nodeIntegration: true
  //   }
  // });
  // // window.loadFile("../render/html/login.html");
  // window.loadFile('./src/render/html/login.html')
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
