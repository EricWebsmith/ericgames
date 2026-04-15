import { type Board } from './models';

export function tranverse(board: Board, startTileIndex: number, startDirection: number): [number, number] {
    let currentTileIndex = startTileIndex;
    let currentDirection = startDirection;
    let currentTile = board.tiles[currentTileIndex];
    console.log("Start Tile", currentTile);

    while (true) {
        console.log("===========================");
        console.log("Current Tile Index and Direction", currentTileIndex, currentDirection);
        console.log("currentTile", currentTile);

        const outDir = currentTile.arcDict[currentDirection];
        console.log("outDir", outDir);
        const nextTileIndex = currentTile.edges[outDir];
        console.log("nextTileIndex", nextTileIndex);
        if (nextTileIndex === undefined) {
            return [currentTileIndex, outDir];
        }

        // Next
        currentTileIndex = nextTileIndex;
        currentDirection = (outDir + 3) % 6;
        currentTile = board.tiles[currentTileIndex];
    }
}