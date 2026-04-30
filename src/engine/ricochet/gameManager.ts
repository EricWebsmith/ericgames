import { ROBOT_COLORS, type Board, type Move, type Puzzle, type Robot, type RobotColor, type Target, BOARD_SIZE_OPTIONS, type BoardSizeOption, SIZE_TO_RADIUS } from './models';

// Pointy-top hex axial direction offsets
// 0=left, 1=upper-left, 2=upper-right, 3=right, 4=lower-right, 5=lower-left
export const AXIAL_OFFSETS: ReadonlyArray<[number, number]> = [
    [-1,  0],
    [ 0, -1],
    [ 1, -1],
    [ 1,  0],
    [ 0,  1],
    [-1,  1],
];

export function isInsideBoard(q: number, r: number, radius: number): boolean {
    return Math.abs(q) <= radius && Math.abs(r) <= radius && Math.abs(-q - r) <= radius;
}

export function getNeighbor(q: number, r: number, direction: number): [number, number] {
    const [dq, dr] = AXIAL_OFFSETS[direction];
    return [q + dq, r + dr];
}

export function wallKey(q: number, r: number, direction: number): string {
    return `${q},${r},${direction}`;
}

export function buildWallSet(walls: Board['walls']): Set<string> {
    return new Set(walls.map(w => wallKey(w.q, w.r, w.direction)));
}

export function buildBlockedCellSet(blockedCells?: Array<[number, number]>): Set<string> {
    if (!blockedCells) return new Set();
    return new Set(blockedCells.map(([q, r]) => `${q},${r}`));
}

function addWall(walls: Board['walls'], q: number, r: number, direction: number): void {
    walls.push({ q, r, direction });
    const [nq, nr] = getNeighbor(q, r, direction);
    walls.push({ q: nq, r: nr, direction: (direction + 3) % 6 });
}

export function canMoveInDirection(
    q: number, r: number,
    direction: number,
    wallSet: Set<string>,
    radius: number,
    blockedCellSet: Set<string> = new Set(),
): boolean {
    if (wallSet.has(wallKey(q, r, direction))) return false;
    const [nq, nr] = getNeighbor(q, r, direction);
    if (!isInsideBoard(nq, nr, radius)) return false;
    // A wall on the incoming side of the neighbor also blocks movement
    if (wallSet.has(wallKey(nq, nr, (direction + 3) % 6))) return false;
    // A blocked cell is impassable
    if (blockedCellSet.has(`${nq},${nr}`)) return false;
    return true;
}

export function slideRobot(
    q: number, r: number,
    direction: number,
    wallSet: Set<string>,
    robotPositions: Set<string>,
    radius: number,
    blockedCellSet: Set<string> = new Set(),
): [number, number] {
    let cq = q;
    let cr = r;
    while (canMoveInDirection(cq, cr, direction, wallSet, radius, blockedCellSet)) {
        const [nq, nr] = getNeighbor(cq, cr, direction);
        if (robotPositions.has(`${nq},${nr}`)) break;
        cq = nq;
        cr = nr;
    }
    return [cq, cr];
}

export function buildRobotPositions(robots: Robot[], excludeColor?: RobotColor): Set<string> {
    const set = new Set<string>();
    for (const robot of robots) {
        if (robot.color !== excludeColor) {
            set.add(`${robot.q},${robot.r}`);
        }
    }
    return set;
}

export function applyMove(
    robots: Robot[],
    color: RobotColor,
    direction: number,
    wallSet: Set<string>,
    radius: number,
    blockedCellSet: Set<string> = new Set(),
): { robots: Robot[]; move: Move; } | null {
    const robot = robots.find(r => r.color === color);
    if (!robot) return null;

    const robotPositions = buildRobotPositions(robots, color);
    const [toQ, toR] = slideRobot(robot.q, robot.r, direction, wallSet, robotPositions, radius, blockedCellSet);

    if (toQ === robot.q && toR === robot.r) return null;

    const newRobots = robots.map(r =>
        r.color === color ? { ...r, q: toQ, r: toR } : r,
    );

    return {
        robots: newRobots,
        move: {
            color,
            direction,
            fromQ: robot.q,
            fromR: robot.r,
            toQ,
            toR,
        },
    };
}

