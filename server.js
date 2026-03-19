const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { newPlayer, newBot } = require('./public/js/player');
const { startRound, advanceTurn, setBroadcast: setRoundBroadcast } = require('./public/js/round');
const { playBot, setBroadcast: setBotBroadcast } = require('./public/js/bots');
const { handleAction, setBroadcast: setActionBroadcast } = require('./public/js/controls');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const rooms = new Map();
 
app.use(express.static(__dirname + '/public'));
 
const roomOf = id => { for (const r of rooms.values()) if (r.players.find(p => p.id === id)) return r; };
const newId  = ()  => Math.random().toString(36).substring(2, 8).toUpperCase();
 
const broadcast = room => io.to(room.id).emit('gameStateUpdate', {
  roomId: room.id, phase: room.phase, currentPlayerIndex: room.currentPlayerIndex,
  roundFinished: room.roundFinished, dealer: room.dealer,
  lastResults: room.lastResults, maxBots: room.maxBots,
  players: room.players.map(({ id,name,isHost,isBot,botStyle,connected,cards,sum,hands,currentHandIndex,status,uiStatus,lastResult,stats }) =>
    ({ id,name,isHost,isBot,botStyle:botStyle||null,connected,cards,sum,hands,currentHandIndex,status,uiStatus,lastResult,stats }))
});

setRoundBroadcast(broadcast);
setBotBroadcast(broadcast);
setActionBroadcast(broadcast);
 
const autoBot = room => {
  const first = room.players[room.currentPlayerIndex];
  if (first?.isBot)
    (async () => { await playBot(room, room.currentPlayerIndex); await advanceTurn(room); })();
};
 
io.on('connection', socket => {
  const err    = msg  => socket.emit('serverError', { message: msg });
  const isHost = room => room?.players.find(p => p.id === socket.id)?.isHost;
 
  socket.on('createRoom', ({ playerName }) => {
    if (!playerName?.trim()) return err('Name is required.');
    const id = newId();
    const room = {
      id, phase: 'lobby', deck: [], currentPlayerIndex: 0,
      roundFinished: false, lastResults: null, maxBots: 3,
      hostName: playerName.trim(),
      dealer: { cards: [], sum: 0, status: 'hidden', uiStatus: '' },
      players: [newPlayer(socket.id, playerName.trim(), true)]
    };
    rooms.set(id, room); socket.join(id);
    socket.emit('roomCreated', { roomId: id }); broadcast(room);
  });
 
  socket.on('joinRoom', ({ roomId, playerName }) => {
    if (!playerName?.trim()) return err('Name is required.');
    const room = rooms.get(roomId?.trim().toUpperCase());
    if (!room) return err('Room not found!');
 
    const existing = room.players.find(p => p.name === playerName.trim() && !p.isBot);
    if (existing) {
      existing.id = socket.id; existing.connected = true;
      existing.isHost = (room.hostName === playerName.trim());
      room.players.forEach(p => { if (p.name !== room.hostName) p.isHost = false; });
      socket.join(room.id); socket.emit('roomJoined', { roomId: room.id }); broadcast(room); return;
    }
 
    if (room.phase !== 'lobby')                          return err('Game already in progress.');
    if (room.players.filter(p => !p.isBot).length >= 6) return err('Room is full.');
    const isOriginalHost = room.hostName === playerName.trim();
    const player = newPlayer(socket.id, playerName.trim(), isOriginalHost);
    room.players.push(player); socket.join(room.id);
    socket.emit('roomJoined', { roomId: room.id }); broadcast(room);
    if (!isOriginalHost) io.to(room.id).emit('playerJoined', { playerName: player.name });
  });
 
  socket.on('addBot', ({ style }) => {
    const room = roomOf(socket.id);
    if (!room)               return err('Could not find your room.');
    if (!isHost(room))       return err('Only the host can add bots.');
    if (room.phase !== 'lobby') return err('Cannot add bots mid-game.');
    const bots = room.players.filter(p => p.isBot).length;
    if (bots >= room.maxBots)     return err(`Max ${room.maxBots} bots allowed.`);
    if (room.players.length >= 6) return err('Room is full.');
    const bot = newBot(bots + 1, style || null);
    room.players.push(bot); broadcast(room);
    io.to(room.id).emit('playerJoined', { playerName: bot.name });
  });
 
  socket.on('removeBot', ({ botId }) => {
    const room = roomOf(socket.id);
    if (!room || !isHost(room) || room.phase !== 'lobby') return;
    const idx = room.players.findIndex(p => p.id === botId && p.isBot);
    if (idx !== -1) {
      const [r] = room.players.splice(idx, 1);
      broadcast(room); io.to(room.id).emit('playerLeft', { playerName: r.name });
    }
  });
 
  socket.on('startGame', () => {
    const room = roomOf(socket.id);
    if (!room || !isHost(room) || room.phase !== 'lobby') return;
    startRound(room);
    broadcast(room);
    io.to(room.id).emit('gameStarted');
  });
 
  socket.on('playerAction', ({ action }) => {
    const room = roomOf(socket.id);
    if (room) handleAction(room, socket.id, action);
  });
 
  socket.on('newRound', () => {
    const room = roomOf(socket.id);
    if (!room || !isHost(room) || !room.roundFinished) return;
    startRound(room); broadcast(room);
  });
 
  const doDisconnect = () => {
    const room = roomOf(socket.id);
    if (!room) return;
    const i = room.players.findIndex(p => p.id === socket.id);
    if (i === -1) return;
    const player = room.players[i];
    player.connected = false;
    io.to(room.id).emit('playerLeft', { playerName: player.name });
 
    if (room.phase === 'lobby') {
      room.players.splice(i, 1);
      if (!room.players.length) {
        setTimeout(() => { if (rooms.has(room.id) && room.players.length === 0) rooms.delete(room.id); }, 10000);
        return;
      }
    } else {
      if (player.isHost) {
        const next = room.players.find(p => p.connected && !p.isBot && p.id !== socket.id);
        if (next) next.isHost = true;
      }
      if (room.phase === 'playing') {
        broadcast(room);
        setTimeout(() => {
          if (player.connected) return;
          player.status = 'stand';
          player.uiStatus = 'Left';
          broadcast(room);
          if (room.currentPlayerIndex === i) advanceTurn(room);
        }, 8000);
      }
    }
    broadcast(room);
  };
 
  socket.on('leaveRoom', doDisconnect);
  socket.on('disconnect', doDisconnect);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));