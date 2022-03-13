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

    openHome: {
        type: 'boolean',
        default: false
    },

    // user: {
    //     name: {
    //         type: 'string',
    //         default: ""
    //     },
    //     pass: {
    //         type: 'string',
    //         default: ""
    //     }
    // }
};

const config = new Store({ schema });

module.exports = config;