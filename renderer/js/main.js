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
    return Math.round(ticks/600000000)
}

const sliderAnim = (slider) => {
    let slide;
    var slides = document.querySelectorAll(slider);
    setInterval(() => {      
        this.index = Array.prototype.indexOf.call(slides, document.querySelector(".slide.active"));
        document.querySelector(".slide.active").classList.add("moveFadeOut");
        console.log(this.index);
        slide = document.querySelectorAll(".slide")[this.index]; 
        slide.classList.remove("hide");
        slide.classList.add("moveFadeIn");
        setTimeout(() => {
            document.querySelector(".slide.active").classList.remove("moveFadeOut");
            document.querySelector(".slide.active").classList.add("hide");
            document.querySelector(".slide.active").classList.remove("active");
            slide.classList.remove("moveFadeIn");
            slide.classList.add("active");
        }, 1000);
        index+=1;
        if(this.index == slides.length) {
            this.index = 0;
        }
    }, 5000);
};

emitter.on("logged-in", async (user) => {
    console.log(user);
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
    html = `<div class="main__page main">
    <section class="menu side__menu">
    <div class="user__menu">
    <div class="image">
    <img src="${window.server}/Users/${user[5]}/Images/Primary"></img>
    </div>
    <div class="text">Hello, ${user[6]}</div>
    </div>
    <div class="submenu">
    <div>
    </div>
    </div>
    </section>
    <section class="main__animated__page">
    <div class="latestMediaSlider">
    </div>
    </section>
    </div>`;
    mainPageCont.insertAdjacentHTML("beforeend", html);
    const mainPage = document.querySelector(".main");
    pageTransition(".login", ".main", false);
    libs.forEach(item => {
        html = `<div class="menu__button">${item.Name}</div>`;
        document.querySelector(".submenu").querySelector("div").insertAdjacentHTML("beforeend", html);
    });
    latestMedia.data.forEach(async (item) => {
        html = `<div class="slide">
                    <div class="slide__background">
                        <canvas class="placeholder" width="1080" height="720"></canvas>
                        <img src="https://jellyfin.prayagnet.tk/Items/${item.Id}/Images/Backdrop?imgTag=${item.BackdropImageTags[0]}">
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
            html = `<div style="background: url('https://jellyfin.prayagnet.tk/Items/${item.Id}/Images/Logo?imgTag=${item.ImageTags.Logo[0]}');">`
            document.querySelector(".info__cont .title").insertAdjacentHTML("beforeend", html)
        } else {
            document.querySelector(".info__cont .title").innerHTML = item.Name
        }
        if (latestMedia.data.indexOf(item) == 0) {
            document.querySelector(".slide").classList.add("active");
        }
        console.log(item.ImageBlurHashes.Backdrop[0]);
        backdrop = item.BackdropImageTags[0];
        blurhashval = decode(item.ImageBlurHashes.Backdrop[backdrop], 1080, 720);
        console.log(blurhashval);
        blurhasdpix = document.querySelector(".placeholder").getContext("2d").createImageData(1080, 720);
        blurhasdpix.data.set(blurhashval);
        document.querySelector(".placeholder").getContext("2d").putImageData(blurhasdpix, 0, 0);
        $(".slide__background img").on("load", function () {
            document.querySelector(".placeholder").setAttribute("style", "opacity: 0;");
        }).attr('src', `https://jellyfin.prayagnet.tk/Items/${item.Id}/Images/Backdrop?imgTag=${item.BackdropImageTags[0]}`);
    });
    console.log(latestMedia.data);
    if (latestMedia.data.length > 1) {
        sliderAnim(".slide");
    }
    document.querySelector(".loader").classList.remove("hide");
});