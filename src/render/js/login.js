const { ipcRenderer } = require("electron");
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
        event.sender.send('userlist-recieved');
        userlist.forEach(user => {
            if (user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" data-userid="${user.Id}" onclick="createEnterPassword(this.dataset.user, true, this.dataset.userid)">
                <div class="content">
                <img class="user__img" src="${config.get('serverUrl')}/Users/${user.Id}/Images/Primary">
                <h1>${user.Name}</h1>
                </div>
                </div>`;
            }
            else if (!user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" onclick="createEnterPassword(this.dataset.user, false)">
                <div class="content">
                <img class="user__svg" src="../svg/avatar.svg">
                <h1>${user.Name}</h1>
                </div>        
                </div>`;
            }
            document.querySelector('.user__cont').insertAdjacentHTML('beforeend', html);
        });
        document.querySelector('.users').classList.remove('hide');
        document.querySelector('.users').scrollIntoView({ behavior: "smooth" });
        document.querySelector('.loader').classList.add('hide');
        setTimeout(() => {
            document.querySelector('.server').classList.add('hide');
        }, 1000);
        // $('main').scrollTo('.users', '2s');
    });
    ipcRenderer.on('no-public-users', () => {
        document.querySelector('.loader').classList.add('hide');
        createManualLogin();
        setTimeout(() => {
            document.querySelector('.server').classList.add('hide');
        }, 1000);
    });    
};

const closeDialog = () => {
    document.querySelector('.dialog').classList.remove('active');
    document.querySelector('.dialog__close').classList.remove('active');
    document.querySelector('.dialog').classList.add('fadeOut');
    document.querySelector('.dialog__close').classList.add('fadeOut');
    setTimeout(() => {
        document.querySelector('.dialog').classList.remove('fadeOut');
        document.querySelector('.dialog__close').classList.remove('fadeOut');
        document.querySelector('.dialog').remove();
        document.querySelector('.dialog__close').remove();
    }, 305);
};

const createAlert = (type, msg, page) => {     
    html = `<div class="alert ${type}">
    <div class="icon">
    <i class="bi bi-exclamation-octagon"></i>
    </div>
    <div class="msg">
    ${msg}
    </div>
    <div class="load"></div>
    </div>`;
    document.querySelector(page).insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
        document.querySelector('.alert').classList.add('goOut');
        setTimeout(() => {
            document.querySelector('.alert').remove();
        }, 1000);
    }, 3000);
};

const createDialog = (title, msg, btn, type) => {
    html = `<div class="dialog ${type}">
    <div class="icon">
    <i class="bi bi-exclamation-octagon"></i>
    </div>
    <div class="title">
    ${title}
    </div>
    <div class="msg">
    ${msg}
    </div>
    </div>
    <div class="dialog__close"></div>`;  
    document.querySelector('main').insertAdjacentHTML('beforeend', html);
    if (btn == "yes__no") {
        html = `<div class="buttons">
        <button class="clicky yes" onclick="sendClearDataRequest()">
        <label>Yes</label>
        </button>
        <button class="clicky no" onclick="closeDialog()">
        <label>No</label>
        </button>
        </div>`;
        document.querySelector('.dialog').insertAdjacentHTML('beforeend', html);
    } else if (btn == "remove__server") {
        html = `<div class="buttons">
        <button class="clicky rem__serv" onclick="sendClearDataRequest()">
        <label>Remove Server</label>
        </button>
        <button class="clicky reload" onclick="ipcRenderer.send('reload-page')">
        <label>Restart JellyPlayer</label>
        </button>
        </div>`;
        document.querySelector('.dialog').insertAdjacentHTML('beforeend', html);
    }
    document.querySelector('.dialog').classList.add('active');
    document.querySelector('.dialog__close').classList.add('active');
    document.querySelector('.dialog__close').addEventListener('click', () => {
        closeDialog();
    });
    document.querySelector('.loader').classList.add('hide');
};

