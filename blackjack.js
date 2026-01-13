
var hidden;
var deck;
var canHit=true;

let players = [];
let dealer = [];

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
        status: "hidden"
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
    canHit = true;

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
    you.hands = null;
    you.currentHandIndex = 0;

    hidden = deck.pop();
    dealer.cards.push(hidden);

    let visible = deck.pop();
    dealer.cards.push(visible);
    dealer.sum += getValue(hidden) +  getValue(visible);
    dealer.aceCount += checkAce(hidden) + checkAce(visible);

    for (let i = 0; i < 2; i++) {
        let card = deck.pop();
        you.cards.push(card);
        you.sum += getValue(card);
        you.aceCount += checkAce(card);
    }
    you.sum = reduceAce(you.sum, you.aceCount);
    
    render();
}

function attachControls() {
    document.getElementById("hit").onclick = () => hit();
    document.getElementById("stand").onclick = () => stand();
    document.getElementById("double").onclick = () => doubleDown();
    document.getElementById("split").onclick = () => splitHand();
    document.getElementById("new-round").onclick = () => startRound();
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

    if (hand.sum > 21) hand.status = "bust";

    if (you.hands && hand.status !== "playing") {
        if (you.currentHandIndex + 1 < you.hands.length) {
            you.currentHandIndex++;
        } else {
            canHit = false;
            dealerPlay();
            renderResults();
        }
    } else if (!you.hands && you.status !== "playing") {
            canHit = false;
            dealerPlay();
            renderResults();
    }

    render();
}

function stand(){
    let you = players[0];
    let hand = you.hands ? you.hands[you.currentHandIndex] : you;

    if (!canHit || hand.status !== "playing") return;

    hand.status = "stand";

    if (you.hands && you.currentHandIndex + 1 < you.hands.length) {
        you.currentHandIndex++;
    } else {
        canHit = false;
        dealerPlay();
        renderResults();
    }

    render();
}

function doubleDown() {
    let you = players[0];
    let hand = you.hands ? you.hands[you.currentHandIndex] : you;

    if (!canHit || hand.status !== "playing") return;

    let card = deck.pop();
    hand.cards.push(card);
    recalc(hand);
    hand.status = "stand";

    if (you.hands && you.currentHandIndex + 1 < you.hands.length) {
        you.currentHandIndex++;
    } else {
        canHit = false;
        dealerPlay();
        renderResults();
    }

    render();
}

function splitHand() {
    let you = players[0];

    if (!canHit || you.cards.length !== 2) return;

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

    render();
}

function dealerPlay() {
    let sum = 0;
    let aceCount = 0;

    for (let c of dealer.cards) {
        sum += getValue(c);
        aceCount += checkAce(c);
    }

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
    let you = players[0];

    document.getElementById("dealer-cards").innerHTML = "";
    document.getElementById("your-cards").innerHTML = "";

    if (dealer.status === "hidden") {
        let img = document.createElement("img");
        img.src = "./cards/BACK.png";
        document.getElementById("dealer-cards").append(img);

        for (let i = 1; i < dealer.cards.length; i++) {
            let img2 = document.createElement("img");
            img2.src = `./cards/${dealer.cards[i]}.png`;
            document.getElementById("dealer-cards").append(img2);
        }
    } else {
        for (let c of dealer.cards) {
            let img2 = document.createElement("img");
            img2.src = `./cards/${c}.png`;
            document.getElementById("dealer-cards").append(img2);
        }
    }

    if (you.hands) {
        you.hands.forEach((hand, index) => {
            let div = document.createElement("div");
            div.innerText = `Hand ${index + 1}: `;

            if (index === you.currentHandIndex) {
                div.style.backgroundColor = "#8a8a8aaf"; 
                div.style.padding = "5px";
                div.style.borderRadius = "5px";
            }

            hand.cards.forEach(c => {
                let img = document.createElement("img");
                img.src = `./cards/${c}.png`;
                div.appendChild(img);
            });
            document.getElementById("your-cards").appendChild(div);
        });
    } else {
        you.cards.forEach(c => {
            let img = document.createElement("img");
            img.src = `./cards/${c}.png`;
            document.getElementById("your-cards").appendChild(img);
        });
    }

    document.getElementById("dealer-sum").innerText = dealer.status === "reveal" ? dealer.sum : "?";
    document.getElementById("your-sum").innerText = you.hands
        ? you.hands.map(h => h.sum).join(" / ")
        : you.sum;
}

function renderResults() {
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
    document.getElementById("results").innerText = messages.join(" | ");
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