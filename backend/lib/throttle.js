// Small in-memory failed-attempt throttle, factored out as a factory (not
// module-level singleton state) so tests can create an isolated instance
// per test instead of fighting shared global state between runs.
export function createAttemptThrottle({ windowMs = 15 * 60 * 1000, limit = 10, now = () => Date.now() } = {}) {
  const attempts = new Map(); // key -> { count, windowStart }

  const tooManyFailedAttempts = (key) => {
    const entry = attempts.get(key);
    if (!entry) return false;
    if (now() - entry.windowStart > windowMs) {
      attempts.delete(key);
      return false;
    }
    return entry.count >= limit;
  };

  const recordFailedAttempt = (key) => {
    const entry = attempts.get(key);
    if (!entry || now() - entry.windowStart > windowMs) {
      attempts.set(key, { count: 1, windowStart: now() });
    } else {
      entry.count += 1;
    }
  };

  return { tooManyFailedAttempts, recordFailedAttempt };
}
