const mainPageCont = document.querySelector("main");
const loginPage = document.querySelector(".login");
const bg = document.querySelector("#background");

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
    const libsRaw = await libApi.getMediaFolders();
    const libs = libsRaw.data.Items;
    console.log(libsRaw.data.Items);
    html = `<div class="main__page main"></div>`;
    mainPageCont.insertAdjacentHTML("beforeend", html);
    const mainPage = document.querySelector(".main");
    pageTransition(".login", ".main", false);
    libs.forEach(item => {
        console.log(item);
        mainPage.innerHTML += item.Name;
    });
    // mainPage.scrollIntoView({ behavior: "smooth" });
    // loginPage.classList.add("hide");
});