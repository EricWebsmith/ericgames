import { useCallback, useMemo, useState } from 'react';
import { setup } from '../../engine/gameManager';
import type { Puzzle } from '../../engine/models';

// ─── Layout constants ──────────────────────────────────────────────
// HEX_SIZE=42 gives center-to-center distance of 42*√3≈72.7px (pointy-top hex).
// HEX_R=38 leaves ~6px visual gap between adjacent tiles (inradius≈33px, gap=(72.7-66)/2≈3px each side).
// BD_DIST=54 places border circles ~20px beyond each tile edge (tile inradius≈33px, 54-33=21px gap).
// BD_R=13 is large enough to fit two-digit labels (10–21) while keeping adjacent circles non-overlapping.
const HEX_SIZE = 42;
const HEX_R    = 38;
const BD_DIST  = 54;
const BD_R     = 13;
const SVG_W    = 700;
const SVG_H    = 600;
const OX       = 350;  // SVG origin X (center of hex grid)
const OY       = 300;  // SVG origin Y

// ─── Axial coordinate helpers ──────────────────────────────────────
// Tile label → (q, r):  letterIndex = 3+q+r,  numberIndex = r+3
// letters: A=0 C=1 E=2 G=3 I=4 K=5 M=6   numbers: 2=0 4=1 6=2 8=3 10=4 12=5 14=6
const LETTERS = ['A', 'C', 'E', 'G', 'I', 'K', 'M'] as const;
const NUMBERS = ['2', '4', '6', '8', '10', '12', '14'] as const;

type TileInfo = { label: string; q: number; r: number };

// All 37 core hex tiles
const ALL_TILES: TileInfo[] = (() => {
  const tiles: TileInfo[] = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      const s = -q - r;
      if (Math.abs(s) > 3) continue;
      tiles.push({
        label: `${LETTERS[3 + q + r]}${NUMBERS[r + 3]}`,
        q,
        r,
      });
    }
  }
  return tiles;
})();

// Axial (q, r) → SVG pixel, centered at (OX, OY)
const toPx = (q: number, r: number) => ({
  x: OX + HEX_SIZE * Math.sqrt(3) * (q + r / 2),
  y: OY + HEX_SIZE * 1.5 * r,
});

// Direction index 0–5 → angle in degrees (SVG y-down coordinate system)
// 0=left 1=upper-left 2=upper-right 3=right 4=lower-right 5=lower-left
const DIR_DEG: Record<number, number> = {
  0: 180, 1: 240, 2: 300, 3: 0, 4: 60, 5: 120,
};

// Pointy-top hexagon polygon points string (vertex at top, SVG y-down)
const hexPoints = (cx: number, cy: number, R: number): string =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (-90 + 60 * k);
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

// ─── Border node data ──────────────────────────────────────────────
// `dir` is the direction FROM the tile TO the border (i.e. tile.edges[dir] = borderLabel)
type BorderInfo = { label: string; tileLabel: string; dir: number };

