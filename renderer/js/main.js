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

const createVerticalSlider = (type, data) => {
    document.querySelector(".library__page").insertAdjacentHTML("beforeend", `<div class="vertical__slider ${type.toLowerCase()}"><div class="slider"></div></div>`);
    document.querySelector(`.vertical__slider.${type.toLowerCase()}`).insertAdjacentHTML("afterbegin", `<h2>${type}</h2>`);
    data.forEach(item => {
        html = `<div class="card" data-index="${data.indexOf(item)}">
                    <div class="image__cont">
                        <canvas class="placeholder"></canvas>
                        <div class="icon__image">
                            <object data="qrc:/renderer/svg/${item.CollectionType}.svg"></object>
                        </div>
                        <div class="primary__image hide">
                            <img>
                        </div>
                    </div>
                    <div class="card__text__cont">
                        <div class="card__text primary">${item.Name}</div>
                    </div>
                </div>`;
        document.querySelector(`.vertical__slider.${type.toLowerCase()} .slider`).insertAdjacentHTML("beforeend", html);
        if (item.ImageTags.Primary) {
            window.itm = item;
            backdrop = item.ImageTags.Primary;
            blurhashval = decode(item.ImageBlurHashes.Primary[backdrop], 1080, 720);
            blurhasdpix = document.querySelector(`.card[data-index="${data.indexOf(item)}"] .placeholder`).getContext("2d").createImageData(1080, 720);
            blurhasdpix.data.set(blurhashval);
            document.querySelector(`.card[data-index="${data.indexOf(item)}"] .placeholder`).getContext("2d").putImageData(blurhasdpix, 0, 0);
            document.querySelector(`.card[data-index="${data.indexOf(item)}"] .primary__image img`).setAttribute("src", `${window.server}/Items/${item.Id}/Images/Primary?imgTag=${item.ImageTags.Primary[0]}`);
            document.querySelector(`.card[data-index="${data.indexOf(item)}"] .primary__image img`).setAttribute("onload", `document.querySelector('.card[data-index="${data.indexOf(item)}"] .placeholder').setAttribute('style', 'opacity:0;')`);
            document.querySelector(`.card[data-index="${data.indexOf(item)}"] .primary__image`).classList.remove("hide");
        }
        console.log(item);
    });
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
    console.log(UserConf);
    const libApi = new LibraryApi(UserConf);
    const itemsApi = new ItemsApi(UserConf);
    const userLibApi = new UserLibraryApi(UserConf);
    const libsRaw = await libApi.getMediaFolders();
    const movies = await itemsApi.getItems({
        userId: user[5],
        recursive: true,
        includeItemTypes: ["Movie"]
    });
    const libs = libsRaw.data.Items;
    window.latestMedia = await userLibApi.getLatestMedia({
        userId: user[5]
    });
    if (!user[7].User.PrimaryImageTag) {
        html = `<img src="../svg/avatar.svg">`;
        document.querySelector(".user__menu .image").insertAdjacentHTML("afterbegin", html);
    } else if (user[7].User.PrimaryImageTag) {
        html = `<img src="${window.server}/Users/${user[5]}/Images/Primary">`;
        document.querySelector(".user__menu .image").insertAdjacentHTML("afterbegin", html);
    }
    const mainPage = document.querySelector(".main");
    libs.forEach(item => {
        html = `<div class="menu__button" data-page="${item.Name.toLowerCase()}">${item.Name}</div>`;
        document.querySelector(".submenu .sub").insertAdjacentHTML("beforeend", html);
    });
    document.querySelectorAll(".menu__button").forEach(btn => {
        if (btn.dataset.page == document.querySelector(".library__page.current").dataset.page) {
            btn.classList.add("active");
        }
    });
    document.querySelectorAll(".menu .skeleton__loader").forEach(sk => {
        sk.classList.add("hide");
    });
    latestMedia.data.forEach(async (item) => {
        document.querySelector(".latestMediaSlider .track__cont").insertAdjacentHTML("beforeend", `<div class="track" data-index=${latestMedia.data.indexOf(item)}></div>`);
        if (item.ImageBlurHashes.Backdrop) {
            console.log(`${window.server}/Items/${item.Id}/Images/Backdrop?imgTag=${item.BackdropImageTags[0]}`);
            html = `<div class="slide" data-index=${latestMedia.data.indexOf(item)}>
            <div class="slide__background"> 
            <canvas class="placeholder" width="1080" height="720" style="width: 100%; height: 100%"></canvas>
            <img src="${window.server}/Items/${item.Id}/Images/Backdrop?imgTag=${item.BackdropImageTags[0]}">
            </div>
            <div class="info__cont">
            <div class="title"></div>
            <div class="overview">
            <div>${item.ProductionYear}</div>
            <div><i class="bi bi-star-fill"></i>${item.CommunityRating}</div>
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
            document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .slide__background img`).onload = () => {
                document.querySelector(`.slide[data-index='${latestMedia.data.indexOf(item)}'] .placeholder`).setAttribute('style', 'opacity: 0;');
            };
            if (item.ImageTags.Logo) {
                html = `<div style="background: url('${window.server}/Items/${item.Id}/Images/Logo?imgTag=${item.ImageTags.Logo[0]}');">`;
                document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .info__cont .title`).insertAdjacentHTML("beforeend", html);
                document.querySelector(`[data-index='${latestMedia.data.indexOf(item)}'] .info__cont .title`).classList.add("logo");
            } else {
                document.querySelector(".info__cont .title").insertAdjacentHTML("beforeend", item.Name);
            }
            backdrop = item.BackdropImageTags[0];
            blurhashval = decode(item.ImageBlurHashes.Backdrop[backdrop], 1080, 720);
            console.log(blurhashval);
            blurhasdpix = document.querySelector(`[data-index="${latestMedia.data.indexOf(item)}"] .placeholder`).getContext("2d").createImageData(1080, 720);
            blurhasdpix.data.set(blurhashval);
            document.querySelector(`[data-index="${latestMedia.data.indexOf(item)}"] .placeholder`).getContext("2d").putImageData(blurhasdpix, 0, 0);
        } else {
            if (item.Type == "AudioBook") {
                html = `<div class="slide" data-index="${latestMedia.data.indexOf(item)}">
                <div class="slide__background">
                <canvas class="placeholder" width="1080" height="720" style="width: 100%; height: 100%"></canvas>
                <div class="icon__image">
                <i class="bi bi-mic-fill"></i>
                </div>
                </div>
                <div class="info__cont">
                <div class="title"></div>
                <div class="overview">
                <div>${item.ProductionYear}</div>
                <div><i class="bi bi-star-fill"></i>${item.CommunityRating}</div>
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
        document.querySelectorAll(".main__animated__page .skeleton__loader").forEach(sk => {
            sk.classList.add("hide");
        });
        
        if (latestMedia.data.indexOf(item) == 0) {
            document.querySelector(".slide").classList.add("active");
            document.querySelector(`.track[data-index="${Array.prototype.indexOf.call(document.querySelectorAll(".slide"), document.querySelector(".slide.active"))}"]`).classList.add("active");
        }
    });
    console.log(latestMedia.data);
    if (latestMedia.data.length > 1) {
        sliderAnim(".slide");
    } else {
        document.querySelector(".track__cont").classList.add("hide");
    }

    createVerticalSlider("Library", libs);
});