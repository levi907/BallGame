// Ball catalog for Ball Machine game

const RARITY = {
  STARTER: 'starter',
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  LEGENDARY: 'legendary',
};

const RARITY_COLORS = {
  [RARITY.STARTER]: '#8aaa8a',
  [RARITY.COMMON]: '#4caf50',
  [RARITY.UNCOMMON]: '#2196f3',
  [RARITY.RARE]: '#9c27b0',
  [RARITY.LEGENDARY]: '#ff9800',
};

const RARITY_SHOP_COST = {
  [RARITY.COMMON]: 2,
  [RARITY.UNCOMMON]: 4,
  [RARITY.RARE]: 7,
  [RARITY.LEGENDARY]: 12,
};

const RARITY_SHOP_WEIGHTS = {
  [RARITY.COMMON]: 50,
  [RARITY.UNCOMMON]: 30,
  [RARITY.RARE]: 15,
  [RARITY.LEGENDARY]: 5,
};

const BALL_CATALOG = {
  // === STARTER BALLS ===
  starter_dollar: {
    name: 'Starter Dollar',
    rarity: RARITY.STARTER,
    color: '#6b9e6b',
    consumable: false,
    description: '+$3',
    apply(state) {
      let cash = 3;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)}`;
    },
  },
  starter_ticket: {
    name: 'Starter Ticket',
    rarity: RARITY.STARTER,
    color: '#7a8aaa',
    consumable: false,
    description: '+2 tickets',
    apply(state) {
      let tickets = 2;
      if (state.modifiers.doubleNext) { tickets *= 2; state.modifiers.doubleNext = false; }
      state.tickets += tickets;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatTickets(tickets)}`;
    },
  },
  starter_bonus: {
    name: 'Starter Bonus',
    rarity: RARITY.STARTER,
    color: '#d4a847',
    consumable: false,
    description: '+$2, +2 tickets',
    apply(state) {
      let cash = 2, tickets = 2;
      if (state.modifiers.doubleNext) { cash *= 2; tickets *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.tickets += tickets;
      state.stats.totalCashEarned += cash;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatCash(cash)}, +${formatTickets(tickets)}`;
    },
  },

  // === COMMON BALLS ===
  dollar_ball: {
    name: 'Dollar Ball',
    rarity: RARITY.COMMON,
    color: '#4caf50',
    consumable: false,
    description: '+$4',
    apply(state) {
      let cash = 4;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)}`;
    },
  },
  ticket_ball: {
    name: 'Ticket Ball',
    rarity: RARITY.COMMON,
    color: '#66bb6a',
    consumable: false,
    description: '+2 tickets',
    apply(state) {
      let tickets = 2;
      if (state.modifiers.doubleNext) { tickets *= 2; state.modifiers.doubleNext = false; }
      state.tickets += tickets;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatTickets(tickets)}`;
    },
  },
  quick_cash: {
    name: 'Quick Cash',
    rarity: RARITY.COMMON,
    color: '#81c784',
    consumable: true,
    description: '+$5 (consumable)',
    apply(state) {
      let cash = 5;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)} (consumed!)`;
    },
  },
  ticket_stash: {
    name: 'Ticket Stash',
    rarity: RARITY.COMMON,
    color: '#a5d6a7',
    consumable: true,
    description: '+5 tickets (consumable)',
    apply(state) {
      let tickets = 5;
      if (state.modifiers.doubleNext) { tickets *= 2; state.modifiers.doubleNext = false; }
      state.tickets += tickets;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatTickets(tickets)} (consumed!)`;
    },
  },
  copper_ball: {
    name: 'Copper Ball',
    rarity: RARITY.COMMON,
    color: '#b87333',
    consumable: false,
    description: '+$1, +1 ticket',
    apply(state) {
      let cash = 1, tickets = 1;
      if (state.modifiers.doubleNext) { cash *= 2; tickets *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.tickets += tickets;
      state.stats.totalCashEarned += cash;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatCash(cash)}, +${formatTickets(tickets)}`;
    },
  },

  // === UNCOMMON BALLS ===
  chain_ball: {
    name: 'Chain Ball',
    rarity: RARITY.UNCOMMON,
    color: '#42a5f5',
    consumable: false,
    description: '+$1, pull again',
    apply(state) {
      let cash = 1;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      state.pullsRemaining += 1;
      return `+${formatCash(cash)}, pull again!`;
    },
  },
  lucky_ticket: {
    name: 'Lucky Ticket',
    rarity: RARITY.UNCOMMON,
    color: '#29b6f6',
    consumable: false,
    description: '+2 tickets, pull again',
    apply(state) {
      let tickets = 2;
      if (state.modifiers.doubleNext) { tickets *= 2; state.modifiers.doubleNext = false; }
      state.tickets += tickets;
      state.stats.totalTicketsEarned += tickets;
      state.pullsRemaining += 1;
      return `+${formatTickets(tickets)}, pull again!`;
    },
  },
  payday: {
    name: 'Payday',
    rarity: RARITY.UNCOMMON,
    color: '#5c6bc0',
    consumable: true,
    description: '+$10 (consumable)',
    apply(state) {
      let cash = 10;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)} (consumed!)`;
    },
  },
  golden_ticket: {
    name: 'Golden Ticket',
    rarity: RARITY.UNCOMMON,
    color: '#ffd54f',
    consumable: true,
    description: '+8 tickets (consumable)',
    apply(state) {
      let tickets = 8;
      if (state.modifiers.doubleNext) { tickets *= 2; state.modifiers.doubleNext = false; }
      state.tickets += tickets;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatTickets(tickets)} (consumed!)`;
    },
  },
  doubler: {
    name: 'Doubler',
    rarity: RARITY.UNCOMMON,
    color: '#7e57c2',
    consumable: false,
    description: 'Next ball this turn pays double',
    apply(state) {
      state.modifiers.doubleNext = true;
      return 'Next ball pays DOUBLE!';
    },
  },

  // === RARE BALLS ===
  midas_ball: {
    name: 'Midas Ball',
    rarity: RARITY.RARE,
    color: '#ce93d8',
    consumable: false,
    description: '+$3 + $1 per round',
    apply(state) {
      let cash = 3 + getRound(state.turn);
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)}`;
    },
  },
  jackpot_ball: {
    name: 'Jackpot Ball',
    rarity: RARITY.RARE,
    color: '#ab47bc',
    consumable: true,
    description: '+$20 (consumable)',
    apply(state) {
      let cash = 20;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)} (consumed!)`;
    },
  },
  recycler: {
    name: 'Recycler',
    rarity: RARITY.RARE,
    color: '#8e24aa',
    consumable: false,
    description: '+$2, remove a Starter Dollar',
    apply(state) {
      let cash = 2;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      const starterIdx = state.machine.findIndex(b => b.type === 'starter_dollar');
      let extra = '';
      if (starterIdx !== -1) {
        state.machine.splice(starterIdx, 1);
        state.stats.ballsRemoved += 1;
        extra = ', removed a Starter Dollar!';
      }
      return `+${formatCash(cash)}${extra}`;
    },
  },
  ticket_machine: {
    name: 'Ticket Machine',
    rarity: RARITY.RARE,
    color: '#ba68c8',
    consumable: false,
    description: '+1 ticket per ball in machine',
    apply(state) {
      let tickets = state.machine.length;
      if (state.modifiers.doubleNext) { tickets *= 2; state.modifiers.doubleNext = false; }
      state.tickets += tickets;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatTickets(tickets)}`;
    },
  },
  combo_ball: {
    name: 'Combo Ball',
    rarity: RARITY.RARE,
    color: '#e040fb',
    consumable: false,
    description: '+$1 per pull this turn',
    apply(state) {
      let cash = state.stats.pullsThisTurn;
      if (cash < 1) cash = 1;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)}`;
    },
  },

  // === LEGENDARY BALLS ===
  diamond_ball: {
    name: 'Diamond Ball',
    rarity: RARITY.LEGENDARY,
    color: '#b9f2ff',
    consumable: false,
    description: '+$5, +3 tickets',
    apply(state) {
      let cash = 5, tickets = 3;
      if (state.modifiers.doubleNext) { cash *= 2; tickets *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.tickets += tickets;
      state.stats.totalCashEarned += cash;
      state.stats.totalTicketsEarned += tickets;
      return `+${formatCash(cash)}, +${formatTickets(tickets)}`;
    },
  },
  infinity_ball: {
    name: 'Infinity Ball',
    rarity: RARITY.LEGENDARY,
    color: '#ffab40',
    consumable: false,
    description: 'Pull 2 additional balls',
    apply(state) {
      state.pullsRemaining += 2;
      return 'Pull 2 more balls!';
    },
  },
  transmuter: {
    name: 'Transmuter',
    rarity: RARITY.LEGENDARY,
    color: '#ff6e40',
    consumable: false,
    description: 'Convert tickets earned this turn to $',
    apply(state) {
      state.modifiers.transmuteActive = true;
      return 'Transmuter active! Tickets → Cash this turn';
    },
  },
  loaded_machine: {
    name: 'Loaded Machine',
    rarity: RARITY.LEGENDARY,
    color: '#ffd740',
    consumable: true,
    description: '+$8 per unique ball type (consumable)',
    apply(state) {
      const uniqueTypes = new Set(state.machine.map(b => b.type));
      let cash = 8 * uniqueTypes.size;
      if (state.modifiers.doubleNext) { cash *= 2; state.modifiers.doubleNext = false; }
      state.cash += cash;
      state.stats.totalCashEarned += cash;
      return `+${formatCash(cash)} (${uniqueTypes.size} unique types, consumed!)`;
    },
  },
};

/**
 * Get the display color for a ball type.
 */
function getBallColor(ballDef) {
  return ballDef.color || RARITY_COLORS[ballDef.rarity];
}

/**
 * Get all ball types that can appear in the shop (non-starter).
 */
function getShopBallTypes() {
  return Object.keys(BALL_CATALOG).filter(
    key => BALL_CATALOG[key].rarity !== RARITY.STARTER
  );
}

/**
 * Get ball types filtered by rarity.
 */
function getBallTypesByRarity(rarity) {
  return Object.keys(BALL_CATALOG).filter(
    key => BALL_CATALOG[key].rarity === rarity
  );
}
