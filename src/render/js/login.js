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
        userlist.forEach(user => {
            if (user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" onclick="createManualLoginFilled(this.dataset.user)"><h1>${user.Name}</h1><img src="${config.get('serverUrl')}/Users/${user.Id}/Images/Primary"></div>`;
            }
            else if (!user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" onclick="createManualLoginFilled(this.dataset.user)"><h1>${user.Name}</h1><img src="../svg/avatar.svg"></div>`;
            }
            document.querySelector('.user__cont').insertAdjacentHTML('beforeend', html);
        });
        document.querySelector('.loader').classList.add('hide');
        document.querySelector('.users').classList.remove('hide');
        document.querySelector('.users').scrollIntoView({ behavior: "smooth" });
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

if (config.get('serverGo') == true) {
    createUserList();
} else if (config.get('serverGo') == false) {
    saveBtn.onclick = () => {
        ipcRenderer.send('setServer', serverUrl.value);
        document.querySelector('.loader').classList.remove('hide');
        ipcRenderer.on('not-jf-server', () => {
            document.querySelector('.loader').classList.add('hide');
            createServerErr();
        });
        ipcRenderer.on('is-jf-server', () => {
            createUserList();
        });
    };
}


const createManualLogin = () => {
    html = `<div class="one"><input type="text" value="" class="user__name"><input type="password" value="" class="user__password"><input class="remember__user" type="checkbox" value="true"><input type="button" value="Login" class="user__login" onclick="sendAuthInfo()"></div>`;
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
};


const createServerErr = () => {
    document.querySelector('.error').classList.remove('hide');
    document.querySelector('.error').classList.add('active');
    document.querySelector('.popup__exit').classList.remove('hide');
    document.querySelector('.popup__exit').classList.add('active');
    closePopup();
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

const setLabelPos = () => {
    if (serverUrl.value.length < 1) {
        console.log('empty');
        document.querySelector('.input__label').classList.remove('inputLabelActive');
    } else {
        document.querySelector('.input__label').classList.add('inputLabelActive');
    }
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
