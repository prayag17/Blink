const serverForm = document.querySelector('.server__cont');
const serverUrl = document.querySelector('.server__url');
const saveBtn = document.querySelector('.save__server');
const user__cont = document.querySelector('.users');
let html;
var server;


function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

window.onload = () => {
    new QWebChannel(qt.webChannelTransport, async (channel) => {
        window.backend = await channel.objects.backend;
        window.getServer = async () => {
            await window.backend.getValuesFromDatabaseStr("server", (data) => {
                window.server = data;
                console.log(`Server:${data}`);
                emitter.emit('server-url', data);
                return data;
            });
        };
        window.setAuthInfoDatabase = async (userName, Pw) => {
            await window.backend.setAuthInfoDatabase(userName, Pw);
        };
        window.getAuthinfo = async () => {
            await window.backend.getAuthinfo(async (data) => {
                console.log(data);
                window.getServer();
                emitter.on('server-url', (server) => {
                    emitter.emit("user-saved", [data[0], data[1], server]);
                });
            });
        };
        
        emitter.on("send-jf-server-info", (server) => {
            window.backend.saveServer(server, (dat) => {
                console.log(`Is Jf Server = ${dat}`);
                if (dat == true) {
                    emitter.emit('is-jf-server');
                } else if (dat == false) {
                    emitter.emit('not-jf-server');
                }
            });
        });
        
        window.serverOnline = await window.backend.onStartup();
        console.log(window.serverOnline);
        if (window.serverOnline == "serverGoTrue") {
            emitter.emit("serverGo-true");
        } else if (window.serverOnline == "serverGoFalse") {
            emitter.emit("serverGo-false");
        } else if(window.serverOnline == "openHomeTrue") {
            window.getAuthinfo();
        } else if (window.serverOnline == "serverOffline") {
            emitter.emit("server-url", "offline");
        }
        
    });
    emitter.on("get-server", async () => {
        window.getServer();
    });
    document.querySelector(".loader").classList.add("hide");
};

const base_token = `MediaBrowser Client="JellyPlayer", Device="${window.navigator.userAgent}", DeviceId="${generateUUID()}", Version="1.0.0"`;

const vanilla_token = `${base_token}, Token=""`; 

