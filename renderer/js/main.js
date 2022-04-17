const mainPageCont = document.querySelector("main");
const loginPage = document.querySelector(".login");
const bg = document.querySelector("#background");
let blurhashval;
let blurhasdpix;
let backdrop;
let itemInfo;
const pageTransition = (from, to, background) => {
    document.querySelector(from).classList.add("moveFadeOut");
    document.querySelector(to).classList.add("moveFadeIn");
    setTimeout(() => {
        document.querySelector(to).classList.remove("moveFadeIn");
        document.querySelector(to).classList.add("active");
        document.querySelector(from).classList.remove("moveFadeOut");
        document.querySelector(from).classList.add("hide");
    }, 5000);
    if (background == false) {
        bg.querySelector(".purple").classList.remove("active");
        bg.querySelector(".blue").classList.remove("active");
    }
};

const ticksToMin = (ticks) => {
    return Math.round(ticks / 600000000);
};

const showSlide = (index) => {
    index = Number(index);
    let slide = document.querySelectorAll(".slide")[index + 1];
    let track = document.querySelectorAll(".track")[index + 1];
    document.querySelector(".slide.active").classList.remove("active");
    document.querySelector(".track.active").classList.remove("active");
    slide.classList.add("active");
    track.classList.add("active");
};

const sliderAnim = (slider) => {
    var slides = document.querySelectorAll(slider);
    sliderAnim.timer = setInterval(() => {
        sliderAnim.index = Array.prototype.indexOf.call(slides, document.querySelector(".slide.active"));
        if (sliderAnim.index + 1 >= slides.length) {
            sliderAnim.index = 0;
        }
        showSlide(sliderAnim.index);
    }, 5000);
    document.querySelectorAll(".track").forEach(track => {
        track.addEventListener("click", () => {
            showSlide(track.dataset.index - 1);
            clearInterval(sliderAnim.timer);
            sliderAnim.timer = setInterval(() => {
                sliderAnim.index = Array.prototype.indexOf.call(slides, document.querySelector(".slide.active"));
                if (sliderAnim.index + 1 >= slides.length) {
                    sliderAnim.index = -1;
                }
                showSlide(sliderAnim.index);
                sliderAnim.index += 1;
            }, 5000);
        });
    });
};

const createCardGrid = (type, data) => {
    let typeClass = type.replace(/\s+/g, '');
    if (data.length != 0) {
        document.querySelector(".library__page").insertAdjacentHTML("beforeend", `<div class="content ${typeClass.toLowerCase()}"><div class="grid"></div></div>`);
        setTimeout(() => {
            document.querySelector(`.content.${typeClass.toLowerCase()}`).insertAdjacentHTML("afterbegin", `<h2>${type}</h2>`);
        }, 1);
        setTimeout(() => {
            for (let item of data) {
                html = `<div class="card" data-index="${data.indexOf(item)}">
                <div class="image__cont">
                <canvas class="placeholder"></canvas>
                <div class="icon__image">
                <span class="mdi">
                </div>
                <div class="primary__image hide">
                <img>
                </div>
                </div>
                <div class="card__text__cont">
                <div class="card__text primary">${item.Name}</div>
                </div>
                </div>`;
                document.querySelector(`.content.${typeClass.toLowerCase()} .grid`).insertAdjacentHTML("beforeend", html);
                if (item.CollectionType) {
                    if (item.ImageTags.Primary) {
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .primary__image img`).setAttribute("src", `${window.server}/Items/${item.Id}/Images/Primary?imgTag=${item.ImageTags.Primary[0]}`);
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .primary__image`).classList.remove("hide");
                    }
                    switch (item.CollectionType) {
                        case "books":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-book-multiple-outline");
                        break;
                        case "boxsets":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-folder-outline");
                        break;
                        case "movies":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-play-box-multiple-outline");
                        break;
                        case "music":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-music-box-multiple-outline");
                        break;
                        case "playlists":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-playlist-music");
                        break;
                        case "tvshows":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-youtube-tv");
                        break;
                    }
                } else if (item.Type) {
                    if (item.ImageTags.Primary) {
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .primary__image img`).setAttribute("src", `${window.server}/Items/${item.Id}/Images/Primary?imgTag=${item.ImageTags.Primary[0]}`);
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .primary__image`).classList.remove("hide");
                    }
                    document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .card__text__cont`).insertAdjacentHTML("beforeend", `<div class="card__text secondary">${item.ProductionYear}</div>`);
                    document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"]`).classList.add("primary");
                    switch (item.Type) {
                        case "books":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-book-multiple-outline");
                        break;
                        case "boxsets":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-folder-outline");
                        break;
                        case "Movie":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-play-box-multiple-outline");
                        break;
                        case "music":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-music-box-multiple-outline");
                        break;
                        case "playlists":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-playlist-music");
                        break;
                        case "tvshows":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-youtube-tv");
                        break;
                    }
                }
            }
        }, 0);
    }    
};

