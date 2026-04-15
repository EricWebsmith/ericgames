import { type Board } from './models';

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