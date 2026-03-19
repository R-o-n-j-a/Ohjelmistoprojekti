const SUITS = ['H','D','C','S'];
const VALS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

const buildDeck = () => SUITS.flatMap(s => VALS.map(v => `${v}-${s}`));

const shuffle = d => {
  for (let i = d.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [d[i], d[j]] = [d[j], d[i]];
  }
};

const getCardValue = c => {
  const v = c.split('-')[0];
  return v === 'A' ? 11 : ['J','Q','K'].includes(v) ? 10 : +v;
};

const calculateSum = cards => {
  let s = 0, a = 0;
  for (const c of cards) { const v = getCardValue(c); s += v; if (v === 11) a++; }
  while (s > 21 && a > 0) { s -= 10; a--; }
  return s;
};

const draw = (target, deck) => {
  const card = deck.pop();
  target.cards.push(card);
  target.sum = calculateSum(target.cards);
};

if (typeof module !== 'undefined') {
  module.exports = { buildDeck, shuffle, getCardValue, calculateSum, draw };
}