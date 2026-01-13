
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

    dealer.cards = [];
    dealer.sum = 0;
    dealer.aceCount = 0;
    dealer.status = "hidden";

    let you = players[0];
    you.cards = [];
    you.sum = 0;
    you.aceCount = 0;
    you.status = "playing";

    hidden = deck.pop();
    dealer.sum += getValue(hidden);
    dealer.aceCount += checkAce(hidden);

    let second = deck.pop();
    dealer.cards.push(second);
    dealer.sum += getValue(second);
    dealer.aceCount += checkAce(second);

    for (let i = 0; i < 2; i++) {
        let card = deck.pop();
        you.cards.push(card);
        you.sum += getValue(card);
        you.aceCount += checkAce(card);
    }
    
    render();
    attachControls();
}

function attachControls() {
    document.getElementById("hit").onclick = hit;
    document.getElementById("stand").onclick = stand;
}


function hit() {
    let you = players[0];
    if (!canHit || you.status !== "playing") return;

    let card = deck.pop();
    you.cards.push(card);
    you.sum += getValue(card);
    you.aceCount += checkAce(card);

    if (reduceAce(you.sum, you.aceCount) > 21) {
        you.status = "bust";
        canHit= false;
    }

    render();
}

function stand(){
    let you = players[0];
    you.sum = reduceAce(you.sum, you.aceCount);
    canHit = false;

    dealer.sum = reduceAce(dealer.sum, dealer.aceCount);
    while (dealer.sum < 17) {
        let card = deck.pop();
        dealer.cards.push(card);
        dealer.sum += getValue(card);
        dealer.aceCount += checkAce(card);
        dealer.sum = reduceAce(dealer.sum, dealer.aceCount);
    }

    you.status = "stand";
    dealer.status = "reveal";

    render();
    renderResults();
}

function render() {
    let you = players[0];

    document.getElementById("dealer-cards").innerHTML = "";
    document.getElementById("your-cards").innerHTML = "";

    if (dealer.status === "hidden") {
        let img = document.createElement("img");
        img.id = "hidden";
        img.src = "./cards/BACK.png";
        document.getElementById("dealer-cards").append(img);

        for (let c of dealer.cards) {
            let img2 = document.createElement("img");
            img2.src = `./cards/${c}.png`;
            document.getElementById("dealer-cards").append(img2);
        }
    } else {
        let img = document.createElement("img");
        img.src = `./cards/${hidden}.png`;
        document.getElementById("dealer-cards").append(img);

        for (let c of dealer.cards) {
            let img2 = document.createElement("img");
            img2.src = `./cards/${c}.png`;
            document.getElementById("dealer-cards").append(img2);
        }
    }

    for (let c of you.cards) {
        let img = document.createElement("img");
        img.src = `./cards/${c}.png`;
        document.getElementById("your-cards").append(img);
    }
}

function renderResults() {
    let you = players[0];

    let message = "";
    if (you.sum > 21) {
        message = "You lose";
    } else if (dealer.sum > 21) {
        message = "You win!";
    } else if (you.sum == dealer.sum) {
        message = "Tie";
    } else if (you.sum > dealer.sum) {
        message = "You win!";
    } else {
        message = "You lose";
    }

    document.getElementById("dealer-sum").innerText = dealer.sum;
    document.getElementById("your-sum").innerText = you.sum;
    document.getElementById("results").innerText = message;
}

function getValue(card) {
    let value = card.split("-")[0];

    if (isNaN(value)) return value === "A" ? 11 : 10;
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