emitter.on("logged-in", async (user) => {
    html = `<div class="main__page main">
    <section class="menu side__menu">
    <div class="user__menu">
    <div class="skeleton__loader"></div>
    <div class="image"></div>
    <div class="text">Hello, ${user[6]}</div>
    </div>
    <div class="submenu">
    <div class="skeleton__loader"></div>
    <div class="sub">
    <div class="menu__button" data-page="home">Home</div>
    </div>
    </div>
    </section>
    <section class="main__animated__page">
    <div class="library__page current" data-page="home">
    <div class="skeleton__loader"></div>
    <div class="latestMediaSlider">
    <div class="track__cont"></div>
    </div>
    </div>
    </section>
    </div>`;
    mainPageCont.insertAdjacentHTML("beforeend", html);
    pageTransition(".login", ".main", false);
    document.querySelector(".loader").classList.add("hide");
    const UserConf = new Configuration({
        apiKey: user[4],
        basePath: user[0],
        username: user[1],
        password: user[2],
        accessToken: user[3]
    });
    const libApi = new LibraryApi(UserConf);
    const itemsApi = new ItemsApi(UserConf);
    const userLibApi = new UserLibraryApi(UserConf);
    const libsRaw = await libApi.getMediaFolders();
    const libs = libsRaw.data.Items;
    const latestMedia = await userLibApi.getLatestMedia({
        userId: user[5]
    });
    if (!user[7].User.PrimaryImageTag) {
        html = `<img src="../svg/avatar.svg">`;
        document.querySelector(".user__menu .image").insertAdjacentHTML("afterbegin", html);
    } else if (user[7].User.PrimaryImageTag) {
        html = `<img src="${window.server}/Users/${user[5]}/Images/Primary">`;
        document.querySelector(".user__menu .image").insertAdjacentHTML("afterbegin", html);
    }
    setTimeout(() => {        
        for (let item of libs) {
            html = `<div class="menu__button" data-page="${item.Name.toLowerCase()}">${item.Name}</div>`;
            document.querySelector(".submenu .sub").insertAdjacentHTML("beforeend", html);
        }
    }, 0);
    document.querySelectorAll(".menu__button").forEach(btn => {
        if (btn.dataset.page == document.querySelector(".library__page.current").dataset.page) {
            btn.classList.add("active");
        }
    });
    document.querySelectorAll(".menu .skeleton__loader").forEach(sk => {
        sk.classList.add("hide");
    });
    for (let item of latestMedia.data) {
        document.querySelector(".latestMediaSlider .track__cont").insertAdjacentHTML("beforeend", `<div class="track" data-index=${latestMedia.data.indexOf(item)}></div>`);
        if (item.ImageBlurHashes.Backdrop) {
            html = `<div class="slide" data-index=${latestMedia.data.indexOf(item)}>
            <div class="slide__background" data-depth="0.8"> 
            <img src="${window.server}/Items/${item.Id}/Images/Backdrop?imgTag=${item.BackdropImageTags[0]}">
            </div>
            <div class="info__cont" data-depth="0.2">
            <div class="title"></div>
            <div class="overview">
            <div>${item.ProductionYear}</div>
            <div><span class="mdi mdi-star-half-full"></span>${item.CommunityRating}</div>
            <div>${ticksToMin(item.RunTimeTicks)}min</div>
            </div>     
            <div class="buttons">
            <button class="filled clicky">
            <span>Play</span>
            </button>
            <button class="outlined clicky">
            <span>More Info</span>
            </button>
            </div>
            </div>
            </div>`;
            document.querySelector(".latestMediaSlider").insertAdjacentHTML("beforeend", html);
            if (item.ImageTags.Logo) {
                html = `<div style="background: url('${window.server}/Items/${item.Id}/Images/Logo?imgTag=${item.ImageTags.Logo[0]}');">`;
                document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .info__cont .title`).insertAdjacentHTML("beforeend", html);
                document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .info__cont .title`).classList.add("logo");
            } else {
                document.querySelector(".info__cont .title").insertAdjacentHTML("beforeend", item.Name);
            }
        } else {
            if (item.Type == "AudioBook") {
                html = `<div class="slide" data-index="${latestMedia.data.indexOf(item)}">
                <div class="slide__background" data-depth="0.8">
                <div class="icon__image">
                <span class="mdi mdi-book-music"></span>
                </div>
                </div>
                <div class="info__cont" data-depth="0.2">
                <div class="title"></div>
                <div class="overview">
                <div>${item.ProductionYear}</div>
                <div><span class="mdi mdi-star-half-full"></span>${item.CommunityRating}</div>
                <div>${ticksToMin(item.RunTimeTicks)}min</div>
                </div>
                <div class="buttons">
                <button class="filled clicky">
                <span>Play</span>
                </button>
                <button class="outlined clicky">
                <span>More Info</span>
                </button>
                </div>
                </div>
                </div>`;
                document.querySelector(".latestMediaSlider").insertAdjacentHTML("beforeend", html);
                if (item.ImageTags.Logo) {
                    html = `<div style="background: url('${window.server}/Items/${item.Id}/Images/Logo?imgTag=${item.ImageTags.Logo[0]}');">`;
                    document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .info__cont .title`).insertAdjacentHTML("beforeend", html);
                    document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .info__cont .title`).classList.add("logo");
                } else {
                    document.querySelector(`[data-index="${latestMedia.data.indexOf(item)}"] .title`).insertAdjacentHTML("beforeend", `<div>${item.Name}</div>`);
                }
            }
            // } else if (!item) { }
        }        
        if (latestMedia.data.indexOf(item) == 0) {
            document.querySelector(".slide").classList.add("active");
            document.querySelector(`.track[data-index="${Array.prototype.indexOf.call(document.querySelectorAll(".slide"), document.querySelector(".slide.active"))}"]`).classList.add("active");
        }
    }
    if (latestMedia.data.length > 1) {
        sliderAnim(".slide");
    } else {
        document.querySelector(".track__cont").classList.add("hide");
    }
    createCardGrid("Library", libs);
    let latest;
    setTimeout(async () => {
        for (let library of libs){
            latest = await userLibApi.getLatestMedia({
                userId: user[5],
                parentId: library.Id
            });
            createCardGrid(library.Name, latest.data);
        }
    }, 0);
    document.querySelectorAll(".main__animated__page .skeleton__loader").forEach(sk => {
        sk.classList.add("hide");
    });
});