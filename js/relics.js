// Relic catalog for Ball Machine game
// Relics are passive, permanent effects (like Slay the Spire relics)

const RELIC_CATALOG = {
  piggy_bank: {
    name: 'Piggy Bank',
    description: 'Gain +$2 at the end of each turn',
    cost: 3,
    color: '#e8a4b8',
    onTurnEnd(state) {
      state.cash += 2;
      state.stats.totalCashEarned += 2;
      addLog(state, 'Piggy Bank: +$2');
    },
  },
  compound_interest: {
    name: 'Compound Interest',
    description: 'Gain 10% of your cash (rounded down) at end of turn',
    cost: 6,
    color: '#7dcea0',
    onTurnEnd(state) {
      const bonus = Math.floor(state.cash * 0.10);
      if (bonus > 0) {
        state.cash += bonus;
        state.stats.totalCashEarned += bonus;
        addLog(state, `Compound Interest: +$${bonus}`);
      }
    },
  },
  ball_polisher: {
    name: 'Ball Polisher',
    description: 'All balls give +$1 extra cash',
    cost: 5,
    color: '#aed6f1',
    onPull(state, ballDef) {
      state.cash += 1;
      state.stats.totalCashEarned += 1;
    },
  },
  ticket_printer: {
    name: 'Ticket Printer',
    description: 'Gain +1 ticket per pull',
    cost: 4,
    color: '#f9e79f',
    onPull(state, ballDef) {
      state.tickets += 1;
      state.stats.totalTicketsEarned += 1;
    },
  },
  thick_skin: {
    name: 'Thick Skin',
    description: '+1 base pull each turn',
    cost: 7,
    color: '#d5a6bd',
    onTurnStart(state) {
      state.pullsRemaining += 1;
    },
  },
  safety_net: {
    name: 'Safety Net',
    description: 'If you\'d go bankrupt, survive with $8 (once)',
    cost: 4,
    color: '#f5b7b1',
    unique: true, // removed after triggering
    onBankruptcy(state) {
      state.cash += 8;
      state.stats.totalCashEarned += 8;
      addLog(state, 'Safety Net triggered! +$8');
      return true; // survived
    },
  },
  momentum: {
    name: 'Momentum',
    description: 'Each pull this turn gives +$1 more than the last',
    cost: 5,
    color: '#82e0aa',
    onPull(state, ballDef) {
      // pullsThisTurn is already incremented, so bonus = pulls-1
      const bonus = state.stats.pullsThisTurn - 1;
      if (bonus > 0) {
        state.cash += bonus;
        state.stats.totalCashEarned += bonus;
      }
    },
  },
  recycling_plant: {
    name: 'Recycling Plant',
    description: 'When a consumable is used, gain +3 tickets',
    cost: 3,
    color: '#a3e4d7',
    onConsume(state, ballDef) {
      state.tickets += 3;
      state.stats.totalTicketsEarned += 3;
      addLog(state, 'Recycling Plant: +3 tickets');
    },
  },
  golden_ratio: {
    name: 'Golden Ratio',
    description: 'Every 3rd pull each turn is free (no cost)',
    cost: 4,
    color: '#fad7a0',
    // Handled in machine.js pull cost logic
  },
  collectors_tome: {
    name: "Collector's Tome",
    description: '+$1 per unique ball type in machine on each pull',
    cost: 6,
    color: '#d2b4de',
    onPull(state, ballDef) {
      const uniqueTypes = new Set(state.machine.map(b => b.type));
      const bonus = uniqueTypes.size;
      state.cash += bonus;
      state.stats.totalCashEarned += bonus;
    },
  },
  lucky_clover: {
    name: 'Lucky Clover',
    description: 'Shop offers are 1 ticket cheaper (min 1)',
    cost: 3,
    color: '#82e0aa',
    // Handled in shop rendering/buying logic
  },
  overcharger: {
    name: 'Overcharger',
    description: 'Doubler effects apply to the next 2 balls instead of 1',
    cost: 5,
    color: '#bb8fce',
    // Handled in balls.js doubler logic
  },
};

/**
 * Get all relic type keys.
 */
function getRelicTypes() {
  return Object.keys(RELIC_CATALOG);
}

/**
 * Check if state has a specific relic.
 */
function hasRelic(state, relicType) {
  return state.relics && state.relics.includes(relicType);
}

/**
 * Apply all relic onPull effects.
 */
function applyRelicOnPull(state, ballDef) {
  if (!state.relics) return;
  state.relics.forEach(relicType => {
    const relic = RELIC_CATALOG[relicType];
    if (relic && relic.onPull) {
      relic.onPull(state, ballDef);
    }
  });
}

/**
 * Apply all relic onTurnEnd effects.
 */
function applyRelicOnTurnEnd(state) {
  if (!state.relics) return;
  state.relics.forEach(relicType => {
    const relic = RELIC_CATALOG[relicType];
    if (relic && relic.onTurnEnd) {
      relic.onTurnEnd(state);
    }
  });
}

/**
 * Apply all relic onTurnStart effects.
 */
function applyRelicOnTurnStart(state) {
  if (!state.relics) return;
  state.relics.forEach(relicType => {
    const relic = RELIC_CATALOG[relicType];
    if (relic && relic.onTurnStart) {
      relic.onTurnStart(state);
    }
  });
}

/**
 * Apply all relic onConsume effects.
 */
function applyRelicOnConsume(state, ballDef) {
  if (!state.relics) return;
  state.relics.forEach(relicType => {
    const relic = RELIC_CATALOG[relicType];
    if (relic && relic.onConsume) {
      relic.onConsume(state, ballDef);
    }
  });
}

/**
 * Check relic-based bankruptcy save. Returns true if saved.
 */
function applyRelicOnBankruptcy(state) {
  if (!state.relics) return false;
  for (let i = 0; i < state.relics.length; i++) {
    const relicType = state.relics[i];
    const relic = RELIC_CATALOG[relicType];
    if (relic && relic.onBankruptcy) {
      const saved = relic.onBankruptcy(state);
      if (saved) {
        // Remove unique relics after triggering
        if (relic.unique) {
          state.relics.splice(i, 1);
        }
        return true;
      }
    }
  }
  return false;
}
