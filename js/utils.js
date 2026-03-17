// Utility functions for Ball Machine game

/**
 * Seeded random not needed - Math.random() is fine for a single-player game.
 */

/**
 * Pick a random element from an array.
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a random element using weighted probabilities.
 * @param {Array<{item: *, weight: number}>} weightedItems
 * @returns {*} The selected item
 */
function weightedRandom(weightedItems) {
  const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const wi of weightedItems) {
    roll -= wi.weight;
    if (roll <= 0) return wi.item;
  }
  return weightedItems[weightedItems.length - 1].item;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a unique ID.
 */
let _idCounter = 0;
function generateId() {
  return 'ball_' + (++_idCounter) + '_' + Date.now().toString(36);
}

/**
 * Format a dollar amount.
 */
function formatCash(amount) {
  return '$' + amount;
}

/**
 * Format a ticket amount.
 */
function formatTickets(amount) {
  return amount + 'tx';
}

/**
 * Get the pull cost for a given round number.
 */
function getPullCost(round) {
  const costs = [1, 2, 5, 9, 14, 19, 25];
  return costs[Math.min(round - 1, costs.length - 1)];
}

/**
 * Get the round number from a turn number (1-indexed).
 */
function getRound(turn) {
  return Math.ceil(turn / 5);
}

/**
 * Pick N unique random items from an array.
 */
function pickN(arr, n) {
  const shuffled = shuffle([...arr]);
  return shuffled.slice(0, Math.min(n, arr.length));
}
