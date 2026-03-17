// Main game controller for Ball Machine game

let gameState = null;
let pendingUpgradeIndex = null; // for selection-based upgrades
let _turnStartCash = 0;
let _turnStartTickets = 0;

function initGame(loadSave) {
  if (loadSave) {
    gameState = loadState();
  }
  if (!gameState) {
    gameState = createInitialState();
  }
  // Generate shop if it's a new round or start
  startTurn();
}

function startTurn() {
  const round = getRound(gameState.turn);

  // Check if new round -> regenerate shop
  if ((gameState.turn - 1) % 5 === 0 || !gameState.shopGenerated) {
    gameState.shop = generateShopContents(gameState);
    gameState.shopGenerated = true;
    addLog(gameState, `--- Round ${round} --- Pull cost: ${formatCash(getPullCost(round))}`);
  }

  // Track start-of-turn resources for transition display
  _turnStartCash = gameState.cash;
  _turnStartTickets = gameState.tickets;

  // Reset per-turn state
  gameState.pullsRemaining = 1;
  gameState._turnCostPaid = false;
  gameState.modifiers.doubleNext = false;
  gameState.modifiers.peekBalls = [];
  gameState.modifiers.transmuteActive = false;
  gameState.stats.pullsThisTurn = 0;
  gameState.draft = null;
  gameState.phase = 'pulling';

  // Apply relic onTurnStart effects (e.g. Thick Skin: +1 pull)
  applyRelicOnTurnStart(gameState);

  // Check if player can afford pull
  if (!canAffordPull(gameState)) {
    // Check insurance modifier
    if (gameState.modifiers.insurance) {
      gameState.cash += 5;
      gameState.modifiers.insurance = false;
      addLog(gameState, 'Insurance activated! +$5');
    } else if (applyRelicOnBankruptcy(gameState)) {
      // Relic saved us (e.g. Safety Net)
    } else {
      // Game over - loss
      gameState.phase = 'gameOver';
      gameState.gameResult = 'loss';
      saveHighScore(gameState.stats.totalCashEarned);
      addLog(gameState, 'BANKRUPT! Game Over.');
    }
  }

  // Check win condition
  if (gameState.turn > 30 && gameState.phase !== 'gameOver') {
    gameState.phase = 'gameOver';
    gameState.gameResult = 'win';
    saveHighScore(gameState.stats.totalCashEarned);
    addLog(gameState, 'YOU SURVIVED 30 TURNS! Victory!');
  }

  saveState(gameState);
  render(gameState);
}

function handlePull() {
  if (gameState.phase !== 'pulling' || gameState.pullsRemaining <= 0) return;

  // Show cost animation on first pull of the turn
  const isFirstPull = !gameState._turnCostPaid;
  const pullCost = isFirstPull ? getPullCost(getRound(gameState.turn)) : 0;

  const result = pullBall(gameState);
  if (!result) return;

  if (isFirstPull && pullCost > 0) {
    showCostAnimation(pullCost);
  }

  const { ball, ballDef, message } = result;
  addLog(gameState, `Pulled ${ballDef.name}: ${message}`);
  showPullResult(ballDef, message, ball.id);

  // Check if pulls are done -> go to drafting
  if (gameState.pullsRemaining <= 0) {
    gameState.phase = 'drafting';
    gameState.draft = generateBallDraft();
  }

  saveState(gameState);
  render(gameState);
}

function handleDraftPick(choiceIndex) {
  if (gameState.phase !== 'drafting' || !gameState.draft) return;

  const message = pickDraftBall(gameState, choiceIndex);
  if (message) {
    addLog(gameState, message);
    gameState.phase = 'shopping';

    // Apply relic onTurnEnd effects (after draft, before shopping)
    applyRelicOnTurnEnd(gameState);

    saveState(gameState);
    render(gameState);
  }
}

function handleSkipDraft() {
  if (gameState.phase !== 'drafting') return;
  gameState.draft = { choices: [], picked: true };
  gameState.phase = 'shopping';
  applyRelicOnTurnEnd(gameState);
  addLog(gameState, 'Skipped ball draft');
  saveState(gameState);
  render(gameState);
}

