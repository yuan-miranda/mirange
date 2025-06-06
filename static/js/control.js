import { loadHeader } from "./HEADER.js";

let lastSentState = null;
let correctionSent = false;

async function sendControlStates(controlStates) {
    // this wierd condition is used to prevent the race condition where because of "uasyncio" asynchronous
    // nature of the code the request are sent in non-sequential order i.e
    // 
    // [00:00:00:58] [handle_request()] [INFO] Request: GET /control/100000
    // [00:00:00:59] [handle_request()] [INFO] Request: GET /control/100010
    // [00:00:00:59] [handle_request()] [INFO] Request: GET /control/000000
    // [00:00:00:59] [send_response()] [INFO] Request: GET /control/000010
    // 
    // this code is used to "forcefully" send another 000000 to hopefully be the last request to be processed
    // by the server lol.
    if (controlStates === '000000') {
        if (lastSentState !== '000000' && !correctionSent) {
            correctionSent = true;
            lastSentState = '000000';

            await fetch(`/control/${controlStates}`);
            await fetch(`/control/${controlStates}`);
            return;
        }
    } else correctionSent = false;

    lastSentState = controlStates;
    await fetch(`/control/${controlStates}`);
}


function getControlStates() {
    const controlStates = [];
    document.querySelectorAll('.grid-item').forEach(item => {
        controlStates.push(item.classList.contains("active") ? "1" : "0");
    });
    return controlStates.join('');
}

// async function toggleControlState(gridItem) {
//     gridItem.classList.toggle("active");
//     const controlStates = getControlStates();
//     await sendControlStates(controlStates);
// }

async function pressedState(item) {
    item.classList.add('pressed');
    item.classList.add('active');
    await sendControlStates(getControlStates());
}

async function releasedState(item) {
    item.classList.remove('pressed');
    item.classList.remove('active');
    await sendControlStates(getControlStates());
}

async function gridItemListener() {
    document.querySelectorAll('.grid-item').forEach(item => {
        let touchStartTimeout;
        let validTouch = false;

        item.addEventListener('touchstart', () => {
            validTouch = false;
            touchStartTimeout = setTimeout(async () => {
                validTouch = true;
                await pressedState(item);
            }, 100);
        });

        item.addEventListener('touchend', async () => {
            clearTimeout(touchStartTimeout);
            if (validTouch) {
                await new Promise(resolve => setTimeout(resolve, 100));
                await releasedState(item);
            }
        });

        item.addEventListener('touchcancel', async () => {
            clearTimeout(touchStartTimeout);
            if (validTouch) {
                await new Promise(resolve => setTimeout(resolve, 100));
                await releasedState(item);
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    await gridItemListener();
});