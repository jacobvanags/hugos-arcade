# Game Template

A template/demo game showing how to build a game for Hugo's Arcade.

## How It Works

- A glowing ball bounces around the canvas
- Arrow keys move the ball, Space boosts speed
- Each wall bounce increments score and plays a sound
- Particle trail follows the ball
- Press Escape to return to the arcade menu

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move the ball |
| Space | Boost speed |
| Escape | Return to arcade |

## Creating a New Game

1. Copy this entire `game-template` folder to `src/games/your-game-name/`
2. Update `config.js` with your game's settings
3. Update `achievements.js` with your game's achievements
4. Update `index.js`:
   - Change the `manifest` object
   - Implement your game logic in the `Game` class lifecycle methods
5. Update `GameCanvas.jsx` to import from your game (just change the import path)
6. Add your game to `src/games/registry.js`

## Lifecycle Methods

- `init(canvas, arcadeAPI)` — Set up your game, store references
- `update(dt)` — Game logic, physics, input handling (dt = seconds since last frame)
- `render(ctx)` — Draw everything to the canvas
- `pause()` — Handle pause state
- `resume()` — Handle resume
- `destroy()` — Clean up, submit final score
- `getState()` — Return serializable game state for saves
- `setState(state)` — Restore game state from saves
