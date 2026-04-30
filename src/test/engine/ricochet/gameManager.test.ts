import { describe, expect, it } from 'vitest';
import {
    applyMove,
    buildWallSet,
    canMoveInDirection,
    getAllCells,
    getNeighbor,
    isInsideBoard,
    isSolved,
    setup,
    setupWithSeed,
    slideRobot,
    wallKey,
} from '../../../engine/ricochet/gameManager';
import type { Board, Robot } from '../../../engine/ricochet/models';

describe('isInsideBoard', () => {
    it('returns true for center cell', () => {
        expect(isInsideBoard(0, 0, 4)).toBe(true);
    });

    it('returns true for cells on the border', () => {
        expect(isInsideBoard(4, 0, 4)).toBe(true);
        expect(isInsideBoard(-4, 0, 4)).toBe(true);
        expect(isInsideBoard(0, 4, 4)).toBe(true);
        expect(isInsideBoard(0, -4, 4)).toBe(true);
    });

    it('returns false for cells outside the radius', () => {
        expect(isInsideBoard(5, 0, 4)).toBe(false);
        expect(isInsideBoard(3, 3, 4)).toBe(false); // q+r+s=3+3-6=0 but |s|=6>4? No: s=-q-r=-3-3=-6, |s|=6>4 → false ✓
        expect(isInsideBoard(3, 2, 4)).toBe(false); // s=-5 → outside
    });
});

describe('getNeighbor', () => {
    it('returns the correct neighbor for each direction', () => {
        // Direction 0 = left
        expect(getNeighbor(0, 0, 0)).toEqual([-1, 0]);
        // Direction 3 = right
        expect(getNeighbor(0, 0, 3)).toEqual([1, 0]);
        // Direction 1 = upper-left
        expect(getNeighbor(0, 0, 1)).toEqual([0, -1]);
        // Direction 4 = lower-right
        expect(getNeighbor(0, 0, 4)).toEqual([0, 1]);
    });

    it('opposite directions are symmetric', () => {
        for (let d = 0; d < 6; d++) {
            const [nq, nr] = getNeighbor(2, -1, d);
            const [back_q, back_r] = getNeighbor(nq, nr, (d + 3) % 6);
            expect(back_q).toBe(2);
            expect(back_r).toBe(-1);
        }
    });
});

describe('getAllCells', () => {
    it('returns 61 cells for radius 4', () => {
        expect(getAllCells(4)).toHaveLength(61);
    });

    it('returns 37 cells for radius 3', () => {
        expect(getAllCells(3)).toHaveLength(37);
    });

    it('returns 7 cells for radius 1', () => {
        expect(getAllCells(1)).toHaveLength(7);
    });
});

describe('slideRobot', () => {
    const radius = 3;
    const noWalls = new Set<string>();
    const noRobots = new Set<string>();

    it('slides until hitting the board border', () => {
        // From center (0,0) going right (direction 3), should hit the border at (3,0)
        const [toQ, toR] = slideRobot(0, 0, 3, noWalls, noRobots, radius);
        expect(toQ).toBe(3);
        expect(toR).toBe(0);
    });

    it('stays put when already at the border in the given direction', () => {
        // From (3,0) going right, cannot move
        const [toQ, toR] = slideRobot(3, 0, 3, noWalls, noRobots, radius);
        expect(toQ).toBe(3);
        expect(toR).toBe(0);
    });

    it('stops before another robot', () => {
        // Robot at (0,0), blocker at (2,0). Moving right should stop at (1,0).
        const robotPositions = new Set(['2,0']);
        const [toQ, toR] = slideRobot(0, 0, 3, noWalls, robotPositions, radius);
        expect(toQ).toBe(1);
        expect(toR).toBe(0);
    });

    it('stops at a wall', () => {
        // Wall on the right side (direction 3) of cell (1,0): robot at (0,0) should stop at (1,0)
        const walls: Board['walls'] = [{ q: 1, r: 0, direction: 3 }];
        const wallSet = buildWallSet(walls);
        const [toQ, toR] = slideRobot(0, 0, 3, wallSet, noRobots, radius);
        expect(toQ).toBe(1);
        expect(toR).toBe(0);
    });

    it('stops at incoming wall on neighbor', () => {
        // Wall on left side (direction 0 = opposite of 3) of cell (2,0): robot at (0,0) going right stops at (1,0)
        const walls: Board['walls'] = [{ q: 2, r: 0, direction: 0 }];
        const wallSet = buildWallSet(walls);
        const [toQ, toR] = slideRobot(0, 0, 3, wallSet, noRobots, radius);
        expect(toQ).toBe(1);
        expect(toR).toBe(0);
    });
});

