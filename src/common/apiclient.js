const { Jellyfin } = require('@thornbill/jellyfin-sdk');
const config = require('../config');

var apiclient = new Jellyfin({
    clientInfo: {
        name: 'Mordern Jellyfin client in Electron',
        version: "0.0.1"
    },
    deviceInfo: {
        name: "JellyPlayer",
        id: "JellyPlayerClient"
    }
});
var api = apiclient.createApi(config.get('serverUrl'));

module.exports = api;