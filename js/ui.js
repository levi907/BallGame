// UI rendering for Ball Machine game

/**
 * Main render function - updates all DOM elements based on state.
 */
function render(state) {
  renderStats(state);
  renderMachine(state);
  renderShop(state);
  renderLog(state);
  renderControls(state);
  renderModals(state);
}

function renderStats(state) {
  const round = getRound(state.turn);
  const pullCost = getPullCost(round);

  document.getElementById('turn-display').textContent = state.turn;
  document.getElementById('round-display').textContent = round;
  document.getElementById('cash-display').textContent = formatCash(state.cash);
  document.getElementById('tickets-display').textContent = formatTickets(state.tickets);
  document.getElementById('pull-cost-display').textContent = formatCash(pullCost);
  document.getElementById('pulls-remaining').textContent = state.pullsRemaining;
  document.getElementById('ball-count').textContent = state.machine.length;

  // Progress bar (survive 30 turns)
  const progress = Math.min(state.turn / 30, 1) * 100;
  document.getElementById('progress-fill').style.width = progress + '%';
  document.getElementById('progress-text').textContent = `Turn ${state.turn} / 30`;

  // Shop reset countdown
  const turnsUntilReset = 5 - ((state.turn - 1) % 5);
  document.getElementById('shop-reset-countdown').textContent =
    turnsUntilReset === 5 ? 'New shop this round!' : `Shop resets in ${turnsUntilReset} turns`;

  // Active modifiers
  const modList = [];
  if (state.modifiers.doubleNext) modList.push('Double next ball');
  if (state.modifiers.freePulls > 0) modList.push(`${state.modifiers.freePulls} free pull(s)`);
  if (state.modifiers.insurance) modList.push('Insurance active');
  if (state.modifiers.transmuteActive) modList.push('Transmuter active');
  document.getElementById('active-modifiers').textContent =
    modList.length > 0 ? modList.join(' | ') : '';
}

function renderMachine(state) {
  const container = document.getElementById('machine-balls');
  container.innerHTML = '';

  state.machine.forEach(ballInstance => {
    const ballDef = BALL_CATALOG[ballInstance.type];
    const el = document.createElement('div');
    el.className = 'ball';
    el.style.backgroundColor = RARITY_COLORS[ballDef.rarity];
    if (ballDef.rarity === RARITY.LEGENDARY) {
      el.classList.add('ball-legendary');
    }
    if (ballDef.consumable) {
      el.classList.add('ball-consumable');
    }
    // Random position within machine
    el.style.left = (10 + Math.random() * 75) + '%';
    el.style.top = (10 + Math.random() * 75) + '%';
    el.title = `${ballDef.name}: ${ballDef.description}`;
    container.appendChild(el);
  });
}

function renderShop(state) {
  const ballsContainer = document.getElementById('shop-balls');
  const upgradesContainer = document.getElementById('shop-upgrades');

  // Render shop balls
  ballsContainer.innerHTML = '';
  state.shop.balls.forEach((shopBall, idx) => {
    const ballDef = BALL_CATALOG[shopBall.type];
    const card = document.createElement('div');
    card.className = 'shop-card' + (shopBall.purchased ? ' purchased' : '');

    const canAfford = state.tickets >= shopBall.cost;
    card.innerHTML = `
      <div class="shop-card-rarity" style="color: ${RARITY_COLORS[ballDef.rarity]}">
        ${ballDef.rarity.toUpperCase()}${ballDef.consumable ? ' (consumable)' : ''}
      </div>
      <div class="shop-card-name">${ballDef.name}</div>
      <div class="shop-card-desc">${ballDef.description}</div>
      <div class="shop-card-cost">${formatTickets(shopBall.cost)}</div>
      ${shopBall.purchased
        ? '<div class="shop-card-sold">SOLD</div>'
        : `<button class="btn btn-buy" ${!canAfford ? 'disabled' : ''} data-action="buy-ball" data-index="${idx}">Buy</button>`
      }
    `;
    ballsContainer.appendChild(card);
  });

  // Render shop upgrades
  upgradesContainer.innerHTML = '';
  state.shop.upgrades.forEach((shopUpgrade, idx) => {
    const upgradeDef = UPGRADE_CATALOG[shopUpgrade.type];
    const card = document.createElement('div');
    card.className = 'shop-card shop-card-upgrade' + (shopUpgrade.purchased ? ' purchased' : '');

    const canAfford = state.tickets >= shopUpgrade.cost;
    const canUse = upgradeDef.canUse(state);
    card.innerHTML = `
      <div class="shop-card-name">${upgradeDef.name}</div>
      <div class="shop-card-desc">${upgradeDef.description}</div>
      <div class="shop-card-cost">${formatTickets(shopUpgrade.cost)}</div>
      ${shopUpgrade.purchased
        ? '<div class="shop-card-sold">SOLD</div>'
        : `<button class="btn btn-buy" ${(!canAfford || !canUse) ? 'disabled' : ''} data-action="buy-upgrade" data-index="${idx}">Buy</button>`
      }
    `;
    upgradesContainer.appendChild(card);
  });
}

