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

    handContainer.style.display = "flex";
    handContainer.style.gap = "10px";
    handContainer.style.justifyContent = "center";

    if (player.hands) {
        player.hands.forEach((hand, idx) => {
            const handDiv = document.createElement("div");
            handDiv.classList.add("hand");
            if (idx === player.currentHandIndex) handDiv.classList.add("active-hand");
            
            const label = document.createElement("div");
            label.innerText = `Hand ${idx + 1} (${hand.sum})`;
            handDiv.appendChild(label);

            const cardsDiv = document.createElement("div");
            cardsDiv.classList.add("hand-cards");

            hand.cards.forEach(c => {
                const img = document.createElement("img");
                img.src = `./cards/${c}.png`;
                cardsDiv.appendChild(img);
            });

            handDiv.appendChild(cardsDiv);
            handContainer.appendChild(handDiv);
        });
    } else {
        const cardsDiv = document.createElement("div");
        cardsDiv.classList.add("hand-cards");

        player.cards.forEach(c => {
            const img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            cardsDiv.appendChild(img);
        });
        handContainer.appendChild(cardsDiv);
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
    //round results
    const roundDiv = document.getElementById("round-result");
    roundDiv.innerHTML = "";
   if (state.roundFinished && state.lastResult) {

        const title = document.createElement("strong");
        title.innerText = "Round results:";
        roundDiv.appendChild(title);

        if (Array.isArray(state.lastResult.player)) {
            state.lastResult.player.forEach(hand => {
                const p = document.createElement("p");
                p.innerText = `You (Hand ${hand.hand}): ${hand.outcome} (${hand.sum})`;
                roundDiv.appendChild(p);
            });
        } else {
            const p = document.createElement("p");
            p.innerText = `You: ${state.lastResult.player.outcome} (${state.lastResult.player.sum})`;
            roundDiv.appendChild(p);
        }
        if (state.lastResult.bots && state.lastResult.bots.length) {
            state.lastResult.bots.forEach(bot => {
                const p = document.createElement("p");
                p.innerText = `${bot.name}: ${bot.outcome} (${bot.sum})`;
                roundDiv.appendChild(p);
            });
        }
        const d = document.createElement("p");
        d.innerText = `Dealer: ${state.lastResult.dealer}`;
        roundDiv.appendChild(d);
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
    const player = state.players[0];

    if (state.roundFinished) {
        document.getElementById("turn-info").innerText = "Round finished";
        return;
    }
    let hasActiveHand = false;
    if (player.hands) {
        hasActiveHand = player.currentHandIndex < player.hands.length &&
                        player.hands[player.currentHandIndex].status === "playing";
    } else {
        hasActiveHand = player.status === "playing";
    }
    if (state.canHit && hasActiveHand) {
        document.getElementById("turn-info").innerText = "Your turn";
    } else {
        document.getElementById("turn-info").innerText = "Round in progress...";
    }
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
