import { ROBOT_COLORS, type Board, type Move, type Puzzle, type Robot, type RobotColor, type Target } from './models';

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
): boolean {
    if (wallSet.has(wallKey(q, r, direction))) return false;
    const [nq, nr] = getNeighbor(q, r, direction);
    if (!isInsideBoard(nq, nr, radius)) return false;
    // A wall on the incoming side of the neighbor also blocks movement
    if (wallSet.has(wallKey(nq, nr, (direction + 3) % 6))) return false;
    return true;
}

export function slideRobot(
    q: number, r: number,
    direction: number,
    wallSet: Set<string>,
    robotPositions: Set<string>,
    radius: number,
): [number, number] {
    let cq = q;
    let cr = r;
    while (canMoveInDirection(cq, cr, direction, wallSet, radius)) {
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
): { robots: Robot[]; move: Move; } | null {
    const robot = robots.find(r => r.color === color);
    if (!robot) return null;

    const robotPositions = buildRobotPositions(robots, color);
    const [toQ, toR] = slideRobot(robot.q, robot.r, direction, wallSet, robotPositions, radius);

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

// Canonical key for a wall between two cells (direction-independent dedup)
function wallPairKey(q: number, r: number, direction: number): string {
    const [nq, nr] = getNeighbor(q, r, direction);
    const a = (q + 10) * 100 + (r + 10);
    const b = (nq + 10) * 100 + (nr + 10);
    return a < b ? `${q},${r}-${nq},${nr}` : `${nq},${nr}-${q},${r}`;
}

export function setupWithSeed(seed: number): Puzzle {
    const rng = seededRandom(seed);
    const radius = 4; // 61-cell board
    const allCells = getAllCells(radius);

    // Add random internal walls (stored in both directions for easy lookup)
    const walls: Board['walls'] = [];
    const wallPairKeys = new Set<string>();
    const targetWallCount = 14;

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

    const board: Board = { radius, walls };

    // Place robots at distinct random cells
    const usedCells = new Set<string>();
    const robots: Robot[] = [];
    for (const color of ROBOT_COLORS) {
        let q: number, r: number;
        do {
            [q, r] = allCells[Math.floor(rng() * allCells.length)];
        } while (usedCells.has(`${q},${r}`));
        usedCells.add(`${q},${r}`);
        robots.push({ color, q, r });
    }

    // Pick a target cell not occupied by any robot
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

export function setup(): Puzzle {
    const seed = Math.floor(Math.random() * 0xFFFFFFFF);
    return setupWithSeed(seed);
}
