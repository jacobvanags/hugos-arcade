import { useEffect, useState } from 'react';

/**
 * Full-screen overlay shown when the user is on a touch device in portrait
 * orientation. All games in the arcade are landscape-only — the canvas is
 * wider than tall and all touch controls assume landscape.
 *
 * Belt-and-suspenders with the manifest's `"orientation": "landscape"` lock,
 * which only applies when the PWA is installed to the home screen.
 */
function isTouch() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
}

function isPortrait() {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

export default function RotatePrompt() {
  const [shouldShow, setShouldShow] = useState(() => isTouch() && isPortrait());

  useEffect(() => {
    if (!isTouch()) return; // desktop never needs the prompt
    const update = () => setShouldShow(isPortrait());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (!shouldShow) return null;

  return (
    <div
      role="dialog"
      aria-label="Please rotate your device to landscape"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0f',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: 32,
        gap: 28,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Animated rotating-device icon */}
      <div
        style={{
          width: 120,
          height: 80,
          border: '5px solid #ffd700',
          borderRadius: 10,
          position: 'relative',
          animation: 'hugosArcadeRotate 2.2s ease-in-out infinite',
        }}
      >
        {/* Screen content hint */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: '2px solid rgba(255,215,0,0.25)',
            borderRadius: 4,
          }}
        />
        {/* Home button dot */}
        <div
          style={{
            position: 'absolute',
            right: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#ffd700',
          }}
        />
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>
        Please rotate your iPad
      </div>
      <div style={{ fontSize: 14, color: '#8892b0', maxWidth: 320, lineHeight: 1.5 }}>
        Hugo's Arcade is best played in landscape — turn your device sideways
        to start playing.
      </div>

      <style>{`
        @keyframes hugosArcadeRotate {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(-90deg); }
          60%  { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