export function isSolved(robots: Robot[], target: Target): boolean {
    return robots.some(r => r.color === target.color && r.q === target.q && r.r === target.r);
}

export function getAllCells(radius: number): Array<[number, number]> {
    const cells: Array<[number, number]> = [];
    for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
            if (isInsideBoard(q, r, radius)) {
                cells.push([q, r]);
            }
        }
    }
    return cells;
}

function seededRandom(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Base board parameters (radius-4 / 61-cell board) used for scaling wall and blocked-cell counts
const BASE_WALL_COUNT = 14;
const BASE_CELL_COUNT = 61; // getAllCells(4).length

// Canonical key for a wall between two cells (direction-independent dedup)
function wallPairKey(q: number, r: number, direction: number): string {
    const [nq, nr] = getNeighbor(q, r, direction);
    const a = (q + 10) * 100 + (r + 10);
    const b = (nq + 10) * 100 + (nr + 10);
    return a < b ? `${q},${r}-${nq},${nr}` : `${nq},${nr}-${q},${r}`;
}

export function setupWithSeed(seed: number, radius = 4): Puzzle {
    const rng = seededRandom(seed);
    const allCells = getAllCells(radius);

    // Number of edge-walls scaled with board area
    const targetWallCount = Math.round(BASE_WALL_COUNT * allCells.length / BASE_CELL_COUNT);

    // Add random internal walls (stored in both directions for easy lookup)
    const walls: Board['walls'] = [];
    const wallPairKeys = new Set<string>();

    for (let i = 0; i < targetWallCount * 8 && wallPairKeys.size < targetWallCount; i++) {
        const [q, r] = allCells[Math.floor(rng() * allCells.length)];
        const direction = Math.floor(rng() * 6);
        const [nq, nr] = getNeighbor(q, r, direction);
        if (!isInsideBoard(nq, nr, radius)) continue;
        const key = wallPairKey(q, r, direction);
        if (wallPairKeys.has(key)) continue;
        wallPairKeys.add(key);
        addWall(walls, q, r, direction);
    }

    // The center cell (0,0) is always a blocked (impassable) cell
    const blockedCells: Array<[number, number]> = [[0, 0]];

    const board: Board = { radius, walls, blockedCells };

    // Place robots at distinct random cells (not on the center blocked cell)
    const usedCells = new Set<string>(['0,0']);
    const robots: Robot[] = [];
    for (const color of ROBOT_COLORS) {
        let q: number, r: number;
        do {
            [q, r] = allCells[Math.floor(rng() * allCells.length)];
        } while (usedCells.has(`${q},${r}`));
        usedCells.add(`${q},${r}`);
        robots.push({ color, q, r });
    }

    // Pick a target cell not occupied by any robot or blocked cell
    let targetQ: number, targetR: number;
    do {
        [targetQ, targetR] = allCells[Math.floor(rng() * allCells.length)];
    } while (usedCells.has(`${targetQ},${targetR}`));

    const targetColorIndex = Math.floor(rng() * ROBOT_COLORS.length);
    const target: Target = {
        q: targetQ,
        r: targetR,
        color: ROBOT_COLORS[targetColorIndex],
    };

    return { board, robots, target };
}

export function generateSeed(): number {
    return Math.floor(Math.random() * 0xFFFFFFFF);
}

export function setup(boardSize: BoardSizeOption = BOARD_SIZE_OPTIONS[0]): Puzzle {
    const radius = SIZE_TO_RADIUS[boardSize];
    const seed = generateSeed();
    return setupWithSeed(seed, radius);
}
