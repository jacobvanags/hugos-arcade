/**
 * Economy helpers — cost checks, sell values.
 */
import { TOWER_TYPES } from '../data/tower-defs.js';
import { config } from '../config.js';

export function canAfford(gs, cost) {
  return gs.cash >= cost;
}

export function getTowerCost(towerType) {
  return TOWER_TYPES[towerType]?.baseCost || 0;
}

export function getSellValue(tower) {
  return Math.floor(tower.totalSpent * config.sellRefund);
}
