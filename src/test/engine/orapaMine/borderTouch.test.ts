import { describe, expect, it } from 'vitest';
import { getBoard, getTiles } from '../../../engine/orapaMine/data';
import { borderTouch, putTile } from '../../../engine/orapaMine/gameManager';

describe('Two tiles touch each other', () => {
    it("Yellow touches lightblue", () => {
        const board = getBoard();
        const tiles = getTiles();
        const yellowTile = tiles[2];
        const lightBlueTile = tiles[7];
        const yellowTiles = putTile(yellowTile, 'D5', 0);
        const lightBlueTiles = putTile(lightBlueTile, 'D4', 0);

        const borderTouched = borderTouch(board, yellowTiles, lightBlueTiles);
        expect(borderTouched).toBe(true);
    });

    it("Yellow does not touch lightblue", () => {
        const board = getBoard();
        const tiles = getTiles();
        const yellowTile = tiles[2];
        const lightBlueTile = tiles[7];
        const yellowTiles = putTile(yellowTile, 'D5', 0);
        const lightBlueTiles = putTile(lightBlueTile, 'D3', 0);

        const borderTouched = borderTouch(board, yellowTiles, lightBlueTiles);
        expect(borderTouched).toBe(false);
    });
});

