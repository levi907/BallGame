// UI rendering for Ball Machine game

/**
 * Main render function - updates all DOM elements based on state.
 */
function render(state) {
  renderStats(state);
  renderMachine(state);
  renderDraft(state);
  renderShop(state);
  renderRelicsBar(state);
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

  // Next turn cost
  const nextTurn = state.turn + 1;
  const nextRound = getRound(nextTurn);
  const nextCost = getPullCost(nextRound);
  const nextCostEl = document.getElementById('next-cost-display');
  if (state.turn < 30) {
    nextCostEl.textContent = `Next: ${formatCash(nextCost)}`;
    nextCostEl.className = state.cash < nextCost ? 'next-cost next-cost-warn' : 'next-cost';
  } else {
    nextCostEl.textContent = '';
  }

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

// Ball physics for bouncing animation
const _ballPhysics = {};
let _bounceAnimFrame = null;

function renderMachine(state) {
  const container = document.getElementById('machine-balls');
  container.innerHTML = '';

  const currentIds = new Set(state.machine.map(b => b.id));
  for (const id in _ballPhysics) {
    if (!currentIds.has(id)) delete _ballPhysics[id];
  }

  state.machine.forEach(ballInstance => {
    const ballDef = BALL_CATALOG[ballInstance.type];

    if (!_ballPhysics[ballInstance.id]) {
      _ballPhysics[ballInstance.id] = {
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      };
    }
    const phys = _ballPhysics[ballInstance.id];

    const el = document.createElement('div');
    el.className = 'ball';
    el.dataset.ballId = ballInstance.id;
    el.style.backgroundColor = getBallColor(ballDef);

    if (ballDef.rarity === RARITY.LEGENDARY) el.classList.add('ball-legendary');
    if (ballInstance.type === 'starter_bonus') el.classList.add('ball-golden');
    if (ballDef.consumable) el.classList.add('ball-consumable');

    el.style.left = phys.x + '%';
    el.style.top = phys.y + '%';
    el.title = `${ballDef.name}: ${ballDef.description}`;
    container.appendChild(el);
  });

  if (!_bounceAnimFrame) startBounceLoop();
}

function startBounceLoop() {
  const container = document.getElementById('machine-balls');
  const DAMPING = 0.997;
  const BOUNCE = 0.7;
  const MIN_X = 5, MAX_X = 90;
  const MIN_Y = 5, MAX_Y = 88;

  function tick() {
    const balls = container.querySelectorAll('.ball');
    balls.forEach(el => {
      const id = el.dataset.ballId;
      const phys = _ballPhysics[id];
      if (!phys) return;

      phys.vx *= DAMPING;
      phys.vy *= DAMPING;
      phys.x += phys.vx;
      phys.y += phys.vy;

      if (phys.x < MIN_X) { phys.x = MIN_X; phys.vx = Math.abs(phys.vx) * BOUNCE; }
      if (phys.x > MAX_X) { phys.x = MAX_X; phys.vx = -Math.abs(phys.vx) * BOUNCE; }
      if (phys.y < MIN_Y) { phys.y = MIN_Y; phys.vy = Math.abs(phys.vy) * BOUNCE; }
      if (phys.y > MAX_Y) { phys.y = MAX_Y; phys.vy = -Math.abs(phys.vy) * BOUNCE; }

      if (Math.abs(phys.vx) < 0.03 && Math.abs(phys.vy) < 0.03) {
        phys.vx += (Math.random() - 0.5) * 0.06;
        phys.vy += (Math.random() - 0.5) * 0.06;
      }

      el.style.left = phys.x + '%';
      el.style.top = phys.y + '%';
    });
    _bounceAnimFrame = requestAnimationFrame(tick);
  }
  _bounceAnimFrame = requestAnimationFrame(tick);
}

function renderDraft(state) {
  const draftSection = document.getElementById('draft-section');
  const draftChoices = document.getElementById('draft-choices');

  if (state.phase === 'drafting' && state.draft && !state.draft.picked) {
    draftSection.style.display = '';
    draftChoices.innerHTML = '';

    state.draft.choices.forEach((choice, idx) => {
      const ballDef = BALL_CATALOG[choice.type];
      const card = document.createElement('div');
      card.className = 'draft-card';
      card.dataset.draftIndex = idx;
      card.innerHTML = `
        <div class="ball-preview ball-preview-large" style="background-color: ${getBallColor(ballDef)}"></div>
        <div class="draft-card-rarity" style="color: ${getBallColor(ballDef)}">
          ${ballDef.rarity.toUpperCase()}${ballDef.consumable ? ' · consumable' : ''}
        </div>
        <div class="draft-card-name">${ballDef.name}</div>
        <div class="draft-card-desc">${ballDef.description}</div>
      `;
      draftChoices.appendChild(card);
    });
  } else {
    draftSection.style.display = 'none';
  }
}

function renderShop(state) {
  const relicsContainer = document.getElementById('shop-relics');
  const upgradesContainer = document.getElementById('shop-upgrades');
  const shopSection = document.getElementById('shop-section');

  // Update shop header with available tickets
  const shopHeading = shopSection.querySelector('h2');
  shopHeading.innerHTML = `Shop <span class="shop-tickets">&#9733; ${state.tickets}</span>`;

  const cloverDiscount = hasRelic(state, 'lucky_clover') ? 1 : 0;

  // Render relics
  relicsContainer.innerHTML = '';
  if (state.shop.relics) {
    state.shop.relics.forEach((shopRelic, idx) => {
      const relicDef = RELIC_CATALOG[shopRelic.type];
      const card = document.createElement('div');
      card.className = 'shop-card shop-card-relic' + (shopRelic.purchased ? ' purchased' : '');

      const effectiveCost = Math.max(1, shopRelic.cost - cloverDiscount);
      const canAfford = state.tickets >= effectiveCost;
      card.innerHTML = `
        <div class="shop-card-relic-icon" style="background-color: ${relicDef.color}"></div>
        <div class="shop-card-name">${relicDef.name}</div>
        <div class="shop-card-desc">${relicDef.description}</div>
        <div class="shop-card-cost">&#9733; ${effectiveCost}${cloverDiscount ? ' <span class="discount-orig">' + shopRelic.cost + '</span>' : ''}</div>
        ${shopRelic.purchased
          ? '<div class="shop-card-sold">ACQUIRED</div>'
          : `<button class="btn btn-buy" ${!canAfford ? 'disabled' : ''} data-action="buy-relic" data-index="${idx}">Buy</button>`
        }
      `;
      relicsContainer.appendChild(card);
    });
  }

  // Render upgrades
  upgradesContainer.innerHTML = '';
  state.shop.upgrades.forEach((shopUpgrade, idx) => {
    const upgradeDef = UPGRADE_CATALOG[shopUpgrade.type];
    const card = document.createElement('div');
    card.className = 'shop-card shop-card-upgrade' + (shopUpgrade.purchased ? ' purchased' : '');

    const effectiveCost = Math.max(1, shopUpgrade.cost - cloverDiscount);
    const canAfford = state.tickets >= effectiveCost;
    const canUse = upgradeDef.canUse(state);
    card.innerHTML = `
      <div class="shop-card-name">${upgradeDef.name}</div>
      <div class="shop-card-desc">${upgradeDef.description}</div>
      <div class="shop-card-cost">&#9733; ${effectiveCost}${cloverDiscount ? ' <span class="discount-orig">' + shopUpgrade.cost + '</span>' : ''}</div>
      ${shopUpgrade.purchased
        ? '<div class="shop-card-sold">SOLD</div>'
        : `<button class="btn btn-buy" ${(!canAfford || !canUse) ? 'disabled' : ''} data-action="buy-upgrade" data-index="${idx}">Buy</button>`
      }
    `;
    upgradesContainer.appendChild(card);
  });
}

function renderRelicsBar(state) {
  const bar = document.getElementById('relics-bar');
  if (!state.relics || state.relics.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = '';
  bar.innerHTML = '';
  state.relics.forEach(relicType => {
    const relic = RELIC_CATALOG[relicType];
    const el = document.createElement('div');
    el.className = 'relic-icon';
    el.style.backgroundColor = relic.color;
    el.title = `${relic.name}: ${relic.description}`;
    bar.appendChild(el);
  });
}

function renderLog(state) {
  const logContainer = document.getElementById('game-log');
  logContainer.innerHTML = '';

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

  const hasPulled = state.stats.pullsThisTurn > 0;

  if (state.phase === 'pulling') {
    pullBtn.style.display = '';
    endTurnBtn.style.display = 'none';

    const round = getRound(state.turn);
    const cost = getPullCost(round);
    const isFree = state.modifiers.freePulls > 0;

    if (state.pullsRemaining > 0 && (state.cash >= cost || isFree || state._turnCostPaid)) {
      pullBtn.disabled = false;
      pullBtn.textContent = isFree && !state._turnCostPaid ? 'PULL — Free!' : 'PULL';
    } else if (state.pullsRemaining <= 0) {
      pullBtn.style.display = 'none';
    } else {
      pullBtn.disabled = true;
      pullBtn.textContent = 'PULL';
    }
  } else if (state.phase === 'drafting') {
    pullBtn.style.display = 'none';
    endTurnBtn.style.display = 'none';
  } else if (state.phase === 'shopping') {
    pullBtn.style.display = 'none';
    endTurnBtn.style.display = hasPulled ? '' : 'none';
  } else {
    pullBtn.style.display = 'none';
    endTurnBtn.style.display = 'none';
  }

  // Shop visible during shopping phase
  if (state.phase === 'shopping') {
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
 * Show the inventory modal listing all balls grouped by type.
 */
function showInventoryModal(state) {
  const modal = document.getElementById('inventory-modal');
  const content = document.getElementById('inventory-content');
  modal.style.display = 'flex';

  const counts = {};
  state.machine.forEach(b => {
    counts[b.type] = (counts[b.type] || 0) + 1;
  });

  const rarityOrder = { starter: 0, common: 1, uncommon: 2, rare: 3, legendary: 4 };
  const sorted = Object.entries(counts).sort((a, b) => {
    const defA = BALL_CATALOG[a[0]], defB = BALL_CATALOG[b[0]];
    const ra = rarityOrder[defA.rarity] || 0, rb = rarityOrder[defB.rarity] || 0;
    return ra - rb || defA.name.localeCompare(defB.name);
  });

  content.innerHTML = '';
  sorted.forEach(([type, count]) => {
    const ballDef = BALL_CATALOG[type];
    const el = document.createElement('div');
    el.className = 'inventory-item';
    el.innerHTML = `
      <div class="ball-preview" style="background-color: ${getBallColor(ballDef)}"></div>
      <div>
        <span class="inventory-item-rarity" style="color: ${getBallColor(ballDef)}">${ballDef.rarity}${ballDef.consumable ? ' · consumable' : ''}</span><br>
        <strong>${ballDef.name}</strong> — ${ballDef.description}
      </div>
      <span class="inventory-item-count">&times;${count}</span>
    `;
    content.appendChild(el);
  });
}

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

function showCostAnimation(amount) {
  const el = document.getElementById('cost-anim');
  el.textContent = `-$${amount}`;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
}

function showTurnTransition(nextTurn, cashEarned, ticketsEarned, callback) {
  const overlay = document.getElementById('turn-transition');
  const turnNum = document.getElementById('transition-turn');
  const sub = document.getElementById('transition-sub');

  turnNum.textContent = nextTurn;

  const parts = [];
  if (cashEarned !== 0) {
    const sign = cashEarned >= 0 ? '+' : '';
    parts.push(`<span class="cash-earned">${sign}$${cashEarned}</span>`);
  }
  if (ticketsEarned > 0) {
    parts.push(`<span class="tickets-earned">+${ticketsEarned} ★</span>`);
  }

  const nextRound = getRound(nextTurn);
  const prevRound = getRound(nextTurn - 1);
  if (nextRound !== prevRound) {
    parts.push(`Round ${nextRound}`);
  }

  sub.innerHTML = parts.join(' &middot; ');

  overlay.classList.add('active');

  setTimeout(() => {
    overlay.classList.remove('active');
    if (callback) setTimeout(callback, 200);
  }, 900);
}

function showPullResult(ballDef, message, pulledBallId) {
  const machine = document.getElementById('machine-balls');
  const toast = document.getElementById('pull-result');
  const color = getBallColor(ballDef);

  // === Gobblegum-style animation ===
  // Phase 1: All balls in machine spin wildly (like the machine is churning)
  const allBalls = machine.querySelectorAll('.ball');
  const savedPhysics = {};

  // Speed up all balls to simulate machine churning
  allBalls.forEach(el => {
    const id = el.dataset.ballId;
    if (_ballPhysics[id]) {
      savedPhysics[id] = { vx: _ballPhysics[id].vx, vy: _ballPhysics[id].vy };
      _ballPhysics[id].vx = (Math.random() - 0.5) * 3;
      _ballPhysics[id].vy = (Math.random() - 0.5) * 3;
    }
  });

  // Add machine shake effect
  machine.classList.add('machine-churning');

  // Phase 2: After churning, one ball funnels to the bottom chute
  setTimeout(() => {
    // Slow balls back down
    allBalls.forEach(el => {
      const id = el.dataset.ballId;
      if (_ballPhysics[id]) {
        _ballPhysics[id].vx = (Math.random() - 0.5) * 0.5;
        _ballPhysics[id].vy = (Math.random() - 0.5) * 0.5;
      }
    });
    machine.classList.remove('machine-churning');

    // Animate the pulled ball out through the chute
    const pulledEl = pulledBallId
      ? machine.querySelector(`[data-ball-id="${pulledBallId}"]`)
      : null;

    // Create a chute ball that drops out the bottom
    const panel = machine.closest('.panel-machine');
    panel.style.position = 'relative';
    const machineRect = machine.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    const chuteBall = document.createElement('div');
    chuteBall.className = 'ball ball-chute';
    chuteBall.style.backgroundColor = color;
    if (ballDef.rarity === RARITY.LEGENDARY) chuteBall.classList.add('ball-legendary');
    if (ballDef.consumable) chuteBall.classList.add('ball-consumable');
    chuteBall.style.width = '24px';
    chuteBall.style.height = '24px';
    chuteBall.style.position = 'absolute';
    chuteBall.style.zIndex = '10';
    // Start at machine bottom center
    chuteBall.style.left = (machineRect.left - panelRect.left + machineRect.width / 2 - 12) + 'px';
    chuteBall.style.top = (machineRect.bottom - panelRect.top - 16) + 'px';
    panel.appendChild(chuteBall);

    if (pulledEl) pulledEl.style.opacity = '0';

    // Animate: drop down into result area
    requestAnimationFrame(() => {
      chuteBall.classList.add('ball-chute-drop');
    });

    setTimeout(() => {
      chuteBall.remove();
      toast.innerHTML = `
        <div class="ball-preview ball-preview-large" style="background-color: ${color}"></div>
        <div class="pull-result-name" style="color: ${color}">${ballDef.name}</div>
        <div class="pull-result-message">${message}</div>
      `;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1200);
    }, 450);
  }, 600);
}
