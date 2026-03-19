const socket = io();
let myId = null;

const storedName   = sessionStorage.getItem('playerName');
const storedRoomId = sessionStorage.getItem('roomId');
const storedHost   = sessionStorage.getItem('isHost') === 'true';

socket.on('connect', () => {
  myId = socket.id;
  if (storedRoomId && storedName) {
    socket.emit('joinRoom', { roomId: storedRoomId, playerName: storedName });
  } else {
    window.location.href = './index.html';
  }
});

socket.on('serverError', ({ message }) => showToast(message));
socket.on('playerJoined', ({ playerName }) => showToast(`${playerName} joined`));
socket.on('playerLeft',   ({ playerName }) => showToast(`${playerName} left`));

socket.on('gameStarted', () => {
  window.location.href = './blackjack.html';
});

socket.on('gameStateUpdate', state => {
  myId = socket.id;
  if (state.phase !== 'lobby') return;
  renderLobby(state, myId);
});

document.getElementById('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('lobby-room-id').textContent).then(() => {
    document.getElementById('btn-copy-code').textContent = '✅';
    setTimeout(() => document.getElementById('btn-copy-code').textContent = '📋', 2000);
    showToast('Room code copied!');
  });
});

document.getElementById('btn-start-game').addEventListener('click', () => socket.emit('startGame'));

document.getElementById('btn-leave-lobby').addEventListener('click', () => {
  socket.emit('leaveRoom');
  sessionStorage.clear();
  window.location.href = './index.html';
});

document.querySelector('.lobby-container').addEventListener('click', e => {
  const add = e.target.closest('.bot-style-btn');
  if (add && !add.disabled) socket.emit('addBot', { style: add.dataset.style || null });
  const remove = e.target.closest('.remove-bot-btn');
  if (remove) socket.emit('removeBot', { botId: remove.dataset.botid });
});