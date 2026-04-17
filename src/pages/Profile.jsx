import { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useAchievements } from '../context/AchievementContext';
import { generateAvatarDataURL } from '../shared/sprite-factory';

const AVATAR_COUNT = 8;

export default function Profile() {
  const { player, updatePlayer, signOut } = usePlayer();
  const { getAllAchievements } = useAchievements();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const [avatarUrls, setAvatarUrls] = useState([]);

  useEffect(() => {
    const urls = [];
    for (let i = 0; i < AVATAR_COUNT; i++) {
      urls.push(generateAvatarDataURL(i, 120));
    }
    setAvatarUrls(urls);
  }, []);

  const achievements = getAllAchievements();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const formatPlayTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) updatePlayer({ name: trimmed });
    setEditing(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Player Profile</h1>

      {/* Profile Card */}
      <div className="card" style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatarSection}>
            {avatarUrls[player.avatar] && (
              <img src={avatarUrls[player.avatar]} alt="avatar" style={styles.mainAvatar} />
            )}
          </div>
          <div style={styles.profileInfo}>
            {editing ? (
              <div style={styles.editRow}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  style={styles.nameInput}
                  autoFocus
                  maxLength={20}
                />
                <button className="btn btn-primary" onClick={handleSaveName}>Save</button>
                <button className="btn btn-ghost" onClick={() => { setEditing(false); setNameInput(player.name); }}>Cancel</button>
              </div>
            ) : (
              <div style={styles.nameRow}>
                <h2 style={styles.playerName}>{player.name}</h2>
                <button className="btn btn-ghost" onClick={() => setEditing(true)} style={{ fontSize: 12 }}>Edit</button>
              </div>
            )}
            <p style={styles.joinDate}>
              Playing since {new Date(player.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{formatPlayTime(player.totalPlayTime)}</div>
            <div style={styles.statLabel}>Play Time</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{player.gamesPlayed}</div>
            <div style={styles.statLabel}>Games Played</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{unlocked}/{achievements.length || 0}</div>
            <div style={styles.statLabel}>Achievements</div>
          </div>
        </div>
      </div>

      {/* Avatar Selection */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>Choose Avatar</h3>
        <div style={styles.avatarGrid}>
          {avatarUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => updatePlayer({ avatar: i })}
              style={{
                ...styles.avatarOption,
                ...(player.avatar === i ? styles.avatarOptionSelected : {}),
              }}
            >
              <img src={url} alt={`Avatar ${i + 1}`} style={styles.avatarImg} />
            </button>
          ))}
        </div>
      </div>

      {/* Switch Profile */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>Switch Profile</h3>
        <p style={{ fontSize: 12, color: '#8892b0', marginBottom: 16 }}>
          Sign out and choose a different profile.
        </p>
        <button className="btn btn-ghost" onClick={() => signOut()}>
          ↺ Switch Profile
        </button>
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
  profileCard: {
    padding: 28,
  },
  profileHeader: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarSection: {},
  mainAvatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '3px solid rgba(233,69,96,0.4)',
    boxShadow: '0 0 20px rgba(233,69,96,0.2)',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
  },
  editRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    padding: '8px 14px',
    background: '#0a0a0f',
    border: '1px solid rgba(233,69,96,0.3)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    outline: 'none',
    fontFamily: 'inherit',
    width: 200,
  },
  joinDate: {
    fontSize: 13,
    color: '#8892b0',
    marginTop: 4,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    padding: '20px 0 0',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#00d4ff',
    fontFamily: "'JetBrains Mono', monospace",
  },
  statLabel: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 4,
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  avatarOption: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: 16,
    border: '2px solid transparent',
    background: '#0a0a0f',
    cursor: 'pointer',
    padding: 8,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    border: '2px solid #e94560',
    boxShadow: '0 0 15px rgba(233,69,96,0.25)',
    background: 'rgba(233,69,96,0.08)',
  },
  avatarImg: {
    width: '80%',
    height: '80%',
    borderRadius: '50%',
  },
};
