import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setup } from '../engine/orapa/gameManager';
import { getBoard, } from '../engine/orapa/mineData';
import type { Color, Puzzle } from '../engine/orapa/models';
import { getTiles, defaultTileOptions, type TileOptions } from '../engine/orapa/spaceData';
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
function borderPx(b: BorderInfo): { x: number; y: number; } {
    switch (b.side) {
        case 'top': return { x: GX + b.idx * CELL + CELL / 2, y: GY - BD_OFF };
        case 'left': return { x: GX - BD_OFF, y: GY + b.idx * CELL + CELL / 2 };
        case 'bottom': return { x: GX + b.idx * CELL + CELL / 2, y: GY + ROWS * CELL + BD_OFF };
        case 'right': return { x: GX + COLS * CELL + BD_OFF, y: GY + b.idx * CELL + CELL / 2 };
    }
}

function notePx(b: BorderInfo): { x: number; y: number; } {
    switch (b.side) {
        case 'top': return { x: GX + b.idx * CELL + CELL / 2, y: GY - BD_OFF - BD_R - 8 };
        case 'left': return { x: GX - BD_OFF - BD_R - 8, y: GY + b.idx * CELL + CELL / 2 };
        case 'bottom': return { x: GX + b.idx * CELL + CELL / 2, y: GY + ROWS * CELL + BD_OFF + BD_R + 8 };
        case 'right': return { x: GX + COLS * CELL + BD_OFF + BD_R + 8, y: GY + b.idx * CELL + CELL / 2 };
    }
}

