
var hidden;
var deck;
var canHit=true;

let players = [];
let dealer = {};
let roundFinished = false;

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

function startRound() {

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
    document.getElementById("results").innerText = "";

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
});

    hidden = deck.pop();
    dealer.cards.push(hidden);

    let visible = deck.pop();
    dealer.cards.push(visible);

    for (let i = 0; i < 2; i++) {
        let card = deck.pop();
        you.cards.push(card);
        you.sum += getValue(card);
        you.aceCount += checkAce(card);

        players.forEach((player, index) => {
            if (index === 0) return;
            if (!player.isBot) return;

            let botCard = deck.pop();
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

    let card = deck.pop();
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

        (async () => {
            for (let bot of players.filter(p => p.isBot && p.active)) {
                await playBot(bot);
            }

            dealerPlay();
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

    (async () => {
        for (let bot of players.filter(p => p.isBot && p.active)) {
            await playBot(bot);
        }

        dealerPlay();
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

    let card = deck.pop();
    hand.cards.push(card);
    recalc(hand);
    hand.status = "stand";
    players[0].uiStatus = "Double";

    if (you.hands && you.currentHandIndex + 1 < you.hands.length) {
        you.currentHandIndex++;
    } else {
        canHit = false;

        (async () => {
            for (let bot of players.filter(p => p.isBot && p.active)) {
                await playBot(bot);
            }
            dealerPlay();
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
        let card = deck.pop();
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

function dealerPlay() {
    let sum = 0;
    let aceCount = 0;

    for (let c of dealer.cards) {
        sum += getValue(c);
        aceCount += checkAce(c);
    }

    sum = reduceAce(sum, aceCount);

    while (sum < 17) {
        let card = deck.pop();
        dealer.cards.push(card);
        sum += getValue(card);
        aceCount += checkAce(card);
        sum = reduceAce(sum, aceCount);
    }

    dealer.sum = sum;
    dealer.aceCount = aceCount;
    dealer.status = "reveal";
}

function render() {
    const dealerDiv = document.getElementById("dealer-cards");
    const yourDiv = document.getElementById("your-cards");

    dealerDiv.innerHTML = "";
    yourDiv.innerHTML = "";

    //dealer
    if (dealer.status === "hidden") {
        let backImg = document.createElement("img");
        backImg.src = "./cards/BACK.png";
        dealerDiv.appendChild(backImg);

        for (let i = 1; i < dealer.cards.length; i++) {
            let img = document.createElement("img");
            img.src = `./cards/${dealer.cards[i]}.png`;
            dealerDiv.appendChild(img);
        }
    } else {
        dealer.cards.forEach(c => {
            let img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            dealerDiv.appendChild(img);
        });
    }

    document.getElementById("dealer-sum").innerText =
        dealer.status === "reveal" ? dealer.sum : "?";

    //bots
    const botDivs = document.querySelectorAll(".bot");
    const bots = players.filter(p => p.isBot && p.active);

    botDivs.forEach((botDiv, index) => {
        const bot = bots[index];

        if (!bot) {
            botDiv.style.display = "none";
        return;
        }

        botDiv.style.display = "block";
        botDiv.querySelector(".bot-sum").innerText = bot.sum;
        botDiv.querySelector(".bot-status").innerText =
            bot.uiStatus ? `(${bot.uiStatus})` : "";

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
    let you = players[0];
    let messages = [];

    if (you.hands) {
        you.hands.forEach((hand, index) => {
            let msg = `Hand ${index + 1}: `;
            if (hand.sum > 21) msg += "Bust - You lose";
            else if (dealer.sum > 21) msg += "Dealer bust - You win";
            else if (hand.sum > dealer.sum) msg += "You win";
            else if (hand.sum < dealer.sum) msg += "You lose";
            else msg += "Tie";
            messages.push(msg);
        });
    } else {
        if (you.sum > 21) messages.push("Bust- You lose");
        else if (dealer.sum > 21) messages.push("Dealer bust - You win");
        else if (you.sum > dealer.sum) messages.push("You win");
        else if (you.sum < dealer.sum) messages.push("You lose");
        else messages.push("Tie");
    }

    document.getElementById("dealer-sum").innerText = dealer.sum;
    document.getElementById("your-sum").innerText = you.hands
        ? you.hands.map(h => h.sum).join(" / ")
        : you.sum;
    
    let resultEl = document.getElementById("results");
    resultEl.className = "";
    resultEl.innerText = messages.join(" | ");

    players.forEach((player, index) => {
        if (!player.isBot) return;

        let result;
        if (player.sum > 21) result = "Bust - loses";
        else if (dealer.sum > 21) result = "Dealer bust - wins";
        else if (player.sum > dealer.sum) result = "Wins";
        else if (player.sum < dealer.sum) result = "Loses";
        else result = "Tie";

        console.log(`${player.name}: ${result} (${player.sum})`);

        let p = document.createElement("div");
        p.innerText = `${player.name}: ${result} (${player.sum})`;
        document.getElementById("results").appendChild(p);
    });

    updateTurnText();
}

function addBot() {
    let botCount = players.filter(p => p.isBot).length;

    if (botCount >= 3) {
        alert("Maximum number of bots reached.");
        return;
    }

    players.push({
        id: "bot" + (botCount + 1),
        name: "Bot " + (botCount + 1),
        cards: [],
        sum: 0,
        aceCount: 0,
        status: "waiting",
        isBot: true,
        active: false
    });

    alert(`Bot ${botCount + 1} added. It will join next round.`);
}

async function playBot(bot) {
    bot.status = "playing";
    updateBotStatus(bot, "Thinking...");
    render();

    await delay(800);

    while (bot.sum < 16) {
        let card = deck.pop();
        bot.cards.push(card);
        recalc(bot);

        updateBotStatus(bot, "Hit");
        render();

        await delay(800);
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
    } else {
        text = "Round in progress...";
    }
    document.getElementById("turn-info").innerText = text;
}


function getValue(card) {
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
