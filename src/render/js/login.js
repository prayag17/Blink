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
        ipcRenderer.on('not-jf-server', () => {
            console.log('not a jf server');
            createServerErr();
        });
    };
}

const createServerErr = () => {
    // html = `<div class="popup error">
    //             <div class="icon">
    //                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
    //                     <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
    //                     <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
    //                 </svg>
    //             </div>
    //             <h2 class="text">The url given is not a valid JF server Url </h2>
    //         </div>`;
    // document.querySelector('main').insertAdjacentHTML('afterbegin', html);
    document.querySelector('.error').classList.remove('hide');
    document.querySelector('.error').classList.add('active');
};

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
