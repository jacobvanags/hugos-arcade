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
  const heldRef = useRef(new Set());

  // Safety: release any held virtual keys when the component unmounts
  // so keys don't get "stuck down" if the user navigates away mid-press.
  useEffect(() => {
    return () => {
      const im = inputRef.current;
      if (!im) return;
      for (const code of heldRef.current) {
        im.releaseVirtualKey(code);
      }
      heldRef.current.clear();
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

  const handleDown = (e) => {
    e.preventDefault();
    setActive(true);
    onPress();
  };

  const handleUp = (e) => {
    e.preventDefault();
    setActive(false);
    onRelease();
  };

  // `touch-action: none` disables iOS scroll / double-tap zoom on the button.
  // We attach both pointer and touch events for maximum browser compatibility.
  return (
    <button
      type="button"
      aria-label={def.ariaLabel || def.label}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={(e) => { if (active) handleUp(e); }}
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
