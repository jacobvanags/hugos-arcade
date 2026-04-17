import { useEffect, useRef, useCallback } from 'react';
import { Game, manifest, achievements } from './index.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAchievements } from '../../context/AchievementContext.jsx';
import { resumeAudio, playSFX, getMasterVolume, getSFXVolume, getMusicVolume } from '../../shared/audio-engine.js';
import TouchControls from '../../components/TouchControls.jsx';

// Touch control layout for Cheese Run.
// Left thumb: D-pad (left/right). Right thumb: Jump + Shoot + Weapon switch.
// Positions use `bottom` and `left`/`right` so they anchor to screen corners
// regardless of orientation or aspect ratio.
const CHEESE_RUN_TOUCH_LAYOUT = [
  { code: 'ArrowLeft', label: '◀', ariaLabel: 'Move left',
    position: { bottom: 24, left: 24 }, size: 72 },
  { code: 'ArrowRight', label: '▶', ariaLabel: 'Move right',
    position: { bottom: 24, left: 112 }, size: 72 },
  { code: 'KeyE', label: 'Weapon', ariaLabel: 'Switch weapon',
    position: { bottom: 112, right: 112 }, size: 64, fontSize: 13, shape: 'square' },
  { code: 'KeyZ', label: 'Shoot', ariaLabel: 'Shoot',
    position: { bottom: 24, right: 112 }, size: 80, fontSize: 16 },
  { code: 'Space', label: 'Jump', ariaLabel: 'Jump',
    position: { bottom: 24, right: 24 }, size: 80, fontSize: 16 },
];

export default function GameCanvas({ onExit }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);
  // Ref pointing at the game's input manager, so TouchControls can inject
  // virtual key presses once the game is initialized.
  const inputRef = useRef(null);

  const { player, settings, submitScore, getHighScores, incrementPlayTime, incrementGamesPlayed, saveGameProgress, loadGameProgress } = usePlayer();
  const { unlock, isUnlocked, getAllAchievements, registerAchievements, unregisterAchievements } = useAchievements();

  const exitToMenu = useCallback(() => {
    onExit();
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.tabIndex = 1;
    canvas.focus();

    const handleInteraction = () => resumeAudio();
    canvas.addEventListener('click', handleInteraction, { once: true });
    canvas.addEventListener('keydown', handleInteraction, { once: true });

    // Re-focus canvas on click so input never gets stuck
    const refocusCanvas = () => { if (canvas) canvas.focus(); };
    canvas.addEventListener('click', refocusCanvas);
    canvas.addEventListener('mousedown', refocusCanvas);

    // Also refocus canvas when clicking anywhere in the parent container
    const parentDiv = canvas.parentElement;
    if (parentDiv) {
      parentDiv.addEventListener('click', refocusCanvas);
      parentDiv.addEventListener('mousedown', refocusCanvas);
    }

    // Refocus when any key is pressed anywhere in the window
    const windowKeyRefocus = (e) => {
      if (canvas && document.activeElement !== canvas) {
        canvas.focus();
      }
    };
    window.addEventListener('keydown', windowKeyRefocus);

    registerAchievements(manifest.id, achievements);

    const arcadeAPI = {
      player: { name: player.name, avatar: player.avatar, settings },
      achievements: {
        unlock: (id) => unlock(id),
        isUnlocked: (id) => isUnlocked(id),
        getAll: () => getAllAchievements(),
      },
      audio: {
        playSFX: (freq, dur, type) => playSFX(freq, dur, type),
        playNote: (note, dur) => {},
        getMasterVolume,
        getSFXVolume,
        getMusicVolume,
      },
      scores: {
        submit: (score, meta) => submitScore(manifest.id, score, meta),
        getHighScores: (gameId, limit) => getHighScores(gameId || manifest.id, limit),
      },
      settings: {
        difficulty: settings.difficulty,
        particles: settings.particles,
        screenShake: settings.screenShake,
      },
      progress: {
        save: (key, data) => saveGameProgress(manifest.id, key, data),
        load: (key) => loadGameProgress(manifest.id, key),
      },
      exitToMenu,
    };

    const game = new Game();
    gameRef.current = game;
    game.init(canvas, arcadeAPI);
    // Expose input manager so TouchControls can dispatch virtual key presses.
    inputRef.current = game.input;
    incrementGamesPlayed();

    let playTimeAccum = 0;

    function loop(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      try {
        game.update(dt);
        game.render(game.ctx || canvas.getContext('2d'));
      } catch (err) {
        console.error('Cheese Run loop error:', err);
        // CRITICAL: ensure input state is cleared even on error,
        // otherwise justPressed flags stay set forever and cause
        // the same error to repeat every frame (appears as freeze)
        try { game.input.update(); } catch (_) {}
      }

      // Periodically ensure canvas has focus so input works
      if (canvas && document.activeElement !== canvas &&
          document.activeElement === document.body) {
        canvas.focus();
      }

      playTimeAccum += dt;
      if (playTimeAccum >= 10) {
        incrementPlayTime(Math.floor(playTimeAccum));
        playTimeAccum -= Math.floor(playTimeAccum);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    }
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
      if (playTimeAccum > 0) {
        incrementPlayTime(Math.floor(playTimeAccum));
      }
      canvas.removeEventListener('click', refocusCanvas);
      canvas.removeEventListener('mousedown', refocusCanvas);
      if (parentDiv) {
        parentDiv.removeEventListener('click', refocusCanvas);
        parentDiv.removeEventListener('mousedown', refocusCanvas);
      }
      window.removeEventListener('keydown', windowKeyRefocus);
      unregisterAchievements(manifest.id);
      lastTimeRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100vh',
      backgroundColor: '#000',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          outline: 'none',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
      <TouchControls inputRef={inputRef} layout={CHEESE_RUN_TOUCH_LAYOUT} />
    </div>
  );
}
