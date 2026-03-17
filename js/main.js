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
    gameState.shop = generateShopContents();
    gameState.shopGenerated = true;
    addLog(gameState, `--- Round ${round} --- Pull cost: ${formatCash(getPullCost(round))}`);
  }

  // Track start-of-turn resources for transition display
  _turnStartCash = gameState.cash;
  _turnStartTickets = gameState.tickets;

  // Reset per-turn state
  gameState.pullsRemaining = 1;
  gameState.modifiers.doubleNext = false;
  gameState.modifiers.peekBalls = [];
  gameState.modifiers.transmuteActive = false;
  gameState.stats.pullsThisTurn = 0;
  gameState.phase = 'pulling';

  // Check if player can afford pull
  if (!canAffordPull(gameState)) {
    // Check insurance
    if (gameState.modifiers.insurance) {
      gameState.cash += 5;
      gameState.modifiers.insurance = false;
      addLog(gameState, 'Insurance activated! +$5');
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

  const result = pullBall(gameState);
  if (!result) return;

  const { ball, ballDef, message } = result;
  addLog(gameState, `Pulled ${ballDef.name}: ${message}`);
  showPullResult(ballDef, message, ball.id);

  // Check if pulls are done
  if (gameState.pullsRemaining <= 0) {
    gameState.phase = 'shopping';
  }

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

function handleBuyBall(index) {
  const message = buyShopBall(gameState, index);
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
  if (gameState.tickets < shopUpgrade.cost) return;
  if (!upgradeDef.canUse(gameState)) return;

  if (upgradeDef.requiresSelection) {
    pendingUpgradeIndex = index;

    // Determine which balls are selectable
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

    // If extra pull was bought, check if we need to go back to pulling
    if (gameState.pullsRemaining > 0 && gameState.phase === 'pulling') {
      // Already in pulling phase
    }

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

  if (action === 'buy-ball') {
    handleBuyBall(index);
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
  document.getElementById('shop-balls').addEventListener('click', handleShopClick);
  document.getElementById('shop-upgrades').addEventListener('click', handleShopClick);

  // Modal close buttons
  document.getElementById('peek-close-btn').addEventListener('click', () => {
    gameState.modifiers.peekBalls = [];
    render(gameState);
  });

  document.getElementById('ball-select-cancel-btn').addEventListener('click', () => {
    document.getElementById('ball-select-modal').style.display = 'none';
    pendingUpgradeIndex = null;
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
