export function parseCommand(input: string): { command: string; args: string[] } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: "", args: [] };
  }

  const tokens = trimmed.split(/\s+/);
  const command = tokens[0];
  const args = tokens.slice(1);

  return { command, args };
}