const sendClearDataRequest = () => {
    ipcRenderer.send('clear-user-data');
};

const createManualLogin = () => {
    html = `<h3 class="title__name">Login</h3>
    <div class="manual__form user">
    <div class="input">
    <input type="text" value="" class="user__name"  onblur="setLabelPos(this)">
    <label class="input__label" for="user__name">Username</label>
    </div>
    <div class="input">
    <input type="password" value="" class="user__password" onblur="setLabelPos(this)">
    <label class="input__label" for="user__password">Password</label>
    </div>
    <div class="input checkbox">
    <label>Remember me</label>
    <input class="remember__user" type="checkbox" value="true" style="-webkit-appearance: none;">
    <svg class="tick" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.854 3.646L6.5 11L2.646 7.146" stroke="black" stroke-linecap="round"/>
    </svg>
    </div>
    <button class="clicky user__login" onclick="sendAuthInfo(document.querySelector('.user__name').value, document.querySelector('.user__password').value, document.querySelector('.remember__user'))">
    <label>Login</label>
    </button>
    <button class="change__server clicky" onclick="changeServer()">
    <span>Change Server</span>
    </button>
    </div>`;
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
};

const setLabelPos = (element) => {
    if (element.value.length < 1) {
        element.parentNode.querySelector('.input__label').classList.remove('inputLabelActive');
    } else {
        element.parentNode.querySelector('.input__label').classList.add('inputLabelActive');
    }
};

const createEnterPassword = (userName, userImg, userId) => {
    html = `<div class="user">
    <div class="user__info">
    <h3 class="title__name">Hello, ${userName}</h3>
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
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
    if (userImg == true) {
        html = `<img class="user__img" src="${config.get('serverUrl')}/Users/${userId}/Images/Primary"></img>`;
        document.querySelector('.manual__input').querySelector('.user__info').insertAdjacentHTML('afterbegin', html);
    } else if (userImg == false) {
        html = `<img class="user__svg" src="../svg/avatar.svg">`;
        document.querySelector('.manual__input').querySelector('.user__info').insertAdjacentHTML('afterbegin', html);
    }
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
};

const sendAuthInfo = (userName, password, checkbox) => {
    if (checkbox.checked == true) {
        ipcRenderer.send('user-auth-details', [userName, password, true]);
    } else {
        ipcRenderer.send('user-auth-details', [userName, password, false]);
    }
};

const changeServer = () => {
    createDialog('Are you sure?', "You want to remove this server", "yes__no", "warning");
};

const goBack = (from, to, loginForm, button) => {
    to.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
        from.classList.add('hide');
        from.querySelector(`.${loginForm}`).remove();
        html = `<section class="${loginForm}"></section>`;
        from.insertAdjacentHTML('beforeend', html);
    }, 1000);
};

if (config.get('serverGo') == true) {
    document.querySelector('.loader').classList.remove('hide');
    ipcRenderer.send('check-server-status');
    ipcRenderer.on('server-online', () => {
        document.querySelector('.loader').classList.add('hide');
        createUserList();
    });
    ipcRenderer.on('server-offline', () => {
        createDialog('Error', "Cant connect to the jellyfin server", "remove__server", "error");
    });
} else if (config.get('serverGo') == false) {
    saveBtn.addEventListener('click', () => {
        ipcRenderer.send('setServer', serverUrl.value);
        document.querySelector('.loader').classList.remove('hide');
    }, true);
    ipcRenderer.on('not-jf-server', () => {
        document.querySelector('.loader').classList.add('hide');
        createAlert('error', "Can't detrmine if the give server address is a valid Jellyfin server", ".server");
    });
    ipcRenderer.on('is-jf-server', () => {
        createUserList();
    });
}

ipcRenderer.on('user-auth-failed', () => {
    console.log(1);
    createAlert('error', "Unable to login. Please check your password", ".manual__login");
});