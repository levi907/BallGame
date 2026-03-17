// Upgrade catalog for Ball Machine game

const UPGRADE_CATALOG = {
  remove_ball: {
    name: 'Remove a Ball',
    cost: 5,
    description: 'Choose a ball to permanently remove from machine',
    requiresSelection: true, // needs ball selection UI
    canUse(state) {
      return state.machine.length > 1; // don't let them empty the machine
    },
    apply(state, selectedBallId) {
      const idx = state.machine.findIndex(b => b.id === selectedBallId);
      if (idx === -1) return 'Ball not found!';
      const ball = state.machine[idx];
      state.machine.splice(idx, 1);
      state.stats.ballsRemoved += 1;
      return `Removed ${BALL_CATALOG[ball.type].name}`;
    },
  },
  extra_pull: {
    name: 'Extra Pull',
    cost: 2,
    description: '+1 pull this turn',
    requiresSelection: false,
    canUse(state) {
      return state.phase === 'shopping';
    },
    apply(state) {
      state.pullsRemaining += 1;
      state.phase = 'pulling';
      return 'Extra pull granted!';
    },
  },
  peek: {
    name: 'Peek',
    cost: 1,
    description: 'See the next 3 balls before pulling',
    requiresSelection: false,
    canUse(state) {
      return state.machine.length > 0;
    },
    apply(state) {
      // Peek generates 3 random previews from the machine
      const peekBalls = [];
      for (let i = 0; i < Math.min(3, state.machine.length); i++) {
        const ball = randomPick(state.machine);
        peekBalls.push(ball);
      }
      state.modifiers.peekBalls = peekBalls;
      return 'Peeking at upcoming balls...';
    },
  },
  reroll_shop: {
    name: 'Reroll Shop',
    cost: 3,
    description: 'Re-randomize the current shop offerings',
    requiresSelection: false,
    canUse(state) {
      return true;
    },
    apply(state) {
      state.shop = generateShopContents();
      return 'Shop rerolled!';
    },
  },
  discount_pull: {
    name: 'Discount Pull',
    cost: 4,
    description: 'Next pull this round is free',
    requiresSelection: false,
    canUse(state) {
      return true;
    },
    apply(state) {
      state.modifiers.freePulls += 1;
      return 'Next pull is free!';
    },
  },
  ball_upgrade: {
    name: 'Ball Upgrade',
    cost: 6,
    description: 'Upgrade a starter ball to its shop equivalent',
    requiresSelection: true,
    canUse(state) {
      return state.machine.some(b =>
        b.type === 'starter_dollar' || b.type === 'starter_ticket'
      );
    },
    getSelectableBalls(state) {
      return state.machine.filter(b =>
        b.type === 'starter_dollar' || b.type === 'starter_ticket'
      );
    },
    apply(state, selectedBallId) {
      const idx = state.machine.findIndex(b => b.id === selectedBallId);
      if (idx === -1) return 'Ball not found!';
      const ball = state.machine[idx];
      if (ball.type === 'starter_dollar') {
        ball.type = 'dollar_ball';
        return 'Starter Dollar → Dollar Ball (+$4)!';
      } else if (ball.type === 'starter_ticket') {
        ball.type = 'ticket_ball';
        return 'Starter Ticket → Ticket Ball (+2tx each)!';
      }
      return 'Cannot upgrade this ball';
    },
  },
  insurance: {
    name: 'Insurance',
    cost: 3,
    description: "If you'd go bankrupt next turn, gain $5",
    requiresSelection: false,
    canUse(state) {
      return !state.modifiers.insurance;
    },
    apply(state) {
      state.modifiers.insurance = true;
      return 'Insurance active!';
    },
  },
};

/**
 * Get all upgrade type keys.
 */
function getUpgradeTypes() {
  return Object.keys(UPGRADE_CATALOG);
}
