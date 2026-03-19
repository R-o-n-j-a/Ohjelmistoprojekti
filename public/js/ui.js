const COLORS = ['#e05c5c', '#5c9de0', '#5cba7c', '#e0a85c', '#b45ce0', '#5cc9c9'];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  t.classList.add('toast-show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => {
    t.classList.remove('toast-show');
    setTimeout(() => { t.style.display = 'none'; }, 300);
  }, duration);
}

function showJoinError(msg) {
  const el = document.getElementById('join-error');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function setBtn(id, enabled) {
  document.getElementById(id).disabled = !enabled;
}

function appendCardImg(container, cardCode, small = false) {
  const img = document.createElement('img');
  img.src = `./cards/${cardCode}.png`;
  img.className = `card-img${small ? ' card-sm' : ''}`;
  img.alt = cardCode;
  container.appendChild(img);
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderLobby(state, myId) {
  document.getElementById('lobby-room-id').textContent = state.roomId;
  document.getElementById('lobby-player-count').textContent = `(${state.players.length}/6)`;

  const me = state.players.find(p => p.id === myId);
  const botCount = state.players.filter(p => p.isBot).length;
  const maxBots = state.maxBots || 3;

  const list = document.getElementById('lobby-player-list');
  list.innerHTML = '';
  state.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'lobby-player-row';
    const extra    = p.isBot ? `<span class="bot-style-tag">${p.botStyle || 'random'}</span>` : '';
    const youTag   = (!p.isBot && p.id === myId) ? ' <em>(You)</em>' : '';
    const removeBtn = (me?.isHost && p.isBot)
      ? `<button class="remove-bot-btn" data-botid="${p.id}" title="Remove bot">✕</button>` : '';
    row.innerHTML = `
      <span class="lobby-player-name">${escHtml(p.name)}${youTag} ${extra}</span>
      <span class="lobby-player-status ${p.connected ? 'online' : 'offline'}">${p.isBot ? 'Bot' : (p.connected ? 'Ready' : 'Offline')}</span>
      ${removeBtn}
    `;
    list.appendChild(row);
  });

  const botCtrl = document.getElementById('bot-controls');
  const startBtn = document.getElementById('btn-start-game');

  if (me?.isHost) {
    botCtrl.style.display = 'block';
    document.getElementById('bot-count-label').textContent = `${botCount} / ${maxBots}`;
    const atMax = botCount >= maxBots || state.players.length >= 6;
    document.querySelectorAll('.bot-style-btn').forEach(b => { b.disabled = atMax; });
    startBtn.style.display = 'block';
    startBtn.disabled = state.players.filter(p => p.connected).length < 1;
    document.getElementById('lobby-status-msg').textContent = state.players.length === 1
      ? 'You are the host. Add bots or wait for friends, then start!'
      : `You are the host. ${state.players.length} player(s) ready — start when you like!`;
  } else {
    botCtrl.style.display = 'none';
    startBtn.style.display = 'none';
    document.getElementById('lobby-status-msg').textContent = 'Waiting for the host to start the game…';
  }
}

function renderGame(state, myId) {
  renderDealer(state);
  renderPlayers(state, myId);
  renderControls(state, myId);
  renderTurnIndicator(state, myId);
  if (state.roundFinished && state.lastResults) renderRoundResults(state);
  else document.getElementById('round-results-panel').innerHTML = '';
  renderMyStats(state, myId);
}

function renderDealer(state) {
  const cardsDiv = document.getElementById('dealer-cards');
  cardsDiv.innerHTML = '';
  if (state.dealer.status === 'hidden') {
    appendCardImg(cardsDiv, 'BACK');
    if (state.dealer.cards[1]) appendCardImg(cardsDiv, state.dealer.cards[1]);
  } else {
    state.dealer.cards.forEach(c => appendCardImg(cardsDiv, c));
  }
  document.getElementById('dealer-sum-display').textContent = state.dealer.status === 'hidden' ? '?' : state.dealer.sum;
  document.getElementById('dealer-status-display').textContent = state.dealer.uiStatus || '';
}

