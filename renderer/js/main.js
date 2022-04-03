const mainPageCont = document.querySelector("main");
emitter.on("logged-in", (token) => {
    html = `<div class="main__page main"></div>`;
    mainPageCont.insertAdjacentHTML("beforeend", html);
    const mainPage = document.querySelector(".main");
    mainPage.innerHTML = token;
    mainPage.scrollIntoView({ behavior: "smooth" });
});