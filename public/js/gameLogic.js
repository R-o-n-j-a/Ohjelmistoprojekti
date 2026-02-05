import { render, showInfo, updateControls, updateTurnText } from "./ui.js";
import { calculateSum, delay } from "./utils.js";
import { playBots } from "./bots.js";

export function buildDeck() {
  const suits = ["H", "D", "C", "S"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];

  for (let s of suits) {
    for (let v of values) {
      deck.push(v + "-" + s);
    }
  }
  return deck;
}

export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

export function drawCard(player, deck) {
  const card = deck.pop();
  player.cards.push(card);
  player.sum = calculateSum(player.cards);
}

export function startRound(state) {
  state.deck = buildDeck();
  shuffle(state.deck);

  state.roundFinished = false;
  state.canHit = true;
  state.infoMessages = [];

  state.dealer.cards = [];
  state.dealer.sum = 0;
  state.dealer.status = "hidden";
  state.dealer.hasFlipped = false;

  state.players.forEach(p => {
    p.cards = [];
    p.sum = 0;
    p.status = "playing";
    p.uiStatus = "";
    p.aceCount = 0;
    p.hands = null;
    p.currentHandIndex = 0;
    p.active = p.isBot ? true : true;

    if (p.isBot) {
      p.active = true;
      p.uiStatus = "";
      p.status = "waiting";
    } else {
      p.active = true;
      p.uiStatus = "";
      p.status = "playing";
    }
  });

  for (let i = 0; i < 2; i++) {
    state.players.forEach(p => drawCard(p, state.deck));
    drawCard(state.dealer, state.deck);
  }
  render(state);
  updateControls(state);
  updateTurnText(state);
}

export function hit(state) {
  if (!state.canHit) return;

  const you = state.players[0];
  const hand = you.hands ? you.hands[you.currentHandIndex] : you;

  drawCard(hand, state.deck);

  if (hand.sum > 21) {
    hand.status = "bust";
    you.uiStatus = "Bust";
    nextTurn(state);
  }

  render(state);
}

export function stand(state) {
  if (!state.canHit) return;
  state.canHit = false;
  nextTurn(state);
}

export function doubleDown(state) {
  const you = state.players[0];
  const hand = you.hands ? you.hands[you.currentHandIndex] : you;

  if (hand.cards.length !== 2) return;

  drawCard(hand, state.deck);
  state.canHit = false;
  nextTurn(state);
}

async function nextTurn(state) {
    await playBots(state);
    await dealerPlay(state);
    decideWinners(state);
    state.roundFinished = true;
    render(state);
}

export function splitHand(state) {
  const you = state.players[0];

  if (state.roundFinished) return;
  if (!state.canHit) return;
  if (you.hands) return;
  if (you.cards.length !== 2) return;

  const c1 = you.cards[0];
  const c2 = you.cards[1];

  if (getCardValue(c1) !== getCardValue(c2)) return;

  you.hands = [
    { cards: [c1], sum: 0, status: "playing" },
    { cards: [c2], sum: 0, status: "playing" }
  ];

  you.cards = [];
  you.sum = 0;

  you.hands.forEach(hand => {
    drawCard(hand, state.deck);
    hand.sum = calculateSum(hand.cards);
  });

  you.currentHandIndex = 0;
  you.uiStatus = "Split";
}

export async function dealerPlay(state) {
  const dealer = state.dealer;
  dealer.status = "playing";
  dealer.uiStatus = "Revealing";
  render(state);

  await delay(600);

  dealer.uiStatus = "Revealed";
  render(state);

  while (dealer.sum < 17) {
    await delay(700);
    drawCard(dealer, state.deck);
    dealer.uiStatus = "Hit";
    render(state);
  }

  await delay(500);

  if (dealer.sum > 21) {
    dealer.uiStatus = "Bust";
    dealer.status = "done";
  } else {
    dealer.uiStatus = "Stand";
    dealer.status = "done";
  }

  render(state);
}

function decideWinners(state) {
    const player = state.players[0];
    const dealerSum = state.dealer.sum;

    if (player.sum > 21) player.status = "Lose";
    else if (dealerSum > 21 || player.sum > dealerSum) player.status = "Win";
    else if (player.sum === dealerSum) player.status = "Tie";
    else player.status = "Lose";

    if (player.status === "Win") {
        state.stats.wins++;
        state.stats.streak++;
    } else if (player.status === "Lose") {
        state.stats.losses++;
        state.stats.streak = 0;
    }
    let playerLetter = player.status === "Win" ? "W" : player.status === "Lose" ? "L" : "T";
    state.stats.history.push(playerLetter);

    const botResults = [];
    state.players.filter(p => p.isBot).forEach(bot => {
        if (bot.sum > 21) bot.status = "Lose";
        else if (dealerSum > 21 || bot.sum > dealerSum) bot.status = "Win";
        else if (bot.sum === dealerSum) bot.status = "Tie";
        else bot.status = "Lose";

        botResults.push({ name: bot.name, outcome: bot.status, sum: bot.sum });
    });
    if (state.stats.history.length > 10) state.stats.history = state.stats.history.slice(-10);

    state.lastResult = {
        player: { sum: player.sum, outcome: player.status },
        bots: botResults,
        dealer: dealerSum
    };
    console.log("Round result:", state.lastResult);
}

export function addBot(state) {
    const botCount = state.players.filter(p => p.isBot).length;

    if (botCount >= state.maxBots) {
        showInfo(state, "Maximum number of bots reached.");
        return;
    }

    const newBot = {
        id: "bot" + (botCount + 1),
        name: "Bot " + (botCount + 1),
        cards: [],
        sum: 0,
        aceCount: 0,
        status: "waiting",
        isBot: true,
        active: false,
        style: ["safe", "normal", "aggressive"][Math.floor(Math.random() * 3)]
    };

    state.players.push(newBot);
    showInfo(state, `Bot ${botCount + 1} added. It will join next round.`);
    render(state);
}