function handleEndTurn() {
  // Calculate net change this turn
  const cashNet = gameState.cash - _turnStartCash;
  const ticketsNet = gameState.tickets - _turnStartTickets;

  gameState.turn += 1;
  gameState.shopGenerated = (gameState.turn - 1) % 5 !== 0;

  showTurnTransition(gameState.turn, cashNet, ticketsNet, () => {
    startTurn();
  });
}

function handleBuyRelic(index) {
  const message = buyShopRelic(gameState, index);
  if (message) {
    addLog(gameState, message);
    saveState(gameState);
    render(gameState);
  }
}

function handleBuyUpgrade(index) {
  const shopUpgrade = gameState.shop.upgrades[index];
  if (!shopUpgrade || shopUpgrade.purchased) return;

  const upgradeDef = UPGRADE_CATALOG[shopUpgrade.type];

  let cost = shopUpgrade.cost;
  if (hasRelic(gameState, 'lucky_clover')) {
    cost = Math.max(1, cost - 1);
  }

  if (gameState.tickets < cost) return;
  if (!upgradeDef.canUse(gameState)) return;

  if (upgradeDef.requiresSelection) {
    pendingUpgradeIndex = index;

    let filterFn = null;
    if (upgradeDef.getSelectableBalls) {
      const selectableIds = new Set(
        upgradeDef.getSelectableBalls(gameState).map(b => b.id)
      );
      filterFn = (b) => selectableIds.has(b.id);
    }

    showBallSelectionModal(gameState, index, filterFn);
    return;
  }

  const result = buyShopUpgrade(gameState, index);
  if (result && result !== 'needs_selection') {
    addLog(gameState, result);
    saveState(gameState);
    render(gameState);
  }
}

function handleBallSelection(upgradeIndex, ballId) {
  const message = completeUpgradePurchase(gameState, upgradeIndex, ballId);
  if (message) {
    addLog(gameState, message);
    saveState(gameState);
    render(gameState);
  }
  pendingUpgradeIndex = null;
}

function handleNewGame() {
  if (gameState && gameState.phase !== 'gameOver') {
    if (!confirm('Start a new game? Current progress will be lost.')) return;
  }
  clearSave();
  gameState = createInitialState();
  startTurn();
}

// Event delegation for shop buttons
function handleShopClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const index = parseInt(btn.dataset.index, 10);

  if (action === 'buy-relic') {
    handleBuyRelic(index);
  } else if (action === 'buy-upgrade') {
    handleBuyUpgrade(index);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Bind events
  document.getElementById('pull-btn').addEventListener('click', handlePull);
  document.getElementById('end-turn-btn').addEventListener('click', handleEndTurn);
  document.getElementById('new-game-btn').addEventListener('click', handleNewGame);
  document.getElementById('play-again-btn').addEventListener('click', handleNewGame);

  // Shop event delegation
  document.getElementById('shop-section').addEventListener('click', handleShopClick);

  // Draft event delegation
  document.getElementById('draft-section').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-draft-index]');
    if (btn) {
      handleDraftPick(parseInt(btn.dataset.draftIndex, 10));
    }
  });
  document.getElementById('draft-skip-btn').addEventListener('click', handleSkipDraft);

  // Modal close buttons
  document.getElementById('peek-close-btn').addEventListener('click', () => {
    gameState.modifiers.peekBalls = [];
    render(gameState);
  });

  document.getElementById('ball-select-cancel-btn').addEventListener('click', () => {
    document.getElementById('ball-select-modal').style.display = 'none';
    pendingUpgradeIndex = null;
  });

  // Inventory
  document.getElementById('inventory-btn').addEventListener('click', () => {
    showInventoryModal(gameState);
  });
  document.getElementById('inventory-close-btn').addEventListener('click', () => {
    document.getElementById('inventory-modal').style.display = 'none';
  });

  // How to play
  document.getElementById('how-to-play-btn').addEventListener('click', () => {
    document.getElementById('rules-modal').style.display = 'flex';
  });

  document.getElementById('rules-close-btn').addEventListener('click', () => {
    document.getElementById('rules-modal').style.display = 'none';
  });

  // Start game (try loading save)
  initGame(true);
});
