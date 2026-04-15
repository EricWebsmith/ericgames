import { getRhombixBoard } from './data';
import { BoardType, type Board, type Puzzle } from './models';

let nextPuzzleId = 1;

export function traverse(board: Board, startTileIndex: number, startDirection: number): [number, number] {
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

export function tranverse(board: Board, startTileIndex: number, startDirection: number): [number, number] {
    return traverse(board, startTileIndex, startDirection);
}

const RHOMBIC_TILE_COUNT_BY_BOARD_TYPE: Record<BoardType, number> = {
    [BoardType.Rhombic9]: 9,
    [BoardType.Rhombic16]: 16,
    [BoardType.Rhombic25]: 25,
    [BoardType.Hexagonal19]: 19,
    [BoardType.Hexagonal37]: 37,
};

export function setup(boardType: BoardType = BoardType.Rhombic9): Puzzle {
    if (!(boardType in RHOMBIC_TILE_COUNT_BY_BOARD_TYPE)) {
        throw new Error(`Unsupported board type: ${boardType}`);
    }

    if (boardType === BoardType.Hexagonal19 || boardType === BoardType.Hexagonal37) {
        throw new Error(`Board type not implemented yet: ${boardType}`);
    }

    const tileCount = RHOMBIC_TILE_COUNT_BY_BOARD_TYPE[boardType];
    const length = Math.sqrt(tileCount);

    const board = getRhombixBoard(tileCount);
    for (const tile of board.tiles) {
        tile.resolve_rotate();
    }

    const startTileIndex = Math.floor(Math.random() * length) * length; // Randomly select a tile on the left border as the start
    const startTileDirection = Math.floor(Math.random() * 2); // Left border entry

    const endTileIndex = Math.floor(Math.random() * length) * length + (length - 1); // Randomly select a tile on the right border as the end
    const endTileDirection = Math.floor(Math.random() * 2) + 3; // Opposite direction for the end


    return {
        id: nextPuzzleId++,
        startTileIndex,
        startTileDirection,
        endTileIndex,
        endTileDirection,
        board,
    };
}
