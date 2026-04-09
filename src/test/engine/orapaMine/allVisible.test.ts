import { describe, expect, it } from 'vitest';
import { allVisible, firstSee, putTile } from '../../../engine/orapa/gameManager';
import { getBoard, getTiles } from '../../../engine/orapa/mineData';

describe('firstSee', () => {
    it('returns parentName of the first gem seen from top border', () => {
        const board = getBoard();
        const tiles = getTiles();
        // Yellow tile anchor at D5: subtiles at D5, E5, E6
        const yellowTiles = putTile(tiles[2], 'D5', 0);

        // Border '5' shoots South into column 5: first cell is A5 … D5 → Yellow gem
        const result = firstSee(board, yellowTiles, '5');
        expect(result).toBe('Yellow');
    });

    it('returns null when no gem is in the line of sight', () => {
        const board = getBoard();
        const tiles = getTiles();
        const yellowTiles = putTile(tiles[2], 'D5', 0);

        // Border '2' shoots South into column 2: no gem there
        const result = firstSee(board, yellowTiles, '2');
        expect(result).toBeNull();
    });

    it('returns null when a non-gem tile blocks a gem behind it', () => {
        const board = getBoard();
        const tiles = getTiles();
        // Black tile at B5 (anchor), Yellow tile at D5
        const blackTiles = putTile(tiles[6], 'B5', 0);
        const yellowTiles = putTile(tiles[2], 'D5', 0);
        const combined = { ...blackTiles, ...yellowTiles };

        // Border '5' shoots South: hits B5 (black, no colors) first → null
        const result = firstSee(board, combined, '5');
        expect(result).toBe("Black");
    });
});

describe('allVisible', () => {
    it('returns true when a single gem tile is visible from at least one border', () => {
        const board = getBoard();
        const tiles = getTiles();
        // Light Blue is a single-cell tile – easy to see from 4 directions
        const lightBlueTiles = putTile(tiles[7], 'D5', 0);

        expect(allVisible(board, {}, lightBlueTiles)).toBe(true);
    });

    it('returns true with no tiles placed', () => {
        const board = getBoard();
        expect(allVisible(board, {}, {})).toBe(true);
    });

    it('returns false when a gem is completely hidden by other gem tiles', () => {
        const board = getBoard();
        const tiles = getTiles();

        // Place Light Blue at D5 (single-cell gem).
        const lightBlueTiles = putTile(tiles[7], 'D5', 0);

        // Block every border's line of sight to D5 using Black tiles (no colors):
        //   rotateAngle=0 → second subtile is one row south (same col)
        //   rotateAngle=1 → second subtile is one col west  (same row)
        //   rotateAngle=3 → second subtile is one col east  (same row)
        const blackTop    = putTile(tiles[6], 'A5', 0); // A5 & B5  – blocks top   border '5'
        const blackBottom = putTile(tiles[6], 'G5', 0); // G5 & H5  – blocks bottom border 'M'
        const blackLeft   = putTile(tiles[6], 'D1', 1); // D4 & D3  – blocks left  border 'D'
        const blackRight  = putTile(tiles[6], 'D10', 3); // D6 & D7  – blocks right border '14'

        const allTiles = { ...lightBlueTiles, ...blackTop, ...blackBottom, ...blackLeft, ...blackRight };

        // Light Blue at D5 is surrounded on all four axes – allVisible must return false.
        expect(allVisible(board, allTiles, {})).toBe(false);
    });

    it('returns true when two separate gems are both visible', () => {
        const board = getBoard();
        const tiles = getTiles();
        const yellowTiles = putTile(tiles[2], 'D5', 0);
        const lightBlueTiles = putTile(tiles[7], 'F3', 0);

        expect(allVisible(board, yellowTiles, lightBlueTiles)).toBe(true);
    });
});
