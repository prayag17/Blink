const Store = require('electron-store');

const schema = {
    serverUrl: {
        type: 'string',
        default: ""
    },
    
    serverGo: {
        type: 'boolean',
        default: false
    },
};

const config = new Store({ schema });

module.exports = config;