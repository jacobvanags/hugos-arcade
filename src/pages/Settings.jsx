import { usePlayer } from '../context/PlayerContext';
import { setMasterVolume, setSFXVolume, setMusicVolume } from '../shared/audio-engine';
import { useState } from 'react';

export default function Settings() {
  const { settings, updateSettings, resetProfile } = usePlayer();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleVolumeChange = (key, value) => {
    const vol = parseFloat(value);
    updateSettings({ [key]: vol });
    if (key === 'masterVolume') setMasterVolume(vol);
    if (key === 'sfxVolume') setSFXVolume(vol);
    if (key === 'musicVolume') setMusicVolume(vol);
  };

  const handleDifficulty = (diff) => {
    updateSettings({ difficulty: diff });
  };

  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleReset = () => {
    resetProfile();
    setShowResetConfirm(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Settings</h1>

      {/* Audio */}
      <div className="card" style={styles.section}>
        <h3 style={styles.sectionTitle}>Audio</h3>

        <div style={styles.setting}>
          <label style={styles.label}>Master Volume</label>
          <div style={styles.sliderRow}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleVolumeChange('masterVolume', e.target.value)}
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{Math.round(settings.masterVolume * 100)}%</span>
          </div>
        </div>

        <div style={styles.setting}>
          <label style={styles.label}>Sound Effects</label>
          <div style={styles.sliderRow}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleVolumeChange('sfxVolume', e.target.value)}
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
        </div>

        <div style={styles.setting}>
          <label style={styles.label}>Music</label>
          <div style={styles.sliderRow}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleVolumeChange('musicVolume', e.target.value)}
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{Math.round(settings.musicVolume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Difficulty */}
      <div className="card" style={styles.section}>
        <h3 style={styles.sectionTitle}>Difficulty</h3>
        <p style={styles.sectionDesc}>Games can read this preference but aren't required to use it.</p>
        <div style={styles.difficultyRow}>
          {['easy', 'normal', 'hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficulty(diff)}
              style={{
                ...styles.diffBtn,
                ...(settings.difficulty === diff ? styles.diffBtnActive : {}),
              }}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className="card" style={styles.section}>
        <h3 style={styles.sectionTitle}>Visual</h3>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.label}>Particle Effects</div>
            <div style={styles.toggleDesc}>Enable particle effects in games</div>
          </div>
          <button
            className={`toggle ${settings.particles ? 'active' : ''}`}
            onClick={() => handleToggle('particles')}
          />
        </div>

        <div style={styles.toggleRow}>
          <div>
            <div style={styles.label}>Screen Shake</div>
            <div style={styles.toggleDesc}>Enable screen shake effects</div>
          </div>
          <button
            className={`toggle ${settings.screenShake ? 'active' : ''}`}
            onClick={() => handleToggle('screenShake')}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={styles.section}>
        <h3 style={styles.sectionTitle}>Controls</h3>
        <p style={styles.sectionDesc}>Default keyboard controls used across games.</p>
        <div style={styles.controlsList}>
          {[
            ['Arrow Keys / WASD', 'Movement'],
            ['Space', 'Primary Action'],
            ['Escape', 'Pause / Back to Menu'],
            ['Enter', 'Confirm / Select'],
            ['1-9', 'Quick Select (game-specific)'],
          ].map(([key, action]) => (
            <div key={key} style={styles.controlRow}>
              <span style={styles.controlKey}>{key}</span>
              <span style={styles.controlAction}>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ ...styles.section, borderColor: 'rgba(255,68,68,0.2)' }}>
        <h3 style={{ ...styles.sectionTitle, color: '#ff4444' }}>Danger Zone</h3>
        {!showResetConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
            Reset Profile & Data
          </button>
        ) : (
          <div style={styles.confirmRow}>
            <p style={{ color: '#ff4444', fontSize: 13, marginBottom: 12 }}>
              This will delete all your profile data, scores, and achievements. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={handleReset}>Yes, Reset Everything</button>
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '32px 40px',
    height: '100vh',
    overflowY: 'auto',
    maxWidth: 600,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#8892b0',
    marginBottom: 16,
  },
  setting: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#e8e8e8',
    marginBottom: 8,
    display: 'block',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#00d4ff',
    fontFamily: "'JetBrains Mono', monospace",
    minWidth: 40,
    textAlign: 'right',
  },
  difficultyRow: {
    display: 'flex',
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0a0a0f',
    color: '#8892b0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  diffBtnActive: {
    border: '1px solid rgba(233,69,96,0.4)',
    background: 'rgba(233,69,96,0.1)',
    color: '#e94560',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#4a5568',
    marginTop: 2,
  },
  controlsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  controlKey: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: '#00d4ff',
    fontWeight: 500,
  },
  controlAction: {
    fontSize: 13,
    color: '#8892b0',
  },
  confirmRow: {},
};
