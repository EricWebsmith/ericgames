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
const BD_OFF = 28;   // distance from grid edge to border circle centre
const GX = 64;   // x of left edge of grid
const GY = 64;   // y of top edge of grid
const SVG_W = 620;
const SVG_H = 510;

// ─── Gem colors ────────────────────────────────────────────────────
const GEM_FILL: Record<string, string> = {
  red: '#ff5555',
  blue: '#5577ff',
  yellow: '#ffee00',
  white: '#dddddd',
};

const DEFAULT_GEM_COLOR = '#aaaaaa';

function getGemColor(colors: string[]): string {
  if (colors.length === 0) return '';
  if (colors.length === 1) return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
  const s = new Set(colors);
  if (s.has('blue') && s.has('white')) return '#66ccee';  // light blue
  if (s.has('red') && s.has('blue')) return '#cc55cc';  // purple
  if (s.has('red') && s.has('yellow')) return '#ff8833';  // orange
  return GEM_FILL[colors[0]] ?? DEFAULT_GEM_COLOR;
}

// ─── Border node data ──────────────────────────────────────────────
type Side = 'top' | 'left' | 'bottom' | 'right';
interface BorderInfo { label: string; side: Side; idx: number; }

const ALL_BORDERS: BorderInfo[] = [
  // Numbers 1–10: top edge, col 1–10
  ...Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), side: 'top' as Side, idx: i + 1 })),
  // Numbers 11–18: left edge, row 1–8
  ...Array.from({ length: 8 }, (_, i) => ({ label: String(11 + i), side: 'left' as Side, idx: i + 1 })),
  // Letters A–J: bottom edge, col 1–10
  ...'ABCDEFGHIJ'.split('').map((c, i) => ({ label: c, side: 'bottom' as Side, idx: i + 1 })),
  // Letters K–R: right edge, row 1–8
  ...'KLMNOPQR'.split('').map((c, i) => ({ label: c, side: 'right' as Side, idx: i + 1 })),
];

// ─── Pixel helpers ─────────────────────────────────────────────────
function cellTL(col: number, row: number) {
  return { x: GX + (col - 1) * CELL, y: GY + (row - 1) * CELL };
}

function borderPx(b: BorderInfo): { x: number; y: number; } {
  switch (b.side) {
    case 'top': return { x: GX + (b.idx - 1) * CELL + CELL / 2, y: GY - BD_OFF };
    case 'left': return { x: GX - BD_OFF, y: GY + (b.idx - 1) * CELL + CELL / 2 };
    case 'bottom': return { x: GX + (b.idx - 1) * CELL + CELL / 2, y: GY + ROWS * CELL + BD_OFF };
    case 'right': return { x: GX + COLS * CELL + BD_OFF, y: GY + (b.idx - 1) * CELL + CELL / 2 };
  }
}

function notePx(b: BorderInfo): { x: number; y: number; } {
  switch (b.side) {
    case 'top': return { x: GX + (b.idx - 1) * CELL + CELL / 2, y: GY - BD_OFF - BD_R - 8 };
    case 'left': return { x: GX - BD_OFF - BD_R - 8, y: GY + (b.idx - 1) * CELL + CELL / 2 };
    case 'bottom': return { x: GX + (b.idx - 1) * CELL + CELL / 2, y: GY + ROWS * CELL + BD_OFF + BD_R + 8 };
    case 'right': return { x: GX + COLS * CELL + BD_OFF + BD_R + 8, y: GY + (b.idx - 1) * CELL + CELL / 2 };
  }
}

