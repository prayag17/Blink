const { ipcRenderer } = require("electron");
const emitter = require('../../common/emitter');
// const {fetch} = require('got-fetch');
const config = require("../../config");
const serverForm = document.querySelector('.server__cont');
const serverUrl = document.querySelector('.server__url');
const saveBtn = document.querySelector('.save__server');

let html;

if (config.get('serverGo') == true) {
    ipcRenderer.send("waiting-for-userlist");
    serverForm.classList.add("hide");
    ipcRenderer.on('userlist', (event, userlist) => {
        console.log(userlist);
        userlist.forEach(user => {
            if (user.PrimaryImageTag) {
                html = `<div><h1>${user.Name}</h1><img src="${config.get('serverUrl')}/Users/${user.Id}/Images/Primary"></div>`;
            }
            else if (!user.PrimaryImageTag) {
                html = `<div><h1>${user.Name}</h1><img src="../svg/avatar.svg"></div>`;
            }
            document.querySelector('.user__cont').insertAdjacentHTML('beforeend', html);
            console.log(user);
        });
    });
} else if (config.get('serverGo') == false) {
    saveBtn.onclick = () => { 
        ipcRenderer.send('setServer', serverUrl.value);
    };
}