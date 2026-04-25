// lib/rateLimit.js
// In-memory sliding-window rate limiter with bounded growth.

const buckets = new Map();
const MAX_BUCKETS = 5000;       // hard ceiling on tracked keys
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

let lastPrune = Date.now();

function maybePrune(now) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  // Remove buckets whose newest hit is older than 1 hour.
  const cutoff = now - 60 * 60 * 1000;
  for (const [key, arr] of buckets) {
    if (!arr.length || arr[arr.length - 1] < cutoff) {
      buckets.delete(key);
    }
  }
  // If still over ceiling, evict oldest entries (Map preserves insertion order).
  if (buckets.size > MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS;
    let i = 0;
    for (const key of buckets.keys()) {
      if (i++ >= overflow) break;
      buckets.delete(key);
    }
  }
}

/**
 * @param {string} key       unique identifier (IP, IP+route, etc.)
 * @param {number} limit     max hits in the window
 * @param {number} windowMs  rolling window size in ms
 * @returns {boolean}        true if ALLOWED, false if over limit
 */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  maybePrune(now);

  const arr = buckets.get(key) || [];
  const fresh = arr.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}