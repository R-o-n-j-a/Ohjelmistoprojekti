class Deck {
  constructor() {
    this.cards = [];
    this.create();
    this.shuffle();
  }

  create() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

    for (let s of suits) {
      for (let v of values) {
        this.cards.push({ suit: s, value: v });
      }
    }
  }

  shuffle() {
    this.cards.sort(() => Math.random() - 0.5);
  }

  draw() {
    return this.cards.pop();
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
  }

  take(card) {
    this.hand.push(card);
  }

  score() {
    let sum = 0;
    let aces = 0;

    for (let c of this.hand) {
      if (c.value === 'A') {
        aces++;
        sum += 11;
      } else if (['K','Q','J'].includes(c.value)) {
        sum += 10;
      } else {
        sum += Number(c.value);
      }
    }

    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }

    return sum;
  }

  bust() {
    return this.score() > 21;
  }
}

class Game {
  constructor() {
    this.deck = new Deck();
    this.player = new Player('Player');
    this.dealer = new Player('Dealer');
  }

  start() {
    this.player.take(this.deck.draw());
    this.dealer.take(this.deck.draw());
    this.player.take(this.deck.draw());
    this.dealer.take(this.deck.draw());
  }
}

const game = new Game();
game.start();

console.log('Player hand:', game.player.hand);
console.log('Player score:', game.player.score());

console.log('Dealer hand:', game.dealer.hand);
console.log('Dealer score:', game.dealer.score());
