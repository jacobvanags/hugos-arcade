import { useState, useEffect, useRef } from 'react';
import { genreColors } from '../shared/colors';

export default function GameCard({ game, onPlay }) {
  const [hovered, setHovered] = useState(false);
  const canvasRef = useRef(null);
  const isComingSoon = game.manifest.comingSoon;

  // Generate thumbnail on canvas — per-game art so each card hints at its
  // actual gameplay instead of using a generic placeholder.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 320;
    const h = 180;
    canvas.width = w;
    canvas.height = h;

    if (isComingSoon) {
      drawComingSoonThumb(ctx, w, h);
    } else if (game.manifest.id === 'tower-defense') {
      drawTowerDefenseThumb(ctx, w, h);
    } else if (game.manifest.id === 'cheese-run') {
      drawCheeseRunThumb(ctx, w, h);
    } else {
      drawGenericThumb(ctx, w, h, game.manifest.title.charAt(0));
    }
  }, [game, isComingSoon]);

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered && !isComingSoon ? styles.cardHovered : {}),
        ...(isComingSoon ? styles.cardComingSoon : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div style={styles.thumbnailContainer}>
        <canvas ref={canvasRef} style={styles.thumbnail} />
        {isComingSoon && (
          <div style={styles.comingSoonBadge}>COMING SOON</div>
        )}
        {!isComingSoon && hovered && (
          <button
            style={styles.playOverlay}
            onClick={() => onPlay(game)}
          >
            <span style={styles.playIcon}>▶</span>
            <span>PLAY</span>
          </button>
        )}
      </div>

      {/* Info */}
      <div style={styles.info}>
        <h3 style={styles.title}>{game.manifest.title}</h3>
        <p style={styles.description}>{game.manifest.description}</p>
        <div style={styles.tags}>
          {game.manifest.genre.map((g) => (
            <span
              key={g}
              className="tag"
              style={{
                ...styles.tag,
                background: `${genreColors[g] || '#555'}22`,
                color: genreColors[g] || '#aaa',
              }}
            >
              {g}
            </span>
          ))}
          {game.manifest.version && !isComingSoon && (
            <span style={styles.version}>v{game.manifest.version}</span>
          )}
        </div>
      </div>

      {/* Bottom Play button — always rendered for playable games.
          Previously it was hidden on hover while the thumbnail overlay took
          over, but that changed the card's height and caused mouseenter/leave
          to flicker when the cursor hovered the button region. Keeping this
          button permanent makes the overlay a bonus hover target without
          any layout shift. */}
      {!isComingSoon && (
        <button
          className="btn btn-primary"
          style={styles.playButton}
          onClick={() => onPlay(game)}
        >
          Play
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHovered: {
    border: '1px solid rgba(233,69,96,0.3)',
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(233,69,96,0.1)',
  },
  cardComingSoon: {
    opacity: 0.6,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '8px 20px',
    background: 'rgba(0,0,0,0.7)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#8892b0',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    fontFamily: "'JetBrains Mono', monospace",
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 3,
    animation: 'fadeIn 0.2s ease',
  },
  playIcon: {
    fontSize: 24,
    color: '#e94560',
  },
  info: {
    padding: '16px 20px',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#8892b0',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 10,
    color: '#4a5568',
    fontFamily: "'JetBrains Mono', monospace",
    marginLeft: 'auto',
  },
  playButton: {
    margin: '0 20px 16px',
    width: 'calc(100% - 40px)',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Thumbnail art — procedural canvas drawing per game.
// Keeps card rendering self-contained and avoids shipping image assets.
// ─────────────────────────────────────────────────────────────────────

function drawComingSoonThumb(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 20 + i * 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillText('?', w / 2, h / 2);
}

function drawGenericThumb(ctx, w, h, letter) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#16213e');
  grad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,212,255,0.3)';
  ctx.fillText(letter, w / 2, h / 2);
}

/** Robot Defense: grid battlefield, winding enemy path, tower silhouettes. */
function drawTowerDefenseThumb(ctx, w, h) {
  // Deep space background
  const grad = ctx.createRadialGradient(w * 0.3, h * 0.3, 20, w / 2, h / 2, w);
  grad.addColorStop(0, '#1a2845');
  grad.addColorStop(1, '#05060d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Faint hex-grid / cell pattern
  const tile = 20;
  ctx.strokeStyle = 'rgba(0,212,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Enemy path — winding curve from left edge to right
  ctx.strokeStyle = 'rgba(0,212,255,0.35)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.55, h * 0.95, w, h * 0.35);
  ctx.stroke();

  // Path glow
  ctx.strokeStyle = 'rgba(0,212,255,0.1)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.55, h * 0.95, w, h * 0.35);
  ctx.stroke();

  // A few towers dotted around the path (colored circles on bases)
  const towers = [
    { x: w * 0.22, y: h * 0.62, color: '#ffd700' }, // gold — blaster
    { x: w * 0.45, y: h * 0.3,  color: '#e94560' }, // red — missile
    { x: w * 0.68, y: h * 0.72, color: '#44ffaa' }, // green — support
    { x: w * 0.82, y: h * 0.25, color: '#ff8844' }, // orange — plasma
  ];
  for (const t of towers) {
    // base
    ctx.fillStyle = 'rgba(20,30,50,0.9)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // turret
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI * 2); ctx.fill();
    // range ring hint
    ctx.strokeStyle = t.color + '33';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(t.x, t.y, 26, 0, Math.PI * 2); ctx.stroke();
  }

  // A small wave of enemies approaching on the path (red dots)
  const enemies = [
    { x: w * 0.08, y: h * 0.68 },
    { x: w * 0.14, y: h * 0.55 },
    { x: w * 0.19, y: h * 0.46 },
  ];
  for (const e of enemies) {
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,68,68,0.25)';
    ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();
  }
}

/** Cheese Run: platforms, cheese wedge, mouse silhouette. */
function drawCheeseRunThumb(ctx, w, h) {
  // Warm night-sky background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#2a1a3e');
  grad.addColorStop(1, '#0f0a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Sparse stars
  ctx.fillStyle = 'rgba(255,220,150,0.5)';
  const stars = [[30, 28], [78, 18], [140, 40], [210, 22], [260, 52], [290, 15]];
  for (const [x, y] of stars) {
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // Moon
  ctx.fillStyle = 'rgba(255,220,150,0.15)';
  ctx.beginPath(); ctx.arc(w - 50, 40, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,150,0.35)';
  ctx.beginPath(); ctx.arc(w - 50, 40, 10, 0, Math.PI * 2); ctx.fill();

  // Platforms — stacked brick-style levels
  const platforms = [
    { x: 0,   y: h - 22, w: 110, color: '#3a2a22' },
    { x: 140, y: h - 60, w: 90,  color: '#3a2a22' },
    { x: 250, y: h - 32, w: 70,  color: '#3a2a22' },
    { x: 60,  y: h - 100, w: 70,  color: '#3a2a22' },
    { x: 190, y: h - 120, w: 90,  color: '#3a2a22' },
  ];
  for (const p of platforms) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, 14);
    // top highlight
    ctx.fillStyle = 'rgba(255,200,120,0.25)';
    ctx.fillRect(p.x, p.y, p.w, 2);
    // brick seams
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let x = p.x + 12; x < p.x + p.w; x += 18) {
      ctx.beginPath(); ctx.moveTo(x, p.y + 2); ctx.lineTo(x, p.y + 14); ctx.stroke();
    }
  }

  // Golden cheese wedge up on the top platform
  const cx = 225, cy = h - 124;
  ctx.fillStyle = '#ffcf3a';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 28, cy);
  ctx.lineTo(cx + 14, cy - 16);
  ctx.closePath();
  ctx.fill();
  // cheese highlight
  ctx.fillStyle = '#fff3a0';
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 1);
  ctx.lineTo(cx + 14, cy - 14);
  ctx.lineTo(cx + 8, cy - 1);
  ctx.closePath();
  ctx.fill();
  // cheese holes
  ctx.fillStyle = '#b8891a';
  ctx.beginPath(); ctx.arc(cx + 12, cy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 19, cy - 6, 1.2, 0, Math.PI * 2); ctx.fill();

  // Mouse on the lowest platform (simple grey body + pink ear + tail)
  const mx = 28, my = h - 30;
  ctx.fillStyle = '#c8c8d0';
  // body
  ctx.beginPath(); ctx.ellipse(mx, my, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.beginPath(); ctx.arc(mx + 8, my - 2, 5, 0, Math.PI * 2); ctx.fill();
  // ear
  ctx.fillStyle = '#f8a8c0';
  ctx.beginPath(); ctx.arc(mx + 6, my - 6, 2.5, 0, Math.PI * 2); ctx.fill();
  // eye
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(mx + 10, my - 2, 0.8, 0, Math.PI * 2); ctx.fill();
  // tail
  ctx.strokeStyle = '#c8c8d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx - 8, my);
  ctx.quadraticCurveTo(mx - 16, my - 4, mx - 18, my + 2);
  ctx.stroke();
  // tiny gun (straight line pointing right)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx + 12, my - 1);
  ctx.lineTo(mx + 18, my - 1);
  ctx.stroke();
}
