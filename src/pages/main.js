const { app, BrowserWindow, ipcMain } = require('electron');
const got = require('got');
const emitter = require('../common/emitter');
const config = require('../config');
const { Jellyfin } = require('@thornbill/jellyfin-sdk');

class MainPage {
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
        this.window.loadFile("./src/render/html/main.html");
        this.window.webContents.openDevTools();
        this.window.setMenu(null);
        this.window.maximize();
        this.window.on('closed', () => {
            emitter.emit('close-app');
        });
    }
    logoutRequest() {
        ipcMain.on('logout-user', () => {
            emitter.emit('logout-user');
        });
    }
    showMain() {
        this.window.show();
    }
    hideMain() {
        this.window.hide();
    }
}

module.exports = MainPage;