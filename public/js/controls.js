const { getCardValue, draw } = require('./cards');
const { advanceTurn } = require('./round');

const delay = ms => new Promise(r => setTimeout(r, ms));

let broadcast = () => {};
const setBroadcast = fn => { broadcast = fn; };

async function handleAction(room, socketId, action) {
  if (room.phase !== 'playing') return;
  const player = room.players[room.currentPlayerIndex];
  if (!player || player.id !== socketId || player.isBot) return;

  const hand = player.hands ? player.hands[player.currentHandIndex] : player;

  const nextHand = async busted => {
    if (player.hands && player.currentHandIndex < player.hands.length - 1) {
      player.currentHandIndex++;
      player.uiStatus = `Hand ${player.currentHandIndex + 1}`;
      broadcast(room);
    } else {
      player.status = busted ? 'bust' : 'stand';
      await advanceTurn(room);
    }
  };

  if (action === 'hit') {
    draw(hand, room.deck);
    if (hand.sum > 21) {
      hand.status = 'bust'; player.uiStatus = 'Bust!';
      broadcast(room); await delay(400); await nextHand(true);
    } else broadcast(room);

  } else if (action === 'stand') {
    hand.status = 'stand'; player.uiStatus = 'Stand';
    broadcast(room); await delay(300); await nextHand(false);

  } else if (action === 'double') {
    if (hand.cards.length !== 2) return;
    draw(hand, room.deck); hand.status = 'stand';
    player.uiStatus = hand.sum > 21 ? 'Bust!' : 'Double';
    broadcast(room); await delay(400); await nextHand(hand.sum > 21);

  } else if (action === 'split') {
    if (player.hands || player.cards.length !== 2) return;
    if (getCardValue(player.cards[0]) !== getCardValue(player.cards[1])) return;
    const [c1, c2] = player.cards;
    player.hands = [
      { cards: [c1], sum: 0, status: 'playing', result: null },
      { cards: [c2], sum: 0, status: 'playing', result: null }
    ];
    player.cards = []; player.sum = 0; player.currentHandIndex = 0;
    player.hands.forEach(h => draw(h, room.deck));
    player.uiStatus = 'Split — Hand 1';
    broadcast(room);
  }
}

module.exports = { handleAction, setBroadcast };