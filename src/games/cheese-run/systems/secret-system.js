import { worldSecrets, bonusRooms } from '../data/secret-defs.js';
import { parseLevel } from '../data/levels.js';

/**
 * Creates the secret state for a given level.
 * Returns null if the level has no secret, or the player already found it.
 */
export function createSecretState(levelIdx, secretLevelsUnlocked) {
  const def = worldSecrets.find(s => s.levelIdx === levelIdx);
  if (!def) return null;
  // Already discovered — don't spawn the secret again
  if (secretLevelsUnlocked && secretLevelsUnlocked.includes(def.reward.unlocksLevelIdx)) return null;

  return {
    def,
    // Trigger object state
    triggerActive: true,
    triggerX: def.trigger.x,
    triggerY: def.trigger.y,
    pushProgress: 0,          // how far it's been pushed (for push type)
    keyCollected: false,       // for key type

    // Door state
    doorOpen: false,
    doorX: def.door.x,
    doorY: def.door.y,

    // Whether the player has entered the door
    entered: false,
  };
}

/**
 * Updates secret objects — push logic, key pickup, door collision.
 * Returns an event string or null:
 *   'enter_tunnel' — player walked into the open door
 */
export function updateSecret(secret, player, dt) {
  if (!secret || secret.entered) return null;
  const { def } = secret;

  // ─── Push trigger ───
  if (def.trigger.type === 'push' && secret.triggerActive) {
    const tx = secret.triggerX;
    const ty = secret.triggerY;
    const tw = def.trigger.width;
    const th = def.trigger.height;
    const pushDir = def.trigger.pushDir;

    // Check if player is pressing against the pushable
    const playerRight = player.x + player.width / 2;
    const playerLeft = player.x - player.width / 2;
    const playerTop = player.y - player.height / 2;
    const playerBot = player.y + player.height / 2;
    const objLeft = tx - tw / 2;
    const objRight = tx + tw / 2;
    const objTop = ty - th / 2;
    const objBot = ty + th / 2;

    // Vertical overlap
    const vOverlap = playerBot > objTop + 4 && playerTop < objBot - 4;

    if (vOverlap) {
      let pushing = false;
      if (pushDir > 0 && player.facing > 0 && playerRight > objLeft - 4 && playerRight < objRight && player.vx > 0) {
        pushing = true;
      } else if (pushDir < 0 && player.facing < 0 && playerLeft < objRight + 4 && playerLeft > objLeft && player.vx < 0) {
        pushing = true;
      }

      if (pushing) {
        const pushSpeed = 40; // pixels per second
        secret.pushProgress += pushSpeed * dt;
        secret.triggerX = def.trigger.x + pushDir * secret.pushProgress;

        if (secret.pushProgress >= def.trigger.pushDist) {
          secret.triggerActive = false;
          secret.doorOpen = true;
        }
      }
    }
  }

  // ─── Key trigger ───
  if (def.trigger.type === 'key' && secret.triggerActive && !secret.keyCollected) {
    const dx = player.x - def.trigger.x;
    const dy = player.y - def.trigger.y;
    if (dx * dx + dy * dy < 20 * 20) {
      secret.keyCollected = true;
      secret.triggerActive = false;
      secret.doorOpen = true;
    }
  }

  // ─── Door collision ───
  if (secret.doorOpen) {
    const dx = player.x - secret.doorX;
    const dy = player.y - secret.doorY;
    if (dx * dx + dy * dy < 24 * 24) {
      secret.entered = true;
      return 'enter_tunnel';
    }
  }

  return null;
}

/**
 * Loads and returns a parsed bonus room for the given secret.
 */
export function loadBonusRoom(secret) {
  const roomDef = bonusRooms[secret.def.bonusRoomId];
  if (!roomDef) return null;
  return {
    ...parseLevel(roomDef.rows),
    name: roomDef.name,
    world: roomDef.world,
  };
}
