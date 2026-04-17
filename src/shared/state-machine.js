/**
 * Simple finite state machine for game states.
 * Manages transitions between states like menu, playing, paused, game-over.
 * @module state-machine
 */

/**
 * Creates a finite state machine.
 * @param {object} config
 * @param {string} config.initial - Initial state name
 * @param {object} config.states - State definitions
 * @param {Function} [config.states[name].enter] - Called when entering this state
 * @param {Function} [config.states[name].update] - Called each frame while in this state
 * @param {Function} [config.states[name].render] - Called each frame for rendering
 * @param {Function} [config.states[name].exit] - Called when leaving this state
 * @returns {object} State machine API
 *
 * @example
 * const fsm = createStateMachine({
 *   initial: 'menu',
 *   states: {
 *     menu: {
 *       enter() { console.log('entered menu'); },
 *       update(dt) { // handle menu logic },
 *       exit() { console.log('left menu'); },
 *     },
 *     playing: {
 *       enter() { console.log('game started'); },
 *       update(dt) { // game logic },
 *       render(ctx) { // draw game },
 *     },
 *     paused: { ... },
 *     gameOver: { ... },
 *   },
 * });
 */
export function createStateMachine(config) {
  let currentState = config.initial;
  let previousState = null;
  const states = config.states;
  const history = [currentState];

  // Run initial enter
  if (states[currentState]?.enter) {
    states[currentState].enter();
  }

  return {
    /**
     * Transitions to a new state.
     * @param {string} newState - State name to transition to
     * @param {*} [data] - Optional data to pass to the new state's enter function
     */
    transition(newState, data) {
      if (!states[newState]) {
        console.warn(`State "${newState}" does not exist`);
        return;
      }
      if (newState === currentState) return;

      previousState = currentState;
      if (states[currentState]?.exit) {
        states[currentState].exit();
      }
      currentState = newState;
      history.push(newState);
      if (states[currentState]?.enter) {
        states[currentState].enter(data);
      }
    },

    /**
     * Updates the current state.
     * @param {number} dt - Delta time
     */
    update(dt) {
      if (states[currentState]?.update) {
        states[currentState].update(dt);
      }
    },

    /**
     * Renders the current state.
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
      if (states[currentState]?.render) {
        states[currentState].render(ctx);
      }
    },

    /**
     * Returns to the previous state.
     */
    goBack() {
      if (previousState) {
        this.transition(previousState);
      }
    },

    /**
     * Returns the current state name.
     * @returns {string}
     */
    get current() {
      return currentState;
    },

    /**
     * Returns the previous state name.
     * @returns {string|null}
     */
    get previous() {
      return previousState;
    },

    /**
     * Checks if currently in a specific state.
     * @param {string} state
     * @returns {boolean}
     */
    is(state) {
      return currentState === state;
    },

    /**
     * Returns the state transition history.
     * @returns {string[]}
     */
    get stateHistory() {
      return [...history];
    },
  };
}
