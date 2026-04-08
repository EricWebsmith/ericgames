import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setup } from '../../engine/orapaMine/gameManager';
import type { Color, Puzzle } from '../../engine/orapaMine/models';
import BorderCircle from '../arclight/BorderCircle';

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

// ─── Component ────────────────────────────────────────────────────
export default function OrapaMine() {
  const { t } = useTranslation();
  const [puzzle, setPuzzle] = useState<Puzzle>(() => setup());
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
    setPuzzle(setup());
    setRevealedCells(new Set());
    setClickedBorders(new Set());
    setShowAll(false);
  }, []);

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

        {/* Brown background */}
        <rect width={SVG_W} height={SVG_H} fill="#2b1a0e" rx={10} />

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
                {/* Background rect – always shown; provides the grid outline. */}
                <rect
                  x={x + 1} y={y + 1}
                  width={CELL - 2} height={CELL - 2}
                  fill="#3d2410"
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
    </div>
  );
}
