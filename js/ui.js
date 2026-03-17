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
  document.getElementById('cash-display').textContent = state.cash;
  document.getElementById('tickets-display').textContent = state.tickets;
  document.getElementById('pull-cost-display').textContent = formatCash(pullCost);
  document.getElementById('pulls-remaining').textContent = state.pullsRemaining;
  document.getElementById('ball-count').textContent = state.machine.length;

  // Progress bar (survive 30 turns)
  const progress = Math.min(state.turn / 30, 1) * 100;
  document.getElementById('progress-fill').style.width = progress + '%';

  // Shop reset countdown
  const turnsUntilReset = 5 - ((state.turn - 1) % 5);
  document.getElementById('shop-reset-countdown').textContent =
    turnsUntilReset === 5 ? 'New shop this round!' : `Shop resets in ${turnsUntilReset} turns`;

  // Active modifiers
  const modList = [];
  if (state.modifiers.doubleNext) modList.push('2x next');
  if (state.modifiers.freePulls > 0) modList.push(`${state.modifiers.freePulls} free`);
  if (state.modifiers.insurance) modList.push('Insured');
  if (state.modifiers.transmuteActive) modList.push('Transmute');
  document.getElementById('active-modifiers').textContent =
    modList.length > 0 ? modList.join(' · ') : '';
}

// Store stable positions for balls so they don't jump on re-render
const _ballPositions = {};

function renderMachine(state) {
  const container = document.getElementById('machine-balls');
  container.innerHTML = '';

  // Clean up positions for removed balls
  const currentIds = new Set(state.machine.map(b => b.id));
  for (const id in _ballPositions) {
    if (!currentIds.has(id)) delete _ballPositions[id];
  }

  state.machine.forEach(ballInstance => {
    const ballDef = BALL_CATALOG[ballInstance.type];

    // Assign stable position
    if (!_ballPositions[ballInstance.id]) {
      _ballPositions[ballInstance.id] = {
        left: 10 + Math.random() * 75,
        top: 10 + Math.random() * 75,
      };
    }
    const pos = _ballPositions[ballInstance.id];

    const el = document.createElement('div');
    el.className = 'ball';
    el.dataset.ballId = ballInstance.id;
    el.style.backgroundColor = getBallColor(ballDef);

    if (ballDef.rarity === RARITY.LEGENDARY) {
      el.classList.add('ball-legendary');
    }
    if (ballInstance.type === 'starter_bonus') {
      el.classList.add('ball-golden');
    }
    if (ballDef.consumable) {
      el.classList.add('ball-consumable');
    }

    el.style.left = pos.left + '%';
    el.style.top = pos.top + '%';
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
      <div class="shop-card-rarity" style="color: ${getBallColor(ballDef)}">
        ${ballDef.rarity.toUpperCase()}${ballDef.consumable ? ' · consumable' : ''}
      </div>
      <div class="shop-card-name">${ballDef.name}</div>
      <div class="shop-card-desc">${ballDef.description}</div>
      <div class="shop-card-cost">&#9733; ${shopBall.cost}</div>
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
      <div class="shop-card-cost">&#9733; ${shopUpgrade.cost}</div>
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
      pullBtn.textContent = isFree ? 'PULL — Free!' : 'PULL';
    } else if (state.pullsRemaining <= 0) {
      pullBtn.style.display = 'none';
      endTurnBtn.style.display = '';
    } else {
      pullBtn.disabled = true;
      pullBtn.textContent = 'PULL';
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
        <div class="ball-preview" style="background-color: ${getBallColor(ballDef)}"></div>
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
      <div class="ball-preview" style="background-color: ${getBallColor(ballDef)}"></div>
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
 * Show a pull animation: ball drops from machine into the result area.
 */
function showPullResult(ballDef, message, pulledBallId) {
  const machine = document.getElementById('machine-balls');
  const toast = document.getElementById('pull-result');
  const color = getBallColor(ballDef);

  // Find the pulled ball element in the machine (if still there)
  const pulledEl = pulledBallId
    ? machine.querySelector(`[data-ball-id="${pulledBallId}"]`)
    : null;

  // Create an animated ball that drops from machine to result area
  const animBall = document.createElement('div');
  animBall.className = 'ball ball-pulling';
  animBall.style.backgroundColor = color;
  if (ballDef.rarity === RARITY.LEGENDARY) animBall.classList.add('ball-legendary');
  if (ballDef.consumable) animBall.classList.add('ball-consumable');

  // Position at the bottom center of the machine
  const machineRect = machine.getBoundingClientRect();
  const panelRect = machine.closest('.panel-machine').getBoundingClientRect();
  animBall.style.left = (machineRect.left - panelRect.left + machineRect.width / 2 - 12) + 'px';
  animBall.style.top = (machineRect.bottom - panelRect.top - 12) + 'px';
  animBall.style.width = '24px';
  animBall.style.height = '24px';
  animBall.style.position = 'absolute';
  animBall.style.zIndex = '10';

  const panel = machine.closest('.panel-machine');
  panel.style.position = 'relative';
  panel.appendChild(animBall);

  // Hide the original ball in the machine during animation
  if (pulledEl) pulledEl.style.opacity = '0';

  // Animate: drop down to the result toast area
  requestAnimationFrame(() => {
    animBall.classList.add('ball-drop');
  });

  // After animation, show the result toast
  setTimeout(() => {
    animBall.remove();
    toast.innerHTML = `
      <div class="ball-preview ball-preview-large" style="background-color: ${color}"></div>
      <div class="pull-result-name" style="color: ${color}">${ballDef.name}</div>
      <div class="pull-result-message">${message}</div>
    `;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1200);
  }, 500);
}
