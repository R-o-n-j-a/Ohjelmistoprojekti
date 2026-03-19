const socket = io();

socket.on('serverError', ({ message }) => {
  showJoinError(message);
});

socket.on('roomCreated', ({ roomId }) => {
  sessionStorage.setItem('roomId', roomId);
  sessionStorage.setItem('playerName', document.getElementById('player-name-input').value.trim());
  window.location.href = './lobby.html';
});

socket.on('roomJoined', ({ roomId }) => {
  sessionStorage.setItem('roomId', roomId);
  sessionStorage.setItem('playerName', document.getElementById('player-name-input').value.trim());
  window.location.href = './lobby.html';
});

document.getElementById('btn-create-room').addEventListener('click', () => {
  const name = document.getElementById('player-name-input').value.trim();
  if (!name) return showJoinError('Please enter your name first.');
  socket.emit('createRoom', { playerName: name });
});

document.getElementById('btn-join-room').addEventListener('click', () => {
  const name = document.getElementById('player-name-input').value.trim();
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  if (!name) return showJoinError('Please enter your name first.');
  if (!code) return showJoinError('Please enter a room code.');
  socket.emit('joinRoom', { roomId: code, playerName: name });
});

document.getElementById('player-name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-create-room').click();
});
document.getElementById('room-code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-join-room').click();
});
