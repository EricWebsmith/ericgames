import { BoardType, type Board, type Puzzle } from './models';
import { getRhombixBoard } from './data';

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

const RHOMBIC_TILE_COUNT_BY_BOARD_TYPE: Record<BoardType, number> = {
    [BoardType.Rhombic9]: 9,
    [BoardType.Rhombic16]: 16,
    [BoardType.Rhombic25]: 25,
    [BoardType.Hexagonal19]: 19,
    [BoardType.Hexagonal37]: 37,
};

function getStartCandidates(board: Board): Array<{ tileIndex: number; direction: number; }> {
    const candidates: Array<{ tileIndex: number; direction: number; }> = [];

    for (const tile of board.tiles) {
        for (let direction = 0; direction < 6; direction++) {
            if (tile.edges[direction] === undefined) {
                candidates.push({ tileIndex: tile.tileNo, direction });
            }
        }
    }

    return candidates;
}

export function setup(boardType: BoardType = BoardType.Rhombic9): Puzzle {
    if (!(boardType in RHOMBIC_TILE_COUNT_BY_BOARD_TYPE)) {
        throw new Error(`Unsupported board type: ${boardType}`);
    }

    if (boardType === BoardType.Hexagonal19 || boardType === BoardType.Hexagonal37) {
        throw new Error(`Board type not implemented yet: ${boardType}`);
    }

    const board = getRhombixBoard(RHOMBIC_TILE_COUNT_BY_BOARD_TYPE[boardType]);
    for (const tile of board.tiles) {
        tile.resolve_rotate();
    }

    const candidates = getStartCandidates(board);
    if (candidates.length === 0) {
        throw new Error('No border entry points found for board.');
    }

    const start = candidates[Math.floor(Math.random() * candidates.length)];
    const [endTileIndex, endTileDirection] = tranverse(board, start.tileIndex, start.direction);

    return {
        id: Date.now(),
        startTileIndex: start.tileIndex,
        startTileDirection: start.direction,
        endTileIndex,
        endTileDirection,
        board,
    };
}
