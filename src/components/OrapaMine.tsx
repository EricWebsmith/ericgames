import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setup } from '../engine/orapa/gameManager';
import { defaultTileOptions, getBoard, getTiles, type TileOptions } from '../engine/orapa/mineData';
import type { Color, Puzzle } from '../engine/orapa/models';
import BorderCircle from './BorderCircle';

// ─── Layout constants ──────────────────────────────────────────────
const COLS = 10;
const ROWS = 8;
const CELL = 46;   // cell size in px
const BD_R = 12;   // border circle radius
const BD_OFF = 28; // distance from grid edge to border circle centre
const GX = 64;     // x of left edge of grid
const GY = 64;     // y of top edge of grid
const SVG_W = GX + COLS * CELL + GX;  // 64 + 460 + 64 = 588
const SVG_H = GY + ROWS * CELL + GY;  // 64 + 368 + 64 = 496

// ─── Row/column helpers ────────────────────────────────────────────
// Engine format: row letter A–H (A = top row), column number 1–10.
const ROW_LETTERS = 'ABCDEFGH';

function cellLabel(col: number, row: number): string {
  return `${ROW_LETTERS[row - 1]}${col}`;
}

function cellTL(col: number, row: number) {
  return { x: GX + (col - 1) * CELL, y: GY + (row - 1) * CELL };
}

// ─── Gem colors ────────────────────────────────────────────────────
const GEM_FILL: Record<string, string> = {
  red:    '#ff5555',
  blue:   '#5577ff',
  yellow: '#ccaa00',
  white:  '#e0e0e0',
};

const DEFAULT_GEM_COLOR = '#aaaaaa';

function getGemColor(colors: string[]): string {
  if (colors.length === 0) return '';
  if (colors.length === 1) return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
  const s = new Set(colors);
  if (s.has('blue') && s.has('white')) return '#66ccee'; // light blue
  return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
}

// ─── Border node data ──────────────────────────────────────────────
// Engine border layout (matches getBoard() in data.ts):
//   Top    (1–10):   numbers, above columns 1–10
//   Left   (A–H):   letters, left of rows A–H (A = top)
//   Bottom (I–R):   letters, below columns 1–10  (I = col 1, R = col 10)
//   Right  (11–18): numbers, right of rows A–H  (11 = row A)
type Side = 'top' | 'left' | 'bottom' | 'right';
interface BorderInfo { label: string; side: Side; idx: number; }

const ALL_BORDERS: BorderInfo[] = [
  // Top: 1–10, above columns 1–10 (idx 0–9)
  ...Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), side: 'top' as Side, idx: i })),
  // Left: A–H, left of rows 1–8 (idx 0–7)
  ...'ABCDEFGH'.split('').map((c, i) => ({ label: c, side: 'left' as Side, idx: i })),
  // Bottom: I–R, below columns 1–10 (idx 0–9)
  ...'IJKLMNOPQR'.split('').map((c, i) => ({ label: c, side: 'bottom' as Side, idx: i })),
  // Right: 11–18, right of rows 1–8 (idx 0–7)
  ...Array.from({ length: 8 }, (_, i) => ({ label: String(11 + i), side: 'right' as Side, idx: i })),
];

// ─── Pixel helpers ─────────────────────────────────────────────────
function borderPx(b: BorderInfo): { x: number; y: number } {
  switch (b.side) {
    case 'top':    return { x: GX + b.idx * CELL + CELL / 2, y: GY - BD_OFF };
    case 'left':   return { x: GX - BD_OFF,                  y: GY + b.idx * CELL + CELL / 2 };
    case 'bottom': return { x: GX + b.idx * CELL + CELL / 2, y: GY + ROWS * CELL + BD_OFF };
    case 'right':  return { x: GX + COLS * CELL + BD_OFF,    y: GY + b.idx * CELL + CELL / 2 };
  }
}

