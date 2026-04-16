import { BoardType, TileInBoard, type Board, type Tile } from './models';

export const borderNodeCoordinates: string[] = [
    ...'ABCDEFGHIJKLMNOPQRSTU'.split(''),
    ...Array.from({ length: 21 }, (_, i) => String(i + 1)),
];

export interface TileOptions {
    includeTransparent: boolean;
    includeBlackHole: boolean;
}

export const defaultTileOptions: TileOptions = {
    includeTransparent: true,
    includeBlackHole: true,
};

/**
 * Get the basic not rotated tiles for the switchboard game.
 * @returns An array of Tile objects representing the basic tiles.
 */
export function getBasicTiles(): Tile[] {
    return [
        { // 3 Short Arcs
            id: 0,
            arcs: [[0, 1], [2, 3], [4, 5]],
        },
        { // 1 Short, 2 Medium Arcs
            id: 1,
            arcs: [[0, 1], [2, 4], [3, 5]],
        },
        { // 2 Medium, 1 Long Arc
            id: 2,
            arcs: [[0, 4], [1, 3], [2, 5]],
        },
        { // 2 Short, 1 Long Arc
            id: 3,
            arcs: [[0, 1], [2, 5], [3, 4]],
        },
    ];
}


/**
 * Flat-topped rhombic board with a positive slope
 * Left border is 0, and the border numbers increase clockwise
 * @param length 
 * @returns 
 */
export function getRhombixBoard(length: number): Board {
    const basicTiles = getBasicTiles();
    const boardLength = Math.sqrt(length);
    if (!Number.isInteger(boardLength)) {
        throw new Error(`Invalid rhombic board size: ${length}`);
    }

    let boardType: BoardType = BoardType.Rhombic9;
    if (length === 16) {
        boardType = BoardType.Rhombic16;
    } else if (length === 25) {
        boardType = BoardType.Rhombic25;
    }
    const board: Board = {
        boardType,
        tiles: [],
    };

    for (let r = 0; r < boardLength; r++) {  // R axis in axial coordinates
        for (let q = 0; q < boardLength; q++) { // Q axis in axial coordinates

            const tileNo = r * boardLength + q;
            // console.log("tileNo", tileNo)
            // Randomly select a tile type for this position
            let tilePrototypeIndex = Math.floor(Math.random() * basicTiles.length);
            while ((q === 0 || q === boardLength - 1) && tilePrototypeIndex === 0) {
                tilePrototypeIndex = Math.floor(Math.random() * basicTiles.length);
            }
            const rotate = Math.floor(Math.random() * 6); // Random rotation angle (0 to 5)
            board.tiles.push(new TileInBoard({ tile: basicTiles[tilePrototypeIndex], tileNo, rotate }));

            // Connect adjacent tiles

            // Connect to the left tile
            if (q > 0) {
                
                board.tiles[tileNo].edges[0] = tileNo - 1; // Left edge of current tile connects to right edge of left tile
                board.tiles[tileNo - 1].edges[3] = tileNo; // Right edge of left tile connects to left edge of current tile
            }
            // Connect to the top tile
            if (r > 0) {
                board.tiles[tileNo].edges[2] = tileNo - boardLength; // Top edge of current tile connects to bottom edge of top tile
                board.tiles[tileNo - boardLength].edges[5] = tileNo; // Bottom edge of top tile connects to top edge of current tile
            }
            // Connect to the top-right tile
            if (q < boardLength - 1 && r > 0) {
                board.tiles[tileNo].edges[1] = tileNo - boardLength + 1; // Top-right edge of current tile connects to bottom-left edge of top-right tile
                board.tiles[tileNo - boardLength + 1].edges[4] = tileNo; // Bottom-left edge of top-right tile connects to top-right edge of current tile
            }
        }
    }

    return board;
}

export function getHexCoordinatesByTileNo(radius: number): Array<{ q: number; r: number; }> {
    const coordinates: Array<{ q: number; r: number; }> = [];
    for (let r = -radius; r <= radius; r++) {
        const qMin = Math.max(-radius, -r - radius);
        const qMax = Math.min(radius, -r + radius);
        for (let q = qMax; q >= qMin; q--) {
            coordinates.push({ q, r });
        }
    }
    return coordinates;
}

/**
 * Flat-topped hexagonal board.
 * @param length Number of tiles in board (supported: 19, 37)
 * @returns Board
 */
export function getHexBoard(length: number): Board {
    const basicTiles = getBasicTiles();

    let boardType: BoardType;
    let radius: number;
    if (length === 19) {
        boardType = BoardType.Hexagonal19;
        radius = 2;
    } else if (length === 37) {
        boardType = BoardType.Hexagonal37;
        radius = 3;
    } else {
        throw new Error(`Invalid hexagonal board size: ${length}`);
    }

    const board: Board = {
        boardType,
        tiles: [],
    };

    const tileNoByCoordinate: Record<string, number> = {};
    const coordinatesByTileNo = getHexCoordinatesByTileNo(radius);

    for (const [tileNo, { q, r }] of coordinatesByTileNo.entries()) {
        const tilePrototypeIndex = Math.floor(Math.random() * basicTiles.length);
        const rotate = Math.floor(Math.random() * 6);

        board.tiles.push(new TileInBoard({ tile: basicTiles[tilePrototypeIndex], tileNo, rotate }));
        tileNoByCoordinate[`${q},${r}`] = tileNo;
    }

    const directionOffsets: Record<number, { dq: number; dr: number; }> = {
        0: { dq: -1, dr: 0 },
        1: { dq: 1, dr: -1 },
        2: { dq: 0, dr: -1 },
        3: { dq: 1, dr: 0 },
        4: { dq: -1, dr: 1 },
        5: { dq: 0, dr: 1 },
    };

    for (let tileNo = 0; tileNo < coordinatesByTileNo.length; tileNo++) {
        const { q, r } = coordinatesByTileNo[tileNo];
        for (let direction = 0; direction < 6; direction++) {
            const { dq, dr } = directionOffsets[direction];
            const neighborTileNo = tileNoByCoordinate[`${q + dq},${r + dr}`];
            if (neighborTileNo !== undefined) {
                board.tiles[tileNo].edges[direction] = neighborTileNo;
            }
        }
    }

    return board;
}
