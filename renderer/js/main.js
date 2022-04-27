const mainPageCont = document.querySelector("main");
const loginPage = document.querySelector(".login");
const bg = document.querySelector("#background");
let backdrop;
let tempData;

var homePageLayout = [
    {
        "name": "Libraries",
        "cardType": "thumb",
        "data": ""
    },
    {
        "name": "Continue Watching",
        "cardType": "thumb",
        "data": ""
    },
    {
        "name": "Next Up",
        "cardType": "thumb",
        "data": ""
    }
];

const pageTransition = (from, to, background) => {
    document.querySelector(from).classList.add("moveFadeOut");
    document.querySelector(to).classList.add("moveFadeIn");
    setTimeout(() => {
        document.querySelector(to).classList.remove("moveFadeIn");
        document.querySelector(to).classList.add("active");
        document.querySelector(from).classList.remove("moveFadeOut");
        document.querySelector(from).classList.add("hide");
    }, 5000);
}

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

const createCardGrid = (type, data, cardType) => {
    let typeClass = type.replace(/\s+/g, '');
    if (data.length != 0) {
        document.querySelector(".library__page").insertAdjacentHTML("beforeend", `<div class="content ${typeClass.toLowerCase()} ${cardType}"><div class="slider__cont"><div class="grid"></div></div>`);
        setTimeout(() => {
            let counter = 0;
            document.querySelector(`.content.${typeClass.toLowerCase()}`).insertAdjacentHTML("afterbegin", `<div class="content__header"><h2>${type}</h2><div class="buttons">
            <button class="mdc-button mdc-button--touch slider-back">
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__touch"></span>
            <span class="mdc-button__label"><i class="mdi mdi-chevron-left"></i></span>
            </button>
            <button class="mdc-button mdc-button--touch slider-forward">
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__touch"></span>
            <span class="mdc-button__label"><i class="mdi mdi-chevron-right"></i></span>
            </button>
            </div>
            </div>`);
            document.querySelector(`.content.${typeClass.toLowerCase()} .slider-forward`).addEventListener("click", () => {
                console.log(counter);
                document.querySelector(`.content.${typeClass.toLowerCase()} .grid`).style.transition = `transform var(--transition-time-slow-1) ease-in-out`;
                counter++;
                switch (cardType) {
                    case "thumb":
                    if (counter > data.length / 4) {
                        counter = 0;
                    }
                    break;
                    default:
                    if (counter > data.length / 6) {
                        counter = 0;
                    }
                    break;
                }
                document.querySelector(`.content.${typeClass.toLowerCase()} .grid`).style.transform = `translateX(${-document.querySelector(`.grid`).clientWidth * counter}px)`;
            });
            document.querySelector(`.content.${typeClass.toLowerCase()} .slider-back`).addEventListener("click", () => {
                document.querySelector(`.content.${typeClass.toLowerCase()} .grid`).style.transition = `transform var(--transition-time-slow-1) ease-in-out`;
                counter--;
                if (counter < 0) {
                    counter = 0;
                }
                console.log(counter);
                document.querySelector(`.content.${typeClass.toLowerCase()} .grid`).style.transform = `translateX(${-document.querySelector(`.grid`).clientWidth * counter}px)`;
            });
            if (data.length <= 6 && cardType == "primary") {
                for (let child of document.querySelector(`.${typeClass.toLowerCase()} .content__header .buttons`).children)
                child.setAttribute("disabled", true);
            }else if (data.length <= 6 && cardType == "square") {
                for (let child of document.querySelector(`.${typeClass.toLowerCase()} .content__header .buttons`).children)
                child.setAttribute("disabled", true);
            }else if (data.length <= 4 && cardType == "thumb") {
                for (let child of document.querySelector(`.${typeClass.toLowerCase()} .content__header .buttons`).children)
                child.setAttribute("disabled", true);
            }
        }, 0);
        setTimeout(() => {
            for (let item of data) {
                html = `<div class="card" data-index="${data.indexOf(item)}">
                <div class="image__cont">
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
                if (item.ImageTags.Primary) {
                    document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .primary__image img`).setAttribute("src", `${window.server}/Items/${item.Id}/Images/Primary?imgTag=${item.ImageTags.Primary[0]}`);
                    document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .primary__image`).classList.remove("hide");
                }
                if (item.CollectionType) {
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
                        default:
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-file-outline");
                        break;
                    }
                } else {
                    switch (item.Type) {
                        case "Episode":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-television-classic");
                        break;
                        case "Book":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-book-open-page-variant-outline");
                        break;
                        case "Movie":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-movie-outline");
                        break;
                        case "MusicAlbum":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-album");
                        break;
                        case "Audio":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-music");
                        break;
                        case "Series":
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-youtube-tv");
                        break;
                        default:
                        document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .mdi`).classList.add("mdi-file-outline");
                        break;
                    }
                }
                if (item.ProductionYear) {
                    document.querySelector(`.${typeClass.toLowerCase()} .card[data-index="${data.indexOf(item)}"] .card__text__cont`).insertAdjacentHTML("beforeend", `<div class="card__text secondary">${item.ProductionYear}</div>`);
                }
            }
            for (let card of document.querySelectorAll(".primary .card")) {
                tempData = card.parentElement.clientWidth;
                card.style.width = `${tempData / 6}px`;
            }
            for (let card of document.querySelectorAll(".square .card")) {
                tempData = card.parentElement.clientWidth;
                card.style.width = `${tempData / 6}px`;
            }
            for (let card of document.querySelectorAll(".thumb .card")) {
                tempData = card.parentElement.clientWidth;
                card.style.width = `${tempData / 4}px`;
            }
            window.onresize = () => {
                for (let card of document.querySelectorAll(".primary .card")) {
                    tempData = card.parentElement.clientWidth;
                    card.style.width = `${tempData / 6}px`;
                }
                for (let card of document.querySelectorAll(".square .card")) {
                    tempData = card.parentElement.clientWidth;
                    card.style.width = `${tempData / 6}px`;
                }
                for (let card of document.querySelectorAll(".thumb .card")) {
                    tempData = card.parentElement.clientWidth;
                    card.style.width = `${tempData / 4}px`;
                }
            };
        }, 0);
    }    
};

