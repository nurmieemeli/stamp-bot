const SEPARATOR = ":";

export function buildCustomId(action: string, ...args: string[]): string {
  return [action, ...args].join(SEPARATOR);
}

export function parseCustomId(customId: string): { action: string; args: string[] } {
  const [action, ...args] = customId.split(SEPARATOR);
  return { action: action ?? "", args };
}