// ─── Arc path inside a square cell ────────────────────────────────
// face 0 = West, 1 = North, 2 = East, 3 = South
// Returns a quadratic-bezier path for a 90° corner arc, or a straight line
// for a through-path.  Only draws each (inFace, outFace) pair once
// (the function returns null when inFace > outFace).
function makeCellArcPath(inFace: number, outFace: number, x: number, y: number): string | null {
  if (inFace >= outFace) return null;   // each pair drawn once (smaller index first)
  const hs = CELL / 2;
  const cx = x + hs, cy = y + hs;

  const facePt = (f: number): { x: number; y: number; } => {
    if (f === 0) return { x, y: cy };
    if (f === 1) return { x: cx, y };
    if (f === 2) return { x: x + CELL, y: cy };
    return { x: cx, y: y + CELL };
  };

  const a = facePt(inFace);
  const b = facePt(outFace);

  // Opposite faces → straight pass-through
  if ((inFace === 0 && outFace === 2) || (inFace === 1 && outFace === 3)) {
    return `M${a.x},${a.y} L${b.x},${b.y}`;
  }

  // 90° corner: control point is the corner shared by both faces
  const corners: Record<string, { x: number; y: number; }> = {
    '0-1': { x, y },           // NW corner
    '1-2': { x: x + CELL, y },          // NE corner
    '2-3': { x: x + CELL, y: y + CELL },// SE corner
    '0-3': { x, y: y + CELL }, // SW corner
  };
  const cp = corners[`${inFace}-${outFace}`];
  if (!cp) return null;
  return `M${a.x},${a.y} Q${cp.x},${cp.y} ${b.x},${b.y}`;
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

        {/* Dark background */}
        <rect width={SVG_W} height={SVG_H} fill="#080818" rx={10} />

        {/* ── Grid cells ── */}
        {Array.from({ length: COLS }, (_, ci) =>
          Array.from({ length: ROWS }, (_, ri) => {
            const col = ci + 1, row = ri + 1;
            const label = `c${col}r${row}`;
            const { x, y } = cellTL(col, row);
            const cx = x + CELL / 2, cy = y + CELL / 2;
            const colors = sightResults[label] ?? [];
            const revealed = showAll || revealedCells.has(label);
            const hasGem = colors.length > 0;
            const gemColor = hasGem ? getGemColor(colors) : '';
            const tileData = tileByCoord[label];

            let fillColor: string;
            if (revealed && hasGem) {
              fillColor = gemColor;
            } else if (revealed && tileData) {
              fillColor = tileData.tile.arcs.length === 0 ? '#1a1a1a' : '#eeeeee';
            } else {
              fillColor = '#14142e';
            }

            return (
              <g
                key={label}
                onClick={() => handleCellClick(label)}
                style={{ cursor: 'pointer' }}
                aria-label={t('orapaMine.cellAriaLabel', { col, row })}
              >
                <rect
                  x={x + 1} y={y + 1}
                  width={CELL - 2} height={CELL - 2}
                  fill={fillColor}
                  stroke="#2a2a6a"
                  strokeWidth={1}
                  rx={2}
                  filter={revealed && hasGem ? 'url(#mine-glow)' : undefined}
                />

                {/* Arc paths (show answer) */}
                {showAll && tileData && Object.entries(tileData.arc_dict).map(([inFaceStr, outFace]) => {
                  const inFace = Number(inFaceStr);
                  const path = makeCellArcPath(inFace, outFace, x, y);
                  if (!path) return null;
                  return (
                    <path
                      key={`arc-${inFace}-${outFace}`}
                      d={path}
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth={2.5}
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* X for revealed empty cell */}
                {revealed && !hasGem && !tileData && (
                  <g stroke="#3a3a7a" strokeWidth={1.5} strokeLinecap="round">
                    <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} />
                    <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} />
                  </g>
                )}

                {/* Cell coordinate label */}
                <text
                  x={cx} y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={revealed && hasGem ? 'rgba(255,255,255,0.9)' : '#3a3a7a'}
                  fontSize={8}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {col},{row}
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
        <button className="btn-reset" onClick={handleNewGame}>
          {t('orapaMine.newGame')}
        </button>
      </div>
    </div>
  );
}