const ALL_BORDERS: BorderInfo[] = [
  // Letter borders A–U  (derived from addBorderEdge(label, borderDir, tile) → tileDir=(borderDir+3)%6)
  { label: 'A',  tileLabel: 'A2',  dir: 2 },
  { label: 'B',  tileLabel: 'C2',  dir: 1 },
  { label: 'C',  tileLabel: 'C2',  dir: 2 },
  { label: 'D',  tileLabel: 'E2',  dir: 1 },
  { label: 'E',  tileLabel: 'E2',  dir: 2 },
  { label: 'F',  tileLabel: 'G2',  dir: 1 },
  { label: 'G',  tileLabel: 'G2',  dir: 2 },
  { label: 'H',  tileLabel: 'G2',  dir: 3 },
  { label: 'I',  tileLabel: 'I4',  dir: 2 },
  { label: 'J',  tileLabel: 'I4',  dir: 3 },
  { label: 'K',  tileLabel: 'K6',  dir: 2 },
  { label: 'L',  tileLabel: 'K6',  dir: 3 },
  { label: 'M',  tileLabel: 'M8',  dir: 2 },
  { label: 'N',  tileLabel: 'M8',  dir: 3 },
  { label: 'O',  tileLabel: 'M8',  dir: 4 },
  { label: 'P',  tileLabel: 'M10', dir: 3 },
  { label: 'Q',  tileLabel: 'M10', dir: 4 },
  { label: 'R',  tileLabel: 'M12', dir: 3 },
  { label: 'S',  tileLabel: 'M12', dir: 4 },
  { label: 'T',  tileLabel: 'M14', dir: 3 },
  { label: 'U',  tileLabel: 'M14', dir: 4 },
  // Number borders 1–21
  { label: '1',  tileLabel: 'A2',  dir: 1 },
  { label: '2',  tileLabel: 'A2',  dir: 0 },
  { label: '3',  tileLabel: 'A4',  dir: 1 },
  { label: '4',  tileLabel: 'A4',  dir: 0 },
  { label: '5',  tileLabel: 'A6',  dir: 1 },
  { label: '6',  tileLabel: 'A6',  dir: 0 },
  { label: '7',  tileLabel: 'A8',  dir: 1 },
  { label: '8',  tileLabel: 'A8',  dir: 0 },
  { label: '9',  tileLabel: 'A8',  dir: 5 },
  { label: '10', tileLabel: 'C10', dir: 0 },
  { label: '11', tileLabel: 'C10', dir: 5 },
  { label: '12', tileLabel: 'E12', dir: 0 },
  { label: '13', tileLabel: 'E12', dir: 5 },
  { label: '14', tileLabel: 'G14', dir: 0 },
  { label: '15', tileLabel: 'G14', dir: 5 },
  { label: '16', tileLabel: 'G14', dir: 4 },
  { label: '17', tileLabel: 'I14', dir: 5 },
  { label: '18', tileLabel: 'I14', dir: 4 },
  { label: '19', tileLabel: 'K14', dir: 5 },
  { label: '20', tileLabel: 'K14', dir: 4 },
  { label: '21', tileLabel: 'M14', dir: 5 },
];

// ─── Color helpers ─────────────────────────────────────────────────
const GEM_FILL: Record<string, string> = {
  red:    '#ff5555',
  blue:   '#5577ff',
  yellow: '#ffee00',
};

const DEFAULT_GEM_COLOR = '#aaaaaa';

const getGemColor = (colors: string[]): string => {
  if (colors.length === 0) return '';
  if (colors.length === 1) return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
  const s = new Set(colors);
  if (s.has('blue')   && s.has('yellow')) return '#33cc66';  // green
  if (s.has('red')    && s.has('blue'))   return '#cc55cc';  // purple
  if (s.has('red')    && s.has('yellow')) return '#ff8833';  // orange
  return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
};

