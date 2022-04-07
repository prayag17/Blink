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
        // getServerStat = async () => {
        //     await window.backend.getValuesFromDatabaseBool("serverGo", (data) => {
        //         if (data == true) {
        //             emitter.emit("serverGo-true");
        //         } else if (data == false) {
        //             emitter.emit('serverGo-false');
        //         }
        //         console.log(`Server Status = ${data}`);
        //         return Boolean(data);
        //     });
        // };
        // getServerStat();
        
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
        if (window.serverOnline == "serverGoTrue") {
            window.getServer();
        } else if (window.serverOnline == "serverGoFalse") {
            emitter.emit("server-url", "offline");
        } else if(window.serverOnline == "openHomeTrue") {
            window.getAuthinfo();
        }
        
        emitter.on("get-server", async () => {
            window.getServer();
        });
    });
    document.querySelector(".loader").classList.add("hide");
};

const base_token = `MediaBrowser Client="JellyPlayer", Device="${window.navigator.userAgent}", DeviceId="${generateUUID()}", Version="1.0.0"`;

const vanilla_token = `${base_token}, Token=""`; 

const createUserList = async (server) => {
    document.querySelector('.loader').classList.remove('hide');
    let users = await window.userApi.getPublicUsers();
    let userlist = users.data;
    console.log(userlist);
    if (userlist.length != 0) {
        userlist.forEach(user => {
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
        });
        document.querySelector('.users').classList.remove('hide');
        document.querySelector(".purple").classList.add("active");
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
    }, 3005);
};

const createDialog = (title, msg, btn, type, page) => {
    html = `<div class="dialog__cont">
    <div class="dialog ${type}">
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
    <div class="dialog__close"></div>
    </div>`;  
    document.querySelector(page).insertAdjacentHTML('beforeend', html);
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
        <button class="clicky reload" onclick="window.backend.restart()">
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
    window.backend.clearStorage();
};

const createManualLogin = (from_users) => {
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
    <button class="change__server clicky" onclick="changeServer('.manual__login')">
    <span>Change Server</span>
    </button>
    </div>`;
    if (from_users == false) {
        document.querySelector('.back').classList.add("hide");
    }
    document.querySelector('.manual__input').insertAdjacentHTML('beforeend', html);
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector(".purple").classList.add("active");
    document.querySelector(".blue").classList.add("active");
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
        html = `<img class="user__img" src="${window.server}/Users/${userId}/Images/Primary"></img>`;
        document.querySelector('.manual__input').querySelector('.user__info').insertAdjacentHTML('afterbegin', html);
    } else if (userImg == false) {
        html = `<img class="user__svg" src="../svg/avatar.svg">`;
        document.querySelector('.manual__input').querySelector('.user__info').insertAdjacentHTML('afterbegin', html);
    }
    document.querySelector('.manual__login').classList.remove('hide');
    document.querySelector(".blue").classList.add("active");
    document.querySelector('.manual__login').scrollIntoView({ behavior: "smooth" });
};

const sendAuthInfo = (userName, password, checkbox) => {
    var authUser;
    const auth = async () => {
        try {
            authUser = await window.userApi.authenticateUserByName({
                authenticateUserByName: {
                    Username: userName,
                    Pw: password
                }
            });
            emitter.emit("logged-in", [window.server, userName, password ,authUser.data.AccessToken, `${base_token}, Token=${authUser.data.AccessToken}`]);
        } catch (error) {
            console.log(`[Err]Can't login, Reason: ${error}`);
            createAlert("error", "Invalid Username or Password entered try again", ".manual__login");
            return "err";
        }
    };
    if (auth() != "err") {
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
    document.querySelector(".blue").classList.remove("active");
    setTimeout(() => {
        from.classList.add('hide');
        from.querySelector(`.${loginForm}`).remove();
        html = `<section class="${loginForm}"></section>`;
        from.insertAdjacentHTML('beforeend', html);
    }, 1000);
};
emitter.on("serverGo-true", () => {
    emitter.emit('get-server-saved');
    emitter.on("server-url", (server) => {
        if (server != "offline") {
            window.ax = axios.create({
                headers: {
                    Authorization: vanilla_token
                }
            });
            window.userApi = new window.UserApi(undefined, server, window.ax);
            document.querySelector('.loader').classList.remove('hide');
            document.querySelector('.loader').classList.add('hide');
            createUserList(server);
        } else {
            createDialog("Error", "Can't connect to Jellyfin server", "remove__server", "error");
        }
    });
});
emitter.on("user-saved", (user) => {
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
            emitter.emit("logged-in", [window.server, user[0], user[1], authUser.data.AccessToken, `${base_token}, Token=${authUser.data.AccessToken}`]);
        } catch (error) {
            console.log(`[Err]Can't login, Reason: ${error}`);
            createAlert("error", "Invalid Username or Password entered try again", ".manual__login");
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