describe('canMoveInDirection', () => {
    const radius = 3;
    const noWalls = new Set<string>();

    it('returns true when cell is inside and no wall', () => {
        expect(canMoveInDirection(0, 0, 3, noWalls, radius)).toBe(true);
    });

    it('returns false at board edge facing outward', () => {
        expect(canMoveInDirection(3, 0, 3, noWalls, radius)).toBe(false);
    });

    it('returns false when a wall blocks the direction', () => {
        const wallSet = new Set([wallKey(0, 0, 3)]);
        expect(canMoveInDirection(0, 0, 3, wallSet, radius)).toBe(false);
    });
});

describe('applyMove', () => {
    const radius = 3;
    const noWallSet = new Set<string>();

    const robots: Robot[] = [
        { color: 'red', q: 0, r: 0 },
        { color: 'blue', q: 2, r: 0 },
    ];

    it('returns null when robot does not move', () => {
        // Red at (0,0) blocked immediately by blue at (2,0)? No, red can move to (1,0)
        // Try left from (-3,0): already at border, cannot move
        const borderRobots: Robot[] = [{ color: 'red', q: -3, r: 0 }];
        expect(applyMove(borderRobots, 'red', 0, noWallSet, radius)).toBeNull();
    });

    it('slides red to (1,0) blocked by blue at (2,0)', () => {
        const result = applyMove(robots, 'red', 3, noWallSet, radius);
        expect(result).not.toBeNull();
        expect(result!.move.toQ).toBe(1);
        expect(result!.move.toR).toBe(0);
        expect(result!.move.fromQ).toBe(0);
        expect(result!.move.fromR).toBe(0);
        expect(result!.robots.find(r => r.color === 'red')?.q).toBe(1);
    });

    it('does not move other robots', () => {
        const result = applyMove(robots, 'red', 3, noWallSet, radius);
        expect(result!.robots.find(r => r.color === 'blue')).toEqual({ color: 'blue', q: 2, r: 0 });
    });
});

describe('isSolved', () => {
    it('returns true when target robot is at target', () => {
        const robots: Robot[] = [{ color: 'red', q: 2, r: -1 }];
        expect(isSolved(robots, { q: 2, r: -1, color: 'red' })).toBe(true);
    });

    it('returns false when target robot is elsewhere', () => {
        const robots: Robot[] = [{ color: 'red', q: 1, r: 0 }];
        expect(isSolved(robots, { q: 2, r: -1, color: 'red' })).toBe(false);
    });

    it('returns false when wrong robot is at target', () => {
        const robots: Robot[] = [
            { color: 'red', q: 0, r: 0 },
            { color: 'blue', q: 2, r: -1 },
        ];
        expect(isSolved(robots, { q: 2, r: -1, color: 'red' })).toBe(false);
    });
});

describe('setupWithSeed', () => {
    it('produces a reproducible puzzle', () => {
        const p1 = setupWithSeed(42);
        const p2 = setupWithSeed(42);
        expect(p1.robots).toEqual(p2.robots);
        expect(p1.target).toEqual(p2.target);
        expect(p1.board.walls).toEqual(p2.board.walls);
    });

    it('places 4 robots on distinct cells', () => {
        const puzzle = setupWithSeed(1337);
        const positions = puzzle.robots.map(r => `${r.q},${r.r}`);
        expect(new Set(positions).size).toBe(4);
    });

    it('places the target on a cell not occupied by a robot', () => {
        const puzzle = setupWithSeed(999);
        const positions = new Set(puzzle.robots.map(r => `${r.q},${r.r}`));
        expect(positions.has(`${puzzle.target.q},${puzzle.target.r}`)).toBe(false);
    });

    it('only adds walls between cells that are inside the board', () => {
        const puzzle = setupWithSeed(12345);
        for (const wall of puzzle.board.walls) {
            expect(isInsideBoard(wall.q, wall.r, puzzle.board.radius)).toBe(true);
        }
    });

    it('walls are stored in both directions (symmetric)', () => {
        const puzzle = setupWithSeed(777);
        const wallSet = buildWallSet(puzzle.board.walls);
        for (const wall of puzzle.board.walls) {
            const [nq, nr] = getNeighbor(wall.q, wall.r, wall.direction);
            expect(wallSet.has(wallKey(nq, nr, (wall.direction + 3) % 6))).toBe(true);
        }
    });
});

describe('setup', () => {
    it('runs without throwing', () => {
        expect(() => setup()).not.toThrow();
    });

    it('produces a valid puzzle with 4 robots', () => {
        const puzzle = setup();
        expect(puzzle.robots).toHaveLength(4);
        expect(puzzle.board.walls.length).toBeGreaterThan(0);
        expect(puzzle.board.radius).toBe(4);
    });
});
