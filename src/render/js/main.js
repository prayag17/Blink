const { ipcRenderer } = require("electron");
const emitter = require('../../common/emitter');
const config = require("../../config");
const logoutBtn = document.querySelector('.user__logout');

const sendLogoutRequest = () => {
    ipcRenderer.send('logout-user');
};