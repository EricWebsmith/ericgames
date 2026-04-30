import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setupWithSeed } from '../engine/orapa/gameManager';
import { getBoard, } from '../engine/orapa/mineData';
import { type Color, type Puzzle } from '../engine/orapa/models';
import { defaultTileOptions, getTiles, type TileOptions } from '../engine/orapa/spaceData';
import BlackHole from './BlackHole';
import BorderCircle from './shared/BorderCircle';
import ShareButton from './shared/ShareButton';

// ─── Board size options ────────────────────────────────────────────
const BOARD_SIZES = ['10x8', '11x7'] as const;
type BoardSize = typeof BOARD_SIZES[number];
const DEFAULT_BOARD_SIZE: BoardSize = '10x8';

function parseBoardSize(size: BoardSize): { cols: number; rows: number } {
    const [c, r] = size.split('x').map(Number);
    return { cols: c, rows: r };
}

// ─── Layout constants ──────────────────────────────────────────────
const CELL = 46;   // cell size in px
const BD_R = 12;   // border circle radius
const BD_OFF = 28; // distance from grid edge to border circle centre
const GX = 64;     // x of left edge of grid
const GY = 64;     // y of top edge of grid

function getSvgDimensions(cols: number, rows: number) {
    return {
        svgW: GX + cols * CELL + GX,
        svgH: GY + rows * CELL + GY,
    };
}

// ─── Row/column helpers ────────────────────────────────────────────
// Engine format: row letter A–? (A = top row), column number 1–cols.
const ALL_ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function cellLabel(col: number, row: number): string {
    return `${ALL_ROW_LETTERS[row - 1]}${col}`;
}

function cellTL(col: number, row: number) {
    return { x: GX + (col - 1) * CELL, y: GY + (row - 1) * CELL };
}

