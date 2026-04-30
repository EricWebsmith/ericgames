import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    applyMove,
    buildRobotPositions,
    buildWallSet,
    getAllCells,
    isSolved,
    setup,
    slideRobot,
} from '../engine/ricochet/gameManager';
import { ROBOT_COLORS, type Move, type Puzzle, type RobotColor } from '../engine/ricochet/models';

// ─── Layout constants ─────────────────────────────────────────────────
const HEX_SIZE = 38;   // center-to-center distance scale
const HEX_R = 33;      // visual hex radius (px)
const SVG_W = 700;
const SVG_H = 620;
const ROBOT_R = 13;    // robot circle radius
const TARGET_R = 10;   // target diamond half-size

// Degrees for each of the 6 hex directions (pointy-top, SVG y-down)
// 0=left, 1=upper-left, 2=upper-right, 3=right, 4=lower-right, 5=lower-left
const DIR_DEG: Record<number, number> = {
    0: 180, 1: 240, 2: 300, 3: 0, 4: 60, 5: 120,
};

const ROBOT_FILL: Record<RobotColor, string> = {
    red:    '#ff5555',
    blue:   '#5577ff',
    green:  '#44cc44',
    yellow: '#ffdd00',
};

const ROBOT_STROKE: Record<RobotColor, string> = {
    red:    '#ff2222',
    blue:   '#2244dd',
    green:  '#22aa22',
    yellow: '#ccaa00',
};

const BOARD_BG = '#081826';
const CELL_FILL = '#0b2438';
const CELL_STROKE = '#3a78a1';
const WALL_COLOR = '#ffffff';
const DEST_FILL_OPACITY = 0.30;
const SOLVED_COLOR = '#00e676';

// ─── Hex geometry helpers ─────────────────────────────────────────────

const toRawPx = (q: number, r: number) => ({
    x: HEX_SIZE * Math.sqrt(3) * (q + r / 2),
    y: HEX_SIZE * 1.5 * r,
});

const hexVertices = (cx: number, cy: number, R: number) =>
    Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 180) * (-90 + 60 * k);
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });

const hexPoints = (cx: number, cy: number, R: number): string =>
    hexVertices(cx, cy, R).map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');