const createUserList = async (server) => {
    document.querySelector('.loader').classList.remove('hide');
    let users = await window.userApi.getPublicUsers();
    let userlist = users.data;
    if (userlist.length != 0) {
        for (let user of userlist) {
            if (user.PrimaryImageTag) {
                html = `<div class="user__card" data-user="${user.Name}" data-userid="${user.Id}" onclick="createEnterPassword(this.dataset.user, true, this.dataset.userid)">
                <div class="content">
                <img class="user__img" src="${server}/Users/${user.Id}/Images/Primary">
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
        }
        document.querySelector('.users').classList.remove('hide');
        document.querySelector('.users').scrollIntoView({ behavior: "smooth" });
        document.querySelector('.loader').classList.add('hide');
        setTimeout(() => {
            document.querySelector('.server').classList.add('hide');
        }, 1000);
    }else if (userlist.length == 0) {
        document.querySelector('.loader').classList.add('hide');
        createManualLogin(false);
        setTimeout(() => {
            document.querySelector('.server').classList.add('hide');
        }, 1000);
    }
};

const closeDialog = () => {
    document.querySelector('.dialog__cont').classList.remove('active');
    document.querySelector('.dialog__close').classList.remove('active');
    document.querySelector('.dialog__cont').classList.add('fadeOut');
    document.querySelector('.dialog__close').classList.add('fadeOut');
    setTimeout(() => {
        document.querySelector('.dialog__cont').classList.remove('fadeOut');
        document.querySelector('.dialog__close').classList.remove('fadeOut');
        document.querySelector('.dialog__cont').remove();
    }, 305);
};

const createAlert = (type, msg, page) => {     
    html = `<div class="alert ${type}">
    <div class="icon">
    <span class="mdi mdi-alert-octagram-outline"></span>
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
    }, 3005);
};

const createDialog = (title, msg, btn, type, page, exitBg) => {
    html = `<div class="dialog__cont">
    <div class="dialog ${type}">
    <div class="icon">
    <span class="mdi mdi-alert-octagram-outline"></span>
    </div>
    <div class="title">
    ${title}
    </div>
    <div class="msg">
    ${msg}
    </div>
    </div>
    <div class="dialog__close"></div>
    </div>`;  
    document.querySelector(page).insertAdjacentHTML('beforeend', html);
    if (btn == "yes__no") {
        html = `<div class="buttons">
        <button class="mdc-button mdc-button--raised" onclick="sendClearDataRequest()">
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <span class="mdc-button__label">Yes</span>
        </button>
        <button class="mdc-button mdc-button--raised" onclick="closeDialog()">
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <span class="mdc-button__label">No</span>
        </button>
        </div>`;
        document.querySelector('.dialog').insertAdjacentHTML('beforeend', html);
    } else if (btn == "remove__server") {
        html = `<div class="buttons">
        <button class="mdc-button mdc-button--raised" onclick="sendClearDataRequest()">
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <span class="mdc-button__label">Remove Server</span>
        </button>
        <button class="mdc-button mdc-button--raised" onclick="window.backend.restart()">
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__focus-ring"></span>
        <span class="mdc-button__label">Restart JellyPlayer</span>
        </button>
        </div>`;
        document.querySelector('.dialog').insertAdjacentHTML('beforeend', html);
    }
    document.querySelectorAll(".mdc-button").forEach(button => {
        mdc.ripple.MDCRipple.attachTo(button);
    });
    document.querySelector('.dialog').classList.add('active');
    document.querySelector('.dialog__close').classList.add('active');
    if (!exitBg) {
        document.querySelector('.dialog__close').addEventListener('click', () => {
            closeDialog();
        });
    }
    document.querySelector('.loader').classList.add('hide');
};

const sendClearDataRequest = () => {
    window.backend.clearStorage();
};

const createManualLogin = (from_users) => {
    html = `<h3 class="title__name">Login</h3>
    <div class="manual__form user">
    <div class="mdc-text-field mdc-text-field--outlined">
    <input type="text" class="mdc-text-field__input first-name-input" id="user__name">
    <span class="mdc-notched-outline">
    <span class="mdc-notched-outline__leading"></span>
    <span class="mdc-notched-outline__notch">
    <span class="mdc-floating-label" id="my-label-id">Username</span>
    </span>
    <span class="mdc-notched-outline__trailing"></span>
    </span>
    </div>
    <div class="mdc-text-field mdc-text-field--outlined mdc-text-field--with-trailing-icon">
    <input type="password" class="mdc-text-field__input first-name-input" id="user__password">
    <span class="mdc-notched-outline">
    <span class="mdc-notched-outline__leading"></span>
    <span class="mdc-notched-outline__notch">
    <span class="mdc-floating-label" id="my-label-id">Password</span>
    </span>
    <span class="mdc-notched-outline__trailing"></span>
    </span>
    <i class="mdi mdi-eye-outline mdc-text-field__icon mdc-text-field__icon--trailing" tabindex="0" data-passvisible="false" role="button" onclick="if(this.dataset.passvisible=='false'){document.querySelector('#user__password').setAttribute('type', 'text');this.dataset.passvisible='true';this.classList.add('mdi-eye-off-outline');this.classList.remove('mdi-eye-outline')} else if(this.dataset.passvisible=='true'){document.querySelector('#user__password').setAttribute('type', 'password');this.dataset.passvisible='false';this.classList.add('mdi-eye-outline');this.classList.remove('mdi-eye-off-outline')}"></i>
    </div>
    <div class="mdc-form-field">
    <div class="mdc-checkbox">
    <input type="checkbox"
    class="mdc-checkbox__native-control"
    id="remember__user"/>
    <div class="mdc-checkbox__background">
    <svg class="mdc-checkbox__checkmark"
    viewBox="0 0 24 24">
    <path class="mdc-checkbox__checkmark-path"
    fill="none"
    d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
    </svg>
    <div class="mdc-checkbox__mixedmark"></div>
    </div>
    <div class="mdc-checkbox__ripple"></div>
    </div>
    <label for="remember__user">Remember me</label>
    </div>
    <button class="mdc-button mdc-button--raised" onclick="sendAuthInfo(document.querySelector('#user__name').value, document.querySelector('#user__password').value, document.querySelector('#remember__user'))">
    <span class="mdc-button__ripple"></span>
    <span class="mdc-button__focus-ring"></span>
    <span class="mdc-button__label">Login</span>
    </button>
    <button class="mdc-button mdc-button--raised" onclick="changeServer('.manual__login')">
    <span class="mdc-button__ripple"></span>
    <span class="mdc-button__focus-ring"></span>
    <span class="mdc-button__label">Change Server</span>
    </button>
    </div>`;
    if (from_users == false) {
        document.querySelector('.back').classList.add("hide");
    }
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
    document.querySelectorAll(".mdc-button").forEach(button => {
        mdc.ripple.MDCRipple.attachTo(button);
    });
    document.querySelectorAll(".mdc-text-field").forEach(textField => {
        mdc.textField.MDCTextField.attachTo(textField);
    });
    mdc.checkbox.MDCCheckbox.attachTo(document.querySelector(".mdc-checkbox"));
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
    // setTimeout(() => {
    //     document.querySelector('.users').classList.add('hide');
    // }, 1000);
};

const createEnterPassword = (userName, userImg, userId) => {
    html = `<div class="user">
    <div class="user__info">
    <h3 class="title__name">Hello, ${userName}</h3>
    </div>
    <div class="mdc-text-field mdc-text-field--outlined mdc-text-field--with-trailing-icon">
    <input type="password" class="mdc-text-field__input first-name-input" id="user__password">
    <span class="mdc-notched-outline">
    <span class="mdc-notched-outline__leading"></span>
    <span class="mdc-notched-outline__notch">
    <span class="mdc-floating-label" id="my-label-id">Password</span>
    </span>
    <span class="mdc-notched-outline__trailing"></span>
    </span>
    <i class="mdi mdi-eye-outline mdc-text-field__icon mdc-text-field__icon--trailing" tabindex="0" data-passvisible="false" role="button" onclick="if(this.dataset.passvisible=='false'){document.querySelector('#user__password').setAttribute('type', 'text');this.dataset.passvisible='true';this.classList.add('mdi-eye-off-outline');this.classList.remove('mdi-eye-outline')} else if(this.dataset.passvisible=='true'){document.querySelector('#user__password').setAttribute('type', 'password');this.dataset.passvisible='false';this.classList.add('mdi-eye-outline');this.classList.remove('mdi-eye-off-outline')}"></i>
    </div>
    <div class="mdc-form-field">
    <div class="mdc-checkbox">
    <input type="checkbox"
    class="mdc-checkbox__native-control"
    id="remember__user"/>
    <div class="mdc-checkbox__background">
    <svg class="mdc-checkbox__checkmark"
    viewBox="0 0 24 24">
    <path class="mdc-checkbox__checkmark-path"
    fill="none"
    d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
    </svg>
    <div class="mdc-checkbox__mixedmark"></div>
    </div>
    <div class="mdc-checkbox__ripple"></div>
    </div>
    <label for="remember__user">Remember me</label>
    </div>
    <button class="mdc-button mdc-button--raised" data-user="${userName}" onclick="sendAuthInfo(this.dataset.user, document.querySelector('#user__password').value, document.querySelector('#remember__user'))">
    <span class="mdc-button__ripple"></span>
    <span class="mdc-button__focus-ring"></span>
    <span class="mdc-button__label">Login</span>
    </button>
    <button class="mdc-button mdc-button--raised" onclick="changeServer('.manual__login')">
    <span class="mdc-button__ripple"></span>
    <span class="mdc-button__focus-ring"></span>
    <span class="mdc-button__label">Change Server</span>
    </button>
    </div>`;
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
    if (userImg == true) {
        html = `<img class="user__img" src="${window.server}/Users/${userId}/Images/Primary"></img>`;
        document.querySelector('.user__info').insertAdjacentHTML('afterbegin', html);
    } else if (userImg == false) {
        html = `<img class="user__svg" data-tp src="../svg/avatar.svg">`;
        document.querySelector('.user__info').insertAdjacentHTML('afterbegin', html);
    }
    document.querySelectorAll(".mdc-button").forEach(button => {
        mdc.ripple.MDCRipple.attachTo(button);
    });
    document.querySelectorAll(".mdc-text-field").forEach(textField => {
        mdc.textField.MDCTextField.attachTo(textField);
    });
    mdc.checkbox.MDCCheckbox.attachTo(document.querySelector(".mdc-checkbox"));
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
    // setTimeout(() => {
    //     document.querySelector('.users').classList.add('hide');
    // }, 1000);
};

const sendAuthInfo = (userName, password, checkbox) => {
    document.querySelector(".loader").classList.remove("hide");
    var authUser;
    const auth = async () => {
        try {
            authUser = await window.userApi.authenticateUserByName({
                authenticateUserByName: {
                    Username: userName,
                    Pw: password
                }
            });
            emitter.emit("logged-in", [window.server, userName, password ,authUser.data.AccessToken, `${base_token}, Token=${authUser.data.AccessToken}`, authUser.data.User.Id, authUser.data.User.Name, authUser.data]);
        } catch (error) {
            document.querySelector(".loader").classList.add("hide");
            console.log(`[Err]Can't login, Reason: ${error}`);
            createAlert("error", "Invalid Username or Password entered try again", ".manual__login");
            return "err";
        }
    };
    if (auth() != "err") {
        console.log(checkbox.checked);
        if (checkbox.checked == true) {
            window.setAuthInfoDatabase(userName, password);
        }
    }
};

const changeServer = (page) => {
    createDialog('Are you sure?', "You want to remove this server", "yes__no", "warning", page);
};

const goBack = (from, to, loginForm) => {
    to.classList.remove("hide");
    to.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
        from.classList.add('hide');
        from.querySelector(`.${loginForm}`).remove();
        html = `<section class="${loginForm}"></section>`;
        from.insertAdjacentHTML('beforeend', html);
    }, 1000);
};
emitter.on("serverGo-true", () => {
    emitter.emit("get-server");
    emitter.on("server-url", (server) => {
        window.ax = axios.create({
            headers: {
                Authorization: vanilla_token
            }
        });
        window.userApi = new window.UserApi(undefined, server, window.ax);
        document.querySelector('.loader').classList.remove('hide');
        document.querySelector('.loader').classList.add('hide');
        createUserList(server);
    });
});
emitter.on("server-url", (server) => {
    if (server == "offline") {
        createDialog("Error", "Can't connect to Jellyfin server", "remove__server", "error", ".server", true);
    }
});
emitter.on("user-saved", (user) => {
    document.querySelector(".loader").classList.remove("hide");
    window.ax = axios.create({
        headers: {
            Authorization: vanilla_token
        }
    });
    window.userApi = new window.UserApi(undefined, user[2], window.ax);
    var authUser;
    const auth = async () => {
        try {
            authUser = await window.userApi.authenticateUserByName({
                authenticateUserByName: {
                    Username: user[0],
                    Pw: user[1]
                }
            });
            emitter.emit("logged-in", [window.server, user[0], user[1], authUser.data.AccessToken, `${base_token}, Token=${authUser.data.AccessToken}`, authUser.data.User.Id, authUser.data.User.Name, authUser.data]);
        } catch (error) {
            console.log(`[Err]Can't login, Reason: ${error}`);
            document.querySelector('.loader').classList.add('hide');
            createDialog("Error", "Invalid Username or Password", "remove__server", "error", ".server", true);
        }
    };
    auth();
});
emitter.on("serverGo-false", () => {
    saveBtn.addEventListener('click', () => {
        emitter.emit("send-jf-server-info", serverUrl.value);
        document.querySelector('.loader').classList.remove('hide');
    }, true);
    emitter.on('not-jf-server', () => {
        document.querySelector('.loader').classList.add('hide');
        createAlert('error', "Can't detrmine if the give server address is a valid Jellyfin server", ".server");
    });
    emitter.on('is-jf-server', () => {
        emitter.emit('get-server');
        emitter.on("server-url", (server) => {
            window.ax = axios.create({
                headers: {
                    Authorization: vanilla_token
                }
            });
            window.userApi = new window.UserApi(undefined, server, window.ax);
            document.querySelector('.loader').classList.remove('hide');
            document.querySelector('.loader').classList.add('hide');
            createUserList(server);
        });
    });
});