// ─── Component ────────────────────────────────────────────────────
export default function Arclight() {
  const [puzzle,         setPuzzle]         = useState<Puzzle>(() => setup());
  const [revealedTiles,  setRevealedTiles]  = useState<Set<string>>(new Set());
  const [showAll,        setShowAll]        = useState(false);
  const [clickedBorders, setClickedBorders] = useState<Set<string>>(new Set());

  // Tile label → pixel center
  const tilePx = useMemo(
    () => Object.fromEntries(ALL_TILES.map(t => [t.label, toPx(t.q, t.r)])),
    [],
  );

  // Border label → pixel center (offset from its adjacent tile by BD_DIST in dir angle)
  const borderPx = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const b of ALL_BORDERS) {
      const tp = tilePx[b.tileLabel];
      if (!tp) continue;
      const rad = (Math.PI / 180) * DIR_DEG[b.dir];
      map[b.label] = {
        x: tp.x + BD_DIST * Math.cos(rad),
        y: tp.y + BD_DIST * Math.sin(rad),
      };
    }
    return map;
  }, [tilePx]);

  // Note position: beyond the border circle, away from the grid
  const notePx = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const b of ALL_BORDERS) {
      const tp = tilePx[b.tileLabel];
      if (!tp) continue;
      const rad = (Math.PI / 180) * DIR_DEG[b.dir];
      const d = BD_DIST + BD_R + 10;
      map[b.label] = { x: tp.x + d * Math.cos(rad), y: tp.y + d * Math.sin(rad) };
    }
    return map;
  }, [tilePx]);

  const handleTileClick = useCallback((label: string) => {
    setRevealedTiles(prev => {
      if (prev.has(label)) return prev;
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  }, []);

  const handleBorderClick = useCallback((label: string) => {
    setClickedBorders(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleNewGame = useCallback(() => {
    setPuzzle(setup());
    setRevealedTiles(new Set());
    setClickedBorders(new Set());
    setShowAll(false);
  }, []);

  const { sight_results: sightResults, light_results: lightResults } = puzzle;

  // Collect exit labels that are currently highlighted as light-beam targets
  const exitHighlights = useMemo(() => {
    const set = new Set<string>();
    for (const bl of clickedBorders) {
      const exit = lightResults[bl]?.end_label;
      if (exit) set.add(exit);
    }
    return set;
  }, [clickedBorders, lightResults]);

  return (
    <div className="game-container">
      <h2 className="game-title">Arclight</h2>
      <p className="status-message">
        Click a tile to inspect it · Click a border to fire a light beam
      </p>

      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="game-svg arclight-svg"
        aria-label="Arclight puzzle board"
      >
        <defs>
          <filter id="al-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dark background */}
        <rect width={SVG_W} height={SVG_H} fill="#080818" rx={10} />

        {/* ── Hex tiles ── */}
        {ALL_TILES.map(({ label }) => {
          const { x, y } = tilePx[label];
          const colors   = sightResults[label] ?? [];
          const revealed = showAll || revealedTiles.has(label);
          const hasGem   = colors.length > 0;
          const gemColor = hasGem ? getGemColor(colors) : '';

          const fillColor   = revealed && hasGem ? gemColor : '#14142e';
          const strokeColor = '#2a2a6a';

          return (
            <g
              key={label}
              onClick={() => handleTileClick(label)}
              style={{ cursor: 'pointer' }}
              aria-label={`Tile ${label}`}
            >
              <polygon
                points={hexPoints(x, y, HEX_R)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={1.5}
                filter={revealed && hasGem ? 'url(#al-glow)' : undefined}
              />

              {/* X cross for revealed tiles with no gem */}
              {revealed && !hasGem && (
                <g stroke="#3a3a7a" strokeWidth={2} strokeLinecap="round">
                  <line x1={x - 13} y1={y - 13} x2={x + 13} y2={y + 13} />
                  <line x1={x + 13} y1={y - 13} x2={x - 13} y2={y + 13} />
                </g>
              )}

              {/* Tile coordinate label */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={revealed && hasGem ? 'rgba(255,255,255,0.9)' : '#3a3a7a'}
                fontSize={9}
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* ── Border circles ── */}
        {ALL_BORDERS.map(({ label }) => {
          const bp = borderPx[label];
          if (!bp) return null;
          const np = notePx[label];

          const isEntry  = clickedBorders.has(label);
          const isExit   = exitHighlights.has(label);
          const result   = lightResults[label];
          const exitLbl  = result?.end_label ?? '';
          const gemColors = result?.colors ?? [];
          const noteColor = gemColors.length > 0 ? getGemColor(gemColors) : '#aaaacc';

          const circleFill   = isEntry ? '#1e1e5a' : isExit ? '#1a3a1a' : '#111130';
          const circleStroke = isEntry ? '#8888ff' : isExit ? '#44cc44' : '#3a3a7a';

          return (
            <g
              key={`b-${label}`}
              onClick={() => handleBorderClick(label)}
              style={{ cursor: 'pointer' }}
              aria-label={`Border ${label}`}
            >
              <circle
                cx={bp.x}
                cy={bp.y}
                r={BD_R}
                fill={circleFill}
                stroke={circleStroke}
                strokeWidth={isEntry || isExit ? 2 : 1.5}
                filter={isEntry ? 'url(#al-glow)' : undefined}
              />
              <text
                x={bp.x}
                y={bp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isEntry ? '#ccccff' : isExit ? '#88ff88' : '#8888aa'}
                fontSize={10}
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>

              {/* Light result note (visible when this border was clicked) */}
              {isEntry && np && (
                <text
                  x={np.x}
                  y={np.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={noteColor}
                  fontSize={9}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {exitLbl ? `→${exitLbl}` : '✕'}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          className="btn-reset"
          onClick={() => setShowAll(true)}
          disabled={showAll}
        >
          Reveal Answer
        </button>
        <button className="btn-reset" onClick={handleNewGame}>
          New Game
        </button>
      </div>
    </div>
  );
}
