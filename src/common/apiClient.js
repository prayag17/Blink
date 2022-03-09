const { Jellyfin } = require('@thornbill/jellyfin-sdk');

class ApiClient {
    constructor() {
        this.apiClient = new Jellyfin({
            clientInfo: {
                name: 'Mordern Jellyfin client in Electron',
                version: "0.0.1"
            },
            deviceInfo: {
                name: "JellyPlayer",
                id: "JellyPlayerClient"
            }
        });
        this.api = this.apiClient.createApi(config.get('serverUrl'));
    }
}

module.exports = ApiClient;