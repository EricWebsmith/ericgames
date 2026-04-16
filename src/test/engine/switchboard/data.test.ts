import { describe, expect, it } from 'vitest';
import { getRhombicBoard, getRhombicCoordinatesByTileNo } from '../../../engine/switchboard/data';

describe('getRhombicCoordinatesByTileNo', () => {
    it('returns tile coordinates in row-major order for valid sizes', () => {
        const normalizedCoordinates = getRhombicCoordinatesByTileNo(9).map(({ q, r }) => ({
            q: q === 0 ? 0 : q,
            r,
        }));
        expect(normalizedCoordinates).toEqual([
            { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
            { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
            { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
        ]);
    });

    it('throws for invalid rhombic size', () => {
        expect(() => getRhombicCoordinatesByTileNo(10)).toThrow('Invalid rhombic board size: 10');
    });
});

describe('getRhombicBoard', () => {
    it('creates reciprocal edges for every connected tile pair', () => {
        const oppositeDirection: Record<number, number> = { 0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2 };
        const board = getRhombicBoard(9);

        expect(board.tiles).toHaveLength(9);
        for (const tile of board.tiles) {
            for (const [directionStr, neighborTileNo] of Object.entries(tile.edges)) {
                const direction = Number(directionStr);
                const opposite = oppositeDirection[direction];
                expect(board.tiles[neighborTileNo].edges[opposite]).toBe(tile.tileNo);
            }
        }
    });
});