function notePx(b: BorderInfo): { x: number; y: number } {
  switch (b.side) {
    case 'top':    return { x: GX + b.idx * CELL + CELL / 2, y: GY - BD_OFF - BD_R - 8 };
    case 'left':   return { x: GX - BD_OFF - BD_R - 8,       y: GY + b.idx * CELL + CELL / 2 };
    case 'bottom': return { x: GX + b.idx * CELL + CELL / 2, y: GY + ROWS * CELL + BD_OFF + BD_R + 8 };
    case 'right':  return { x: GX + COLS * CELL + BD_OFF + BD_R + 8, y: GY + b.idx * CELL + CELL / 2 };
  }
}

// ─── Triangle tile helper ──────────────────────────────────────────
// Returns SVG polygon points for the triangle that results from a reflect arc.
// arc [a, b] means faces a and b are "open" (no solid wall) – their shared
// corner is cut away, leaving a 45-45-90 triangle.
//
//   0=West  1=North  2=East  3=South
//   Shared corners: 0∩1=NW, 1∩2=NE, 2∩3=SE, 0∩3=SW
//
// We use 1-px inset corners to match the background <rect> geometry.
function getTrianglePoints(cellX: number, cellY: number, arc: [number, number]): string | null {
  const [a, b] = arc;
  const key = [Math.min(a, b), Math.max(a, b)].join(',');

  const x0 = cellX + 1,      y0 = cellY + 1;        // NW inset
  const x1 = cellX + CELL - 1, y1 = cellY + CELL - 1; // SE inset

  const NW = `${x0},${y0}`;
  const NE = `${x1},${y0}`;
  const SE = `${x1},${y1}`;
  const SW = `${x0},${y1}`;

  switch (key) {
    // '/' diagonal (SW←→NE): excludes the corner not on the "/" line
    case '0,1': return `${NE} ${SE} ${SW}`; // open corner = NW, solid: right+bottom+/ hyp
    case '2,3': return `${NW} ${NE} ${SW}`; // open corner = SE, solid: top+left+/ hyp
    // '\' diagonal (NW←→SE): excludes the corner not on the "\" line
    case '1,2': return `${NW} ${SW} ${SE}`; // open corner = NE, solid: left+bottom+\ hyp
    case '0,3': return `${NW} ${NE} ${SE}`; // open corner = SW, solid: top+right+\ hyp
    default:    return null;
  }
}

// ─── Rock pebbles ─────────────────────────────────────────────────
// Deterministic pebble positions for the mine background texture.
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

function seededPebbles(count: number): { x: number; y: number; rx: number; ry: number }[] {
  const pebbles: { x: number; y: number; rx: number; ry: number }[] = [];
  let seed = 3571;
  for (let i = 0; i < count; i++) {
    seed = ((seed * LCG_MULTIPLIER + LCG_INCREMENT) | 0) >>> 0;
    const x = seed % SVG_W;
    seed = ((seed * LCG_MULTIPLIER + LCG_INCREMENT) | 0) >>> 0;
    const y = seed % SVG_H;
    const rx = 2 + (i % 4);
    const ry = 1 + (i % 3);
    pebbles.push({ x, y, rx, ry });
  }
  return pebbles;
}
const PEBBLES = seededPebbles(50);

