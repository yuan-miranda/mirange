import { loadHeader } from "./HEADER.js";

let socket;

function initWebSocket() {
    socket = new WebSocket(`ws://${location.hostname}/ws`);
    socket.addEventListener('message', handleWebSocketMessage);
}

function getPlayerName() {
    return localStorage.getItem('playerName') || `${navigator.platform.replace(/ /g, '_')}${Math.floor(Math.random() * 100)}`;
}

// handle player input
function playerSlotListener() {
    const playerInputs = document.querySelectorAll('.player-slot');

    playerInputs.forEach(input => {
        const button = input.nextElementSibling;
        button.addEventListener('click', () => {
            // ENTER button functionality here
            window.location.href = `../html/control.html`;
        });

        input.addEventListener('dblclick', () => {
            const playerSlot = input.classList.contains('one') ? 'one' : 'two';
            const playerName = getPlayerName();

            // fill the slot with the player name
            if (input.value === '') {
                localStorage.setItem('playerSlot', playerSlot);
                localStorage.setItem('playerName', playerName);

                socket.send(JSON.stringify({
                    type: 'setPlayerSlot',
                    slot: playerSlot,
                    name: playerName
                }));

                // if you're in slot1 and switched to slot2, remove the value of slot1
                const otherInput = document.querySelector(`.player-slot.${playerSlot === 'one' ? 'two' : 'one'}`);
                
                if (otherInput.value === `${playerName} (You)`) {
                    socket.send(JSON.stringify({
                        type: 'setPlayerSlot',
                        slot: playerSlot === 'one' ? 'two' : 'one',
                        name: ''
                    }));
                }
            }
            // remove the current player in the slot
            else {
                if (input.value === `${playerName} (You)`) {
                    localStorage.removeItem('playerSlot');
                    localStorage.removeItem('playerName');
                }

                socket.send(JSON.stringify({
                    type: 'setPlayerSlot',
                    slot: playerSlot,
                    name: ''
                }));
            }
        });
    });
}

function loadPlayerSlot() {
    const savedPlayerSlot = localStorage.getItem('playerSlot');
    if (!savedPlayerSlot) return;

    // load only if that saved slot is empty
    const input = document.querySelector(`.player-slot.${savedPlayerSlot}`);
    if (input.value === '') {
        socket.send(JSON.stringify({
            type: 'setPlayerSlot',
            slot: savedPlayerSlot,
            name: getPlayerName()
        }));
    }
}

function handleWebSocketMessage(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'wsUpdatePlayerSlot') {
        const input = document.querySelector(`.player-slot.${data.slot}`);
        const button = input.nextElementSibling;

        if (data.name) {
            const playerName = getPlayerName();
            input.value = data.name === playerName ? `${data.name} (You)` : data.name;
            button.disabled = false;
        } else {
            input.value = '';
            button.disabled = true;
        }
    }
    else if (data.type === 'wsLoadPlayerSlots') {
        Object.entries(data.slots).forEach(([slot, name]) => {
            const input = document.querySelector(`.player-slot.${slot}`);
            const button = input.nextElementSibling;

            const playerName = getPlayerName();
            input.value = name === playerName ? `${name} (You)` : name || '';
            button.disabled = !name;
        });
        loadPlayerSlot();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHeader();
    initWebSocket();
    playerSlotListener();
});