import { describe, it, expect } from 'vitest';
import { createAttemptThrottle } from './throttle.js';

describe('createAttemptThrottle', () => {
  it('does not throttle a key with no recorded attempts', () => {
    const { tooManyFailedAttempts } = createAttemptThrottle();
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(false);
  });

  it('does not throttle below the limit', () => {
    const { tooManyFailedAttempts, recordFailedAttempt } = createAttemptThrottle({ limit: 3 });
    recordFailedAttempt('1.2.3.4');
    recordFailedAttempt('1.2.3.4');
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(false);
  });

  it('throttles once the limit is reached', () => {
    const { tooManyFailedAttempts, recordFailedAttempt } = createAttemptThrottle({ limit: 3 });
    recordFailedAttempt('1.2.3.4');
    recordFailedAttempt('1.2.3.4');
    recordFailedAttempt('1.2.3.4');
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(true);
  });

  it('tracks each key independently', () => {
    const { tooManyFailedAttempts, recordFailedAttempt } = createAttemptThrottle({ limit: 1 });
    recordFailedAttempt('attacker-ip');
    expect(tooManyFailedAttempts('attacker-ip')).toBe(true);
    expect(tooManyFailedAttempts('innocent-ip')).toBe(false);
  });

  it('resets after the time window elapses', () => {
    let now = 0;
    const { tooManyFailedAttempts, recordFailedAttempt } = createAttemptThrottle({
      limit: 1, windowMs: 1000, now: () => now,
    });
    recordFailedAttempt('1.2.3.4');
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(true);

    now = 1001; // just past the window
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(false);
  });

  it('a fresh attempt after the window restarts the count at 1, not throttled', () => {
    let now = 0;
    const { tooManyFailedAttempts, recordFailedAttempt } = createAttemptThrottle({
      limit: 2, windowMs: 1000, now: () => now,
    });
    recordFailedAttempt('1.2.3.4');
    recordFailedAttempt('1.2.3.4');
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(true);

    now = 2000;
    recordFailedAttempt('1.2.3.4'); // first attempt in the new window
    expect(tooManyFailedAttempts('1.2.3.4')).toBe(false);
  });
});