function renderLog(state) {
  const logContainer = document.getElementById('game-log');
  logContainer.innerHTML = '';

  // Show last 10 entries
  const recentLog = state.log.slice(-10);
  recentLog.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'log-entry';
    el.textContent = `[T${entry.turn}] ${entry.message}`;
    logContainer.appendChild(el);
  });
  logContainer.scrollTop = logContainer.scrollHeight;
}

function renderControls(state) {
  const pullBtn = document.getElementById('pull-btn');
  const endTurnBtn = document.getElementById('end-turn-btn');
  const shopSection = document.getElementById('shop-section');

  if (state.phase === 'pulling') {
    pullBtn.style.display = '';
    endTurnBtn.style.display = 'none';

    const round = getRound(state.turn);
    const cost = getPullCost(round);
    const isFree = state.modifiers.freePulls > 0;

    if (state.pullsRemaining > 0 && (state.cash >= cost || isFree)) {
      pullBtn.disabled = false;
      pullBtn.textContent = isFree ? 'PULL (Free!)' : `PULL (${formatCash(cost)})`;
    } else if (state.pullsRemaining <= 0) {
      // All pulls done, transition to shopping
      pullBtn.style.display = 'none';
      endTurnBtn.style.display = '';
    } else {
      pullBtn.disabled = true;
      pullBtn.textContent = `PULL (${formatCash(cost)}) - Can't afford!`;
    }
  } else if (state.phase === 'shopping') {
    pullBtn.style.display = 'none';
    endTurnBtn.style.display = '';
  } else {
    pullBtn.style.display = 'none';
    endTurnBtn.style.display = 'none';
  }

  // Show/hide shop based on phase
  if (state.phase === 'shopping' || state.pullsRemaining <= 0) {
    shopSection.classList.remove('shop-hidden');
  } else {
    shopSection.classList.add('shop-hidden');
  }
}

function renderModals(state) {
  // Peek modal
  const peekModal = document.getElementById('peek-modal');
  if (state.modifiers.peekBalls && state.modifiers.peekBalls.length > 0) {
    peekModal.style.display = 'flex';
    const peekContent = document.getElementById('peek-content');
    peekContent.innerHTML = '';
    state.modifiers.peekBalls.forEach(ball => {
      const ballDef = BALL_CATALOG[ball.type];
      const el = document.createElement('div');
      el.className = 'peek-ball';
      el.innerHTML = `
        <div class="ball-preview" style="background-color: ${RARITY_COLORS[ballDef.rarity]}"></div>
        <div>${ballDef.name}</div>
        <div class="peek-desc">${ballDef.description}</div>
      `;
      peekContent.appendChild(el);
    });
  } else {
    peekModal.style.display = 'none';
  }

  // Game over modal
  const gameOverModal = document.getElementById('gameover-modal');
  if (state.phase === 'gameOver') {
    gameOverModal.style.display = 'flex';
    document.getElementById('gameover-result').textContent =
      state.gameResult === 'win' ? 'YOU SURVIVED!' : 'BANKRUPT!';
    document.getElementById('gameover-result').className =
      state.gameResult === 'win' ? 'result-win' : 'result-loss';
    document.getElementById('gameover-turns').textContent = state.turn;
    document.getElementById('gameover-cash').textContent = formatCash(state.stats.totalCashEarned);
    document.getElementById('gameover-tickets').textContent = formatTickets(state.stats.totalTicketsEarned);
    document.getElementById('gameover-pulls').textContent = state.stats.totalPulls;
    document.getElementById('gameover-highscore').textContent = formatCash(getHighScore());
  } else {
    gameOverModal.style.display = 'none';
  }
}

/**
 * Show the ball selection modal for upgrades that need it.
 */
function showBallSelectionModal(state, upgradeIndex, filterFn) {
  const modal = document.getElementById('ball-select-modal');
  const content = document.getElementById('ball-select-content');
  modal.style.display = 'flex';

  const selectableBalls = filterFn ? state.machine.filter(filterFn) : state.machine;

  content.innerHTML = '';
  selectableBalls.forEach(ball => {
    const ballDef = BALL_CATALOG[ball.type];
    const el = document.createElement('div');
    el.className = 'ball-select-item';
    el.innerHTML = `
      <div class="ball-preview" style="background-color: ${RARITY_COLORS[ballDef.rarity]}"></div>
      <div>
        <strong>${ballDef.name}</strong><br>
        <span class="peek-desc">${ballDef.description}</span>
      </div>
    `;
    el.addEventListener('click', () => {
      modal.style.display = 'none';
      handleBallSelection(upgradeIndex, ball.id);
    });
    content.appendChild(el);
  });
}

/**
 * Show a pull result toast.
 */
function showPullResult(ballDef, message) {
  const toast = document.getElementById('pull-result');
  toast.innerHTML = `
    <div class="ball-preview ball-preview-large" style="background-color: ${RARITY_COLORS[ballDef.rarity]}"></div>
    <div class="pull-result-name" style="color: ${RARITY_COLORS[ballDef.rarity]}">${ballDef.name}</div>
    <div class="pull-result-message">${message}</div>
  `;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}
