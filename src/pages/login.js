const { app, BrowserWindow, ipcMain } = require('electron');
const got = require('got');
const emitter = require('../common/emitter');
const config = require('../config');
const { Jellyfin } = require('@thornbill/jellyfin-sdk');

class LoginPage {
    constructor() {
        this.createWindow();
        this.setConfig();
        this.authUser();
        this.logoutUser();
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
        this.window.loadFile("./src/render/html/login.html");
        this.window.webContents.openDevTools();
    }
    setConfig() {
        if (config.get('serverGo') == false) {
            ipcMain.on('setServer', (event, serverUrl) => {
                serverUrl = serverUrl.replace(/\/+$/, '');
                got.post(`${serverUrl}/System/Ping`).then(async (response) => {
                    if (response.body == '"Jellyfin Server"') {
                        config.set('serverUrl', serverUrl);
                        config.set('serverGo', true);
                        this.getUserlist();
                    }
                    else {
                        console.log(response.body);
                    }
                }).catch((er) => {
                    console.log(er);
                    let error;
                    
                    if (typeof er == 'string') {
                        error = e;
                    } else {
                        error = "The given server url is not a Jellyfin server url";
                    }
                });
                // this.apiclient = new ApiClient();
            });
        } else if (config.get('serverGo') == true) {
            this.getUserlist();
        }
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
                event.sender.send('userlist', users.data);
            });
        });
    }
    async authUser() {
        let auth;
        if (config.get('openHome') == true) {
            try {
                auth = await this.api.authenticateUserByName(config.get('user.name'), config.get('user.pass'));
                emitter.emit('logged-in');
            } catch(err) {
                console.log(err);
            }
        } else {
            this.window.once('ready-to-show', () => {
                ipcMain.on('user-auth-details', async (e, user) => {
                    try {
                        auth = await this.api.authenticateUserByName(user[0], user[1]);
                        console.log("Auth =>", auth.data);
                        if (user[2] == true) {
                            config.set('user.name', user[0]);
                            config.set('user.pass', user[1]);
                            config.set('openHome', true);
                        }
                        emitter.emit('logged-in');
                    } catch (err) {
                        console.log(err);
                    }
                });
            });
        }
        emitter.on('reauth', () => {
            this.window.once('ready-to-show', () => {
                ipcMain.on('user-auth-details', async (e, user) => {
                    try {
                        auth = await this.api.authenticateUserByName(user[0], user[1]);
                        console.log("Auth =>", auth.data);
                        if (user[2] == true) {
                            config.set('user.name', user[0]);
                            config.set('user.pass', user[1]);
                            config.set('openHome', true);
                        }
                        emitter.emit('logged-in');
                    } catch (err) {
                        console.log(err);
                    }
                });
            });
        });
    }
    logoutUser() {
        emitter.on('logout-user', async () => {
            console.log('he');
            await this.api.logout();
            emitter.emit('closeHome');
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