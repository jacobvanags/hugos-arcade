import { useEffect, useState, useRef } from 'react';

/**
 * Detects whether the current device has a touchscreen.
 * We check once on mount; no need to react to changes.
 */
function detectTouch() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints || 0) > 0
  );
}

/**
 * On-screen touch controls overlay.
 *
 * Renders DOM buttons positioned absolutely over the game canvas. When pressed,
 * calls `inputRef.current.pressVirtualKey(code)` so game code that reads
 * `input.isDown('ArrowLeft')` etc. works identically to a real keyboard.
 *
 * - `inputRef`: React ref pointing at the input-manager instance (game.input)
 * - `layout`: array of button defs { code, label, position, size }
 * - Hidden on non-touch devices — desktop renders nothing.
 */
export default function TouchControls({ inputRef, layout }) {
  const [isTouch] = useState(detectTouch);
  // Tracks codes that this component has currently pressed down. Used as a
  // safety net to release everything on unmount, and to avoid double-releases.
  const heldRef = useRef(new Set());

  // Global safety net: if any pointer is lifted or cancelled anywhere in the
  // document, release ALL keys that don't still have an active pointer on them.
  // This catches the case where setPointerCapture falls through, the button
  // unmounts mid-press, or iOS decides to eat a pointerup event.
  //
  // Each button tracks its own pointerId in its closure. When the window sees
  // a pointerup, each button checks if it's the one that just lifted and
  // fires its own cleanup. We only need the document listener as a fallback
  // to force-release everything on `pointercancel` at the window level.
  useEffect(() => {
    const forceReleaseAll = () => {
      const im = inputRef.current;
      if (!im) return;
      for (const code of heldRef.current) {
        im.releaseVirtualKey(code);
      }
      heldRef.current.clear();
    };
    // `pointercancel` on the window means the OS or browser yanked the gesture
    // away (phone call, app switcher, etc.). Always fully release.
    window.addEventListener('pointercancel', forceReleaseAll);
    // Visibility change = tab backgrounded. Also a good time to release.
    const onVis = () => { if (document.hidden) forceReleaseAll(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      forceReleaseAll();
      window.removeEventListener('pointercancel', forceReleaseAll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [inputRef]);

  if (!isTouch) return null;

  const press = (code) => {
    const im = inputRef.current;
    if (!im) return;
    im.pressVirtualKey(code);
    heldRef.current.add(code);
  };

  const release = (code) => {
    const im = inputRef.current;
    if (!im) return;
    im.releaseVirtualKey(code);
    heldRef.current.delete(code);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none', // children opt in individually
        zIndex: 10,
      }}
    >
      {layout.map((btn) => (
        <TouchButton
          key={btn.code + '-' + (btn.label || '')}
          def={btn}
          onPress={() => press(btn.code)}
          onRelease={() => release(btn.code)}
        />
      ))}
    </div>
  );
}

function TouchButton({ def, onPress, onRelease }) {
  const [active, setActive] = useState(false);
  // Ref mirror of `active` so event handlers can check current state without
  // stale-closure bugs (critical for onPointerLeave / window listeners).
  const activeRef = useRef(false);
  // Pointer currently pressing this button, so we only respond to matching
  // pointer events (protects against multi-touch cross-talk).
  const pointerIdRef = useRef(null);

  const doPress = (e) => {
    // Ignore if another finger is already on this button.
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    // Capture the pointer on this element so pointerup/pointermove keep
    // firing here even if the finger drifts outside the button bounds.
    // This is the single most important fix for stuck-key bugs on touch.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      // Older browsers without pointer capture — fall through.
    }
    activeRef.current = true;
    setActive(true);
    onPress();
    e.preventDefault();
  };

  const doRelease = (e) => {
    // Only release for the pointer that originally pressed us.
    if (pointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    pointerIdRef.current = null;
    activeRef.current = false;
    setActive(false);
    onRelease();
    e.preventDefault();
  };

  // Belt-and-suspenders: if the component unmounts while held, release.
  // (Primary release path is onPointerUp / onPointerCancel.)
  useEffect(() => () => {
    if (activeRef.current) {
      activeRef.current = false;
      onRelease();
    }
  }, [onRelease]);

  return (
    <button
      type="button"
      aria-label={def.ariaLabel || def.label}
      onPointerDown={doPress}
      onPointerUp={doRelease}
      onPointerCancel={doRelease}
      // With setPointerCapture, onPointerLeave won't normally fire while the
      // finger is tracked — but as a last-resort fallback for browsers without
      // pointer capture, we use the ref (not stale state) to check if held.
      onPointerLeave={(e) => { if (activeRef.current) doRelease(e); }}
      style={{
        position: 'absolute',
        ...def.position,
        width: def.size || 72,
        height: def.size || 72,
        borderRadius: def.shape === 'square' ? 12 : '50%',
        border: '2px solid rgba(255,255,255,0.4)',
        background: active
          ? 'rgba(255, 200, 60, 0.55)'
          : 'rgba(30, 30, 40, 0.55)',
        color: '#fff',
        fontSize: def.fontSize || 22,
        fontWeight: 700,
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: active
          ? '0 0 12px rgba(255,200,60,0.6), inset 0 0 8px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'background 60ms, box-shadow 60ms',
        cursor: 'pointer',
      }}
    >
      {def.label}
    </button>
  );
}
