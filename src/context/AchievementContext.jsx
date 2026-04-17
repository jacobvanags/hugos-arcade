import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { usePlayer } from './PlayerContext';

const AchievementContext = createContext(null);

/**
 * Global achievement registry. Games register achievements here.
 * Handles unlock notifications and cross-game achievements.
 */
export function AchievementProvider({ children }) {
  const { achievements: unlockedMap, unlockAchievement, isAchievementUnlocked } = usePlayer();
  const [registry, setRegistry] = useState({});
  const [notification, setNotification] = useState(null);
  const notificationTimeout = useRef(null);

  // Register achievements from a game
  const registerAchievements = useCallback((gameId, achievementDefs) => {
    setRegistry((prev) => {
      const updated = { ...prev };
      for (const ach of achievementDefs) {
        updated[ach.id] = { ...ach, gameId };
      }
      return updated;
    });
  }, []);

  // Unregister achievements for a game (cleanup)
  const unregisterAchievements = useCallback((gameId) => {
    setRegistry((prev) => {
      const updated = {};
      for (const [id, ach] of Object.entries(prev)) {
        if (ach.gameId !== gameId) updated[id] = ach;
      }
      return updated;
    });
  }, []);

  // Unlock with notification
  const unlock = useCallback(
    (achievementId) => {
      if (isAchievementUnlocked(achievementId)) return false;
      unlockAchievement(achievementId);
      const def = registry[achievementId];
      if (def) {
        setNotification({ ...def, unlockedAt: Date.now() });
        if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
        notificationTimeout.current = setTimeout(() => setNotification(null), 4000);
      }
      return true;
    },
    [registry, unlockAchievement, isAchievementUnlocked]
  );

  // Get all registered achievements with their unlock status
  const getAllAchievements = useCallback(() => {
    return Object.values(registry).map((ach) => ({
      ...ach,
      unlocked: !!unlockedMap[ach.id],
      unlockedAt: unlockedMap[ach.id]?.unlockedAt || null,
    }));
  }, [registry, unlockedMap]);

  // Get achievements for a specific game
  const getGameAchievements = useCallback(
    (gameId) => {
      return getAllAchievements().filter((a) => a.gameId === gameId);
    },
    [getAllAchievements]
  );

  // Dismiss notification
  const dismissNotification = useCallback(() => {
    setNotification(null);
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    };
  }, []);

  const value = {
    registerAchievements,
    unregisterAchievements,
    unlock,
    isUnlocked: isAchievementUnlocked,
    getAllAchievements,
    getGameAchievements,
    notification,
    dismissNotification,
  };

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
}

export function useAchievements() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider');
  return ctx;
}
