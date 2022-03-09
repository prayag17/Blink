const { ipcRenderer } = require("electron");
const emitter = require('../../common/emitter');
const config = require("../../config");
const serverForm = document.querySelector('.server__cont');
const serverUrl = document.querySelector('.server__url');
const saveBtn = document.querySelector('.save__server');

let html;

if (config.get('serverGo') == true) {
    ipcRenderer.send("waiting-for-userlist");
    serverForm.classList.add("hide");
    ipcRenderer.on('userlist', (event, userlist) => {
        userlist.forEach(user => {
            if (user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" onclick="createManualLoginFilled(this.dataset.user)"><h1>${user.Name}</h1><img src="${config.get('serverUrl')}/Users/${user.Id}/Images/Primary"></div>`;
            }
            else if (!user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" onclick="createManualLoginFilled(this.dataset.user)"><h1>${user.Name}</h1><img src="../svg/avatar.svg"></div>`;
            }
            document.querySelector('.user__cont').insertAdjacentHTML('beforeend', html);
        });
        emitter.emit('user_card_created');
    });
} else if (config.get('serverGo') == false) {
    saveBtn.onclick = () => { 
        ipcRenderer.send('setServer', serverUrl.value);
    };
}

const createManualLoginFilled = (userName) => {
    html = `<div class="one"><input type="text" value="${userName}" class="user__name"><input type="password" value="" class="user__password"><input class="remember__user" type="checkbox" value="true"><input type="button" value="Login" class="user__login" onclick="sendAuthInfo()"></div>`;
    document.querySelector('.user__cont').classList.add('hide');
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
};

const sendAuthInfo = () => {
    const user_name = document.querySelector('.user__name');
    const user_pass = document.querySelector('.user__password');
    if (document.querySelector(".remember__user").checked == true) {
        ipcRenderer.send('user-auth-details', [user_name.value, user_pass.value, true]);
    } else {
        ipcRenderer.send('user-auth-details', [user_name.value, user_pass.value, false]);
    }
};