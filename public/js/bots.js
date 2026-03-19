const { getCardValue, draw } = require('./cards');

const delay = ms => new Promise(r => setTimeout(r, ms));

let broadcast = () => {};
const setBroadcast = fn => { broadcast = fn; };

async function playBot(room, idx) {
  const bot = room.players[idx];
  const upVal = getCardValue(room.dealer.cards[1] || room.dealer.cards[0]);

  let limit = bot.botStyle === 'aggressive' ? 18 : bot.botStyle === 'safe' ? 16 : 17;
  if (upVal >= 7) limit++;
  if (upVal <= 3) limit--;
  limit = Math.max(15, Math.min(limit, 19));

  Object.assign(bot, { status: 'playing', uiStatus: 'Thinking…' });
  room.currentPlayerIndex = idx;
  broadcast(room); await delay(800);

  while (bot.sum < limit) {
    draw(bot, room.deck);
    bot.uiStatus = `Hit (${bot.sum})`;
    broadcast(room); await delay(700);
    if (bot.sum > 21) {
      Object.assign(bot, { uiStatus: 'Bust!', status: 'bust' });
      broadcast(room); await delay(500);
      return;
    }
  }

  Object.assign(bot, { uiStatus: 'Stand', status: 'stand' });
  broadcast(room); await delay(500);
}

module.exports = { playBot, setBroadcast };