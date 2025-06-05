import { loadHeader } from "./HEADER.js";

async function sendControlStates(controlStates) {
    await fetch(`/control/${controlStates}`);
}

function getControlStates() {
    const controlStates = [];
    document.querySelectorAll('.grid-item').forEach(item => {
        controlStates.push(item.classList.contains("active") ? "1" : "0");
    });
    return controlStates.join('');
}

async function toggleControlState(gridItem) {
    gridItem.classList.toggle("active");
    const controlStates = getControlStates();
    await sendControlStates(controlStates);
}

async function gridItemListener() {
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('touchstart', async () => {
            item.classList.add('pressed')
            await toggleControlState(item);
        });
        item.addEventListener('touchend', async () => {
            item.classList.remove('pressed')
            await toggleControlState(item);
        })
        item.addEventListener('touchcancel', async () => {
            item.classList.remove('pressed')
            await toggleControlState(item);
        })
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    await gridItemListener();
});