// ─── Border bar helper ─────────────────────────────────────────────
// Returns the x, y, width, height of a thin bar drawn on the given side of a cell.
// border: 0=west, 1=north, 2=east, 3=south
// The +1 / -2 insets match the background <rect> geometry (x+1, y+1, CELL-2 × CELL-2).
const BAR_THICKNESS = 4;
const CELL_INSET = 1; // 1px inset on each side to align with background rect
function getBarRect(cellX: number, cellY: number, border: number): { x: number; y: number; width: number; height: number } | null {
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

function seededStars(count: number): { x: number; y: number; r: number }[] {
    const stars: { x: number; y: number; r: number }[] = [];
    let seed = 7919;
    for (let i = 0; i < count; i++) {
        seed = ((seed * LCG_MULTIPLIER + LCG_INCREMENT) | 0) >>> 0;
        const x = seed % SVG_W;
        seed = ((seed * LCG_MULTIPLIER + LCG_INCREMENT) | 0) >>> 0;
        const y = seed % SVG_H;
        stars.push({ x, y, r: i % 6 === 0 ? 1.5 : 0.8 });
    }
    return stars;
}
const STARS = seededStars(70);

// ─── Component ────────────────────────────────────────────────────
export default function OrapaSpace() {
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
            <h2 className="game-title">{t('orapaSpace.title')}</h2>
            <p className="status-message">{t('orapaSpace.instructions')}</p>

            <svg
                width={SVG_W}
                height={SVG_H}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
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
                <rect width={SVG_W} height={SVG_H} fill="#060614" rx={10} />

                {/* Stars */}
                {STARS.map((s, i) => (
                    <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.6 + (i % 4) * 0.1} />
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
                                        /* Black hole: SVG icon (svgrepo.com #187751), scaled to cell, colored purple. */
                                        <g
                                            transform={`translate(${x + 1}, ${y + 1}) scale(${(CELL - 2) / 512})`}
                                            fill="#aa44ff"
                                            filter="url(#space-glow)"
                                        >
                                            <path d="M347.671,94.92c-0.144-0.712-0.355-1.414-0.633-2.081c-0.278-0.679-0.624-1.325-1.024-1.926
			c-0.412-0.612-0.879-1.18-1.391-1.692c-0.512-0.512-1.081-0.979-1.693-1.38c-0.601-0.401-1.247-0.746-1.914-1.024
			c-0.679-0.278-1.38-0.49-2.081-0.634c-1.436-0.289-2.916-0.289-4.352,0c-0.712,0.145-1.414,0.356-2.081,0.634
			c-0.678,0.278-1.323,0.623-1.924,1.024c-0.612,0.401-1.181,0.868-1.693,1.38c-0.512,0.512-0.979,1.08-1.379,1.692
			c-0.401,0.601-0.746,1.247-1.024,1.926c-0.278,0.668-0.49,1.369-0.634,2.081s-0.223,1.447-0.223,2.17
			c0,0.735,0.078,1.458,0.223,2.182c0.145,0.701,0.356,1.402,0.634,2.081c0.278,0.668,0.623,1.313,1.024,1.914
			c0.4,0.612,0.867,1.18,1.379,1.692c0.512,0.512,1.081,0.979,1.693,1.391c0.601,0.401,1.247,0.746,1.924,1.024
			c0.669,0.278,1.369,0.49,2.081,0.634c0.713,0.145,1.447,0.211,2.17,0.211c0.723,0,1.458-0.067,2.182-0.211
			c0.701-0.145,1.402-0.356,2.081-0.634c0.668-0.278,1.313-0.623,1.914-1.024c0.612-0.412,1.181-0.879,1.693-1.391
			c0.512-0.512,0.979-1.08,1.391-1.692c0.4-0.601,0.746-1.247,1.024-1.914c0.278-0.679,0.489-1.38,0.633-2.081
			c0.146-0.723,0.211-1.447,0.211-2.182C347.883,96.367,347.816,95.633,347.671,94.92z" />
                                            <path d="M499.046,248.43c4.902-0.393,8.967-3.958,9.994-8.767c1.965-9.187,2.96-18.622,2.96-28.043
			c0-61.604-41.925-113.589-98.737-128.949c3.45,0.237,6.906-1.136,9.243-3.881c3.189-3.745,3.543-9.138,0.868-13.266
			c-5.108-7.886-11.075-15.262-17.736-21.924c-25.227-25.227-58.769-39.12-94.446-39.12c-23.673,0-46.403,6.123-66.39,17.609
			c2.505-2.271,3.91-5.616,3.628-9.134c-0.393-4.903-3.958-8.967-8.767-9.994C230.475,0.996,221.039,0,211.62,0
			C150.018,0,98.031,41.924,82.67,98.736c0.237-3.45-1.138-6.905-3.882-9.242c-3.745-3.19-9.139-3.542-13.266-0.867
			c-7.886,5.108-15.262,11.076-21.922,17.736c-25.227,25.227-39.12,58.769-39.12,94.445c0,23.672,6.123,46.401,17.608,66.389
			c-2.272-2.509-5.619-3.917-9.133-3.625c-4.903,0.393-8.967,3.958-9.995,8.767C0.996,281.525,0,290.961,0,300.38
			c0,61.602,41.924,113.588,98.736,128.949c-3.452-0.238-6.905,1.136-9.243,3.882c-3.189,3.744-3.542,9.138-0.867,13.266
			c5.109,7.887,11.076,15.263,17.736,21.922c25.227,25.228,58.769,39.12,94.445,39.12c23.674,0,46.405-6.124,66.393-17.612
			c-2.508,2.271-3.914,5.616-3.631,9.136c0.394,4.903,3.958,8.967,8.767,9.994c9.188,1.965,18.622,2.961,28.043,2.961
			c61.602,0,113.588-41.924,128.949-98.736c-0.238,3.45,1.136,6.905,3.881,9.243c2.067,1.761,4.637,2.656,7.218,2.656
			c2.096,0,4.198-0.59,6.049-1.789c7.886-5.108,15.262-11.076,21.922-17.736c43.558-43.559,50.674-109.962,21.365-160.995
			C492.039,247.251,495.452,248.724,499.046,248.43z M311.193,26.741c25.53-0.001,49.749,8.537,69.394,24.261
			c-13.053-1.562-26.352-1.185-39.53,1.169c-26.933,4.812-51.429,17.615-70.841,37.026c-21.744,21.744-35.399,50.543-38.45,81.09
			c-1.687,16.895-0.112,33.911,4.484,50.056c-1.277-1.165-2.531-2.364-3.761-3.593c-43.398-43.398-43.398-114.011,0-157.409
			C253.511,38.319,281.463,26.741,311.193,26.741z M240.961,24.387c-8.682,5.387-16.808,11.807-24.213,19.212
			c-38.079,38.079-48.308,93.618-30.7,141.085c-9.98-16.77-15.683-36.228-15.683-56.684
			C170.366,81.867,198.063,41.248,240.961,24.387z M199.128,22.958c-10.329,8.125-19.463,17.791-27.114,28.769
			c-15.642,22.447-23.909,48.821-23.909,76.273c0,30.751,10.707,60.771,30.15,84.528c10.753,13.14,23.898,24.057,38.566,32.223
			c-1.727,0.079-3.462,0.119-5.2,0.119c-61.373,0-111.304-49.931-111.304-111.304C100.315,76.414,143.613,29.184,199.128,22.958z
			 M81.667,102.673c-2.357,9.919-3.613,20.262-3.613,30.893c0,53.881,32.073,100.409,78.129,121.505
			c-18.945-4.795-36.764-14.544-51.246-29.027C72.268,193.375,63.15,144.974,81.667,102.673z M51.001,131.414
			c-1.56,13.054-1.184,26.352,1.169,39.53c4.812,26.933,17.615,51.429,37.026,70.841c21.744,21.746,50.542,35.4,81.09,38.451
			c16.895,1.688,33.911,0.111,50.057-4.486c-1.165,1.278-2.364,2.532-3.594,3.762c-21.022,21.022-48.974,32.6-78.703,32.6
			c-29.729,0-57.681-11.578-78.704-32.601c-21.022-21.022-32.6-48.974-32.6-78.703C26.74,175.278,35.278,151.06,51.001,131.414z
			 M43.599,295.253c25.227,25.227,58.769,39.12,94.445,39.12c16.049,0,31.663-2.82,46.286-8.211
			c-16.69,9.85-36.019,15.474-56.33,15.474c-46.135,0-86.753-27.698-103.614-70.597C29.773,279.72,36.194,287.848,43.599,295.253z
			 M22.957,312.872c8.125,10.329,17.791,19.463,28.769,27.114c22.448,15.643,48.823,23.91,76.275,23.91
			c30.751,0,60.771-10.707,84.528-30.149c13.14-10.753,24.057-23.899,32.223-38.566c0.079,1.727,0.119,3.462,0.119,5.2
			c0,61.373-49.931,111.304-111.304,111.304C76.414,411.685,29.184,368.388,22.957,312.872z M102.673,430.333
			c9.919,2.357,20.262,3.613,30.893,3.613c53.853,0,100.36-32.04,121.471-78.058c-4.802,18.916-14.527,36.709-28.993,51.174
			C193.375,439.733,144.974,448.852,102.673,430.333z M200.807,485.259c-25.53,0.001-49.747-8.536-69.393-24.26
			c13.054,1.559,26.352,1.184,39.529-1.17c26.933-4.812,51.429-17.615,70.841-37.026c21.744-21.744,35.399-50.543,38.45-81.09
			c1.687-16.895,0.114-33.911-4.484-50.056c1.277,1.165,2.531,2.364,3.761,3.593c43.396,43.398,43.396,114.011,0,157.408
			C258.488,473.681,230.537,485.259,200.807,485.259z M271.036,487.615c8.683-5.388,16.81-11.808,24.216-19.214
			c38.078-38.079,48.307-93.618,30.699-141.085c9.98,16.77,15.684,36.23,15.684,56.684
			C341.635,430.136,313.936,470.755,271.036,487.615z M312.872,489.043c10.329-8.125,19.463-17.791,27.113-28.769
			c15.643-22.447,23.91-48.821,23.91-76.274c0-30.751-10.707-60.77-30.15-84.528c-10.753-13.139-23.899-24.057-38.566-32.223
			c1.727-0.079,3.462-0.119,5.201-0.119c61.374,0,111.304,49.931,111.304,111.304C411.686,435.586,368.388,482.816,312.872,489.043z
			 M430.333,409.327c2.357-9.919,3.613-20.262,3.613-30.893c0-53.852-32.04-100.359-78.055-121.471
			c18.916,4.802,36.707,14.527,51.172,28.993C439.732,318.625,448.85,367.026,430.333,409.327z M461,380.572
			c1.558-13.049,1.183-26.342-1.171-39.514c-4.811-26.933-17.615-51.43-37.026-70.841c-21.744-21.746-50.542-35.4-81.09-38.451
			c-16.894-1.687-33.91-0.112-50.056,4.486c1.165-1.278,2.364-2.532,3.594-3.762c21.022-21.022,48.973-32.6,78.703-32.6
			c29.731,0,57.681,11.578,78.704,32.601C493.073,272.9,495.854,336.913,461,380.572z M468.402,216.749
			c-25.227-25.227-58.769-39.12-94.446-39.12c-16.049,0-31.664,2.82-46.287,8.212c16.691-9.85,36.02-15.475,56.331-15.475
			c46.202,0,86.876,27.778,103.692,70.786C482.346,232.469,475.92,224.267,468.402,216.749z M460.272,172.015
			c-22.447-15.643-48.82-23.91-76.272-23.91c-30.751,0-60.771,10.707-84.527,30.149c-13.141,10.753-24.058,23.899-32.224,38.567
			c-0.079-1.727-0.118-3.462-0.118-5.201c0-36.333,17.806-70.467,47.634-91.307c5.039-3.522,6.27-10.46,2.749-15.499
			c-3.522-5.04-10.46-6.269-15.499-2.749c-19.87,13.884-35.285,32.692-45.073,54.136c4.794-18.95,14.529-36.776,29.015-51.262
			c32.669-32.67,81.069-41.788,123.369-23.27c-9.919-2.357-20.261-3.613-30.891-3.613c-4.025,0-8.09,0.181-12.079,0.54
			c-6.123,0.55-10.642,5.958-10.091,12.081c0.55,6.123,5.971,10.635,12.081,10.091c3.331-0.299,6.725-0.451,10.089-0.451
			c57.153,0,104.38,43.297,110.608,98.814C480.917,188.8,471.251,179.665,460.272,172.015z" />
                                        </g>
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
                                    {exitLbl ? `→${exitLbl}` : '✕'}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn-reset" onClick={() => setShowAll(!showAll)}>
                    {t('orapaSpace.showAnswer')}
                </button>
                <button className="btn-reset" onClick={handleClickAllBorders}>
                    {t('orapaSpace.clickAllBorders')}
                </button>
                <button className="btn-reset" onClick={handleNewGame}>
                    {t('orapaSpace.newGame')}
                </button>
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
