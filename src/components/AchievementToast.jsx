import { useAchievements } from '../context/AchievementContext';

export default function AchievementToast() {
  const { notification, dismissNotification } = useAchievements();

  if (!notification) return null;

  return (
    <div style={styles.overlay} onClick={dismissNotification}>
      <div style={styles.toast}>
        <div style={styles.icon}>{notification.icon || '🏆'}</div>
        <div style={styles.content}>
          <div style={styles.header}>ACHIEVEMENT UNLOCKED</div>
          <div style={styles.title}>{notification.name}</div>
          <div style={styles.desc}>{notification.description}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    animation: 'slideDown 0.4s ease forwards',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #16213e, #1a1a2e)',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: 14,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.15)',
    cursor: 'pointer',
    minWidth: 300,
    maxWidth: 420,
  },
  icon: {
    fontSize: 36,
    width: 50,
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#ffd700',
    marginBottom: 4,
    fontFamily: "'JetBrains Mono', monospace",
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    color: '#8892b0',
  },
};
