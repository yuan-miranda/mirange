import { loadHeader } from "./HEADER.js";

let requestQueue = Promise.resolve();
function sendControlStates(controlStates) {
    requestQueue = requestQueue.then(() => fetch(`/control/${controlStates}`));
    // await requestQueue;
}

function getControlStates() {
    const controlStates = [];
    document.querySelectorAll('.grid-item').forEach(item => {
        controlStates.push(item.classList.contains("active") ? "1" : "0");
    });
    return controlStates.join('');
}

function pressedState(item) {
    item.classList.add('pressed');
    item.classList.add('active');
    sendControlStates(getControlStates());
}

function releasedState(item) {
    item.classList.remove('pressed');
    item.classList.remove('active');
    sendControlStates(getControlStates());
}

function gridItemsTouchListener() {
    document.querySelectorAll('.grid-item').forEach(item => {
        let touchStartTimeout;
        let validTouch = false;

        item.addEventListener('touchstart', () => {
            validTouch = false;
            touchStartTimeout = setTimeout(() => {
                validTouch = true;
                pressedState(item);
            }, 10);
        });

        item.addEventListener('touchend', () => {
            clearTimeout(touchStartTimeout);
            if (validTouch) {
                releasedState(item);
            }
        });

        item.addEventListener('touchcancel', () => {
            clearTimeout(touchStartTimeout);
            if (validTouch) {
                releasedState(item);
            }
        });
    });
}

function gridItemsKeyListener() {
    const keyMap = {
        'w': 'controlW',
        'a': 'controlA',
        's': 'controlS',
        'd': 'controlD',
        'e': 'controlE',
        'f': 'controlF'
    };

    const activeKeys = new Set();

    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (keyMap[key] && !activeKeys.has(key)) {
            const item = document.getElementById(keyMap[key]);
            activeKeys.add(key);
            pressedState(item);
        }
    });
    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (keyMap[key] && activeKeys.has(key)) {
            const item = document.getElementById(keyMap[key]);
            activeKeys.delete(key);
            releasedState(item);
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    gridItemsTouchListener();
    gridItemsKeyListener();
});