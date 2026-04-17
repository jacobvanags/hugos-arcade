import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PlayerContext = createContext(null);

const DEFAULT_PLAYER = {
  name: 'Player',
  avatar: 0,
  totalPlayTime: 0,
  gamesPlayed: 0,
  createdAt: Date.now(),
};

const DEFAULT_SETTINGS = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  difficulty: 'normal',
  particles: true,
  screenShake: true,
};

// --- Multi-key localStorage helpers ---

const META_KEY = 'hugos-arcade-meta';
const PROFILE_PREFIX = 'hugos-arcade-profile-';
const OLD_KEY = 'hugos-arcade';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function loadProfile(profileId) {
  try {
    const raw = localStorage.getItem(PROFILE_PREFIX + profileId);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveProfile(profileId, data) {
  localStorage.setItem(PROFILE_PREFIX + profileId, JSON.stringify(data));
}

function deleteProfileStorage(profileId) {
  localStorage.removeItem(PROFILE_PREFIX + profileId);
}

/**
 * Migrate from v1 single-key format to v2 multi-key format.
 */
function migrateV1() {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const oldData = JSON.parse(raw);
    const profileId = generateId();
    const profileData = {
      player: { ...DEFAULT_PLAYER, ...oldData.player },
      settings: { ...DEFAULT_SETTINGS, ...oldData.settings },
      achievements: oldData.achievements || {},
      scores: oldData.scores || {},
      gameProgress: {},
    };
    saveProfile(profileId, profileData);
    const meta = {
      activeProfileId: profileId,
      profileOrder: [profileId],
      version: 2,
    };
    saveMeta(meta);
    localStorage.removeItem(OLD_KEY);
    return meta;
  } catch {
    return null;
  }
}

/**
 * Initialize storage — handle migration and return meta.
 */
function initStorage() {
  let meta = loadMeta();
  if (meta) return meta;

  // Try v1 migration
  meta = migrateV1();
  if (meta) return meta;

  // Fresh install — no profiles yet
  meta = { activeProfileId: null, profileOrder: [], version: 2 };
  saveMeta(meta);
  return meta;
}

export function PlayerProvider({ children }) {
  const [meta, setMeta] = useState(() => initStorage());

  const [player, setPlayer] = useState(() => {
    if (!meta.activeProfileId) return { ...DEFAULT_PLAYER };
    const profile = loadProfile(meta.activeProfileId);
    return profile ? { ...DEFAULT_PLAYER, ...profile.player } : { ...DEFAULT_PLAYER };
  });

  const [settings, setSettings] = useState(() => {
    if (!meta.activeProfileId) return { ...DEFAULT_SETTINGS };
    const profile = loadProfile(meta.activeProfileId);
    return profile ? { ...DEFAULT_SETTINGS, ...profile.settings } : { ...DEFAULT_SETTINGS };
  });

  const [achievements, setAchievements] = useState(() => {
    if (!meta.activeProfileId) return {};
    const profile = loadProfile(meta.activeProfileId);
    return profile ? (profile.achievements || {}) : {};
  });

  const [scores, setScores] = useState(() => {
    if (!meta.activeProfileId) return {};
    const profile = loadProfile(meta.activeProfileId);
    return profile ? (profile.scores || {}) : {};
  });

  const [gameProgress, setGameProgress] = useState(() => {
    if (!meta.activeProfileId) return {};
    const profile = loadProfile(meta.activeProfileId);
    return profile ? (profile.gameProgress || {}) : {};
  });

  // Persist active profile on every state change
  useEffect(() => {
    if (!meta.activeProfileId) return;
    saveProfile(meta.activeProfileId, { player, settings, achievements, scores, gameProgress });
  }, [player, settings, achievements, scores, gameProgress, meta.activeProfileId]);

  // Persist meta changes
  useEffect(() => {
    saveMeta(meta);
  }, [meta]);

  // --- Profile management ---

  const hasActiveProfile = useCallback(() => {
    return !!meta.activeProfileId;
  }, [meta.activeProfileId]);

  const listProfiles = useCallback(() => {
    return meta.profileOrder.map((id) => {
      const profile = loadProfile(id);
      return {
        id,
        name: profile?.player?.name || 'Unknown',
        avatar: profile?.player?.avatar || 0,
        totalPlayTime: profile?.player?.totalPlayTime || 0,
        gamesPlayed: profile?.player?.gamesPlayed || 0,
        createdAt: profile?.player?.createdAt || 0,
      };
    });
  }, [meta.profileOrder]);

  const createProfile = useCallback((name, avatar = 0) => {
    const id = generateId();
    const newPlayer = { ...DEFAULT_PLAYER, name, avatar, createdAt: Date.now() };
    const profileData = {
      player: newPlayer,
      settings: { ...DEFAULT_SETTINGS },
      achievements: {},
      scores: {},
      gameProgress: {},
    };
    saveProfile(id, profileData);

    setPlayer(newPlayer);
    setSettings({ ...DEFAULT_SETTINGS });
    setAchievements({});
    setScores({});
    setGameProgress({});
    setMeta((prev) => ({
      ...prev,
      activeProfileId: id,
      profileOrder: [...prev.profileOrder, id],
    }));
  }, []);

  const switchProfile = useCallback((id) => {
    const profile = loadProfile(id);
    if (!profile) return;
    setPlayer({ ...DEFAULT_PLAYER, ...profile.player });
    setSettings({ ...DEFAULT_SETTINGS, ...profile.settings });
    setAchievements(profile.achievements || {});
    setScores(profile.scores || {});
    setGameProgress(profile.gameProgress || {});
    setMeta((prev) => ({ ...prev, activeProfileId: id }));
  }, []);

  const deleteProfile = useCallback((id) => {
    deleteProfileStorage(id);
    setMeta((prev) => {
      const newOrder = prev.profileOrder.filter((pid) => pid !== id);
      const wasActive = prev.activeProfileId === id;

      if (wasActive && newOrder.length > 0) {
        const nextId = newOrder[0];
        const nextProfile = loadProfile(nextId);
        if (nextProfile) {
          setPlayer({ ...DEFAULT_PLAYER, ...nextProfile.player });
          setSettings({ ...DEFAULT_SETTINGS, ...nextProfile.settings });
          setAchievements(nextProfile.achievements || {});
          setScores(nextProfile.scores || {});
          setGameProgress(nextProfile.gameProgress || {});
        }
        return { ...prev, activeProfileId: nextId, profileOrder: newOrder };
      }

      if (wasActive) {
        setPlayer({ ...DEFAULT_PLAYER });
        setSettings({ ...DEFAULT_SETTINGS });
        setAchievements({});
        setScores({});
        setGameProgress({});
        return { ...prev, activeProfileId: null, profileOrder: newOrder };
      }

      return { ...prev, profileOrder: newOrder };
    });
  }, []);

  const signOut = useCallback(() => {
    setMeta((prev) => ({ ...prev, activeProfileId: null }));
  }, []);

  // --- Existing functions (scoped to active profile) ---

  const updatePlayer = useCallback((updates) => {
    setPlayer((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const unlockAchievement = useCallback((achievementId) => {
    setAchievements((prev) => {
      if (prev[achievementId]) return prev;
      console.log(`[PLAYER] Achievement unlocked: ${achievementId}`);
      return { ...prev, [achievementId]: { unlockedAt: Date.now() } };
    });
  }, []);

  const isAchievementUnlocked = useCallback(
    (achievementId) => !!achievements[achievementId],
    [achievements]
  );

  const submitScore = useCallback((gameId, score, metadata = {}) => {
    setScores((prev) => {
      const gameScores = prev[gameId] || [];
      const entry = { score, date: Date.now(), ...metadata };
      const updated = [...gameScores, entry].sort((a, b) => b.score - a.score).slice(0, 20);
      return { ...prev, [gameId]: updated };
    });
  }, []);

  const getHighScores = useCallback(
    (gameId, limit = 10) => (scores[gameId] || []).slice(0, limit),
    [scores]
  );

  const incrementPlayTime = useCallback((seconds) => {
    setPlayer((prev) => ({ ...prev, totalPlayTime: prev.totalPlayTime + seconds }));
  }, []);

  const incrementGamesPlayed = useCallback(() => {
    setPlayer((prev) => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
  }, []);

  // --- Game progress ---

  const saveGameProgress = useCallback((gameId, key, data) => {
    setGameProgress((prev) => {
      const gameData = prev[gameId] || {};
      const existing = gameData[key] || {};
      return {
        ...prev,
        [gameId]: {
          ...gameData,
          [key]: { ...existing, ...data },
        },
      };
    });
  }, []);

  const loadGameProgress = useCallback(
    (gameId, key) => {
      if (!gameId) return {};
      const gameData = gameProgress[gameId] || {};
      if (key) return gameData[key] || {};
      return gameData;
    },
    [gameProgress]
  );

  // --- Reset (for settings page danger zone) ---

  const resetProfile = useCallback(() => {
    if (!meta.activeProfileId) return;
    setPlayer({ ...DEFAULT_PLAYER, createdAt: Date.now() });
    setSettings({ ...DEFAULT_SETTINGS });
    setAchievements({});
    setScores({});
    setGameProgress({});
  }, [meta.activeProfileId]);

  const value = {
    // Profile management
    hasActiveProfile,
    listProfiles,
    createProfile,
    switchProfile,
    deleteProfile,
    signOut,
    activeProfileId: meta.activeProfileId,

    // Existing API (unchanged)
    player,
    settings,
    achievements,
    scores,
    updatePlayer,
    updateSettings,
    unlockAchievement,
    isAchievementUnlocked,
    submitScore,
    getHighScores,
    incrementPlayTime,
    incrementGamesPlayed,
    resetProfile,

    // Game progress
    gameProgress,
    saveGameProgress,
    loadGameProgress,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
