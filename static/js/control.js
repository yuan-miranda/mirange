import { loadHeader } from "./HEADER.js";

function gridItemListener() {
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('touchstart', () => item.classList.add('pressed'));
        item.addEventListener('touchend', () => item.classList.remove('pressed'));
        item.addEventListener('touchcancel', () => item.classList.remove('pressed'));
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    gridItemListener();
});