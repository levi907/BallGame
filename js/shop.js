// Shop system for Ball Machine game

/**
 * Generate random shop contents (3 balls + 3 upgrades).
 */
function generateShopContents() {
  const balls = [];
  for (let i = 0; i < 3; i++) {
    // Pick rarity by weight
    const rarityItems = Object.entries(RARITY_SHOP_WEIGHTS).map(([rarity, weight]) => ({
      item: rarity,
      weight,
    }));
    const rarity = weightedRandom(rarityItems);

    // Pick a random ball of that rarity
    const ballTypes = getBallTypesByRarity(rarity);
    if (ballTypes.length > 0) {
      const ballType = randomPick(ballTypes);
      balls.push({
        type: ballType,
        cost: RARITY_SHOP_COST[rarity],
        purchased: false,
      });
    }
  }

  // Pick 3 random upgrades
  const allUpgradeTypes = getUpgradeTypes();
  const shuffled = shuffle([...allUpgradeTypes]);
  const upgrades = shuffled.slice(0, 3).map(type => ({
    type,
    cost: UPGRADE_CATALOG[type].cost,
    purchased: false,
  }));

  return { balls, upgrades };
}

/**
 * Buy a ball from the shop.
 * @returns {string|null} Message or null if purchase failed.
 */
function buyShopBall(state, shopIndex) {
  const shopBall = state.shop.balls[shopIndex];
  if (!shopBall || shopBall.purchased) return null;
  if (state.tickets < shopBall.cost) return null;

  state.tickets -= shopBall.cost;
  shopBall.purchased = true;

  const ball = addBallToMachine(state, shopBall.type);
  const ballDef = BALL_CATALOG[shopBall.type];

  return `Bought ${ballDef.name} for ${formatTickets(shopBall.cost)}`;
}

/**
 * Buy an upgrade from the shop.
 * For upgrades that require selection, returns 'needs_selection'.
 * @returns {string|null} Message, 'needs_selection', or null if purchase failed.
 */
function buyShopUpgrade(state, shopIndex) {
  const shopUpgrade = state.shop.upgrades[shopIndex];
  if (!shopUpgrade || shopUpgrade.purchased) return null;

  const upgradeDef = UPGRADE_CATALOG[shopUpgrade.type];
  if (state.tickets < shopUpgrade.cost) return null;
  if (!upgradeDef.canUse(state)) return null;

  if (upgradeDef.requiresSelection) {
    return 'needs_selection';
  }

  state.tickets -= shopUpgrade.cost;
  shopUpgrade.purchased = true;

  const message = upgradeDef.apply(state);
  return message;
}

/**
 * Complete a selection-based upgrade purchase.
 */
function completeUpgradePurchase(state, shopIndex, selectedBallId) {
  const shopUpgrade = state.shop.upgrades[shopIndex];
  if (!shopUpgrade || shopUpgrade.purchased) return null;

  const upgradeDef = UPGRADE_CATALOG[shopUpgrade.type];
  if (state.tickets < shopUpgrade.cost) return null;

  state.tickets -= shopUpgrade.cost;
  shopUpgrade.purchased = true;

  const message = upgradeDef.apply(state, selectedBallId);
  return message;
}
