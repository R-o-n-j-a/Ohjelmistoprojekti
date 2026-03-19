const { buildDeck, shuffle, draw } = require('./cards');
const { freshState } = require('./player');
const { playBot } = require('./bots');

const delay = ms => new Promise(r => setTimeout(r, ms));
const getResult = (ps, ds) => ps > 21 ? 'Lose' : ds > 21 || ps > ds ? 'Win' : ps === ds ? 'Tie' : 'Lose';

let broadcast = () => {};
const setBroadcast = fn => { broadcast = fn; };

function addStats(p, outcome) {
  if (outcome === 'Win')       { p.stats.wins++;   p.stats.streak++; p.stats.history.push('W'); }
  else if (outcome === 'Lose') { p.stats.losses++; p.stats.streak = 0; p.stats.history.push('L'); }
  else p.stats.history.push('T');
  if (p.stats.history.length > 10) p.stats.history = p.stats.history.slice(-10);
}

function startRound(room) {
  room.deck = [...buildDeck(), ...buildDeck()];
  shuffle(room.deck);

  const firstHumanIdx = room.players.findIndex(p => !p.isBot && p.connected);
  const startIdx = firstHumanIdx !== -1 ? firstHumanIdx : 0;

  Object.assign(room, { roundFinished: false, currentPlayerIndex: startIdx, phase: 'playing', lastResults: null,
    dealer: { cards: [], sum: 0, status: 'hidden', uiStatus: '' } });
  room.players.forEach((p, i) => Object.assign(p, freshState(), { status: i === startIdx ? 'playing' : 'waiting', stats: p.stats }));
  for (let i = 0; i < 2; i++) { room.players.forEach(p => draw(p, room.deck)); draw(room.dealer, room.deck); }
}

async function advanceTurn(room) {
  let i = room.currentPlayerIndex + 1;
  while (i < room.players.length) {
    const p = room.players[i];
    if (!p.isBot && (!p.connected || p.status === 'stand' || p.status === 'bust')) {
      p.status = 'stand';
      p.uiStatus = p.connected ? p.uiStatus : 'Left';
      i++;
    } else break;
  }

  if (i < room.players.length) {
    room.currentPlayerIndex = i;
    Object.assign(room.players[i], { status: 'playing', uiStatus: '' });
    broadcast(room);
    if (room.players[i].isBot) { await playBot(room, i); await advanceTurn(room); }
  } else {
    await dealerPlay(room);
    decideWinners(room);
    Object.assign(room, { roundFinished: true, phase: 'results' });
    broadcast(room);
  }
}

async function dealerPlay(room) {
  Object.assign(room, { phase: 'dealer_turn' });
  Object.assign(room.dealer, { status: 'playing', uiStatus: 'Revealing…' });
  broadcast(room); await delay(700);
  while (room.dealer.sum < 17) {
    draw(room.dealer, room.deck);
    room.dealer.uiStatus = 'Hit';
    broadcast(room); await delay(750);
  }
  Object.assign(room.dealer, { uiStatus: room.dealer.sum > 21 ? 'Bust!' : 'Stand', status: 'done' });
  broadcast(room); await delay(500);
}

function decideWinners(room) {
  const ds = room.dealer.sum;
  const results = room.players.map(p => {
    const outcomes = p.hands
      ? p.hands.map((h, i) => { const o = getResult(h.sum, ds); h.result = o; addStats(p, o); return { hand: i+1, outcome: o, sum: h.sum }; })
      : (() => { const o = getResult(p.sum, ds); p.status = o; addStats(p, o); return [{ hand: 1, outcome: o, sum: p.sum }]; })();
    p.lastResult = p.hands ? p.hands.map((h, i) => `H${i+1}: ${h.result}`).join(' · ') : outcomes[0].outcome;
    return { playerId: p.id, playerName: p.name, isBot: p.isBot, outcomes };
  });
  room.lastResults = { results, dealerSum: ds };
}

module.exports = { startRound, advanceTurn, setBroadcast };