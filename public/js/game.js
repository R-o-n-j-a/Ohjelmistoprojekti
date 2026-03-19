const socket = io();
let myId = null;

const storedName   = sessionStorage.getItem('playerName');
const storedRoomId = sessionStorage.getItem('roomId');

socket.on('connect', () => {
  myId = socket.id;
  if (storedRoomId && storedName) {
    socket.emit('joinRoom', { roomId: storedRoomId, playerName: storedName });
  } else {
    window.location.href = './index.html';
  }
});

socket.on('serverError', ({ message }) => {
  showToast('Connection error: ' + message);
  setTimeout(() => { window.location.href = './index.html'; }, 2000);
});

socket.on('playerJoined', ({ playerName }) => showToast(`${playerName} joined`));
socket.on('playerLeft',   ({ playerName }) => showToast(`${playerName} left`));

socket.on('gameStateUpdate', state => {
  myId = socket.id;
  const me = state.players.find(p => p.id === myId);
  if (me) sessionStorage.setItem('isHost', me.isHost ? 'true' : 'false');
  if (state.phase === 'lobby') {
    window.location.href = './lobby.html';
    return;
  }
  renderGame(state, myId);
});

document.getElementById('btn-hit').addEventListener('click',       () => socket.emit('playerAction', { action: 'hit' }));
document.getElementById('btn-stand').addEventListener('click',     () => socket.emit('playerAction', { action: 'stand' }));
document.getElementById('btn-double').addEventListener('click',    () => socket.emit('playerAction', { action: 'double' }));
document.getElementById('btn-split').addEventListener('click',     () => socket.emit('playerAction', { action: 'split' }));
document.getElementById('btn-new-round').addEventListener('click', () => socket.emit('newRound'));
document.getElementById('btn-exit-game').addEventListener('click', () => {
  if (confirm('Exit the game?')) {
    socket.emit('leaveRoom');
    sessionStorage.clear();
    window.location.href = './index.html';
  }
});