// ─── Component ────────────────────────────────────────────────────
export default function OrapaMine() {
  const { t } = useTranslation();
  const [tileOptions, setTileOptions] = useState<TileOptions>(defaultTileOptions);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => setup(getBoard(), getTiles(defaultTileOptions)));
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [clickedBorders, setClickedBorders] = useState<Set<string>>(new Set());

  const { sight_results: sightResults, light_results: lightResults } = puzzle;

  const tileByCoord = useMemo(
    () => Object.fromEntries(puzzle.tiles.map(t => [t.coordinate, t])),
    [puzzle.tiles],
  );

  const exitHighlights = useMemo(() => {
    const set = new Set<string>();
    for (const bl of clickedBorders) {
      const exit = lightResults[bl]?.end_label;
      if (exit) set.add(exit);
    }
    return set;
  }, [clickedBorders, lightResults]);

  const exitColors = useMemo(() => {
    const map: Record<string, Color[]> = {};
    for (const bl of clickedBorders) {
      const result = lightResults[bl];
      if (result?.end_label) map[result.end_label] = result.colors;
    }
    return map;
  }, [clickedBorders, lightResults]);

  const handleCellClick = useCallback((label: string) => {
    setRevealedCells(prev => {
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

  const handleClickAllBorders = useCallback(() => {
    setClickedBorders(new Set(ALL_BORDERS.map(b => b.label)));
  }, []);

  const handleNewGame = useCallback(() => {
    setPuzzle(setup(getBoard(), getTiles(tileOptions)));
    setRevealedCells(new Set());
    setClickedBorders(new Set());
    setShowAll(false);
  }, [tileOptions]);

  return (
    <div className="game-container">
      <h2 className="game-title">{t('orapaMine.title')}</h2>
      <p className="status-message">{t('orapaMine.instructions')}</p>

      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="game-svg mine-svg"
        aria-label={t('orapaMine.boardAriaLabel')}
      >
        <defs>
          <filter id="mine-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Mine background */}
        <rect width={SVG_W} height={SVG_H} fill="#2b1a0e" rx={10} />

        {/* Dig-for-diamond watermark */}
        <g opacity={0.4} stroke="#c8a050" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Diamond outline: flat-top crown + pointed pavilion */}
          <path d="M224,148 L364,148 L394,248 L294,368 L194,248 Z" strokeWidth={2} fill="#4a3015" fillOpacity={0.35} />
          {/* Girdle line */}
          <line x1={194} y1={248} x2={394} y2={248} strokeWidth={1} />
          {/* Crown star facets */}
          <line x1={224} y1={148} x2={294} y2={248} strokeWidth={1} />
          <line x1={294} y1={148} x2={294} y2={248} strokeWidth={1} />
          <line x1={364} y1={148} x2={294} y2={248} strokeWidth={1} />
          {/* Pavilion facets */}
          <line x1={234} y1={248} x2={294} y2={368} strokeWidth={1} />
          <line x1={354} y1={248} x2={294} y2={368} strokeWidth={1} />
        </g>

        {/* Rock pebbles */}
        {PEBBLES.map((p, i) => (
          <ellipse key={`pebble-${i}`} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="#4a2e18" opacity={0.5} />
        ))}

        {/* ── Grid cells ── */}
        {Array.from({ length: COLS }, (_, ci) =>
          Array.from({ length: ROWS }, (_, ri) => {
            const col = ci + 1, row = ri + 1;
            const label = cellLabel(col, row);
            const { x, y } = cellTL(col, row);
            const cx = x + CELL / 2, cy = y + CELL / 2;
            const colors = sightResults[label] ?? [];
            const revealed = showAll || revealedCells.has(label);
            const hasGem = colors.length > 0;
            const gemColor = hasGem ? getGemColor(colors) : '';
            const tileData = tileByCoord[label];

            // Triangle tiles: any tile whose reflect array is non-empty.
            // The triangle shape is only revealed in "See Answer" mode (showAll);
            // during normal play the full square is painted with the tile colour so
            // the player has to figure out the shape themselves.
            const rawReflectArcs = tileData?.tile.reflect ?? [];
            const rotAngle = tileData?.rotate_angle ?? 0;
            const reflectArcs: [number, number][] = rawReflectArcs.map(
              ([a, b]) => [(a + rotAngle) % 4, (b + rotAngle) % 4],
            );
            const isTriangle = reflectArcs.length > 0;

            // Tile fill colour (only relevant when revealed and a tile exists).
            let tileFill = '';
            if (revealed && tileData) {
              if (hasGem) {
                tileFill = gemColor;
              } else {
                tileFill = isTriangle ? '#eeeeee' : '#000000';
              }
            }

            // Opacity from tile data (transparent gem is 50%); only when revealed.
            const fillOpacity = revealed && tileData ? tileData.tile.opacity / 100 : 1;

            // SVG polygon points for triangle tiles – only computed in showAll mode.
            // reflectArcs[0] is safe here: isTriangle guarantees length > 0,
            // and Reflect is typed as [number, number].
            const trianglePoints = showAll && isTriangle && reflectArcs[0]
              ? getTrianglePoints(x, y, reflectArcs[0])
              : null;

            return (
              <g
                key={label}
                onClick={() => handleCellClick(label)}
                style={{ cursor: 'pointer' }}
                aria-label={t('orapaMine.cellAriaLabel', { col, row })}
              >
                {/* Background rect – always shown; provides the grid outline. Diamond watermark shows through. */}
                <rect
                  x={x + 1} y={y + 1}
                  width={CELL - 2} height={CELL - 2}
                  fill="none"
                  stroke="#6a4420"
                  strokeWidth={1.5}
                  rx={2}
                />

                {/* Revealed tile drawn on top of the background. */}
                {revealed && tileData && (
                  isTriangle && trianglePoints ? (
                    /* Triangle tile (See Answer mode): polygon covers only the solid portion. */
                    <polygon
                      points={trianglePoints}
                      fill={tileFill}
                      fillOpacity={fillOpacity}
                      filter={hasGem ? 'url(#mine-glow)' : undefined}
                    />
                  ) : (
                    /* Normal play or non-triangle tile: full rectangle. */
                    <rect
                      x={x + 1} y={y + 1}
                      width={CELL - 2} height={CELL - 2}
                      fill={tileFill}
                      fillOpacity={fillOpacity}
                      rx={2}
                      filter={hasGem ? 'url(#mine-glow)' : undefined}
                    />
                  )
                )}

                {/* X cross for revealed empty cells (no gem piece placed) */}
                {revealed && !hasGem && !tileData && (
                  <g stroke="#7a4a20" strokeWidth={2} strokeLinecap="round">
                    <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} />
                    <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} />
                  </g>
                )}

                {/* Cell coordinate label */}
                <text
                  x={cx} y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={revealed && hasGem ? 'rgba(255,255,255,0.9)' : '#7a4a20'}
                  fontSize={9}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {label}
                </text>
              </g>
            );
          })
        )}

        {/* ── Border circles ── */}
        {ALL_BORDERS.map(b => {
          const bp = borderPx(b);
          const np = notePx(b);
          const isEntry = clickedBorders.has(b.label);
          const isExit = exitHighlights.has(b.label);
          const result = lightResults[b.label];
          const exitLbl = result?.end_label ?? '';

          // Entry circles show the result colours; exit circles mirror them.
          const circleColors: Color[] = isEntry
            ? (result?.colors ?? [])
            : (exitColors[b.label] ?? []);

          const noteColor = circleColors.length > 0
            ? getGemColor(circleColors as string[])
            : '#aaaacc';

          return (
            <g key={`b-${b.label}`}>
              <BorderCircle
                cx={bp.x}
                cy={bp.y}
                r={BD_R}
                colors={circleColors}
                isEntry={isEntry}
                isExit={isExit}
                label={b.label}
                onClick={() => handleBorderClick(b.label)}
                glowFilter="url(#mine-glow)"
              />

              {/* Wave result annotation */}
              {isEntry && (
                <text
                  x={np.x} y={np.y}
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
        <button className="btn-reset" onClick={() => setShowAll(!showAll)}>
          {t('orapaMine.showAnswer')}
        </button>
        <button className="btn-reset" onClick={handleClickAllBorders}>
          {t('orapaMine.clickAllBorders')}
        </button>
        <button className="btn-reset" onClick={handleNewGame}>
          {t('orapaMine.newGame')}
        </button>
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <label htmlFor="option-transparent" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            id="option-transparent"
            type="checkbox"
            checked={tileOptions.includeTransparent}
            onChange={e => setTileOptions(prev => ({ ...prev, includeTransparent: e.target.checked }))}
          />
          {t('orapaMine.includeTransparent')}
        </label>
        <label htmlFor="option-black" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            id="option-black"
            type="checkbox"
            checked={tileOptions.includeBlack}
            onChange={e => setTileOptions(prev => ({ ...prev, includeBlack: e.target.checked }))}
          />
          {t('orapaMine.includeBlack')}
        </label>
      </div>
    </div>
  );
}
