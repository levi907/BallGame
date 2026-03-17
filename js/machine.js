// Machine logic for Ball Machine game

/**
 * Pull a random ball from the machine, apply its effect, handle consumables.
 * Returns { ball, message } or null if machine is empty.
 */
function pullBall(state) {
  if (state.machine.length === 0) return null;

  // Deduct pull cost (unless free pull)
  if (state.modifiers.freePulls > 0) {
    state.modifiers.freePulls -= 1;
    addLog(state, 'Free pull!');
  } else {
    const cost = getPullCost(getRound(state.turn));
    state.cash -= cost;
  }

  // Pick a random ball
  const ballInstance = randomPick(state.machine);
  const ballDef = BALL_CATALOG[ballInstance.type];

  // Track pulls this turn
  state.stats.pullsThisTurn += 1;
  state.stats.totalPulls += 1;

  // Track tickets before to calculate gain for transmuter
  const ticketsBefore = state.tickets;

  // Apply the ball's effect
  const message = ballDef.apply(state);

  // Handle transmuter: convert tickets gained this turn to cash
  if (state.modifiers.transmuteActive) {
    const ticketsGained = state.tickets - ticketsBefore;
    if (ticketsGained > 0) {
      state.tickets -= ticketsGained;
      state.cash += ticketsGained;
      state.stats.totalCashEarned += ticketsGained;
      addLog(state, `Transmuter: ${formatTickets(ticketsGained)} → ${formatCash(ticketsGained)}`);
    }
  }

  // Remove consumable balls
  if (ballDef.consumable) {
    const idx = state.machine.findIndex(b => b.id === ballInstance.id);
    if (idx !== -1) {
      state.machine.splice(idx, 1);
    }
  }

  // Decrement pulls remaining
  state.pullsRemaining -= 1;

  return { ball: ballInstance, ballDef, message };
}

/**
 * Add a ball to the machine.
 */
function addBallToMachine(state, ballType) {
  const ball = { id: generateId(), type: ballType };
  state.machine.push(ball);
  state.stats.ballsAdded += 1;
  return ball;
}

/**
 * Remove a specific ball from the machine by ID.
 */
function removeBallFromMachine(state, ballId) {
  const idx = state.machine.findIndex(b => b.id === ballId);
  if (idx !== -1) {
    const removed = state.machine.splice(idx, 1)[0];
    state.stats.ballsRemoved += 1;
    return removed;
  }
  return null;
}

/**
 * Check if the player can afford a pull.
 */
function canAffordPull(state) {
  const cost = getPullCost(getRound(state.turn));
  return state.cash >= cost || state.modifiers.freePulls > 0;
}

/**
 * Add a message to the game log.
 */
function addLog(state, message) {
  state.log.push({ turn: state.turn, message });
  // Keep only last 50 entries
  if (state.log.length > 50) {
    state.log = state.log.slice(-50);
  }
}
