import { createGameState } from "./gameState.js";
import { startRound } from "./gameLogic.js";
import { attachControls } from "./controls.js";
import { render } from "./ui.js";

const state = createGameState();

window.onload = () => {
  startRound(state);
  attachControls(state);
  render(state);
};
