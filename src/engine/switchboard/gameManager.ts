import { getHexBoard, getRhombicBoard } from './data';
import { BoardType, type Board, type Puzzle } from './models';

let nextPuzzleId = 1;

export function tranverse(board: Board, startTileIndex: number, startDirection: number): [number, number] {
    let currentTileIndex = startTileIndex;
    let currentDirection = startDirection;
    let currentTile = board.tiles[currentTileIndex];

    while (true) {
        const outDir = currentTile.arcDict[currentDirection];
        const nextTileIndex = currentTile.edges[outDir];
        if (nextTileIndex === undefined) {
            return [currentTileIndex, outDir];
        }

        // Next
        currentTileIndex = nextTileIndex;
        currentDirection = (outDir + 3) % 6;
        currentTile = board.tiles[currentTileIndex];
    }
}

const TILE_COUNT_BY_BOARD_TYPE: Record<BoardType, number> = {
    [BoardType.Rhombic9]: 9,
    [BoardType.Rhombic16]: 16,
    [BoardType.Rhombic25]: 25,
    [BoardType.Hexagonal19]: 19,
    [BoardType.Hexagonal37]: 37,
};

export function setup(boardType: BoardType = BoardType.Rhombic9): Puzzle {
    if (!(boardType in TILE_COUNT_BY_BOARD_TYPE)) {
        throw new Error(`Unsupported board type: ${boardType}`);
    }

    const tileCount = TILE_COUNT_BY_BOARD_TYPE[boardType];

    const board = boardType === BoardType.Hexagonal19 || boardType === BoardType.Hexagonal37
        ? getHexBoard(tileCount)
        : getRhombicBoard(tileCount);

    for (const tile of board.tiles) {
        tile.resolve_rotate();
    }

    let startTileIndex = 0;
    let startTileDirection = 0;
    let endTileIndex = 0;
    let endTileDirection = 0;

    if (boardType === BoardType.Hexagonal19 || boardType === BoardType.Hexagonal37) {
        const borderEntries: Array<{ tileNo: number; direction: number; }> = [];
        for (const tile of board.tiles) {
            for (let direction = 0; direction < 6; direction++) {
                if (tile.edges[direction] === undefined) {
                    borderEntries.push({ tileNo: tile.tileNo, direction });
                }
            }
        }

        const startIndex = Math.floor(Math.random() * borderEntries.length);
        let endIndex = Math.floor(Math.random() * borderEntries.length);
        while (endIndex === startIndex) {
            endIndex = Math.floor(Math.random() * borderEntries.length);
        }

        startTileIndex = borderEntries[startIndex].tileNo;
        startTileDirection = borderEntries[startIndex].direction;
        endTileIndex = borderEntries[endIndex].tileNo;
        endTileDirection = borderEntries[endIndex].direction;
    } else {
        const length = Math.sqrt(tileCount);
        startTileIndex = Math.floor(Math.random() * length) * length; // Randomly select a tile on the left border as the start
        startTileDirection = Math.floor(Math.random() * 2); // Left border entry

        endTileIndex = Math.floor(Math.random() * length) * length + (length - 1); // Randomly select a tile on the right border as the end
        endTileDirection = Math.floor(Math.random() * 2) + 3; // Opposite direction for the end
    }


    return {
        id: nextPuzzleId++,
        startTileIndex,
        startTileDirection,
        endTileIndex,
        endTileDirection,
        board,
    };
}
