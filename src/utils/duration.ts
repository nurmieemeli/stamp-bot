const UNIT_MS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const satisfies Record<string, number>;

const MAX_TIMEOUT_MS = 28 * 86_400_000; // Discord's hard cap on timeout duration

export class DurationParseError extends Error {}

/** Parses shorthand durations like "10m", "1h", "2d" (single unit, no combinations). */
export function parseDuration(input: string): number {
  const match = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) {
    throw new DurationParseError(`Couldn't parse "${input}" — use a number plus s/m/h/d, e.g. 10m, 2h, 1d.`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof UNIT_MS;
  const ms = amount * UNIT_MS[unit];

  if (ms <= 0) {
    throw new DurationParseError("Duration must be greater than zero.");
  }
  if (ms > MAX_TIMEOUT_MS) {
    throw new DurationParseError("Timeouts can't exceed 28 days (Discord's limit).");
  }

  return ms;
}

export function formatDuration(ms: number): string {
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(ms / 60_000);
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(ms / 1000)}s`;
}
