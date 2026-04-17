import { useState, useEffect, useRef } from 'react';
import { genreColors } from '../shared/colors';

export default function GameCard({ game, onPlay }) {
  const [hovered, setHovered] = useState(false);
  const canvasRef = useRef(null);
  const isComingSoon = game.manifest.comingSoon;

  // Generate thumbnail on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 320;
    const h = 180;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    if (isComingSoon) {
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#0f0f1a');
    } else {
      grad.addColorStop(0, '#16213e');
      grad.addColorStop(1, '#0a0a1a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative elements
    ctx.strokeStyle = isComingSoon ? 'rgba(255,255,255,0.03)' : 'rgba(0,212,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 20 + i * 15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center icon
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isComingSoon ? 'rgba(255,255,255,0.1)' : 'rgba(0,212,255,0.3)';
    ctx.fillText(isComingSoon ? '?' : game.manifest.title.charAt(0), w / 2, h / 2);
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

      {/* Play button (below card, always visible for playable games) */}
      {!isComingSoon && !hovered && (
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
