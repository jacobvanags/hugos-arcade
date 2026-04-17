import { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { generateAvatarDataURL } from '../shared/sprite-factory';

const AVATAR_COUNT = 8;
const MAX_PROFILES = 6;

export default function ProfileSelect() {
  const { listProfiles, createProfile, deleteProfile, switchProfile } = usePlayer();
  const [profiles, setProfiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [avatarUrls, setAvatarUrls] = useState([]);

  useEffect(() => {
    setProfiles(listProfiles());
  }, [listProfiles]);

  useEffect(() => {
    const urls = [];
    for (let i = 0; i < AVATAR_COUNT; i++) {
      urls.push(generateAvatarDataURL(i, 120));
    }
    setAvatarUrls(urls);
  }, []);

  const handleCreate = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    createProfile(trimmed, selectedAvatar);
  };

  const handleSelect = (id) => {
    switchProfile(id);
  };

  const handleDelete = (id) => {
    deleteProfile(id);
    setConfirmDelete(null);
    setProfiles(listProfiles());
  };

  const formatPlayTime = (seconds) => {
    if (!seconds || seconds < 60) return seconds ? `${seconds}s` : '0s';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (creating) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>Create Profile</h1>
          <p style={styles.subtitle}>Choose your name and avatar</p>

          <div style={styles.createCard}>
            {/* Name input */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Player Name</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                style={styles.nameInput}
                placeholder="Enter name..."
                autoFocus
                maxLength={20}
              />
            </div>

            {/* Avatar grid */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Choose Avatar</label>
              <div style={styles.avatarGrid}>
                {avatarUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAvatar(i)}
                    style={{
                      ...styles.avatarOption,
                      ...(selectedAvatar === i ? styles.avatarSelected : {}),
                    }}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} style={styles.avatarImg} />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={styles.createActions}>
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  opacity: nameInput.trim() ? 1 : 0.4,
                }}
                onClick={handleCreate}
                disabled={!nameInput.trim()}
              >
                Create Profile
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnGhost }}
                onClick={() => { setCreating(false); setNameInput(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>H</div>
          <div>
            <div style={styles.logoTitle}>Hugo's</div>
            <div style={styles.logoSubtitle}>ARCADE</div>
          </div>
        </div>

        <h1 style={styles.title}>Select Profile</h1>
        <p style={styles.subtitle}>Choose who's playing</p>

        {/* Profile cards */}
        <div style={styles.profileGrid}>
          {profiles.map((p) => (
            <div key={p.id} style={styles.profileCard}>
              {confirmDelete === p.id ? (
                <div style={styles.confirmOverlay}>
                  <p style={styles.confirmText}>Delete this profile?</p>
                  <p style={styles.confirmWarn}>All progress will be lost.</p>
                  <div style={styles.confirmActions}>
                    <button
                      style={{ ...styles.btn, ...styles.btnDanger, fontSize: 12, padding: '6px 14px' }}
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnGhost, fontSize: 12, padding: '6px 14px' }}
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    style={styles.profileBtn}
                    onClick={() => handleSelect(p.id)}
                  >
                    {avatarUrls[p.avatar] && (
                      <img src={avatarUrls[p.avatar]} alt="avatar" style={styles.profileAvatar} />
                    )}
                    <div style={styles.profileName}>{p.name}</div>
                    <div style={styles.profileStats}>
                      {formatPlayTime(p.totalPlayTime)} · {p.gamesPlayed} games
                    </div>
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id); }}
                    title="Delete profile"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Create new button */}
          {profiles.length < MAX_PROFILES && (
            <button
              style={styles.createBtn}
              onClick={() => setCreating(true)}
            >
              <div style={styles.createPlus}>+</div>
              <div style={styles.createLabel}>New Profile</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #12121a 0%, #0a0a0f 70%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: {
    textAlign: 'center',
    maxWidth: 640,
    width: '100%',
    padding: '0 24px',
  },
  logoSection: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 40,
  },
  logoIcon: {
    width: 56,
    height: 56,
    background: 'linear-gradient(135deg, #e94560, #ff6b81)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 28,
    color: '#fff',
    fontFamily: "'JetBrains Mono', monospace",
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.1,
    textAlign: 'left',
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 4,
    color: '#e94560',
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'left',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8892b0',
    marginBottom: 32,
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    maxWidth: 540,
    margin: '0 auto',
  },
  profileCard: {
    position: 'relative',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#12121a',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  profileBtn: {
    width: '100%',
    padding: '28px 16px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '2px solid rgba(233,69,96,0.3)',
  },
  profileName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  profileStats: {
    fontSize: 11,
    color: '#4a5568',
    fontFamily: "'JetBrains Mono', monospace",
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,68,68,0.1)',
    color: '#ff4444',
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    transition: 'opacity 0.2s',
    fontFamily: 'inherit',
  },
  confirmOverlay: {
    padding: '20px 14px',
    textAlign: 'center',
  },
  confirmText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  confirmWarn: {
    color: '#8892b0',
    fontSize: 11,
    marginBottom: 14,
  },
  confirmActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  createBtn: {
    borderRadius: 14,
    border: '2px dashed rgba(255,255,255,0.1)',
    background: 'none',
    cursor: 'pointer',
    padding: '28px 16px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'border-color 0.2s, background 0.2s',
    fontFamily: 'inherit',
    minHeight: 140,
  },
  createPlus: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '2px solid rgba(233,69,96,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: '#e94560',
    fontWeight: 300,
  },
  createLabel: {
    fontSize: 13,
    color: '#8892b0',
    fontWeight: 500,
  },
  // Create form styles
  createCard: {
    background: '#12121a',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.06)',
    padding: 32,
    maxWidth: 440,
    margin: '0 auto',
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#e8e8e8',
    marginBottom: 10,
  },
  nameInput: {
    width: '100%',
    padding: '12px 16px',
    background: '#0a0a0f',
    border: '1px solid rgba(233,69,96,0.25)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    outline: 'none',
    fontFamily: 'inherit',
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
  },
  avatarOption: {
    aspectRatio: '1',
    borderRadius: 12,
    border: '2px solid transparent',
    background: '#0a0a0f',
    cursor: 'pointer',
    padding: 6,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    border: '2px solid #e94560',
    boxShadow: '0 0 15px rgba(233,69,96,0.25)',
    background: 'rgba(233,69,96,0.08)',
  },
  avatarImg: {
    width: '80%',
    height: '80%',
    borderRadius: '50%',
  },
  createActions: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #e94560, #c23152)',
    color: '#fff',
    flex: 1,
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.05)',
    color: '#8892b0',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  btnDanger: {
    background: 'rgba(255,68,68,0.15)',
    color: '#ff4444',
    border: '1px solid rgba(255,68,68,0.3)',
  },
};
