const freshState = () => ({
  cards: [], sum: 0, hands: null, currentHandIndex: 0,
  status: 'waiting', uiStatus: '', lastResult: null
});

const newStats  = () => ({ wins: 0, losses: 0, streak: 0, history: [] });
const newPlayer = (id, name, isHost = false) => ({
  ...freshState(), id, name, isHost, isBot: false, connected: true, stats: newStats()
});
const newBot = (index, style) => {
  const s = style || ['safe','normal','aggressive'][Math.floor(Math.random() * 3)];
  return {
    ...freshState(),
    id: `bot-${index}-${Date.now()}`,
    name: `Bot ${index}`,
    isHost: false, isBot: true, botStyle: s, connected: true, stats: newStats()
  };
};

module.exports = { freshState, newPlayer, newBot };