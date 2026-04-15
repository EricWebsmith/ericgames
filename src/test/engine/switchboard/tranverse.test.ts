import { beforeEach, describe, expect, it } from 'vitest';
import { getBasicTiles } from '../../../engine/switchboard/data';
import { tranverse } from '../../../engine/switchboard/gameManager';
import { type Board, TileInBoard } from '../../../engine/switchboard/models';

describe('traverse', () => {
    let board: Board;

    beforeEach(() => {
        const basicTiles = getBasicTiles();
        board = {
            boardType: "rhombic9",
            tiles: [
                new TileInBoard({ // 0
                    tile: basicTiles[2],
                    tileNo: 0,
                    rotate: 0,
                    edges: { 3: 1, 4: 4, 5: 3 },
                }),
                new TileInBoard({  // 1
                    tile: basicTiles[1],
                    tileNo: 1,
                    rotate: 2,
                    edges: { 0: 0, 3: 2, 4: 5, 5: 4 },
                }),
                new TileInBoard({  // 2
                    tile: basicTiles[1],
                    tileNo: 2,
                    rotate: -1,
                    edges: { 0: 1, 5: 5 },
                }),
                new TileInBoard({  // 3
                    tile: basicTiles[3],
                    tileNo: 3,
                    rotate: 1,
                    edges: { 2: 0, 3: 4, 4: 7, 5: 6 },
                }),
                new TileInBoard({  // 4
                    tile: basicTiles[3],
                    tileNo: 4,
                    rotate: 5,
                    edges: { 0: 3, 1: 0, 2: 1, 3: 5, 4: 8, 5: 7 },
                }),
                new TileInBoard({  // 5
                    tile: basicTiles[2],
                    tileNo: 5,
                    rotate: 0,
                    edges: { 0: 4, 1: 1, 2: 2, 5: 8 },
                }),
                new TileInBoard({  // 6
                    tile: basicTiles[3],
                    tileNo: 6,
                    rotate: 0,
                    edges: { 2: 3, 3:7 },
                }),
                new TileInBoard({  // 7
                    tile: basicTiles[0],
                    tileNo: 7,
                    rotate: 1,
                    edges: { 0: 6, 1: 3, 2: 4, 3: 8 },
                }),
                new TileInBoard({  // 8
                    tile: basicTiles[1],
                    tileNo: 8,
                    rotate: 3,
                    edges: { 0: 7, 1: 4, 2: 5 },
                }),
            ],
        };

        for (const tile of board.tiles) {
            tile.resolve_rotate();
        }
    });

    it.each([
        [6, 0, 6, 1],
        [6, 1, 6, 0],
        [3, 0, 6, 5],
        [3, 1, 0, 2],
        [0, 1, 5, 3],
        [0, 0, 8, 5],
        
    ])('start %s %s → end %s %s', (startTileIndex, startTileBorder, expectedExistTileIndex, expectedExistTileBorder) => {
        const [endTileIndex, endTileBorder] = tranverse(board, startTileIndex, startTileBorder);
        expect(endTileIndex).toBe(expectedExistTileIndex);
        expect(endTileBorder).toBe(expectedExistTileBorder);
    });
});
