import { useState, useMemo } from 'react';
import GameCard from '../components/GameCard';
import { getAllGameEntries } from '../games/registry';

const GENRES = ['all', 'arcade', 'strategy', 'platformer', 'action', 'shooter', 'puzzle', 'rpg'];

export default function Home({ onPlayGame }) {
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');

  const allGames = useMemo(() => getAllGameEntries(), []);

  const filtered = useMemo(() => {
    return allGames.filter((g) => {
      const m = g.manifest;
      const matchesSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());
      const matchesGenre =
        genreFilter === 'all' || m.genre.includes(genreFilter);
      return matchesSearch && matchesGenre;
    });
  }, [allGames, search, genreFilter]);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Game Library</h1>
          <p style={styles.subtitle}>{allGames.length} titles</p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.genreTabs}>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              style={{
                ...styles.genreTab,
                ...(genreFilter === g ? styles.genreTabActive : {}),
              }}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game Grid */}
      <div style={styles.grid}>
        {filtered.map((game, i) => (
          <div key={game.manifest.id} style={{ ...styles.gridItem, animationDelay: `${i * 0.05}s` }} className="animate-slide-up">
            <GameCard game={game} onPlay={onPlayGame} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>No games found matching your search.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '32px 40px',
    height: '100vh',
    overflowY: 'auto',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8892b0',
  },
  filters: {
    marginBottom: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  searchInput: {
    width: '100%',
    maxWidth: 400,
    padding: '10px 16px',
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#e8e8e8',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  genreTabs: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  genreTab: {
    padding: '6px 14px',
    borderRadius: 20,
    border: 'none',
    background: 'transparent',
    color: '#8892b0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  genreTabActive: {
    background: 'rgba(233,69,96,0.15)',
    color: '#e94560',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
    paddingBottom: 40,
  },
  gridItem: {
    opacity: 0,
    animation: 'slideUp 0.4s ease forwards',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#8892b0',
  },
  emptyIcon: {
    fontSize: 48,
    display: 'block',
    marginBottom: 12,
  },
};
