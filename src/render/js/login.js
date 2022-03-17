const { ipcRenderer } = require("electron");
const got = require('got');
const emitter = require('../../common/emitter');
const config = require("../../config");
const serverForm = document.querySelector('.server__cont');
const serverUrl = document.querySelector('.server__url');
const saveBtn = document.querySelector('.save__server');
const user__cont = document.querySelector('.users');

let html;

const createUserList = () => {
    ipcRenderer.send("waiting-for-userlist");
    document.querySelector('.loader').classList.remove('hide');
    ipcRenderer.on('userlist', (event, userlist) => {
        console.log(userlist);
        userlist.forEach(user => {
            if (user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" data-userid="${user.Id}" onclick="createEnterPassword(this.dataset.user, true, this.dataset.userid)"><h1>${user.Name}</h1><img class="user__img" src="${config.get('serverUrl')}/Users/${user.Id}/Images/Primary"></div>`;
            }
            else if (!user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" onclick="createEnterPassword(this.dataset.user, false)"><h1>${user.Name}</h1><img class="user__svg" src="../svg/avatar.svg"></div>`;
            }
            document.querySelector('.user__cont').insertAdjacentHTML('beforeend', html);
        });
        document.querySelector('.users').classList.remove('hide');
        document.querySelector('.users').scrollIntoView({ behavior: "smooth" });
        document.querySelector('.loader').classList.add('hide');
        setInterval(() => {
            document.querySelector('.server').classList.add('hide');
        }, 1000);
        // $('main').scrollTo('.users', '2s');
    });
    ipcRenderer.on('no-public-users', () => {
        document.querySelector('.loader').classList.add('hide');
        createManualLogin();
        document.querySelector('.manual__login').classList.remove('hide');
        document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
    });    
};

const closePopup = () => {
    document.querySelector('.popup__exit').addEventListener('click', () => {
        document.querySelector('.error').classList.remove('active');
        document.querySelector('.error').classList.add('fadeOut');
        document.querySelector('.popup__exit').classList.remove('active');
        document.querySelector('.popup__exit').classList.add('fadeOut');
        setTimeout(() => {
            document.querySelector('.error').classList.remove('fadeOut');
            document.querySelector('.popup__exit').classList.remove('fadeOut');
            document.querySelector('.error').classList.add('hide');
            document.querySelector('.popup__exit').classList.add('hide');
        }, 305);
    });
    
    document.querySelector('.popup__exit__btn').addEventListener('click', () => {
        document.querySelector('.error').classList.remove('active');
        document.querySelector('.error').classList.add('fadeOut');
        document.querySelector('.popup__exit').classList.remove('active');
        document.querySelector('.popup__exit').classList.add('fadeOut');
        setTimeout(() => {
            document.querySelector('.error').classList.remove('fadeOut');
            document.querySelector('.popup__exit').classList.remove('fadeOut');
            document.querySelector('.error').classList.add('hide');
            document.querySelector('.popup__exit').classList.add('hide');
        }, 300);
    });
};

const createServerErr = () => {
    document.querySelector('.error').classList.remove('hide');
    document.querySelector('.error').classList.add('active');
    document.querySelector('.popup__exit').classList.remove('hide');
    document.querySelector('.popup__exit').classList.add('active');
    closePopup();
};

const sendClearDataRequest = () => {
    ipcRenderer.send('clear-user-data');
    console.log('cleardata');
};


if (config.get('serverGo') == true) {
    document.querySelector('.loader').classList.remove('hide');
    ipcRenderer.send('check-server-status');
    ipcRenderer.on('server-online', () => {
        document.querySelector('.loader').classList.add('hide');
        createUserList();
    });
    ipcRenderer.on('server-offline', () => {
        html = `<button class="popup__cleardata__button" onclick="sendClearDataRequest()">
                    <span class="btn__label">Clear Data</span>
                </button>`;
        document.querySelector('.loader').classList.add('hide');
        document.querySelector('.popup__exit__btn').addEventListener('click', () => {
            ipcRenderer.send('reload-page');
        });
        document.querySelector('.error').insertAdjacentHTML('beforeend', html);
        createServerErr();
    });
} else if (config.get('serverGo') == false) {    
    saveBtn.onclick = () => {
        ipcRenderer.send('setServer', serverUrl.value);
        document.querySelector('.loader').classList.remove('hide');
        ipcRenderer.on('not-jf-server', () => {
            document.querySelector('.loader').classList.add('hide');
            createServerErr();
        });
    };
}


const createManualLogin = () => {
    html = `<div class="one">
                <input type="text" value="" class="user__name">
                <input type="password" value="" class="user__password">
                <input class="remember__user" type="checkbox" value="true">
                <input type="button" value="Login" class="user__login" onclick="sendAuthInfo()">
            </div>`;
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
};

