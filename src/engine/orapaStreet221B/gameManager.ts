import { BOARD_SIZE, borderEntries, isPlayable, type BrainwaveTrace, type ColorName, type GameState, type Token } from './models';

const COLORS: ColorName[] = ['red', 'blue', 'yellow', 'white', 'purple', 'green'];

function hashLabel(label: string): number {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickPlayableCells(): Array<{ q: number; r: number }> {
  const cells: Array<{ q: number; r: number }> = [];
  for (let q = 0; q < BOARD_SIZE; q += 1) {
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      if (isPlayable(q, r) && !(q === 0 && r === 0)) {
        cells.push({ q, r });
      }
    }
  }
  return cells;
}

export function createGame(): GameState {
  const cells = pickPlayableCells();
  const tokens: Token[] = [];
  const used = new Set<string>();

  for (let i = 0; i < 6; i += 1) {
    let choice = cells[Math.floor(Math.random() * cells.length)];
    while (used.has(`${choice.q}:${choice.r}`)) {
      choice = cells[Math.floor(Math.random() * cells.length)];
    }

    used.add(`${choice.q}:${choice.r}`);
    tokens.push({
      id: i + 1,
      q: choice.q,
      r: choice.r,
      color: COLORS[(i + Math.floor(Math.random() * COLORS.length)) % COLORS.length],
    });
  }

  return { id: 1, tokens };
}

function nearestExit(label: string, q: number, r: number): string {
  const entries = borderEntries();
  let best = entries[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    const dx = entry.cell.q - q;
    const dy = entry.cell.r - r;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }

  return best.label === label ? `${best.label}*` : best.label;
}

export function traceBrainwave(game: GameState, label: string): BrainwaveTrace {
  const entries = borderEntries();
  const entry = entries.find(item => item.label === label) ?? entries[hashLabel(label) % entries.length];
  const path: Array<{ q: number; r: number }> = [{ q: entry.cell.q, r: entry.cell.r }];

  let q = entry.cell.q;
  let r = entry.cell.r;
  const delta = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
  ];

  const startStep = hashLabel(label) % delta.length;

  for (let step = 0; step < 8; step += 1) {
    const direction = delta[(startStep + step) % delta.length];
    const nextQ = q + direction.q;
    const nextR = r + direction.r;
    if (!isPlayable(nextQ, nextR)) break;
    q = nextQ;
    r = nextR;
    path.push({ q, r });
  }

  const colors = game.tokens
    .filter(token => path.some(step => step.q === token.q && step.r === token.r))
    .map(token => token.color);

  return {
    label,
    colors: [...new Set(colors)],
    exit: nearestExit(label, q, r),
    path,
  };
}
