const { app, BrowserWindow, ipcMain } = require('electron');
const got = require('got');
const emitter = require('../common/emitter');
const config = require('../config');
const ApiClient = require('@thornbill/jellyfin-sdk');
const { Jellyfin } = require('@thornbill/jellyfin-sdk');

class LoginPage {
    constructor() {
        this.createWindow();
        this.setConfig();
    }
    createWindow() {
        this.window = new BrowserWindow({
            width: 800,
            height: 700,
            center: true,
            resizable: true,
            maximizable: true,
            show: true,
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
        this.window.once('ready-to-show', () => {
            ipcMain.on('waiting-for-userlist', async (event) => {
                let api = this.apiclient.createApi(config.get('serverUrl'));
                let users = await api.userApi.getPublicUsers();
                console.log(users.data);
                event.sender.send('userlist', users.data);
            });
        })
    }
}

module.exports = LoginPage;