const setLabelPos = (element) => {
    if (element.value.length < 1) {
        element.parentNode.querySelector('.input__label').classList.remove('inputLabelActive');
    } else {
        element.parentNode.querySelector('.input__label').classList.add('inputLabelActive');
    }
};

const createEnterPassword = (userName, userImg, userId) => {
    if (userImg == true) {
        html = `<div class="user">
                <div class="user__info">
                    <img class="user__img" src="${config.get('serverUrl')}/Users/${userId}/Images/Primary">
                    <h3 class="name">Hello, ${userName}</h3>
                </div>
                <div class="input">
                    <input type="password" value="" class="user__password" onblur="setLabelPos(this)">
                    <label for="user__password" class="input__label">Password</label>
                </div>
                <div class="input checkbox">
                    <label>Remember me</label>
                    <input class="remember__user" type="checkbox" value="true" style="-webkit-appearance: none;">
                    <svg class="tick" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.854 3.646L6.5 11L2.646 7.146" stroke="black" stroke-linecap="round"/>
                    </svg>
                </div>
                <button class="user__login clicky" data-user="${userName}" onclick="sendAuthInfo(this.dataset.user, document.querySelector('.user__password').value, document.querySelector('.remember__user'))">
                    <span>Login</span>
                </button>
            </div>`;
    } else if (userImg == false) {
        html = `<div class="user">
                <div class="user__info">
                    <img class="user__svg" src="../svg/avatar.svg">
                    <h3 class="name">Hello, ${userName}</h3>
                </div>
                <div class="input">
                    <input type="password" value="" class="user__password" onblur="setLabelPos(this)">
                    <label for="user__password" class="input__label">Password</label>
                </div>
                <div class="input checkbox">
                    <label>Remember me</label>
                    <input class="remember__user" type="checkbox" value="true" style="-webkit-appearance: none;">
                    <svg class="tick" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.854 3.646L6.5 11L2.646 7.146" stroke="black" stroke-linecap="round"/>
                    </svg>
                </div>
                <button class="user__login clicky" data-user="${userName}" onclick="sendAuthInfo(this.dataset.user, document.querySelector('.user__password').value, document.querySelector('.remember__user'))">
                    <span>Login</span>
                </button>
            </div>`;
    }
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
    setInterval(() => {
        document.querySelector('.users').classList.add('hide');
    }, 1000);
};

const sendAuthInfo = (userName, password, checkbox) =>{
    if (checkbox.checked == true) {
        ipcRenderer.send('user-auth-details', [userName, password, true]);
    } else {
        ipcRenderer.send('user-auth-details', [userName, password, false]);
    }
    ipcRenderer.on('user-auth-failed', () => {
        console.log('heloo');
        document.querySelector('.error').querySelector('.text').innerHTML = "Unable to login Please check your password";
        createServerErr();
    });
};


const changeServer = () => {
    html = `<div class="popup warning hide">
                <div class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                        <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                        <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                    </svg>
                </div>
                <h2 class="text">Are you sure, you want to remove your existing server?</h2>
                <button class="popup__exit__btn yes clicky" onclick="sendClearDataRequest()">
                    <span class="btn__label">Yes</span>
                </button>
                <button class="popup__exit__btn no clicky">
                    <span class="btn__label">No</span>
                </button>
            </div>`;
    document.querySelector('main').insertAdjacentHTML('beforeend', html);
    
    document.querySelector('.warning').classList.remove('hide');
    document.querySelector('.warning').classList.add('active');
    document.querySelector('.popup__exit').classList.remove('hide');
    document.querySelector('.popup__exit').classList.add('active');

    document.querySelector('.popup__exit').addEventListener('click', () => {
        document.querySelector('.warning').classList.remove('active');
        document.querySelector('.warning').classList.add('fadeOut');
        document.querySelector('.popup__exit').classList.remove('active');
        document.querySelector('.popup__exit').classList.add('fadeOut');
        setTimeout(() => {
            document.querySelector('.warning').classList.remove('fadeOut');
            document.querySelector('.popup__exit').classList.remove('fadeOut');
            document.querySelector('.warning').classList.add('hide');
            document.querySelector('.popup__exit').classList.add('hide');
            document.querySelector('.warning').remove();
        }, 305);
    });
    
    document.querySelector('.popup__exit__btn').addEventListener('click', () => {
        document.querySelector('.warning').classList.remove('active');
        document.querySelector('.warning').classList.add('fadeOut');
        document.querySelector('.popup__exit').classList.remove('active');
        document.querySelector('.popup__exit').classList.add('fadeOut');
        setTimeout(() => {
            document.querySelector('.warning').classList.remove('fadeOut');
            document.querySelector('.popup__exit').classList.remove('fadeOut');
            document.querySelector('.warning').classList.add('hide');
            document.querySelector('.popup__exit').classList.add('hide');
            document.querySelector('.warning').remove();
        }, 305);
    });
};