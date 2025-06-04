import { loadHeader } from "./HEADER.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();

    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('touchstart', () => item.classList.add('pressed'));
        item.addEventListener('touchend', () => item.classList.remove('pressed'));
        item.addEventListener('touchcancel', () => item.classList.remove('pressed'));
    });
});