// ─── Gem colors ────────────────────────────────────────────────────
const GEM_FILL: Record<string, string> = {
    red: '#ff5555',
    blue: '#5577ff',
    yellow: '#ccaa00',
    white: '#e0e0e0',
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
// Engine border layout (matches getBoard() in mineData.ts):
//   Top    (1–cols):          numbers, above columns 1–cols
//   Left   (A–rowLetter):     letters, left of rows (A = top)
//   Bottom (next cols letters after row letters): below columns 1–cols
//   Right  ((cols+1)–(cols+rows)): numbers, right of rows
type Side = 'top' | 'left' | 'bottom' | 'right';
interface BorderInfo { label: string; side: Side; idx: number; }

function buildBorders(cols: number, rows: number): BorderInfo[] {
    const rowLetters = ALL_ROW_LETTERS.slice(0, rows).split('');
    const bottomLetters = ALL_ROW_LETTERS.slice(rows, rows + cols).split('');
    return [
        // Top: 1–cols, above columns 1–cols (idx 0–cols-1)
        ...Array.from({ length: cols }, (_, i) => ({ label: String(i + 1), side: 'top' as Side, idx: i })),
        // Left: row letters, left of rows (idx 0–rows-1)
        ...rowLetters.map((c, i) => ({ label: c, side: 'left' as Side, idx: i })),
        // Bottom: next cols letters after row letters (idx 0–cols-1)
        ...bottomLetters.map((c, i) => ({ label: c, side: 'bottom' as Side, idx: i })),
        // Right: (cols+1)–(cols+rows), right of rows (idx 0–rows-1)
        ...Array.from({ length: rows }, (_, i) => ({ label: String(cols + 1 + i), side: 'right' as Side, idx: i })),
    ];
}

// ─── Pixel helpers ─────────────────────────────────────────────────
function borderPx(b: BorderInfo, cols: number, rows: number): { x: number; y: number; } {
    switch (b.side) {
        case 'top': return { x: GX + b.idx * CELL + CELL / 2, y: GY - BD_OFF };
        case 'left': return { x: GX - BD_OFF, y: GY + b.idx * CELL + CELL / 2 };
        case 'bottom': return { x: GX + b.idx * CELL + CELL / 2, y: GY + rows * CELL + BD_OFF };
        case 'right': return { x: GX + cols * CELL + BD_OFF, y: GY + b.idx * CELL + CELL / 2 };
    }
}

function notePx(b: BorderInfo, cols: number, rows: number): { x: number; y: number; } {
    switch (b.side) {
        case 'top': return { x: GX + b.idx * CELL + CELL / 2, y: GY - BD_OFF - BD_R - 8 };
        case 'left': return { x: GX - BD_OFF - BD_R - 8, y: GY + b.idx * CELL + CELL / 2 };
        case 'bottom': return { x: GX + b.idx * CELL + CELL / 2, y: GY + rows * CELL + BD_OFF + BD_R + 8 };
        case 'right': return { x: GX + cols * CELL + BD_OFF + BD_R + 8, y: GY + b.idx * CELL + CELL / 2 };
    }
}

// ─── Border bar helper ─────────────────────────────────────────────
// Returns the x, y, width, height of a thin bar drawn on the given side of a cell.
// border: 0=west, 1=north, 2=east, 3=south
// The +1 / -2 insets match the background <rect> geometry (x+1, y+1, CELL-2 × CELL-2).
const BAR_THICKNESS = 4;
const CELL_INSET = 1; // 1px inset on each side to align with background rect
function getBarRect(cellX: number, cellY: number, border: number): { x: number; y: number; width: number; height: number; } | null {
    const innerSize = CELL - 2 * CELL_INSET; // inner dimension matches background rect
    switch (border) {
        case 0: return { x: cellX + CELL_INSET, y: cellY + CELL_INSET, width: BAR_THICKNESS, height: innerSize };
        case 1: return { x: cellX + CELL_INSET, y: cellY + CELL_INSET, width: innerSize, height: BAR_THICKNESS };
        case 2: return { x: cellX + CELL - CELL_INSET - BAR_THICKNESS, y: cellY + CELL_INSET, width: BAR_THICKNESS, height: innerSize };
        case 3: return { x: cellX + CELL_INSET, y: cellY + CELL - CELL_INSET - BAR_THICKNESS, width: innerSize, height: BAR_THICKNESS };
        default: return null;
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

    const x0 = cellX + 1, y0 = cellY + 1;        // NW inset
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
        default: return null;
    }
}

// ─── Stars ────────────────────────────────────────────────────────
// Deterministic star positions for the space background.
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

function seededStars(count: number, svgW: number, svgH: number): { x: number; y: number; r: number; }[] {
    const stars: { x: number; y: number; r: number; }[] = [];
    let seed = 7919;
    for (let i = 0; i < count; i++) {
        seed = ((seed * LCG_MULTIPLIER + LCG_INCREMENT) | 0) >>> 0;
        const x = seed % svgW;
        seed = ((seed * LCG_MULTIPLIER + LCG_INCREMENT) | 0) >>> 0;
        const y = seed % svgH;
        stars.push({ x, y, r: i % 6 === 0 ? 1.5 : 0.8 });
    }
    return stars;
}

// ─── URL sharing ──────────────────────────────────────────────────
const QUERY_PARAM_OPTIONS_SPACE = 'o';
const QUERY_PARAM_SEED_SPACE = 's';
const QUERY_PARAM_SIZE_SPACE = 'z';

const getSearchParamsSpace = (): URLSearchParams => {
    if (typeof window === 'undefined') return new URLSearchParams();
    const params = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.split('?')[1];
    if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        hashParams.forEach((value, key) => {
            if (!params.has(key)) params.set(key, value);
        });
    }
    return params;
};

const getInitialSpaceStateFromQuery = (): { puzzle: Puzzle; tileOptions: TileOptions; seed: number; boardSize: BoardSize; } => {
    const params = getSearchParamsSpace();
    const optStr = params.get(QUERY_PARAM_OPTIONS_SPACE) ?? '';
    const tileOptions: TileOptions = { includeBlackHole: optStr[0] === '1' };
    const sizeParam = params.get(QUERY_PARAM_SIZE_SPACE);
    const boardSize: BoardSize = (BOARD_SIZES as readonly string[]).includes(sizeParam ?? '') ? (sizeParam as BoardSize) : DEFAULT_BOARD_SIZE;
    const { cols, rows } = parseBoardSize(boardSize);

    if (!/^[01]$/.test(optStr)) {
        const seed = Math.floor(Math.random() * 0xFFFFFFFF);
        return { puzzle: setupWithSeed(getBoard(cols, rows), getTiles(defaultTileOptions), seed), tileOptions: defaultTileOptions, seed, boardSize };
    }

    const seedStr = params.get(QUERY_PARAM_SEED_SPACE);
    const parsedSeed = seedStr !== null && /^\d+$/.test(seedStr) ? parseInt(seedStr, 10) : null;

    if (parsedSeed !== null && Number.isInteger(parsedSeed) && parsedSeed >= 0) {
        return { puzzle: setupWithSeed(getBoard(cols, rows), getTiles(tileOptions), parsedSeed), tileOptions, seed: parsedSeed, boardSize };
    }

    const seed = Math.floor(Math.random() * 0xFFFFFFFF);
    return { puzzle: setupWithSeed(getBoard(cols, rows), getTiles(tileOptions), seed), tileOptions, seed, boardSize };
};

