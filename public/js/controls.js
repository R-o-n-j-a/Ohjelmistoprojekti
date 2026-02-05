import {
  hit,
  stand,
  doubleDown,
  splitHand,
  startRound,
  addBot
} from "./gameLogic.js";

export function attachControls(state) {
  document.getElementById("hit").onclick = () => {
    if (!state.roundFinished) hit(state);
  };

  document.getElementById("stand").onclick = () => {
    if (!state.roundFinished) stand(state);
  };

  document.getElementById("double").onclick = () => {
    if (!state.roundFinished) doubleDown(state);
  };

  document.getElementById("split").onclick = () => {
    if (!state.roundFinished) splitHand(state);
  };

  document.getElementById("new-round").onclick = () => {
    if (state.roundFinished) startRound(state);
  };

  document.getElementById("add-bot").onclick = () => {
    addBot(state);
  };

  document.getElementById("exit").onclick = () => {
    const ok = confirm("Are you sure you want to exit the game?");
    if (ok) {
      window.location.href = "index.html";
    }
  };
}