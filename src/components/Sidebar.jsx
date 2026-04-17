import { NavLink, useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { generateAvatarDataURL } from '../shared/sprite-factory';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', icon: '🎮', label: 'Library' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/achievements', icon: '🏆', label: 'Achievements' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const { player, signOut } = usePlayer();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    setAvatarUrl(generateAvatarDataURL(player.avatar, 80));
  }, [player.avatar]);

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>H</div>
        <div>
          <div style={styles.logoTitle}>Hugo's</div>
          <div style={styles.logoSubtitle}>ARCADE</div>
        </div>
      </div>

      {/* Player mini-profile */}
      <div
        style={styles.miniProfile}
        onClick={() => navigate('/profile')}
        title="View profile"
      >
        {avatarUrl && <img src={avatarUrl} alt="avatar" style={styles.avatar} />}
        <span style={styles.playerName}>{player.name}</span>
      </div>

      {/* Switch profile button */}
      <button
        style={styles.switchBtn}
        onClick={() => signOut()}
        title="Switch to a different profile"
      >
        ↺ Switch Profile
      </button>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>v1.0.0</div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220,
    minWidth: 220,
    height: '100vh',
    background: 'linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  logoIcon: {
    width: 40,
    height: 40,
    background: 'linear-gradient(135deg, #e94560, #ff6b81)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 20,
    color: '#fff',
    fontFamily: "'JetBrains Mono', monospace",
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.1,
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 3,
    color: '#e94560',
    fontFamily: "'JetBrains Mono', monospace",
  },
  miniProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 20px',
    marginBottom: 4,
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'background 0.2s',
  },
  switchBtn: {
    display: 'block',
    width: 'calc(100% - 40px)',
    margin: '0 20px 8px',
    padding: '4px 0',
    background: 'none',
    border: 'none',
    color: '#4a5568',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'left',
    transition: 'color 0.2s',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '2px solid rgba(233,69,96,0.4)',
  },
  playerName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e8e8e8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 10px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 8,
    color: '#8892b0',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    background: 'rgba(233, 69, 96, 0.12)',
    color: '#e94560',
  },
  navIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  footerText: {
    fontSize: 11,
    color: '#4a5568',
    fontFamily: "'JetBrains Mono', monospace",
  },
};
