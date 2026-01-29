var hidden;
var deck;
var canHit=true;

let players = [];
let dealer = {};
let roundFinished = false;
let winStreak = 0;
let bestStreak = 0;
let history = [];
let roundToken = 0;

window.onload=function() {
    initGameState();
    buildDeck();
    shuffleDeck();
    startRound();
    attachControls();
}

function initGameState() {
    players = [
        {
            id: "you",
            name: "You",
            cards: [],
            sum: 0,
            aceCount: 0,
            status: "playing"
        }
    ];

    dealer = {
        cards: [],
        sum: 0,
        aceCount: 0,
        status: "hidden",
        hasFlipped: false,
        uiStatus: ""
    };
}

function buildDeck() {
    let values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    let types = ["C","D","H","S"]
    deck = []

    for (let t of types) {
        for (let v of values) {
            deck.push(`${v}-${t}`);
        }
    }
}

function shuffleDeck() {
   for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCard() {
    if (!deck || deck.length === 0) {
        buildDeck();
        shuffleDeck();
        showInfoMessage("Deck reshuffled");
    }
    return deck.pop();
}

function startRound() {
        if (!deck || deck.length < 20) {
        buildDeck();
        shuffleDeck();
        showInfoMessage("Shuffling deck...");
    }
    roundToken++;
    document.getElementById("round-result").innerHTML = "";
    document.getElementById("info-messages").innerHTML = "";

    players.forEach(p => {
        if (p.isBot) {
            p.active = true;
            p.uiStatus = "";
            p.status = "waiting";
        }
    });

    players[0].uiStatus = "";
    dealer.uiStatus = "";

    canHit = true;
    roundFinished = false;

    dealer.cards = [];
    dealer.sum = 0;
    dealer.aceCount = 0;
    dealer.status = "hidden";

    let you = players[0];
    you.cards = [];
    you.sum = 0;
    you.aceCount = 0;
    you.status = "playing";
    you.uiStatus = "";
    you.hands = null;
    you.currentHandIndex = 0;

    players.forEach((player, index) => {
    if (index === 0) return;

    if (player.isBot) {
        player.cards = [];
        player.sum = 0;
        player.aceCount = 0;
        player.status = "playing";
    }
    dealer.hasFlipped = false;
});

    hidden = dealCard();
    dealer.cards.push(hidden);

    let visible = dealCard();
    dealer.cards.push(visible);

    for (let i = 0; i < 2; i++) {
        let card = dealCard();
        you.cards.push(card);
        you.sum += getValue(card);
        you.aceCount += checkAce(card);

        players.forEach((player, index) => {
            if (index === 0) return;
            if (!player.isBot) return;

            let botCard = dealCard();
            player.cards.push(botCard);
            player.sum += getValue(botCard);
            player.aceCount += checkAce(botCard);
        });
    }
    you.sum = reduceAce(you.sum, you.aceCount);

    players.forEach((player, index) => {
        if (index === 0) return;
        if (player.isBot) {
            player.sum = reduceAce(player.sum, player.aceCount);
        }
    });
    recalc(dealer);
    render();
}

function attachControls() {
    document.getElementById("hit").onclick = () => hit();
    document.getElementById("stand").onclick = () => stand();
    document.getElementById("double").onclick = () => doubleDown();
    document.getElementById("split").onclick = () => splitHand();
    document.getElementById("new-round").onclick = () => startRound();
    document.getElementById("add-bot").onclick = () => addBot();
    document.getElementById("exit").onclick = () => exitGame();
}

function exitGame() {
    if (confirm("Are you sure you want to exit the game?")){
        window.location.href = "index.html";
    }
}

function hit() {
    let you = players[0];
    if (!canHit) return;

    let hand = you.hands ? you.hands[you.currentHandIndex] : you;
    if (hand.status !== "playing") return;

    let card = dealCard();
    hand.cards.push(card);
    recalc(hand);
    players[0].uiStatus = "Hit";


    if (hand.sum > 21) {
        hand.status = "bust";
        players[0].uiStatus = "Bust";
    }

    if (you.hands && hand.status !== "playing") {
        if (you.currentHandIndex + 1 < you.hands.length) {
            you.currentHandIndex++;
            render();
            return;
        }
    }

    let allHandsDone = you.hands
        ? you.hands.every(h => h.status !== "playing")
        : hand.status !== "playing";

    if (allHandsDone) {
        canHit = false;

        const token = roundToken;

        (async () => {
            for (let bot of players.filter(p => p.isBot && p.active)) {
                if (token !== roundToken) return;
                await playBot(bot);
            }

            if (token !== roundToken) return;
            await dealerPlay();

            if (token !== roundToken) return;
            render();
            renderResults();
        })();

    }
    render();
}

function stand(){
    let you = players[0];
    let hand = you.hands ? you.hands[you.currentHandIndex] : you;

    if (!canHit || hand.status !== "playing") return;

    hand.status = "stand";
    players[0].uiStatus = "Stand";

     if (you.hands && you.currentHandIndex < you.hands.length - 1) {
        you.currentHandIndex++;
        render();
        return;
    }
    canHit = false;

        const token = roundToken;

        (async () => {
            for (let bot of players.filter(p => p.isBot && p.active)) {
                if (token !== roundToken) return;
                await playBot(bot);
            }

            if (token !== roundToken) return;
            await dealerPlay();
            
            if (token !== roundToken) return;
            render();
            renderResults();
        })();

    render();
}

function doubleDown() {
    let you = players[0];
    let hand = you.hands ? you.hands[you.currentHandIndex] : you;

    if (!canHit) return;
    if (hand.cards.length !== 2) return;

    let card = dealCard();
    hand.cards.push(card);
    recalc(hand);
    hand.status = "stand";
    players[0].uiStatus = "Double";

    if (you.hands && you.currentHandIndex + 1 < you.hands.length) {
        you.currentHandIndex++;
    } else {
        canHit = false;

        const token = roundToken;

        (async () => {
            for (let bot of players.filter(p => p.isBot && p.active)) {
                if (token !== roundToken) return;
                await playBot(bot);
            }

            if (token !== roundToken) return;
            await dealerPlay();
            
            if (token !== roundToken) return;
            render();
            renderResults();
        })();
    }
    render();
}

function splitHand() {
    let you = players[0];

    if (!canHit) return;
    if (you.hands) return;

    let card1 = you.cards[0];
    let card2 = you.cards[1];
    if (getValue(card1) !== getValue(card2)) {
        alert("Splitting is only allowed with two cards of the same value.");
        return;
    }

    you.hands = [
        { cards: [card1], sum: getValue(card1), aceCount: checkAce(card1), status: "playing" },
        { cards: [card2], sum: getValue(card2), aceCount: checkAce(card2), status: "playing" }
    ];

    for (let hand of you.hands) {
        let card = dealCard();
        hand.cards.push(card);
        recalc(hand);
    }

    you.currentHandIndex = 0;
    you.cards =[];
    you.sum =0;
    you.aceCount =0;

    players[0].uiStatus = "Split";

    render();
}

async function dealerPlay() {
    dealer.status = "playing";
    dealer.uiStatus = "Revealing";
    updateTurnText();
    render();

    await delay(600);

    dealer.status = "reveal";
    dealer.uiStatus = "Revealed";
    recalc(dealer);
    render();

    while (dealer.sum < 17) {
        await delay(700);

        dealer.cards.push(dealCard());
        recalc(dealer);

        dealer.uiStatus = "Hit";
        render();
    }

    await delay(600);

    if (dealer.sum > 21) {
        dealer.uiStatus = "Bust";
    } else {
        dealer.uiStatus = "Stand";
    }

    dealer.status = "done";
    render();
}

function render() {
    const dealerDiv = document.getElementById("dealer-cards");
    const yourDiv = document.getElementById("your-cards");

    dealerDiv.innerHTML = "";
    yourDiv.innerHTML = "";

    // dealer
    if (dealer.status === "hidden") {
        const backImg = document.createElement("img");
        backImg.src = "./cards/BACK.png";
        dealerDiv.appendChild(backImg);

        const img = document.createElement("img");
        img.src = `./cards/${dealer.cards[1]}.png`;
        dealerDiv.appendChild(img);
    } else {
        dealer.cards.forEach((c, index) => {
            const img = document.createElement("img");

            if (index === 0 && !dealer.hasFlipped) {
                img.src = `./cards/${c}.png`;
                img.classList.add("dealer-card");

                dealerDiv.appendChild(img);

                setTimeout(() => {
                    img.classList.add("revealed");
                }, 50);

                dealer.hasFlipped = true;
            } else {
                img.src = `./cards/${c}.png`;
                dealerDiv.appendChild(img);
            }
        });
    }

    document.getElementById("dealer-sum").innerText =
    dealer.status === "reveal" || dealer.status === "done"
        ? dealer.sum
        : "?";

    document.getElementById("dealer-status").innerText =
    dealer.uiStatus ? `(${dealer.uiStatus})` : "";

    //bots
    const botDivs = document.querySelectorAll(".bot");
    const bots = players.filter(p => p.isBot);

    botDivs.forEach((botDiv, index) => {
        const bot = bots[index];

        if (!bot) {
            botDiv.style.display = "none";
        return;
        }
        botDiv.style.display = "block";

        const statusEl = botDiv.querySelector(".bot-status");

        if (!bot.active) {
            botDiv.classList.add("waiting");
            statusEl.innerText = "(Waiting next round)";
        } else {
            botDiv.classList.remove("waiting");
            statusEl.innerText = bot.uiStatus ? `(${bot.uiStatus})` : "";
        }

        botDiv.querySelector(".bot-sum").innerText = bot.sum;

        const cardsDiv = botDiv.querySelector(".bot-cards");
        cardsDiv.innerHTML = "";

        bot.cards.forEach(card => {
            const img = document.createElement("img");
            img.src = `./cards/${card}.png`;
            cardsDiv.appendChild(img);
        });
    });

    //you
    let you = players[0];

    let youDiv = document.createElement("div");

    if (you.hands) {
        you.hands.forEach((hand, index) => {
            let handDiv = document.createElement("div");
            handDiv.innerText = `Hand ${index + 1}: `;

            if (index === you.currentHandIndex) {
                handDiv.classList.add("active-hand");
            }

            hand.cards.forEach(c => {
                let img = document.createElement("img");
                img.src = `./cards/${c}.png`;
                handDiv.appendChild(img);
            });

            youDiv.appendChild(handDiv);
        });
    } else {
        you.cards.forEach(c => {
            let img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            youDiv.appendChild(img);
        });
    }

    yourDiv.appendChild(youDiv);

    document.getElementById("your-sum").innerText =
    you.hands
        ? you.hands.map(h => h.sum).join(" / ")
        : you.sum;

    document.getElementById("your-status").innerText =
    you.uiStatus ? `(${you.uiStatus})` : "";

    updateControls();
    updateTurnText();
}

function renderResults() {
    roundFinished = true;

    renderPlayerResults();
    renderBotResults();
    updateTurnText();
    updateControls();
}

function renderStats() {
    const stats = document.getElementById("stats");
    stats.innerHTML = `
        <hr>
        <div>Current streak: ${winStreak}</div>
        <div>Best streak: ${bestStreak}</div>
        <div>History: ${history.join(" ")}</div>
    `;
}

function renderPlayerResults() {
    const you = players[0];
    const roundDiv = document.getElementById("round-result");
    roundDiv.innerHTML = "";
    let messages = [];
    let outcome;

    if (you.hands) {
        you.hands.forEach((hand, index) => {
            let msg = `Hand ${index + 1}: `;
            if (hand.sum > 21) {
                msg += "Bust - You lose"; 
                outcome = "L";
            } else if (dealer.sum > 21) {
                msg += "Dealer bust - You win";
                outcome = "W";
            } else if (hand.sum > dealer.sum) {
                msg += "You win";
                outcome = "W";
            } else if (hand.sum < dealer.sum) {
                msg += "You lose";
                outcome = "L";
            } else {
                msg += "Tie";
                outcome = "T";
            }
            messages.push(msg);
        });
    } else {
        if (you.sum > 21) {
            messages.push("Bust - You lose");
            outcome = "L";
        } else if (dealer.sum > 21) {
            messages.push("Dealer bust - You win");
            outcome = "W";
        } else if (you.sum > dealer.sum) {
            messages.push("You win");
            outcome = "W";
        } else if (you.sum < dealer.sum) {
            messages.push("You lose");
            outcome = "L";
        } else {
            messages.push("Tie");
            outcome = "T";
        }
    }

    roundDiv.innerText = messages.join(" | ");

    if (outcome === "W") {
        winStreak++;
        bestStreak = Math.max(bestStreak, winStreak);
    } else if (outcome === "L") {
        winStreak = 0;
    }
    history.push(outcome);
    if (history.length > 10) history.shift();

    renderStats();
}

function renderBotResults() {
    const results = document.getElementById("round-result");

    players.forEach(player => {
        if (!player.isBot) return;

        let result;
        if (player.sum > 21) result = "Bust - loses";
        else if (dealer.sum > 21) result = "Dealer bust - wins";
        else if (player.sum > dealer.sum) result = "Wins";
        else if (player.sum < dealer.sum) result = "Loses";
        else result = "Tie";

        const p = document.createElement("div");
        p.innerText = `${player.name}: ${result} (${player.sum})`;
        results.appendChild(p);
    });
}

function showResultMessage(text, type = "") {
    const results = document.getElementById("results");
    const msg = document.createElement("div");
    msg.innerText = text;

    if (type) {
        msg.classList.add(type);
    }
    results.appendChild(msg);
}

function showInfoMessage(text) {
    const info = document.getElementById("info-messages");
    if (!info) return;
    const msg = document.createElement("div");
    msg.innerText = text;
    msg.classList.add("info");
    info.appendChild(msg);

    setTimeout(() => {
        msg.remove();
    }, 3000);
}

function addBot() {
    let botCount = players.filter(p => p.isBot).length;

    if (botCount >= 3) {
        showInfoMessage("Maximum number of bots reached.");
        return;
    }

    let newBotNumber = botCount + 1;

    players.push({
        id: "bot" + (newBotNumber),
        name: "Bot " + (newBotNumber),
        cards: [],
        sum: 0,
        aceCount: 0,
        status: "waiting",
        isBot: true,
        active: false,
        style: ["safe", "normal", "aggressive"][Math.floor(Math.random() * 3)]
    });
    
    showInfoMessage(
        `Bot ${newBotNumber} added. It will join next round.`
    );
    render();
}

async function playBot(bot) {
    bot.status = "playing";
    updateBotStatus(bot, "Thinking...");
    render();

    await delay(800);

    const dealerUpCard = getValue(dealer.cards[1]);

    let hitLimit;
    switch (bot.style) {
        case "safe":
            hitLimit = 16;
            break;
        case "aggressive":
            hitLimit = 18;
            break;
        default:
            hitLimit = 17;
    }

    if (dealerUpCard >= 7) {
        hitLimit ++;
    } else if (dealerUpCard <= 3) {
        hitLimit --;
    }

    hitLimit = Math.max(15, Math.min(hitLimit, 19));
    const isSoft = ()=> bot.aceCount > 0 && bot.sum + 10 <= 21;

    while (
        bot.sum < hitLimit ||
        (bot.sum === 17 && isSoft())
    ) {
        updateBotStatus(bot, "Hit");
        render();

        await delay(700);

        const card = dealCard();
        bot.cards.push(card);
        recalc(bot);
    }
    await delay(500);

    if (bot.sum > 21) {
        bot.status = "bust";
        updateBotStatus(bot, "Bust");
    } else {
        bot.status = "stand";
        updateBotStatus(bot, "Stand");
    }
    render();
    await delay(500);
}

function updateControls() {
    let player = players[0];

    document.getElementById("new-round").disabled = !roundFinished;

    if (roundFinished) {
        document.getElementById("hit").disabled = true;
        document.getElementById("stand").disabled = true;
        document.getElementById("double").disabled = true;
        document.getElementById("split").disabled = true;
        return;
    }

    document.getElementById("hit").disabled = !canHit;
    document.getElementById("stand").disabled = !canHit;

    let activeHand = player.hands
        ? player.hands[player.currentHandIndex]
        : player;

    document.getElementById("double").disabled =
        !canHit || activeHand.cards.length !== 2;

    let canSplit =
        canHit &&
        !player.hands &&
        player.cards.length === 2 &&
        getValue(player.cards[0]) === getValue(player.cards[1]);

    document.getElementById("split").disabled = !canSplit;
}

function updateTurnText() {
    let text;

    if (roundFinished) {
        text = "Round finished";
    } else if (canHit) {
        text = "Your turn";
    } else if (dealer.status === "playing") {
        text = "Dealer is playing...";
    } else {
        text = "Round in progress...";
    }
    document.getElementById("turn-info").innerText = text;
}

function getValue(card) {
    if (!card) return 0;

    let value = card.split("-")[0];
    if (value === "A") return 11;
    if (["J","Q","K"].includes(value)) return 10;
    return parseInt(value);
}

function checkAce(card) {
    return card.startsWith("A") ? 1 : 0;
}

function reduceAce(sum, aceCount) {
    while (sum > 21 && aceCount > 0) {
        sum -= 10;
        aceCount -= 1;
    }
    return sum;
}

function recalc(hand){
    let sum = 0;
    let aceCount = 0;

    for (let c of hand.cards) {
        sum += getValue(c);
        aceCount += checkAce(c);
    }

    while (sum > 21 && aceCount > 0) {
        sum -= 10;
        aceCount--;
    }

    hand.sum = sum;
    hand.aceCount = aceCount;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateBotStatus(bot, text) {
    bot.uiStatus = text;
}