function renderPlayers(state, myId) {
  const row = document.getElementById('players-row');
  row.innerHTML = '';

  state.players.forEach((player, idx) => {
    const isMe      = player.id === myId;
    const isCurrent = state.currentPlayerIndex === idx && state.phase === 'playing';

    const slot = document.createElement('div');
    slot.className = ['player-slot', isCurrent ? 'current-player' : '', isMe ? 'my-slot' : '',
      player.isBot ? 'bot-slot' : '', !player.connected ? 'disconnected' : ''].filter(Boolean).join(' ');
    slot.style.setProperty('--pc', COLORS[idx % COLORS.length]);

    const youBadge   = isMe ? ' <span class="you-badge">(You)</span>' : '';
    const styleBadge = player.isBot ? `<span class="bot-style-tag sm">${player.botStyle || 'random'}</span>` : '';
    const header = document.createElement('div');
    header.className = 'player-slot-header';
    header.innerHTML = `
      <span class="ps-name">${escHtml(player.name)}${youBadge}${styleBadge}</span>
      <span class="ps-sum">${getSumText(player)}</span>
    `;
    slot.appendChild(header);

    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'ps-cards-wrap';
    if (player.hands) {
      player.hands.forEach((hand, hi) => {
        const handDiv = document.createElement('div');
        handDiv.className = `hand-group${hi === player.currentHandIndex && isCurrent ? ' active-hand' : ''}`;
        handDiv.innerHTML = `<div class="hand-label">Hand ${hi + 1} · ${hand.sum}</div>`;
        const hcards = document.createElement('div');
        hcards.className = 'hand-cards-row';
        hand.cards.forEach(c => appendCardImg(hcards, c, true));
        handDiv.appendChild(hcards);
        cardsWrap.appendChild(handDiv);
      });
    } else {
      const hcards = document.createElement('div');
      hcards.className = 'hand-cards-row';
      player.cards.forEach(c => appendCardImg(hcards, c));
      cardsWrap.appendChild(hcards);
    }
    slot.appendChild(cardsWrap);

    const badge = document.createElement('div');
    badge.className = `ps-badge ${getResultClass(player, state)}`;
    badge.textContent = getStatusText(player, state);
    slot.appendChild(badge);

    row.appendChild(slot);
  });
}

function renderControls(state, myId) {
  const me        = state.players.find(p => p.id === myId);
  const isMyTurn  = state.players[state.currentPlayerIndex]?.id === myId;
  const isPlaying = state.phase === 'playing' && isMyTurn && !state.roundFinished;
  const hand      = me?.hands ? me.hands[me.currentHandIndex] : me;
  const canAct    = isPlaying && hand?.status === 'playing';

  setBtn('btn-hit',       canAct);
  setBtn('btn-stand',     canAct);
  setBtn('btn-double',    canAct && (me?.hands ? hand.cards.length === 2 : me?.cards.length === 2));
  setBtn('btn-split',     canAct && !me?.hands && me?.cards.length === 2 &&
                          getCardValue(me.cards[0]) === getCardValue(me.cards[1]));
  setBtn('btn-new-round', state.roundFinished && !!me?.isHost);

  document.getElementById('game-controls').classList.toggle('my-turn-glow', isMyTurn && !state.roundFinished);
}

function renderTurnIndicator(state, myId) {
  const el  = document.getElementById('turn-indicator');
  const me  = state.players.find(p => p.id === myId);
  const cur = state.players[state.currentPlayerIndex];

  if (state.roundFinished) {
    el.textContent = me?.isHost ? 'Round over — start a new round!' : 'Round finished — waiting for host…';
    el.className = 'turn-indicator finished';
  } else if (state.phase === 'dealer_turn') {
    el.textContent = 'Dealer is playing…';
    el.className = 'turn-indicator dealer-turn';
  } else if (cur?.id === myId) {
    el.textContent = 'Your turn!';
    el.className = 'turn-indicator my-turn';
  } else {
    el.textContent = cur?.isBot ? `${escHtml(cur.name)} is thinking…` : `Waiting for ${escHtml(cur?.name)}…`;
    el.className = 'turn-indicator other-turn';
  }
}

function renderRoundResults(state) {
  const panel = document.getElementById('round-results-panel');
  panel.innerHTML = '<div class="results-title">Round Results</div>';
  state.lastResults.results.forEach(r => {
    r.outcomes.forEach(o => {
      const p = document.createElement('div');
      p.className = `result-row result-${o.outcome.toLowerCase()}`;
      p.textContent = `${r.playerName}${r.outcomes.length > 1 ? ` (H${o.hand})` : ''} : ${o.outcome} · ${o.sum}`;
      panel.appendChild(p);
    });
  });
  const d = document.createElement('div');
  d.className = 'result-row dealer-row';
  d.textContent = `Dealer : ${state.lastResults.dealerSum}`;
  panel.appendChild(d);
}

function renderMyStats(state, myId) {
  const me = state.players.find(p => p.id === myId);
  if (!me) return;
  const s = me.stats;
  document.getElementById('my-stats-panel').innerHTML = `
    <span>${s.wins}W</span>
    <span>${s.losses}L</span>
    <span>${s.streak} streak</span>
    <span class="history-chips">${s.history.map(h => `<span class="hc hc-${h.toLowerCase()}">${h}</span>`).join('')}</span>
  `;
}

function getSumText(player) {
  return player.hands ? player.hands.map(h => h.sum).join(' / ') : (player.sum || '0');
}

function getStatusText(player, state) {
  if (state.roundFinished && player.lastResult) return player.lastResult;
  if (player.uiStatus) return player.uiStatus;
  if (state.phase === 'playing') {
    if (state.players[state.currentPlayerIndex]?.id === player.id) return 'Turn';
    if (player.status === 'waiting') return 'Waiting…';
  }
  return player.status || '';
}

function getResultClass(player, state) {
  if (!state.roundFinished) return '';
  const r = player.lastResult || '';
  if (r.includes('Win'))  return 'result-win';
  if (r.includes('Lose')) return 'result-lose';
  if (r.includes('Tie'))  return 'result-tie';
  return '';
}