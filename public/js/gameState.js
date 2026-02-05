export function createGameState() {
    return {
        deck: [],
        hiddenCard: null,
        canHit: true,
        roundFinished: false,
        roundToken: 0,
        players: [
            {
                id: "you",
                name: "You",
                cards: [],
                sum: 0,
                aceCount: 0,
                status: "playing",
                hands: null,
                currentHandIndex: 0,
                uiStatus: ""
            }
        ],
        dealer: {
            cards: [],
            sum: 0,
            aceCount: 0,
            status: "hidden",
            hasFlipped: false,
            uiStatus: ""
        },

        stats: {
            wins: 0,
            losses: 0,
            streak: 0,
            history: []
        },
        infoMessages: [],
        maxBots: 3
    };
}
