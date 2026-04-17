/**
 * Game Registry — central import point for all games in the arcade.
 * To add a new game:
 *   1. Create src/games/your-game-name/ with an index.js exporting manifest + Game
 *   2. Import and add it to the games array below
 *   3. The game will automatically appear in the launcher
 */

import * as TowerDefense from './tower-defense/index.js';
import * as CheeseRun from './cheese-run/index.js';

/** All registered games */
export const games = [
  TowerDefense,
  CheeseRun,
];

/**
 * Placeholder game entries for "Coming Soon" slots.
 * These show in the launcher but are not playable.
 */
export const placeholders = [
  {
    manifest: {
      id: 'space-shooter',
      title: 'Star Blaster',
      description: 'Navigate through asteroid fields and battle alien fleets in this vertical space shooter.',
      genre: ['shooter', 'arcade'],
      version: '0.0.0',
      thumbnail: null,
      comingSoon: true,
    },
  },
];

/**
 * Returns all games including placeholders.
 * @returns {Array} Combined game list
 */
export function getAllGameEntries() {
  return [...games, ...placeholders];
}
