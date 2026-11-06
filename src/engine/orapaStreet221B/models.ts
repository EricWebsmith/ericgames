export const BOARD_SIZE = 10;

export type ColorName = 'red' | 'blue' | 'yellow' | 'white' | 'purple' | 'green';

export const COLOR_HEX: Record<ColorName, string> = {
  red: '#ff5555',
  blue: '#5577ff',
  yellow: '#ccaa00',
  white: '#e0e0e0',
  purple: '#b466ff',
  green: '#4ade80',
};

export interface Token {
  id: number;
  q: number;
  r: number;
  color: ColorName;
}

export interface GameState {
  id: number;
  tokens: Token[];
}

export interface BorderEntry {
  label: string;
  cell: { q: number; r: number };
}

export interface BrainwaveTrace {
  label: string;
  colors: ColorName[];
  exit?: string;
  path: Array<{ q: number; r: number }>;
}

export function cellKey(q: number, r: number): string {
  return `${q}:${r}`;
}

export function cellLabel(q: number, r: number): string {
  return `${String.fromCharCode(65 + q)}${r + 1}`;
}

export function isPlayable(q: number, r: number): boolean {
  if (q < 0 || q >= BOARD_SIZE || r < 0 || r >= BOARD_SIZE) return false;
  const blocked = q >= 5 && q <= 8 && r >= 5 && r <= 8;
  return !blocked;
}

export function borderEntries(): BorderEntry[] {
  const entries: BorderEntry[] = [];

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    entries.push({ label: `T${i + 1}`, cell: { q: i, r: 0 } });
    entries.push({ label: `L${i + 1}`, cell: { q: 0, r: i } });
    entries.push({ label: `B${i + 1}`, cell: { q: i, r: BOARD_SIZE - 1 } });
    entries.push({ label: `R${i + 1}`, cell: { q: BOARD_SIZE - 1, r: i } });
  }

  return entries;
}

export function colorName(colors: Array<string | ColorName> | readonly string[]): string {
  if (!colors.length) return 'none';
  const unique = [...new Set(colors.map(color => String(color)))];
  return unique.map(color => color.charAt(0).toUpperCase() + color.slice(1)).join(', ');
}
