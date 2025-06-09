export async function loadHeader() {
    try {
        const response = await fetch("../html/HEADER.html");
        const data = await response.text();
        document.querySelector("header").innerHTML = data;

        loadStoredValues();
        ribbonActionsBtnListener();
    } catch (error) {
        console.error(error);
    }
}

// 0: visible, 1: hidden
let mainHeaderToggleState = 0;

function loadStoredValues() {
    const headerToggleState = localStorage.getItem("mainHeaderToggleState");
    const activeRibbonBtn = localStorage.getItem("activeRibbonBtn");

    if (headerToggleState) { mainHeaderToggleState = parseInt(headerToggleState, 10); }
    if (activeRibbonBtn) {
        // remove when the current url is not the same as the activeRibbonBtn
        const currentUrl = window.location.href
            .split("/")
            .slice(-1)[0]
            .split(".")[0];
        if (activeRibbonBtn !== currentUrl) {
            localStorage.removeItem("activeRibbonBtn");
            return;
        }
        const btn = document.getElementById(activeRibbonBtn);
        if (btn) { addActiveClassToRibbonBtn(btn); }
    }
}

function addActiveClassToRibbonBtn(btn) {
    const ribbonActions = document.querySelector(".ribbon-actions ul");
    ribbonActions.querySelectorAll("li").forEach((element) => {
        element.classList.remove("active");
    });
    btn.classList.add("active");
    localStorage.setItem("activeRibbonBtn", btn.id);
}

function ribbonActionsBtnListener() {
    const controlBtn = document.getElementById("control");
    const settingsBtn = document.getElementById("settings");
    const moreBtn = document.getElementById("more");

    controlBtn.addEventListener("click", () => {
        addActiveClassToRibbonBtn(controlBtn);
        window.location.href = "../html/control.html";
    });
    settingsBtn.addEventListener("click", () => {
        addActiveClassToRibbonBtn(settingsBtn);
        window.location.href = "../html/settings.html";
    });
    moreBtn.addEventListener("click", () => {
        // load the rest of "li" elements to the list
        // code here
    });
}