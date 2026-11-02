export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

/**
 * Time left until the event, split into whole units. Invalid dates and dates in
 * the past both return zero, so the UI never shows negative numbers.
 */
export function remainingParts(targetIso: string, now: number = Date.now()): CountdownParts {
  const target = new Date(targetIso).getTime();
  const totalMs = Number.isNaN(target) ? 0 : Math.max(0, target - now);

  return {
    days: Math.floor(totalMs / 86_400_000),
    hours: Math.floor(totalMs / 3_600_000) % 24,
    minutes: Math.floor(totalMs / 60_000) % 60,
    seconds: Math.floor(totalMs / 1_000) % 60,
    totalMs,
  };
}
