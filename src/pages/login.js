const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const got = require('got');
const emitter = require('../common/emitter');
const config = require('../config');
const { Jellyfin } = require('@thornbill/jellyfin-sdk');

var icon = nativeImage.createFromPath('../assets/icon.png');

class LoginPage {
    constructor() {
        this.createWindow();
        this.setConfig();
        this.onstartUp();
        this.authUser();
        this.logoutUser();
        this.getUserlist();
        this.clearData();
    }
    createWindow() {
        this.window = new BrowserWindow({
            width: 800,
            height: 700,
            center: true,
            resizable: true,
            maximizable: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            show: false,
            icon: icon
        });
        this.window.loadFile("./src/render/html/login.html");
        this.window.webContents.openDevTools();
        this.window.setMenu(null);
        this.window.maximize();
    }
    onstartUp() {
        ipcMain.on('check-server-status', (event) => {
            got.post(`${config.get('serverUrl')}/System/Ping`).then(async (response) => {
                if (response.body == '"Jellyfin Server"') {
                    event.sender.send('server-online');
                    this.serverOnline = true;
                }
                else {
                    event.sender.send('server-offline');
                    this.serverOnline = true;
                }
            }).catch((er) => {
                let error;
                event.sender.send('server-offline');
                if (typeof er == 'string') {
                    error = e;
                } else {
                    error = "Can't connect to Jellyfin server";
                }
            });
        });
        ipcMain.on('reload-page', () => {
            this.window.reload();
        });
    }
    setConfig() {
        ipcMain.on('setServer', (event, serverUrl) => {
            serverUrl = serverUrl.replace(/\/+$/, '');
            got.post(`${serverUrl}/System/Ping`).then(async (response) => {
                if (response.body == '"Jellyfin Server"') {
                    event.sender.send('is-jf-server');
                    config.set('serverUrl', serverUrl);
                    config.set('serverGo', true);
                    this.window.reload();
                }
                else {
                    event.sender.send('not-jf-server');
                }
            }).catch((er) => {
                let error;
                event.sender.send('not-jf-server');
                if (typeof er == 'string') {
                    error = e;
                } else {
                    error = "The given server url is not a Jellyfin server url";
                }
            });
        });
    }
    getUserlist() {
        this.apiclient = new Jellyfin({
            clientInfo: {
                name: 'Mordern Jellyfin client in Electron',
                version: "0.0.1"
            },
            deviceInfo: {
                name: "JellyPlayer",
                id: "JellyPlayerClient"
            }
        });
        this.api = this.apiclient.createApi(config.get('serverUrl'));
        this.window.once('ready-to-show', () => {
            ipcMain.on('waiting-for-userlist', async (event) => {
                let users = await this.api.userApi.getPublicUsers();
                if (users.data.length == 0) {
                    event.sender.send('no-public-users');
                } else {
                    event.sender.send('userlist', users.data);
                }
            });
        });
    }
    async authUser() {
        let auth;
        if (config.get('openHome') == true) {
            if (this.serverOnline == true) {
                try {
                    auth = await this.api.authenticateUserByName(config.get('user.name'), config.get('user.pass'));
                    emitter.emit('logged-in');
                } catch (err) {
                    console.log(err);
                }
            }
        } else {
            this.window.once('ready-to-show', () => {
                ipcMain.on('user-auth-details', async (event, user) => {
                    try {
                        auth = await this.api.authenticateUserByName(user[0], user[1]);
                        if (user[2] == true) {
                            config.set('user.name', user[0]);
                            config.set('user.pass', user[1]);
                            config.set('openHome', true);
                        }
                        emitter.emit('logged-in');
                    } catch (err) {
                        console.log("err");
                        event.sender.send('user-auth-failed');
                        
                    }
                });
            });
        }
    }
    logoutUser() {
        emitter.on('logout-user', async () => {
            await this.api.logout();
            emitter.emit('closeHome');
        });
    }
    clearData() {
        ipcMain.on('clear-user-data', async () => {
            config.clear();
            this.window.reload();
        });
    }
    showLogin() {
        this.window.show();
    }
    hideLogin() {
        this.window.hide();
    }
}

module.exports = LoginPage;