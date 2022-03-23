const { app, BrowserWindow, ipcMain } = require('electron');
const got = require('got');
const emitter = require('../common/emitter');
const config = require('../config');
const api = require('../common/apiclient');
class LoginPage {
    constructor() {
        this.createWindow();
        this.setConfig();
        this.onstartUp();
        this.authUser();
        this.clearData();
        this.apiclient = api;
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
            icon: "../assets/icon.ico"
        });
        this.window.loadFile("./src/render/html/login.html");
        this.window.setMenu(null);
        this.window.maximize();
        this.window.webContents.openDevTools();
        this.window.on('closed', () => {
            emitter.emit('close-app');
        });
    }
    onstartUp() {
        ipcMain.on('check-server-status', (event) => {
            got.post(`${config.get('serverUrl')}/System/Ping`).then(async (response) => {
                if (response.body == '"Jellyfin Server"') {
                    event.sender.send('server-online');
                    this.serverOnline = true;
                    this.getUserlist();
                }
                else {
                    event.sender.send('server-offline');
                    this.serverOnline = true;
                }
            }).catch((er) => {
                let error;
                event.sender.send('server-offline');
                if (typeof er == 'string') {
                    error = er;
                } else {
                    error = "Can't connect to Jellyfin server";
                }
                console.log(error);
            });
        });
        ipcMain.on('reload-page', () => {
            app.relaunch();
            app.quit();
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
                    this.getUserlist();
                } else {
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
        this.window.once('ready-to-show', async () => {
            if (this.getUsers != false) {
                ipcMain.on('waiting-for-userlist', async (event) => {
                    this.users = await this.apiclient.userApi.getPublicUsers();
                    if (await this.users.length == 0) {
                        event.sender.send('no-public-users');
                    } else {
                        event.sender.send('userlist', this.users.data);
                    }
                });
            }
            ipcMain.on('userlist-recieved', () => {
                this.getUsers = false;
            });
        });
    }
    async authUser() {
        let auth;
        if (config.get('openHome') == true) {
            if (this.serverOnline == true) {
                try {
                    auth = await this.apiclient.authenticateUserByName(config.get('user.name'), config.get('user.pass'));
                    emitter.emit('logged-in');
                } catch (err) {
                    console.log(err);
                }
            }
        } else {
            this.window.once('ready-to-show', () => {
                ipcMain.on('user-auth-details', async (event, user) => {
                    try {
                        auth = await this.apiclient.authenticateUserByName(user[0], user[1]);
                        if (user[2] == true) {
                            config.set('user.name', user[0]);
                            config.set('user.pass', user[1]);
                            config.set('openHome', true);
                        }
                        emitter.emit('logged-in');
                    } catch (err) {
                        console.log(err);
                        event.sender.send('user-auth-failed');
                        
                    }
                });
            });
        }
    }
    clearData() {
        ipcMain.on('clear-user-data', async () => {
            config.clear();
            app.relaunch();
            app.quit();
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