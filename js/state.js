// Game state management for Ball Machine game

function createInitialState() {
  const machine = [];

  // 5x Starter Dollar
  for (let i = 0; i < 5; i++) {
    machine.push({ id: generateId(), type: 'starter_dollar' });
  }
  // 5x Starter Ticket
  for (let i = 0; i < 5; i++) {
    machine.push({ id: generateId(), type: 'starter_ticket' });
  }
  // 1x Starter Bonus
  machine.push({ id: generateId(), type: 'starter_bonus' });

  return {
    turn: 1,
    cash: 15,
    tickets: 0,
    pullsRemaining: 1,
    machine: machine,
    shop: { balls: [], upgrades: [] },
    log: [],
    phase: 'pulling', // 'pulling' | 'shopping' | 'gameOver'
    modifiers: {
      doubleNext: false,
      peekBalls: [],
      freePulls: 0,
      insurance: false,
      transmuteActive: false,
      ticketsGainedThisTurn: 0,
    },
    stats: {
      totalPulls: 0,
      totalCashEarned: 0,
      totalTicketsEarned: 0,
      ballsAdded: 0,
      ballsRemoved: 0,
      pullsThisTurn: 0,
    },
    gameResult: null, // 'win' | 'loss'
    shopGenerated: false, // has shop been generated for this round?
  };
}

function saveState(state) {
  try {
    localStorage.setItem('ballgame_save', JSON.stringify(state));
  } catch (e) {
    // localStorage might be full or disabled
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('ballgame_save');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // corrupt save, ignore
  }
  return null;
}

function clearSave() {
  localStorage.removeItem('ballgame_save');
}

function saveHighScore(score) {
  try {
    const current = localStorage.getItem('ballgame_highscore');
    const highScore = current ? parseInt(current, 10) : 0;
    if (score > highScore) {
      localStorage.setItem('ballgame_highscore', score.toString());
      return true;
    }
  } catch (e) {}
  return false;
}

function getHighScore() {
  try {
    return parseInt(localStorage.getItem('ballgame_highscore') || '0', 10);
  } catch (e) {
    return 0;
  }
}
