const { app, BrowserWindow, ipcMain } = require('electron');
const got = require('got');
const emitter = require('../common/emitter');
const config = require('../config');
const { Jellyfin } = require('@thornbill/jellyfin-sdk');

class HomePage {
    constructor() {
        this.createWindow();
        this.logoutRequest();
    }
    createWindow() {
        this.window = new BrowserWindow({
            width: 800,
            height: 700,
            center: true,
            resizable: true,
            maximizable: true,
            show: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.window.loadFile("./src/render/html/home.html");
        this.window.webContents.openDevTools();
    }
    logoutRequest() {
        ipcMain.on('logout-user', () => {
            emitter.emit('logout-user');
        });
    }
    showHome() {
        this.window.show();
    }
    hideHome() {
        this.window.hide();
    }
    closeHome() {
        this.window.close();
    }
}

module.exports = HomePage;