// ─── Component ────────────────────────────────────────────────────
export default function OrapaSpace() {
    const { t } = useTranslation();
    const [initialState] = useState(() => getInitialSpaceStateFromQuery());
    const [boardSize, setBoardSize] = useState<BoardSize>(initialState.boardSize);
    const [tileOptions, setTileOptions] = useState<TileOptions>(initialState.tileOptions);
    const [puzzle, setPuzzle] = useState<Puzzle>(initialState.puzzle);
    const [seed, setSeed] = useState<number>(initialState.seed);
    const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
    const [showAll, setShowAll] = useState(false);
    const [clickedBorders, setClickedBorders] = useState<Set<string>>(new Set());

    const { cols, rows } = parseBoardSize(boardSize);
    const { svgW, svgH } = getSvgDimensions(cols, rows);
    const allBorders = useMemo(() => buildBorders(cols, rows), [cols, rows]);
    const stars = useMemo(() => seededStars(70, svgW, svgH), [svgW, svgH]);

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

    // ─── URL update ───────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = getSearchParamsSpace();
        params.set(QUERY_PARAM_OPTIONS_SPACE, tileOptions.includeBlackHole ? '1' : '0');
        params.set(QUERY_PARAM_SEED_SPACE, String(seed));
        params.set(QUERY_PARAM_SIZE_SPACE, boardSize);
        const search = params.toString();
        const querySuffix = search ? `?${search}` : '';
        const hashPath = window.location.hash.split('?')[0];
        const hasHashPathRoute = hashPath.startsWith('#/');
        const nextUrl = hasHashPathRoute
            ? `${window.location.pathname}${hashPath}${querySuffix}`
            : `${window.location.pathname}${querySuffix}${hashPath}`;
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (currentUrl === nextUrl) return;
        window.history.replaceState(null, '', nextUrl);
    }, [seed, tileOptions, boardSize]);

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
        setClickedBorders(new Set(allBorders.map(b => b.label)));
    }, [allBorders]);

    const handleNewGame = useCallback(() => {
        const nextSeed = Math.floor(Math.random() * 0xFFFFFFFF);
        setSeed(nextSeed);
        setPuzzle(setupWithSeed(getBoard(cols, rows), getTiles(tileOptions), nextSeed));
        setRevealedCells(new Set());
        setClickedBorders(new Set());
        setShowAll(false);
    }, [tileOptions, cols, rows]);

    const handleBoardSizeChange = useCallback((newSize: BoardSize) => {
        setBoardSize(newSize);
        const { cols: newCols, rows: newRows } = parseBoardSize(newSize);
        const nextSeed = Math.floor(Math.random() * 0xFFFFFFFF);
        setSeed(nextSeed);
        setPuzzle(setupWithSeed(getBoard(newCols, newRows), getTiles(tileOptions), nextSeed));
        setRevealedCells(new Set());
        setClickedBorders(new Set());
        setShowAll(false);
    }, [tileOptions]);

    return (
        <div className="game-container">
            <h2 className="game-title">{t('orapaSpace.title')}</h2>
            <p className="status-message">{t('orapaSpace.instructions')}</p>

            <svg
                width={svgW}
                height={svgH}
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="game-svg space-svg"
                aria-label={t('orapaSpace.boardAriaLabel')}
            >
                <defs>
                    <filter id="space-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Space background */}
                <rect width={svgW} height={svgH} fill="#060614" rx={10} />

                {/* Stars */}
                {stars.map((s, i) => (
                    <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.6 + (i % 4) * 0.1} />
                ))}

                {/* ── Grid cells ── */}
                {Array.from({ length: cols }, (_, ci) =>
                    Array.from({ length: rows }, (_, ri) => {
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

                        // belt: -1 means full tile; 0/1/2/3 means draw only a bar on that side.
                        // TileInBoard.belt already has the rotation applied.
                        const belt = tileData?.belt ?? -1;
                        const isBelt = belt !== -1;
                        const isBlackHole = tileData?.tile.blackHole ?? false;

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
                        const trianglePoints = showAll && isTriangle && !isBelt && reflectArcs[0]
                            ? getTrianglePoints(x, y, reflectArcs[0])
                            : null;

                        // Bar rect for belt tiles – only computed in showAll mode so that
                        // during normal play the full square is painted (same approach as trianglePoints).
                        const barRect = showAll && isBelt ? getBarRect(x, y, belt) : null;

                        return (
                            <g
                                key={label}
                                onClick={() => handleCellClick(label)}
                                style={{ cursor: 'pointer' }}
                                aria-label={t('orapaSpace.cellAriaLabel', { col, row })}
                            >
                                {/* Background rect – always shown; provides the grid outline. */}
                                <rect
                                    x={x + 1} y={y + 1}
                                    width={CELL - 2} height={CELL - 2}
                                    fill="#0a1828"
                                    stroke="#1e3d5c"
                                    strokeWidth={1.5}
                                    rx={2}
                                />

                                {/* Revealed tile drawn on top of the background. */}
                                {revealed && tileData && (
                                    isBlackHole ? (
                                        /* Black hole: SVG icon (svgrepo.com #187751), colored purple. */
                                        <BlackHole
                                            x={x + 1}
                                            y={y + 1}
                                            size={CELL - 2}
                                            filter="url(#space-glow)"
                                        />
                                    ) : isBelt && barRect ? (
                                        /* Border bar tile: only draw a thin bar on the specified side. */
                                        <rect
                                            x={barRect.x} y={barRect.y}
                                            width={barRect.width} height={barRect.height}
                                            fill={tileFill}
                                            fillOpacity={fillOpacity}
                                            filter={hasGem ? 'url(#space-glow)' : undefined}
                                        />
                                    ) : isTriangle && trianglePoints ? (
                                        /* Triangle tile (See Answer mode): polygon covers only the solid portion. */
                                        <polygon
                                            points={trianglePoints}
                                            fill={tileFill}
                                            fillOpacity={fillOpacity}
                                            filter={hasGem ? 'url(#space-glow)' : undefined}
                                        />
                                    ) : (
                                        /* Normal play or non-triangle tile: full rectangle. */
                                        <rect
                                            x={x + 1} y={y + 1}
                                            width={CELL - 2} height={CELL - 2}
                                            fill={tileFill}
                                            fillOpacity={fillOpacity}
                                            rx={2}
                                            filter={hasGem ? 'url(#space-glow)' : undefined}
                                        />
                                    )
                                )}

                                {/* X cross for revealed empty cells (no gem piece placed) */}
                                {revealed && !hasGem && !tileData && (
                                    <g stroke="#1e5a8a" strokeWidth={2} strokeLinecap="round">
                                        <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} />
                                        <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} />
                                    </g>
                                )}

                                {/* Cell coordinate label */}
                                <text
                                    x={cx} y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={revealed && hasGem ? 'rgba(255,255,255,0.9)' : '#2a5a8a'}
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
                {allBorders.map(b => {
                    const bp = borderPx(b, cols, rows);
                    const np = notePx(b, cols, rows);
                    const isEntry = clickedBorders.has(b.label);
                    const isExit = exitHighlights.has(b.label);
                    const result = lightResults[b.label];
                    const exitLbl = result?.end_label ?? '';

                    const circleColors: Color[] = isEntry ? (result?.colors ?? []) : [];

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
                                glowFilter="url(#space-glow)"
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
                                    {exitLbl ? exitLbl : '⊘'}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                <label htmlFor="space-board-size">{t('orapaSpace.boardSizeLabel')}</label>
                <select
                    id="space-board-size"
                    className="lang-switcher"
                    value={boardSize}
                    onChange={e => handleBoardSizeChange(e.target.value as BoardSize)}
                >
                    {BOARD_SIZES.map(size => (
                        <option key={size} value={size}>
                            {t(`orapaSpace.${size.replace('x', 'by')}`)}
                        </option>
                    ))}
                </select>
                <button className="btn-reset" onClick={() => setShowAll(!showAll)}>
                    {t('orapaSpace.showAnswer')}
                </button>
                <button className="btn-reset" onClick={handleClickAllBorders}>
                    {t('orapaSpace.clickAllBorders')}
                </button>
                <button className="btn-reset" onClick={handleNewGame}>
                    {t('orapaSpace.newGame')}
                </button>
                <ShareButton />
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                <label htmlFor="space-option-blackhole" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                        id="space-option-blackhole"
                        type="checkbox"
                        checked={tileOptions.includeBlackHole}
                        onChange={e => setTileOptions(prev => ({ ...prev, includeBlackHole: e.target.checked }))}
                    />
                    {t('orapaSpace.includeBlackHole')}
                </label>
            </div>
        </div>
    );
}
