import { drawCard } from "./gameLogic.js";
import { delay, getCardValue } from "./utils.js";
import { render } from "./ui.js";

export async function playBots(state) {
  const bots = state.players.filter(p => p.isBot && p.active);

  for (const bot of bots) {
    bot.uiStatus = "Thinking...";
    render(state);
    await delay(600);

    const dealerUp = getCardValue(state.dealer.cards[1]);
    let limit = bot.style === "aggressive" ? 18 :
                bot.style === "safe" ? 16 : 17;

    if (dealerUp >= 7) limit++;
    if (dealerUp <= 3) limit--;

    limit = Math.max(15, Math.min(limit, 19));

    while (bot.sum < limit) {
      drawCard(bot, state.deck);
      bot.uiStatus = "Hit";
      render(state);
      await delay(600);
    }

    bot.uiStatus = bot.sum > 21 ? "Bust" : "Stand";
    bot.active = false;
    render(state);
  }
}