const createLibraryPage = async (page, userId, itemsApi) => {
    let data;
    // if (!document.querySelector(`.library__page[data-page='${page}']`)) {
        html = `<div class="library__page" data-page="${page}">
        <div class="skeleton__loader"></div>
        <div class="tab__bar"></div>
        <div class="libraryGrid primary"></div>
        </div>`;
        document.querySelector('.main__animated__page').insertAdjacentHTML("beforeend", html)
        document.querySelector(`.library__page[data-page='${page}']`).scrollIntoView({ behavior: "smooth" });
        data = await itemsApi.getItems({
            userId: userId,
            includeItemTypes: [`${page.toUpperCase()}`],
            recursive: true
        });
        for (let item of data.data) {
            html = `<div class="card" data-index="${data.data.indexOf(item)}">
            <div class="image__cont">
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
            </div>`
            document.querySelector(`.library__page[data-page='${page}'] .LibraryGrid`).insertAdjacentHTML("beforeend", html);
    }
            document.querySelector(`.library__page[data-page='${page}'] .skeleton__loader`).classList.add("hide");
    // }
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
    <div class="vertical__tab__highlighter"></div>
    <div class="sub">
    <div class="menu__button" data-page="home"><i class="mdi mdi-home-variant-outline"></i>Home</div>
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
    const tvshowsApi = new TvShowsApi(UserConf);
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
            if (item.CollectionType) {
                html = `<div class="menu__button" data-page="${item.CollectionType.toLowerCase()}"><div class="mdi"></div>${item.Name}</div>`;
                document.querySelector(".submenu .sub").insertAdjacentHTML("beforeend", html);
                for (let menuBtn of document.querySelectorAll('.menu__button')) {
                    menuBtn.addEventListener("click", () => {
                        createLibraryPage(menuBtn.dataset.page, user[5], itemsApi)
                    })
                }
                switch (item.CollectionType) {
                    case "books":
                    document.querySelector(`.menu__button[data-page="books"] .mdi`).classList.add("mdi-book-multiple-outline");
                    break;
                    case "boxsets":
                    document.querySelector(`.menu__button[data-page="boxsets"] .mdi`).classList.add("mdi-folder-outline");
                    break;
                    case "movies":
                    document.querySelector(`.menu__button[data-page="movies"] .mdi`).classList.add("mdi-play-box-multiple-outline");
                    break;
                    case "music":
                    document.querySelector(`.menu__button[data-page="music"] .mdi`).classList.add("mdi-music-box-multiple-outline");
                    break;
                    case "playlists":
                    document.querySelector(`.menu__button[data-page="playlists"] .mdi`).classList.add("mdi-playlist-music");
                    break;
                    case "tvshows":
                    document.querySelector(`.menu__button[data-page="tvshows"] .mdi`).classList.add("mdi-youtube-tv");
                    break;
                    default:
                    document.querySelector(`.menu__button[data-page="${item.CollectionType.toLowerCase()}"] .mdi`).classList.add("mdi-file-outline");
                    break;
                }
            } else {
                html = `<div class="menu__button" data-page="${item.Name.toLowerCase()}"><div class="mdi mdi-folder-outline"></div>${item.Name}</div>`;
                document.querySelector(".submenu .sub").insertAdjacentHTML("beforeend", html);
            }
        }
    }, 0);
    document.querySelectorAll(".menu__button").forEach(btn => {
        if (btn.dataset.page == document.querySelector(".library__page.current").dataset.page) {
            btn.classList.add("active");
        }
    });
    document.querySelector(".vertical__tab__highlighter").style.top = `${document.querySelector(".menu__button.active").getBoundingClientRect().top}px`;
    document.querySelector(".vertical__tab__highlighter").style.height = `${document.querySelector(".menu__button.active").getBoundingClientRect().height}px`;
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
    let latest;
    tempData = await itemsApi.getResumeItems({ userId: user[5], limit: 24, mediaTypes: "Video" });
    homePageLayout[0].data = libs;
    homePageLayout[1].data = tempData.data.Items;
    tempData = await tvshowsApi.getNextUp({ userId: user[5] });
    homePageLayout[2].data = tempData.data.Items;
    // Array.prototype.push.call(homePageLayout[0], { "data": libs });
    // Array.prototype.push.call(homePageLayout[1], { "data": tempData.data.Items });
    // tempData = await tvshowsApi.getNextUp({ userId: user[5] });
    // Array.prototype.push.call(homePageLayout[2], { "data": tempData.data.Items });
    // homePageLayout[1].push({ "data": libs });
    setTimeout(async () => {
        window.libs = libs
        for (let library of libs) {
            latest = await userLibApi.getLatestMedia({
                userId: user[5],
                parentId: library.Id
            });
            if (library.CollectionType == "music") {
                homePageLayout.push({ "name": `Latest ${library.Name}`, "cardType": "square", "data": latest.data });
            } else {
                homePageLayout.push({ "name": `Latest ${library.Name}`, "cardType": "primary", "data": latest.data });
            }
        }
        for (let lib of homePageLayout) {
            createCardGrid(lib.name, lib.data, lib.cardType);
        }
    }, 0);
    document.querySelectorAll(".main__animated__page .skeleton__loader").forEach(sk => {
        sk.classList.add("hide");
    });
});