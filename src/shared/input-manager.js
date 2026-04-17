/**
 * Keyboard and mouse input handling. Tracks key states for polling-based input.
 * Shared across all games — each game gets its own instance via createInputManager().
 * @module input-manager
 */

/**
 * Creates a new input manager instance bound to a target element.
 * @param {HTMLElement} [target=window] - Element to listen for events on
 * @returns {object} Input manager API
 */
export function createInputManager(target = window) {
  const keys = {};
  const justPressed = {};
  const justReleased = {};
  const mouse = { x: 0, y: 0, down: false, clicked: false, rightDown: false, wheelDeltaY: 0 };
  // Touch state — mirrors into mouse so existing mouse-based logic works on iPad.
  // `touchActive` tracks whether input is currently coming from a finger (vs. real mouse),
  // so games can adjust UI (hide hover tooltips, show touch controls, etc.).
  const touch = { active: false, id: null, lastY: 0 };
  let enabled = true;

  function onKeyDown(e) {
    if (!enabled) return;
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;
    // Prevent default for game keys (arrows, space)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    if (!enabled) return;
    keys[e.code] = false;
    justReleased[e.code] = true;
  }

  function onMouseMove(e) {
    if (!enabled) return;
    if (target === window) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    } else {
      const rect = target.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
  }

  function onMouseDown(e) {
    if (!enabled) return;
    if (e.button === 0) {
      mouse.down = true;
      mouse.clicked = true;
    }
    if (e.button === 2) {
      mouse.rightDown = true;
    }
  }

  function onMouseUp(e) {
    if (!enabled) return;
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
  }

  function onWheel(e) {
    if (!enabled) return;
    mouse.wheelDeltaY += e.deltaY;
    e.preventDefault();
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  // --- Touch → Mouse synthesis ---
  // On iPad, we map the first active touch to the mouse API so existing games
  // (which all read `mouse.x/y/down/clicked`) work without per-game changes.
  // Multi-touch isn't synthesized — second fingers are ignored here. On-screen
  // controls (D-pad, jump button) attach their own listeners outside this manager.

  function pointFromTouch(t) {
    if (target === window) return { x: t.clientX, y: t.clientY };
    const rect = target.getBoundingClientRect();
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function onTouchStart(e) {
    if (!enabled) return;
    if (touch.id !== null) return; // already tracking a finger
    const t = e.changedTouches[0];
    if (!t) return;
    touch.active = true;
    touch.id = t.identifier;
    const p = pointFromTouch(t);
    mouse.x = p.x;
    mouse.y = p.y;
    touch.lastY = t.clientY;
    mouse.down = true;
    mouse.clicked = true;
    // Prevent iOS double-tap zoom and scroll on the canvas
    if (e.cancelable) e.preventDefault();
  }

  function onTouchMove(e) {
    if (!enabled || touch.id === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier === touch.id) {
        const p = pointFromTouch(t);
        mouse.x = p.x;
        mouse.y = p.y;
        // Synthesize wheel delta from vertical drag so scroll-wheel UI (TD sidebar,
        // map select) works via drag. Inverted so dragging up scrolls content up.
        mouse.wheelDeltaY += (touch.lastY - t.clientY);
        touch.lastY = t.clientY;
        if (e.cancelable) e.preventDefault();
        break;
      }
    }
  }

  function onTouchEnd(e) {
    if (!enabled || touch.id === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier === touch.id) {
        touch.id = null;
        touch.active = false;
        mouse.down = false;
        if (e.cancelable) e.preventDefault();
        break;
      }
    }
  }

  /** Clears all tracked key/mouse state so nothing is "stuck" */
  function clearAllState() {
    for (const code in keys) delete keys[code];
    for (const code in justPressed) delete justPressed[code];
    for (const code in justReleased) delete justReleased[code];
    mouse.down = false;
    mouse.clicked = false;
    mouse.rightDown = false;
    mouse.wheelDeltaY = 0;
    touch.id = null;
    touch.active = false;
  }

  /** When canvas loses focus, release all keys so nothing is stuck */
  function onBlur() {
    clearAllState();
  }

  // Attach listeners
  const listenTarget = target === window ? window : target;
  listenTarget.addEventListener('keydown', onKeyDown);
  listenTarget.addEventListener('keyup', onKeyUp);
  listenTarget.addEventListener('mousemove', onMouseMove);
  listenTarget.addEventListener('mousedown', onMouseDown);
  listenTarget.addEventListener('mouseup', onMouseUp);
  listenTarget.addEventListener('contextmenu', onContextMenu);
  listenTarget.addEventListener('wheel', onWheel, { passive: false });
  listenTarget.addEventListener('blur', onBlur);
  listenTarget.addEventListener('touchstart', onTouchStart, { passive: false });
  listenTarget.addEventListener('touchmove', onTouchMove, { passive: false });
  listenTarget.addEventListener('touchend', onTouchEnd, { passive: false });
  listenTarget.addEventListener('touchcancel', onTouchEnd, { passive: false });

  return {
    /**
     * Returns true while the key is held down.
     * @param {string} code - KeyboardEvent.code (e.g., 'ArrowUp', 'Space', 'KeyW')
     * @returns {boolean}
     */
    isDown(code) {
      return !!keys[code];
    },

    /**
     * Returns true only on the first frame the key was pressed.
     * Must call update() each frame for this to work correctly.
     * @param {string} code
     * @returns {boolean}
     */
    isPressed(code) {
      return !!justPressed[code];
    },

    /**
     * Returns true only on the frame the key was released.
     * @param {string} code
     * @returns {boolean}
     */
    isReleased(code) {
      return !!justReleased[code];
    },

    /**
     * Returns the current mouse state.
     * @returns {{ x: number, y: number, down: boolean, clicked: boolean, rightDown: boolean }}
     */
    getMouse() {
      return { ...mouse };
    },

    /**
     * Returns true when input is currently coming from a touch device.
     * Games use this to show on-screen controls and hide hover tooltips.
     * @returns {boolean}
     */
    isTouchActive() {
      return touch.active;
    },

    /**
     * Simulate a key press from UI (e.g. an on-screen touch button).
     * Feeds directly into the same `keys` / `justPressed` state, so game code
     * reading `isDown('ArrowLeft')` works the same whether the arrow came
     * from a keyboard or from a D-pad button.
     * @param {string} code
     */
    pressVirtualKey(code) {
      if (!enabled) return;
      if (!keys[code]) justPressed[code] = true;
      keys[code] = true;
    },

    /**
     * Release a key that was pressed via pressVirtualKey.
     * @param {string} code
     */
    releaseVirtualKey(code) {
      if (!enabled) return;
      if (keys[code]) justReleased[code] = true;
      keys[code] = false;
    },

    /**
     * Called at the end of each frame to reset one-shot states.
     */
    update() {
      for (const code in justPressed) delete justPressed[code];
      for (const code in justReleased) delete justReleased[code];
      mouse.clicked = false;
      mouse.wheelDeltaY = 0;
    },

    /**
     * Enables input tracking.
     */
    enable() {
      enabled = true;
    },

    /**
     * Disables input tracking (e.g., when game is paused).
     */
    disable() {
      enabled = false;
      clearAllState(); // prevent stuck keys
    },

    /**
     * Removes all event listeners. Call when game is destroyed.
     */
    destroy() {
      listenTarget.removeEventListener('keydown', onKeyDown);
      listenTarget.removeEventListener('keyup', onKeyUp);
      listenTarget.removeEventListener('mousemove', onMouseMove);
      listenTarget.removeEventListener('mousedown', onMouseDown);
      listenTarget.removeEventListener('mouseup', onMouseUp);
      listenTarget.removeEventListener('contextmenu', onContextMenu);
      listenTarget.removeEventListener('wheel', onWheel);
      listenTarget.removeEventListener('blur', onBlur);
      listenTarget.removeEventListener('touchstart', onTouchStart);
      listenTarget.removeEventListener('touchmove', onTouchMove);
      listenTarget.removeEventListener('touchend', onTouchEnd);
      listenTarget.removeEventListener('touchcancel', onTouchEnd);
    },
  };
}