// 5-pointed star polygon centered at (cx, cy), outer radius outerR, inner radius innerR.
// First point at the top (-90°).
const starPoints = (cx: number, cy: number, outerR: number, innerR: number): string =>
    Array.from({ length: 10 }, (_, i) => {
        const angle = (Math.PI / 180) * (-90 + 36 * i);
        const r = i % 2 === 0 ? outerR : innerR;
        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');

// ─── Pre-computed cell pixel map ──────────────────────────────────────

function buildCellPx(radius: number): Map<string, { x: number; y: number; }> {
    const allCells = getAllCells(radius);
    const rawCells = allCells.map(([q, r]) => ({ q, r, ...toRawPx(q, r) }));
    const xs = rawCells.map(c => c.x);
    const ys = rawCells.map(c => c.y);
    const offsetX = SVG_W / 2 - (Math.min(...xs) + Math.max(...xs)) / 2;
    const offsetY = SVG_H / 2 - (Math.min(...ys) + Math.max(...ys)) / 2;
    return new Map(rawCells.map(c => [`${c.q},${c.r}`, { x: c.x + offsetX, y: c.y + offsetY }]));
}

// ─── Component ────────────────────────────────────────────────────────

export default function RicochetRobots() {
    const { t } = useTranslation();

    const [puzzle, setPuzzle] = useState<Puzzle>(() => setup());
    const [currentRobots, setCurrentRobots] = useState(() => puzzle.robots);
    const [moveHistory, setMoveHistory] = useState<Move[]>([]);
    const [selectedColor, setSelectedColor] = useState<RobotColor | null>(null);

    const wallSet = useMemo(() => buildWallSet(puzzle.board.walls), [puzzle.board.walls]);

    const cellPx = useMemo(() => buildCellPx(puzzle.board.radius), [puzzle.board.radius]);

    const solved = useMemo(
        () => isSolved(currentRobots, puzzle.target),
        [currentRobots, puzzle.target],
    );

    // Potential slide destinations for the selected robot (one per direction that moves it)
    const moveDestinations = useMemo(() => {
        if (!selectedColor) return [];
        const robot = currentRobots.find(r => r.color === selectedColor);
        if (!robot) return [];
        const robotPositions = buildRobotPositions(currentRobots, selectedColor);
        return Array.from({ length: 6 }, (_, d) => {
            const [toQ, toR] = slideRobot(
                robot.q, robot.r, d, wallSet, robotPositions, puzzle.board.radius,
            );
            if (toQ === robot.q && toR === robot.r) return null;
            return { q: toQ, r: toR, direction: d };
        }).filter(Boolean) as Array<{ q: number; r: number; direction: number; }>;
    }, [selectedColor, currentRobots, wallSet, puzzle.board.radius]);

    // Wall line segments to render (deduplicated: only direction < 3)
    const wallLines = useMemo(() => {
        return puzzle.board.walls
            .filter(w => w.direction < 3)
            .flatMap(w => {
                const pos = cellPx.get(`${w.q},${w.r}`);
                if (!pos) return [];
                const verts = hexVertices(pos.x, pos.y, HEX_R);
                const v1 = verts[(w.direction + 4) % 6];
                const v2 = verts[(w.direction + 5) % 6];
                return [{ x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y, key: `${w.q},${w.r},${w.direction}` }];
            });
    }, [puzzle.board.walls, cellPx]);

    // Target diamond points
    const targetPos = cellPx.get(`${puzzle.target.q},${puzzle.target.r}`);

    const handleNewGame = useCallback(() => {
        const newPuzzle = setup();
        setPuzzle(newPuzzle);
        setCurrentRobots(newPuzzle.robots);
        setMoveHistory([]);
        setSelectedColor(null);
    }, []);

    const handleUndo = useCallback(() => {
        if (moveHistory.length === 0) return;
        const last = moveHistory[moveHistory.length - 1];
        setCurrentRobots(prev =>
            prev.map(r => r.color === last.color ? { ...r, q: last.fromQ, r: last.fromR } : r),
        );
        setMoveHistory(prev => prev.slice(0, -1));
        setSelectedColor(null);
    }, [moveHistory]);

    const handleRobotClick = useCallback((color: RobotColor) => {
        if (solved) return;
        setSelectedColor(prev => (prev === color ? null : color));
    }, [solved]);

    const handleDestinationClick = useCallback((direction: number) => {
        if (!selectedColor || solved) return;
        const result = applyMove(currentRobots, selectedColor, direction, wallSet, puzzle.board.radius);
        if (!result) return;
        setCurrentRobots(result.robots);
        setMoveHistory(prev => [...prev, result.move]);
        setSelectedColor(null);
    }, [selectedColor, solved, currentRobots, wallSet, puzzle.board.radius]);

    const handleBoardClick = useCallback(() => {
        setSelectedColor(null);
    }, []);

    return (
        <div className="game-container">
            <h2 className="game-title">{t('ricochetRobots.title')}</h2>
            <p className="status-message">{t('ricochetRobots.instructions')}</p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn-reset" onClick={handleNewGame}>
                    {t('ricochetRobots.newGame')}
                </button>
                <button
                    className="btn-reset"
                    onClick={handleUndo}
                    disabled={moveHistory.length === 0}
                >
                    {t('ricochetRobots.undo')}
                </button>
            </div>

            <svg
                width={SVG_W}
                height={SVG_H}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="game-svg"
                aria-label={t('ricochetRobots.boardAriaLabel')}
            >
                <defs>
                    <filter id="rr-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="rr-selected-glow" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background */}
                <rect width={SVG_W} height={SVG_H} fill={BOARD_BG} rx={10} onClick={handleBoardClick} />

                {/* Hex cells */}
                {Array.from(cellPx.entries()).map(([key, { x, y }]) => (
                    <polygon
                        key={key}
                        points={hexPoints(x, y, HEX_R)}
                        fill={CELL_FILL}
                        stroke={CELL_STROKE}
                        strokeWidth={1}
                        onClick={handleBoardClick}
                    />
                ))}

                {/* Target tile: filled hex in robot's color + white star */}
                {targetPos && (
                    <g
                        aria-label={t('ricochetRobots.targetAriaLabel', { color: t(`ricochetRobots.color.${puzzle.target.color}`) })}
                    >
                        <polygon
                            points={hexPoints(targetPos.x, targetPos.y, HEX_R)}
                            fill={ROBOT_FILL[puzzle.target.color]}
                            fillOpacity={0.75}
                            stroke={ROBOT_STROKE[puzzle.target.color]}
                            strokeWidth={2}
                        />
                        <polygon
                            points={starPoints(targetPos.x, targetPos.y, TARGET_R, TARGET_R * 0.42)}
                            fill="#ffffff"
                            fillOpacity={0.95}
                            strokeLinejoin="round"
                        />
                    </g>
                )}

                {/* Move destinations (shown when a robot is selected) */}
                {moveDestinations.map(({ q, r, direction }) => {
                    const pos = cellPx.get(`${q},${r}`);
                    if (!pos || !selectedColor) return null;
                    const fill = ROBOT_FILL[selectedColor];
                    // Arrow tip in the direction the robot traveled
                    const tipAngle = (Math.PI / 180) * DIR_DEG[direction];
                    const tipDist = HEX_R * 0.55;
                    const baseDist = HEX_R * 0.25;
                    const perpAngle = tipAngle + Math.PI / 2;
                    const tx = pos.x + tipDist * Math.cos(tipAngle);
                    const ty = pos.y + tipDist * Math.sin(tipAngle);
                    const b1x = pos.x - baseDist * Math.cos(tipAngle) + baseDist * Math.cos(perpAngle);
                    const b1y = pos.y - baseDist * Math.sin(tipAngle) + baseDist * Math.sin(perpAngle);
                    const b2x = pos.x - baseDist * Math.cos(tipAngle) - baseDist * Math.cos(perpAngle);
                    const b2y = pos.y - baseDist * Math.sin(tipAngle) - baseDist * Math.sin(perpAngle);
                    return (
                        <g
                            key={`dest-${q}-${r}-${direction}`}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleDestinationClick(direction); }}
                            aria-label={t('ricochetRobots.moveAriaLabel', {
                                color: t(`ricochetRobots.color.${selectedColor}`),
                                direction,
                            })}
                        >
                            <polygon
                                points={hexPoints(pos.x, pos.y, HEX_R * 0.85)}
                                fill={fill}
                                fillOpacity={DEST_FILL_OPACITY}
                                stroke={fill}
                                strokeWidth={1.5}
                            />
                            <polygon
                                points={`${tx.toFixed(1)},${ty.toFixed(1)} ${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}`}
                                fill={fill}
                                fillOpacity={0.8}
                            />
                        </g>
                    );
                })}

                {/* Wall lines */}
                {wallLines.map(({ x1, y1, x2, y2, key }) => (
                    <line
                        key={key}
                        x1={x1.toFixed(1)}
                        y1={y1.toFixed(1)}
                        x2={x2.toFixed(1)}
                        y2={y2.toFixed(1)}
                        stroke={WALL_COLOR}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                ))}

                {/* Robots */}
                {currentRobots.map(robot => {
                    const pos = cellPx.get(`${robot.q},${robot.r}`);
                    if (!pos) return null;
                    const isSelected = robot.color === selectedColor;
                    const isTargetRobot = robot.color === puzzle.target.color;
                    return (
                        <g
                            key={robot.color}
                            style={{ cursor: solved ? 'default' : 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleRobotClick(robot.color); }}
                            aria-label={t('ricochetRobots.robotAriaLabel', { color: t(`ricochetRobots.color.${robot.color}`) })}
                        >
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={ROBOT_R + (isSelected ? 3 : 0)}
                                fill={ROBOT_FILL[robot.color]}
                                stroke={isSelected ? '#ffffff' : ROBOT_STROKE[robot.color]}
                                strokeWidth={isSelected ? 2.5 : 1.5}
                                filter={isSelected ? 'url(#rr-selected-glow)' : undefined}
                            />
                            {isTargetRobot && (
                                <polygon
                                    points={starPoints(pos.x, pos.y, ROBOT_R * 0.55, ROBOT_R * 0.23)}
                                    fill="#ffffff"
                                    fillOpacity={0.95}
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}
                        </g>
                    );
                })}

                {/* Solved: glow the target robot */}
                {solved && targetPos && (
                    <circle
                        cx={targetPos.x}
                        cy={targetPos.y}
                        r={ROBOT_R + 6}
                        fill="none"
                        stroke={SOLVED_COLOR}
                        strokeWidth={3}
                        filter="url(#rr-glow)"
                    />
                )}
            </svg>

            <div style={{ width: '100%', maxWidth: SVG_W }}>
                {solved && (
                    <p
                        className="status-message"
                        style={{ textAlign: 'center', color: SOLVED_COLOR, fontWeight: 'bold' }}
                    >
                        {t('ricochetRobots.solved', { count: moveHistory.length })}
                    </p>
                )}
                <p className="status-message" style={{ textAlign: 'center' }}>
                    {t('ricochetRobots.moveCount', { count: moveHistory.length })}
                </p>

                {/* Robot color legend */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                    {ROBOT_COLORS.map(color => {
                        const isTarget = color === puzzle.target.color;
                        return (
                            <span
                                key={color}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 13,
                                    color: ROBOT_FILL[color],
                                    fontWeight: 600,
                                }}
                            >
                                <svg width={16} height={16} aria-hidden="true">
                                    <circle
                                        cx={8} cy={8} r={6}
                                        fill={ROBOT_FILL[color]}
                                        stroke={ROBOT_STROKE[color]}
                                        strokeWidth={1.5}
                                    />
                                    {isTarget && (
                                        <polygon
                                            points={starPoints(8, 8, 3.5, 1.5)}
                                            fill="#ffffff"
                                            fillOpacity={0.95}
                                        />
                                    )}
                                </svg>
                                {isTarget
                                    ? t('ricochetRobots.targetRobotLabel', { color: t(`ricochetRobots.color.${color}`) })
                                    : t(`ricochetRobots.color.${color}`)}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
