import { config } from '../config.js';
import { clamp, lerp } from '../../../shared/math-utils.js';

/**
 * Creates a camera that follows the player with smooth scrolling.
 */
export function createCamera() {
  return {
    x: 0,
    y: 0,
    shakeX: 0,
    shakeY: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
  };
}

/**
 * Updates camera position to follow target, clamped to level bounds.
 */
export function updateCamera(cam, targetX, targetY, levelWidth, levelHeight, dt) {
  const halfW = config.width / 2;
  const halfH = config.height / 2;

  // Smooth follow
  const goalX = targetX - halfW;
  const goalY = targetY - halfH;
  cam.x = lerp(cam.x, goalX, 1 - Math.pow(0.001, dt));
  cam.y = lerp(cam.y, goalY, 1 - Math.pow(0.001, dt));

  // Clamp to level bounds
  cam.x = clamp(cam.x, 0, Math.max(0, levelWidth - config.width));
  cam.y = clamp(cam.y, 0, Math.max(0, levelHeight - config.height));

  // Screen shake
  if (cam.shakeTimer > 0) {
    cam.shakeTimer -= dt;
    const intensity = cam.shakeIntensity * (cam.shakeTimer / 0.3);
    cam.shakeX = (Math.random() - 0.5) * intensity * 2;
    cam.shakeY = (Math.random() - 0.5) * intensity * 2;
  } else {
    cam.shakeX = 0;
    cam.shakeY = 0;
  }
}

/**
 * Triggers screen shake.
 */
export function shakeCamera(cam, intensity) {
  cam.shakeTimer = 0.3;
  cam.shakeIntensity = intensity;
}

/**
 * Returns the camera offset for rendering (including shake).
 */
export function getCameraOffset(cam) {
  return {
    x: -Math.round(cam.x + cam.shakeX),
    y: -Math.round(cam.y + cam.shakeY),
  };
}
