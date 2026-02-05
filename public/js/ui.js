import { getCardValue } from "./utils.js";

export function render(state) {
    // dealer
    const dealerDiv = document.getElementById("dealer-cards");
    dealerDiv.innerHTML = "";

    if (state.dealer.status === "hidden" && !state.roundFinished) {
        const backImg = document.createElement("img");
        backImg.src = "./cards/BACK.png";
        dealerDiv.appendChild(backImg);

    if (state.dealer.cards[1]) {
        const visibleImg = document.createElement("img");
        visibleImg.src = `./cards/${state.dealer.cards[1]}.png`;
        dealerDiv.appendChild(visibleImg);
    }
    } else {
        state.dealer.cards.forEach(c => {
            const img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            dealerDiv.appendChild(img);
        });
    }

    document.getElementById("dealer-sum").innerText =
        (state.dealer.status === "hidden") ? "?" : state.dealer.sum;

    document.getElementById("dealer-status").innerText =
        state.dealer.uiStatus || "";

    //bots
    const botDivs = document.querySelectorAll(".bot");
    const bots = state.players.filter(p => p.isBot);

    botDivs.forEach((botDiv, index) => {
        const bot = bots[index];
        if (!bot) {
            botDiv.style.display = "none";
            return;
        }
        botDiv.style.display = "block";
        botDiv.querySelector(".bot-sum").innerText = bot.sum;
        botDiv.querySelector(".bot-status").innerText = bot.uiStatus || "";

        const cardsDiv = botDiv.querySelector(".bot-cards");
        cardsDiv.innerHTML = "";
        bot.cards.forEach(c => {
            const img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            cardsDiv.appendChild(img);
        });
    });
    //player
    const yourDiv = document.getElementById("your-cards");
    yourDiv.innerHTML = "";

    const player = state.players[0];
    const handContainer = document.createElement("div");

    if (player.hands) {
        player.hands.forEach((hand, idx) => {
            const handDiv = document.createElement("div");
            handDiv.innerText = `Hand ${idx + 1}: `;
            if (idx === player.currentHandIndex) handDiv.classList.add("active-hand");

            hand.cards.forEach(c => {
                const img = document.createElement("img");
                img.src = `./cards/${c}.png`;
                handDiv.appendChild(img);
            });

            handContainer.appendChild(handDiv);
        });
    } else {
        player.cards.forEach(c => {
            const img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            handContainer.appendChild(img);
        });
    }

    yourDiv.appendChild(handContainer);

    document.getElementById("your-sum").innerText = player.hands
        ? player.hands.map(h => h.sum).join(" / ")
        : player.sum;

    document.getElementById("your-status").innerText =
        player.uiStatus || "";

    const infoDiv = document.getElementById("info-messages");
    infoDiv.innerHTML = "";
    if (state.infoMessages && state.infoMessages.length) {
        state.infoMessages.forEach(msg => {
            const div = document.createElement("div");
            div.classList.add("info");
            div.innerText = msg;
            infoDiv.appendChild(div);
        });
    }

    const roundDiv = document.getElementById("round-result");
    roundDiv.innerHTML = "";
   if (state.roundFinished && state.lastResult) {
    roundDiv.innerHTML = `Round Result: ${state.lastResult.player.outcome} (${state.lastResult.player.sum})`;

    if (state.lastResult.bots.length) {
        state.lastResult.bots.forEach(bot => {
            const p = document.createElement("p");
            p.innerText = `${bot.name}: ${bot.outcome} (${bot.sum})`;
            roundDiv.appendChild(p);
        });
    }
}
    const statsDiv = document.getElementById("stats");
    statsDiv.innerHTML = `
        <hr>
        <div>Current streak: ${state.stats.streak}</div>
        <div>Wins: ${state.stats.wins} | Losses: ${state.stats.losses}</div>
        <div>History: ${state.stats.history.join(" ")}</div>
    `;

    const turnInfo = document.getElementById("turn-info");
    if (state.roundFinished) turnInfo.innerText = "Round finished";
    else if (state.canHit) turnInfo.innerText = "Your turn";
    else turnInfo.innerText = "Round in progress...";

    updateControls(state);
    updateTurnText(state);
}


export function showInfo(state, message) {
    if (!state.infoMessages) state.infoMessages = [];
    state.infoMessages.push(message);
    if (state.infoMessages.length > 5) state.infoMessages.shift();
    render(state);

    setTimeout(() => {
        state.infoMessages.shift();
        render(state);
    }, 3000);
}

export function updateControls(state) {
    const player = state.players[0];
    const canHit = !state.roundFinished && player.status === "playing";

    document.getElementById("hit").disabled = !canHit;
    document.getElementById("stand").disabled = !canHit;
    document.getElementById("double").disabled =
        !canHit || (player.hands ? player.hands[player.currentHandIndex].cards.length !== 2 : player.cards.length !== 2);

    const canSplit =
        canHit &&
        !player.hands &&
        player.cards.length === 2 &&
        getCardValue(player.cards[0]) === getCardValue(player.cards[1]);

    document.getElementById("split").disabled = !canSplit;
    document.getElementById("add-bot").disabled = state.players.filter(p => p.isBot).length >= state.maxBots;
    document.getElementById("new-round").disabled = !state.roundFinished;
}

export function updateTurnText(state) {
  let text;
  if (state.roundFinished) text = "Round finished";
  else if (state.players[0].status === "playing") text = "Your turn";
  else text = "Round in progress...";
  document.getElementById("turn-info").innerText = text;
}

export function showResult(state, text) {
  const results = document.getElementById("round-result");
  const p = document.createElement("p");
  p.textContent = text;
  results.appendChild(p);
}

function getValue(card) {
  if (!card) return 0;
  const value = card.split("-")[0];
  if (value === "A") return 11;
  if (["J", "Q", "K"].includes(value)) return 10;
  return parseInt(value);
}
