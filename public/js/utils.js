export function getCardValue(card) {
  const v = card.split("-")[0];
  if (v === "A") return 11;
  if (["J", "Q", "K"].includes(v)) return 10;
  return parseInt(v);
}

export function calculateSum(cards) {
  let sum = 0;
  let aces = 0;

  for (let c of cards) {
    const v = getCardValue(c);
    sum += v;
    if (v === 11) aces++;
  }
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}