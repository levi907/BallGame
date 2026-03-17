// Shop system for Ball Machine game

/**
 * Generate random shop contents (3 relics + 3 upgrades).
 */
function generateShopContents(state) {
  // Pick 3 relics the player doesn't already own
  const ownedRelics = new Set(state ? state.relics : []);
  const availableRelics = getRelicTypes().filter(r => !ownedRelics.has(r));
  const shuffledRelics = shuffle([...availableRelics]);
  const relics = shuffledRelics.slice(0, 3).map(type => ({
    type,
    cost: RELIC_CATALOG[type].cost,
    purchased: false,
  }));

  // Pick 3 random upgrades
  const allUpgradeTypes = getUpgradeTypes();
  const shuffled = shuffle([...allUpgradeTypes]);
  const upgrades = shuffled.slice(0, 3).map(type => ({
    type,
    cost: UPGRADE_CATALOG[type].cost,
    purchased: false,
  }));

  return { relics, upgrades };
}

/**
 * Generate a ball draft (pick 1 of 3 random balls).
 */
function generateBallDraft() {
  const choices = [];
  for (let i = 0; i < 3; i++) {
    const rarityItems = Object.entries(RARITY_SHOP_WEIGHTS).map(([rarity, weight]) => ({
      item: rarity,
      weight,
    }));
    const rarity = weightedRandom(rarityItems);
    const ballTypes = getBallTypesByRarity(rarity);
    if (ballTypes.length > 0) {
      choices.push({ type: randomPick(ballTypes) });
    }
  }
  return { choices, picked: false };
}

/**
 * Buy a relic from the shop.
 */
function buyShopRelic(state, shopIndex) {
  const shopRelic = state.shop.relics[shopIndex];
  if (!shopRelic || shopRelic.purchased) return null;

  let cost = shopRelic.cost;
  // Lucky Clover discount
  if (hasRelic(state, 'lucky_clover')) {
    cost = Math.max(1, cost - 1);
  }

  if (state.tickets < cost) return null;

  state.tickets -= cost;
  shopRelic.purchased = true;
  state.relics.push(shopRelic.type);

  const relicDef = RELIC_CATALOG[shopRelic.type];
  return `Acquired ${relicDef.name}!`;
}

/**
 * Buy an upgrade from the shop.
 */
function buyShopUpgrade(state, shopIndex) {
  const shopUpgrade = state.shop.upgrades[shopIndex];
  if (!shopUpgrade || shopUpgrade.purchased) return null;

  const upgradeDef = UPGRADE_CATALOG[shopUpgrade.type];

  let cost = shopUpgrade.cost;
  if (hasRelic(state, 'lucky_clover')) {
    cost = Math.max(1, cost - 1);
  }

  if (state.tickets < cost) return null;
  if (!upgradeDef.canUse(state)) return null;

  if (upgradeDef.requiresSelection) {
    return 'needs_selection';
  }

  state.tickets -= cost;
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

  let cost = shopUpgrade.cost;
  if (hasRelic(state, 'lucky_clover')) {
    cost = Math.max(1, cost - 1);
  }

  if (state.tickets < cost) return null;

  state.tickets -= cost;
  shopUpgrade.purchased = true;

  const message = upgradeDef.apply(state, selectedBallId);
  return message;
}

/**
 * Pick a ball from the draft.
 */
function pickDraftBall(state, choiceIndex) {
  if (!state.draft || state.draft.picked) return null;
  const choice = state.draft.choices[choiceIndex];
  if (!choice) return null;

  state.draft.picked = true;
  const ball = addBallToMachine(state, choice.type);
  const ballDef = BALL_CATALOG[choice.type];
  return `Drafted ${ballDef.name}!`;
}
