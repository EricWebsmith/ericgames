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

const directionOffsets: Record<number, { dq: number; dr: number; }> = {
    0: { dq: -1, dr: 0 },
    1: { dq: 0, dr: -1 },
    2: { dq: 1, dr: -1 },
    3: { dq: 1, dr: 0 },
    4: { dq: 0, dr: 1 },
    5: { dq: -1, dr: 1 },
};

export function getRhombicCoordinatesByTileNo(length: number): Array<{ q: number; r: number; }> {
    const boardLength = Math.sqrt(length);
    if (!Number.isInteger(boardLength)) {
        throw new Error(`Invalid rhombic board size: ${length}`);
    }

    const coordinates: Array<{ q: number; r: number; }> = [];
    for (let r = 0; r < boardLength; r++) {
        for (let q = -r; q < boardLength-r; q++) {
            coordinates.push({ q, r });
        }
    }

    return coordinates;
}

function getBoundaryEndpoints(coordinatesByTileNo: Array<{ q: number; r: number; }>): {
    startTileIndex: number;
    startTileDirection: number;
    endTileIndex: number;
    endTileDirection: number;
} {
    const rValues = coordinatesByTileNo.map(({ r }) => r);
    const rMin = Math.min(...rValues);
    const rMax = Math.max(...rValues);

    const topTileIndices = coordinatesByTileNo
        .map((coordinate, tileNo) => coordinate.r === rMin ? tileNo : -1)
        .filter((tileNo) => tileNo >= 0);

    const bottomTileIndices = coordinatesByTileNo
        .map((coordinate, tileNo) => coordinate.r === rMax ? tileNo : -1)
        .filter((tileNo) => tileNo >= 0);

    const startTileIndex = topTileIndices[Math.floor(Math.random() * topTileIndices.length)];
    const endTileIndex = bottomTileIndices[Math.floor(Math.random() * bottomTileIndices.length)];
    const startTileDirection = Math.floor(Math.random() * 2) + 1; // 1 or 2
    const endTileDirection = Math.floor(Math.random() * 2) + 4; // 4 or 5

    return { startTileIndex, startTileDirection, endTileIndex, endTileDirection };
}


/**
 * Flat-topped rhombic board with a positive slope
 * Left border is 0, and the border numbers increase clockwise
 * @param length 
 * @returns 
 */
export function getRhombicBoard(length: number): Board {
    const basicTiles = getBasicTiles();
    const boardLength = Math.sqrt(length);
    const coordinatesByTileNo = getRhombicCoordinatesByTileNo(length);
    const tileNoByCoordinate: Record<string, number> = {};

    let boardType: BoardType = BoardType.Rhombic9;
    if (length === 16) {
        boardType = BoardType.Rhombic16;
    } else if (length === 25) {
        boardType = BoardType.Rhombic25;
    }
    const board: Board = {
        boardId: 0,
        boardType,
        ...getBoundaryEndpoints(coordinatesByTileNo),
        tiles: [],
    };

    for (const [tileNo, { q, r }] of coordinatesByTileNo.entries()) {
        let tilePrototypeIndex = Math.floor(Math.random() * basicTiles.length);
        while ((q === 0 || q === boardLength - 1) && tilePrototypeIndex === 0) {
            tilePrototypeIndex = Math.floor(Math.random() * basicTiles.length);
        }
        const rotate = Math.floor(Math.random() * 6);
        board.tiles.push(new TileInBoard({ tile: basicTiles[tilePrototypeIndex], tileNo, rotate }));
        tileNoByCoordinate[`${q},${r}`] = tileNo;
    }

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

    console.log("Generated rhombic board:", board);

    return board;
}

export function getHexCoordinatesByTileNo(radius: number): Array<{ q: number; r: number; }> {
    const coordinates: Array<{ q: number; r: number; }> = [];
    for (let r = -radius; r <= radius; r++) {
        const qMin = Math.max(-radius, -r - radius);
        const qMax = Math.min(radius, -r + radius);
        for (let q = qMin; q <= qMax; q++) {
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

    const tileNoByCoordinate: Record<string, number> = {};
    const coordinatesByTileNo = getHexCoordinatesByTileNo(radius);
    const board: Board = {
        boardId: 0,
        boardType,
        ...getBoundaryEndpoints(coordinatesByTileNo),
        tiles: [],
    };
    console.log("coordinatesByTileNo", coordinatesByTileNo);

    for (const [tileNo, { q, r }] of coordinatesByTileNo.entries()) {
        const tilePrototypeIndex = Math.floor(Math.random() * basicTiles.length);
        const rotate = Math.floor(Math.random() * 6);

        board.tiles.push(new TileInBoard({ tile: basicTiles[tilePrototypeIndex], tileNo, rotate }));
        tileNoByCoordinate[`${q},${r}`] = tileNo;
    }

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

    console.log("Generated hex board:", board);

    return board;
}
