export const BOARD_SIZE = 14;
export const DEFAULT_TOKEN_COUNT = 6;
export const ROWS = 'ABCDEFGHIJKLMN';

export type ClueColor = 'red' | 'yellow' | 'blue' | 'white';
export type Direction = 0 | 1 | 2 | 3 | 4 | 5;
export interface Cell { q: number; r: number; }
export interface ClueToken extends Cell { id: number; color: ClueColor; }
export interface BrainwaveResult { exit: string | null; colors: ClueColor[]; absorbed: boolean; path: Cell[]; }
export interface GameState { tokens: ClueToken[]; seed: number; }

export const COLORS: ClueColor[] = ['red', 'yellow', 'blue', 'white'];
export const COLOR_HEX: Record<ClueColor, string> = {
  red: '#ef4444', yellow: '#facc15', blue: '#3b82f6', white: '#f8fafc',
};

export function cellKey(q: number, r: number): string { return `${q},${r}`; }
export function cellLabel(q: number, r: number): string { return `${ROWS[r]}${q + 1}`; }
export function isPlayable(q: number, r: number): boolean {
  return q >= 0 && q < BOARD_SIZE && r >= 0 && r < BOARD_SIZE && !(q >= 5 && q <= 8 && r >= 5 && r <= 8);
}

// Axial hex-grid directions, clockwise from east.
export const DIRECTIONS: readonly Cell[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

export function borderEntries(): { label: string; cell: Cell; direction: Direction }[] {
  const entries: { label: string; cell: Cell; direction: Direction }[] = [];
  // Numbered north/south edges and lettered east/west edges, with two diagonal
  // edges included to match the six-direction hexagonal beam system.
  for (let i = 0; i < BOARD_SIZE; i++) {
    entries.push({ label: `${i + 1}`, cell: { q: i, r: 0 }, direction: 5 });
    entries.push({ label: `${ROWS[i]}`, cell: { q: BOARD_SIZE - 1, r: i }, direction: 3 });
    entries.push({ label: `${i + 1}′`, cell: { q: i, r: BOARD_SIZE - 1 }, direction: 2 });
    entries.push({ label: `${ROWS[i]}′`, cell: { q: 0, r: i }, direction: 0 });
  }
  return entries;
}

export function colorName(colors: ClueColor[]): string {
  const set = new Set(colors);
  if (set.size === 0) return 'Colorless';
  if (set.size === 4) return 'Grey';
  if (set.size === 3) {
    if (!set.has('red')) return 'Light Green';
    if (!set.has('yellow')) return 'Light Purple';
    if (!set.has('blue')) return 'Light Orange';
    return 'Black';
  }
  if (set.size === 2) {
    const pair = [...set].sort().join('+');
    return ({ 'blue+red': 'Purple', 'blue+yellow': 'Green', 'red+yellow': 'Orange',
      'red+white': 'Pink', 'blue+white': 'Sky Blue', 'white+yellow': 'Lemon' } as Record<string, string>)[pair] ?? 'Mixed';
  }
  return [...set][0].replace(/^./, c => c.toUpperCase());
}
