import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { AchievementProvider } from './context/AchievementContext';
import Sidebar from './components/Sidebar';
import AchievementToast from './components/AchievementToast';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import ProfileSelect from './pages/ProfileSelect';

// Lazy load game canvases
const GameTemplate = lazy(() => import('./games/game-template/GameCanvas'));
const TowerDefense = lazy(() => import('./games/tower-defense/GameCanvas'));
const CheeseRun = lazy(() => import('./games/cheese-run/GameCanvas'));

/** Map of game IDs to their canvas components */
const GAME_COMPONENTS = {
  'game-template': GameTemplate,
  'tower-defense': TowerDefense,
  'cheese-run': CheeseRun,
};

function ArcadeShell() {
  const { hasActiveProfile } = usePlayer();
  const [activeGame, setActiveGame] = useState(null);

  const handlePlayGame = useCallback((game) => {
    if (game.manifest.comingSoon) return;
    setActiveGame(game.manifest.id);
  }, []);

  const handleExitGame = useCallback(() => {
    setActiveGame(null);
  }, []);

  // If no profile is selected, show profile picker
  if (!hasActiveProfile()) {
    return <ProfileSelect />;
  }

  // If a game is active, show only the game canvas
  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame];
    if (!GameComponent) {
      setActiveGame(null);
      return null;
    }
    return (
      <Suspense
        fallback={
          <div style={styles.loading}>
            <div style={styles.loadingText}>Loading game...</div>
          </div>
        }
      >
        <GameComponent onExit={handleExitGame} />
      </Suspense>
    );
  }

  // Show the arcade launcher
  return (
    <div style={styles.shell}>
      <Sidebar />
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Home onPlayGame={handlePlayGame} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <AchievementProvider>
        <BrowserRouter>
          <ArcadeShell />
          <AchievementToast />
        </BrowserRouter>
      </AchievementProvider>
    </PlayerProvider>
  );
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#0a0a0f',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    background: '#000',
  },
  loadingText: {
    color: '#8892b0',
    fontSize: 18,
    fontFamily: "'JetBrains Mono', monospace",
    animation: 'pulse 1.5s ease infinite',
  },
};
