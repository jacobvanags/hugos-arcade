import { useEffect, useRef, useCallback } from 'react';
import { Game, manifest, achievements } from './index.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useAchievements } from '../../context/AchievementContext.jsx';
import { resumeAudio, playSFX, getMasterVolume, getSFXVolume, getMusicVolume } from '../../shared/audio-engine.js';

/**
 * GameCanvas component — renders a game in a canvas element.
 * Handles the game lifecycle (init, update, render, destroy).
 * @param {object} props
 * @param {Function} props.onExit - Called when the game requests to exit to menu
 */
export default function GameCanvas({ onExit }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  const { player, settings, submitScore, getHighScores, incrementPlayTime, incrementGamesPlayed, saveGameProgress, loadGameProgress } = usePlayer();
  const { unlock, isUnlocked, getAllAchievements, registerAchievements, unregisterAchievements } = useAchievements();

  const exitToMenu = useCallback(() => {
    onExit();
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure canvas can receive keyboard events
    canvas.tabIndex = 1;
    canvas.focus();

    // Resume audio on first interaction
    const handleInteraction = () => resumeAudio();
    canvas.addEventListener('click', handleInteraction, { once: true });
    canvas.addEventListener('keydown', handleInteraction, { once: true });

    // Register achievements
    registerAchievements(manifest.id, achievements);

    // Build the arcade API
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

    // Create and init game
    const game = new Game();
    gameRef.current = game;
    game.init(canvas, arcadeAPI);
    incrementGamesPlayed();

    let playTimeAccum = 0;

    // Game loop
    function loop(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // Cap dt at 100ms
      lastTimeRef.current = timestamp;

      game.update(dt);
      game.render(game.ctx || canvas.getContext('2d'));

      // Track play time
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
    </div>
  );
}
