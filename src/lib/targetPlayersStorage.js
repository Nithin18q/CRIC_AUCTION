// Target Players Storage and Session Management Helper
//
// All data is keyed by (roomId + userId) so each manager's strategy is
// completely isolated — no two users share the same localStorage entry,
// even when testing on the same device or browser profile.
//
// Legacy (roomId-only) keys are intentionally NOT used as a fallback when
// userId is available.  Such a key could have been written by a different
// user (e.g. the room host) and reading it would:
//   • For isTargetsConfirmed: falsely mark the joining user as confirmed,
//     bypassing their Target Players page entirely.
//   • For getTargetPlayers: silently pre-load another manager's player picks
//     into the current user's target board.
// Ownership of a roomId-only key cannot be verified, so it is never trusted
// once a userId is known.

const STORAGE_PREFIX = 'cric_targets_';
const CONFIRMED_PREFIX = 'cric_targets_confirmed_';

/**
 * Build a unique storage key scoped to both room and user.
 * When userId is absent (not yet authenticated) the key degrades to
 * roomId-only, which is safe because no cross-user comparison is possible
 * without an identity.
 *
 * @param {string}                  roomId
 * @param {string|null|undefined}   userId
 * @returns {string}
 */
const buildKey = (roomId, userId) =>
  userId ? `${roomId}_${userId}` : roomId;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve this user's saved target players for a room.
 *
 * When userId is present we ONLY read the user-scoped key.
 * We do NOT fall back to the roomId-only key: that entry may contain
 * another manager's selections and cannot be safely attributed to this user.
 *
 * @param {string}                  roomId
 * @param {string|null|undefined}   userId
 * @returns {Array}
 */
export const getTargetPlayers = (roomId, userId) => {
  if (!roomId || typeof window === 'undefined') return [];
  try {
    const key = buildKey(roomId, userId);
    // localStorage is the primary store; sessionStorage is a secondary cache.
    const raw =
      localStorage.getItem(`${STORAGE_PREFIX}${key}`) ||
      sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[TargetPlayers] Failed to read from storage:', err);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist this user's target players for a room.
 *
 * @param {string}                  roomId
 * @param {Array}                   targets   Max 5 entries.
 * @param {string|null|undefined}   userId
 */
export const saveTargetPlayers = (roomId, targets, userId) => {
  if (!roomId || typeof window === 'undefined') return;
  try {
    const sanitized = (targets || []).slice(0, 5).map(t => ({
      id: t.id,
      name: t.name,
      role: t.role,
      type: t.type,
      country: t.country,
      basePrice: Number(t.basePrice || 0),
      set: t.set,
      image: t.image,
      stats: t.stats || {},
      maxBid: Number(t.maxBid || t.basePrice || 0),
    }));

    const json = JSON.stringify(sanitized);
    const key = buildKey(roomId, userId);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, json);
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, json);

    // Notify listeners in the current window (e.g. AuctionRoom).
    window.dispatchEvent(new CustomEvent('cric_targets_updated', {
      detail: { roomId, userId, targets: sanitized },
    }));
  } catch (err) {
    console.error('[TargetPlayers] Failed to write to storage:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether THIS specific user has confirmed their targets for this room.
 *
 * When userId is present we ONLY check the user-scoped key.
 * We intentionally do NOT fall back to the roomId-only confirmed key because:
 *   — It may have been set by a different user (e.g. the host).
 *   — Treating another user's confirmation as the current user's own would
 *     silently skip the Target Players page for the joining manager.
 *
 * @param {string}                  roomId
 * @param {string|null|undefined}   userId
 * @returns {boolean}
 */
export const isTargetsConfirmed = (roomId, userId) => {
  if (!roomId || typeof window === 'undefined') return false;
  const key = buildKey(roomId, userId);
  return (
    sessionStorage.getItem(`${CONFIRMED_PREFIX}${key}`) === 'true' ||
    localStorage.getItem(`${CONFIRMED_PREFIX}${key}`) === 'true'
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark this user's targets as confirmed for this auction session.
 *
 * @param {string}                  roomId
 * @param {boolean}                 confirmed
 * @param {string|null|undefined}   userId
 */
export const setTargetsConfirmed = (roomId, confirmed = true, userId) => {
  if (!roomId || typeof window === 'undefined') return;
  const val = confirmed ? 'true' : 'false';
  const key = buildKey(roomId, userId);
  sessionStorage.setItem(`${CONFIRMED_PREFIX}${key}`, val);
  localStorage.setItem(`${CONFIRMED_PREFIX}${key}`, val);
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clear this user's targets and confirmed status for a room.
 * Also removes any legacy roomId-only keys so stale entries cannot
 * accumulate and interfere with future sessions.
 *
 * @param {string}                  roomId
 * @param {string|null|undefined}   userId
 */
export const clearTargetPlayers = (roomId, userId) => {
  if (!roomId || typeof window === 'undefined') return;
  const key = buildKey(roomId, userId);

  // Remove the user-scoped entries.
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  localStorage.removeItem(`${CONFIRMED_PREFIX}${key}`);
  sessionStorage.removeItem(`${CONFIRMED_PREFIX}${key}`);

  // Also sweep legacy roomId-only entries so they cannot bleed into any
  // future session that has no userId yet.
  if (userId) {
    localStorage.removeItem(`${STORAGE_PREFIX}${roomId}`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}${roomId}`);
    localStorage.removeItem(`${CONFIRMED_PREFIX}${roomId}`);
    sessionStorage.removeItem(`${CONFIRMED_PREFIX}${roomId}`);
  }

  window.dispatchEvent(new CustomEvent('cric_targets_updated', {
    detail: { roomId, userId, targets: [] },
  }));
};

