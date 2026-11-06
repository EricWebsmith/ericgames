import { BOARD_SIZE, cellKey, COLORS, DIRECTIONS, isPlayable, type BrainwaveResult, type ClueColor, type ClueToken, type Direction, type GameState } from './models';

function randomInt(rng: () => number, max: number): number { return Math.floor(rng() * max); }
function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 0x100000000; };
}

export function createGame(seed = Math.floor(Math.random() * 0xffffffff), count = 6): GameState {
  const rng = seededRandom(seed);
  const tokens: ClueToken[] = [];
  const occupied = new Set<string>();
  for (let id = 0; id < count; id++) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const q = randomInt(rng, BOARD_SIZE), r = randomInt(rng, BOARD_SIZE);
      const key = cellKey(q, r);
      if (!isPlayable(q, r) || occupied.has(key)) continue;
      // Tokens may not touch even at a vertex.
      if (tokens.some(token => Math.max(Math.abs(token.q - q), Math.abs(token.r - r), Math.abs((token.q + token.r) - (q + r))) <= 1)) continue;
      occupied.add(key);
      tokens.push({ id, q, r, color: COLORS[randomInt(rng, COLORS.length)] });
      break;
    }
  }
  return { tokens, seed };
}

export function traceBrainwave(state: GameState, entry: string): BrainwaveResult {
  const side = entry.endsWith('′');
  const raw = side ? entry.slice(0, -1) : entry;
  const numeric = /^\d+$/.test(raw);
  const index = numeric ? Number(raw) - 1 : 'ABCDEFGHIJKLMN'.indexOf(raw);
  if (index < 0 || index >= BOARD_SIZE) return { exit: null, colors: [], absorbed: false, path: [] };

  const starts = numeric
    ? (side ? { q: index, r: BOARD_SIZE - 1, direction: 2 as Direction } : { q: index, r: 0, direction: 5 as Direction })
    : (side ? { q: 0, r: index, direction: 0 as Direction } : { q: BOARD_SIZE - 1, r: index, direction: 3 as Direction });
  let { q, r, direction } = starts;
  const tokenAt = new Map(state.tokens.map(token => [cellKey(token.q, token.r), token]));
  const colors = new Set<ClueColor>();
  const path = [] as { q: number; r: number }[];
  const seen = new Set<string>();
  for (let step = 0; step < BOARD_SIZE * BOARD_SIZE * 3; step++) {
    const key = `${q},${r},${direction}`;
    if (seen.has(key)) return { exit: null, colors: [...colors], absorbed: false, path };
    seen.add(key);
    if (!isPlayable(q, r)) return { exit: null, colors: [...colors], absorbed: false, path };
    path.push({ q, r });
    const token = tokenAt.get(cellKey(q, r));
    if (token) {
      colors.add(token.color);
      direction = ((direction + 1) % 6) as Direction;
    }
    const delta = DIRECTIONS[direction];
    q += delta.q; r += delta.r;
  }
  return { exit: null, colors: [...colors], absorbed: false, path };
}

export function getTokenColorAt(state: GameState, q: number, r: number): ClueColor | null {
  return state.tokens.find(token => token.q === q && token.r === r)?.color ?? null;
}
