import { getHexBoard, getRhombicBoard } from './data';
import { BoardType, type Board } from './models';

let nextBoardId = 1;

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

export function setup(boardType: BoardType = BoardType.Rhombic9): Board {
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

    board.boardId = nextBoardId++;
    return board;
}
