import { useMemo, useState } from 'react';
import { useAchievements } from '../context/AchievementContext';
import { usePlayer } from '../context/PlayerContext';
import { games } from '../games/registry';

export default function Achievements() {
  const { getAllAchievements } = useAchievements();
  const { achievements: unlockedMap } = usePlayer();
  const [filter, setFilter] = useState('all');

  // Collect all achievement defs from games + merge unlock status from player profile
  const allAchievements = useMemo(() => {
    const defs = [];
    for (const game of games) {
      if (game.achievements) {
        for (const ach of game.achievements) {
          defs.push({ ...ach, gameId: game.manifest.id, gameTitle: game.manifest.title });
        }
      }
    }
    // Merge with any achievements registered in context (active game)
    const registered = getAllAchievements();
    const merged = new Map();
    for (const d of defs) {
      merged.set(d.id, d);
    }
    for (const r of registered) {
      if (merged.has(r.id)) {
        merged.set(r.id, { ...merged.get(r.id), ...r });
      } else {
        merged.set(r.id, r);
      }
    }
    // Apply unlock status from player profile (persisted in localStorage)
    for (const [id, ach] of merged) {
      const unlock = unlockedMap[id];
      if (unlock) {
        merged.set(id, { ...ach, unlocked: true, unlockedAt: unlock.unlockedAt });
      }
    }
    return Array.from(merged.values());
  }, [getAllAchievements, unlockedMap]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allAchievements;
    if (filter === 'unlocked') return allAchievements.filter((a) => a.unlocked);
    if (filter === 'locked') return allAchievements.filter((a) => !a.unlocked);
    return allAchievements;
  }, [allAchievements, filter]);

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const progress = allAchievements.length > 0 ? unlockedCount / allAchievements.length : 0;

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Achievements</h1>

      {/* Progress bar */}
      <div className="card" style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>Overall Progress</span>
          <span style={styles.progressCount}>
            {unlockedCount} / {allAchievements.length}
          </span>
        </div>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Filter */}
      <div style={styles.filterRow}>
        {['all', 'unlocked', 'locked'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterBtnActive : {}),
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievement list */}
      <div style={styles.list}>
        {filtered.length === 0 && (
          <div style={styles.empty}>
            {filter === 'unlocked'
              ? 'No achievements unlocked yet. Start playing!'
              : 'No achievements to show.'}
          </div>
        )}
        {filtered.map((ach, i) => (
          <div
            key={ach.id}
            style={{
              ...styles.achCard,
              ...(ach.unlocked ? {} : styles.achCardLocked),
              animationDelay: `${i * 0.03}s`,
            }}
            className="animate-in"
          >
            <div style={{
              ...styles.achIcon,
              ...(ach.unlocked ? {} : styles.achIconLocked),
            }}>
              {ach.icon || '🏆'}
            </div>
            <div style={styles.achInfo}>
              <div style={styles.achTitle}>{ach.name}</div>
              <div style={styles.achDesc}>{ach.description}</div>
              {ach.gameTitle && (
                <div style={styles.achGame}>{ach.gameTitle}</div>
              )}
            </div>
            <div style={styles.achStatus}>
              {ach.unlocked ? (
                <div style={styles.achUnlocked}>
                  <span style={styles.achCheck}>✓</span>
                  <span style={styles.achDate}>
                    {new Date(ach.unlockedAt).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <span style={styles.achLocked}>🔒</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '32px 40px',
    height: '100vh',
    overflowY: 'auto',
    maxWidth: 700,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 24,
  },
  progressCard: {
    marginBottom: 24,
    padding: 20,
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e8e8e8',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ffd700',
    fontFamily: "'JetBrains Mono', monospace",
  },
  progressBar: {
    height: 8,
    background: '#0f3460',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
    borderRadius: 4,
    transition: 'width 0.5s ease',
    minWidth: 0,
  },
  filterRow: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
  },
  filterBtn: {
    padding: '6px 16px',
    borderRadius: 20,
    border: 'none',
    background: 'transparent',
    color: '#8892b0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: 'rgba(255,215,0,0.12)',
    color: '#ffd700',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 40,
  },
  achCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 18px',
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    opacity: 0,
  },
  achCardLocked: {
    opacity: 0,
  },
  achIcon: {
    fontSize: 28,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,215,0,0.08)',
    borderRadius: 10,
    flexShrink: 0,
  },
  achIconLocked: {
    filter: 'grayscale(1)',
    opacity: 0.4,
  },
  achInfo: {
    flex: 1,
  },
  achTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 2,
  },
  achDesc: {
    fontSize: 12,
    color: '#8892b0',
  },
  achGame: {
    fontSize: 11,
    color: '#4a5568',
    marginTop: 3,
    fontFamily: "'JetBrains Mono', monospace",
  },
  achStatus: {
    flexShrink: 0,
  },
  achUnlocked: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  achCheck: {
    color: '#00ff88',
    fontWeight: 700,
    fontSize: 18,
  },
  achDate: {
    fontSize: 10,
    color: '#4a5568',
    fontFamily: "'JetBrains Mono', monospace",
  },
  achLocked: {
    fontSize: 20,
    opacity: 0.4,
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#8892b0',
    fontSize: 14,
  },
};
