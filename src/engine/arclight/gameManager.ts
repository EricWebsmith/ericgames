import { borderNodeCoordinates, getBasicTiles, getBoard, type TileOptions, defaultTileOptions } from './data';
import { type Board, type Color, type LightResult, type Puzzle, type Tile, TileInBoard } from './models';

export function traverse(board: Board, tilesInBoard: Record<string, TileInBoard>, startCoordinate: string): LightResult {
    const startNode = board.spaces[startCoordinate];
    const outDirKey = Number(Object.keys(startNode.edges)[0]);
    let currentCoordinate = startNode.edges[outDirKey];
    let outDir = outDirKey;
    const colors = new Set<Color>();

    while (true) {
        const currentNode = board.spaces[currentCoordinate];
        if (currentNode.is_border) break;

        if (currentCoordinate in tilesInBoard) {
            const tile = tilesInBoard[currentCoordinate];
            const inDir = (outDir + 3) % 6;
            if (!(inDir in tile.arc_dict)) {
                return { end_label: '', colors: [] };
            }
            outDir = tile.arc_dict[inDir];
            for (const color of tile.tile.colors) {
                colors.add(color);
            }
        }

        currentCoordinate = currentNode.edges[outDir];
    }

    return { end_label: currentCoordinate, colors: [...colors] };
}

// Maps axial coordinate offset (q, r) to hex direction (0-5).
// Directions and their offsets in axial (q, r) coordinates:
//   0: (-1,  0), 1: ( 0, -1), 2: (+1, -1)
//   3: (+1,  0), 4: ( 0, +1), 5: (-1, +1)
const AXIAL_OFFSETS: Array<[number, number]> = [
    [-1,  0],
    [ 0, -1],
    [ 1, -1],
    [ 1,  0],
    [ 0,  1],
    [-1,  1],
];

function coordinateToDirection(coordinate: Record<number, number>): number {
    const q = coordinate[0];
    const r = coordinate[1];
    const dir = AXIAL_OFFSETS.findIndex(([dq, dr]) => dq === q && dr === r);
    if (dir === -1) throw new Error(`Invalid axial coordinate offset: (${q}, ${r})`);
    return dir;
}

/**
 * Simple 32-bit LCG seeded random number generator.
 * Returns a function that produces values in [0, 1).
 */
function seededRandom(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function putTiles(board: Board, tiles: Tile[], rng: () => number): Record<string, TileInBoard> {
    const coordinates: string[] = [];
    const unavailableCoordinates = new Set<string>();

    for (const [coordinate, node] of Object.entries(board.spaces)) {
        if (node.is_border) {
            unavailableCoordinates.add(coordinate);
        } else {
            coordinates.push(coordinate);
        }
    }

    const tilesInBoard: Record<string, TileInBoard> = {};
    const unavailableTileIds = new Set<number>();

    const putTile = (tile: Tile, coordinate: string, rotateAngle: number): void => {
        tilesInBoard[coordinate] = new TileInBoard({ tile, coordinate, rotate_angle: rotateAngle });
        tilesInBoard[coordinate].resolve_rotate();
        unavailableTileIds.add(tile.id);
        unavailableCoordinates.add(coordinate);
        for (const neighbor of Object.values(board.spaces[coordinate].edges)) {
            unavailableCoordinates.add(neighbor);
        }
    };

    const randomChoice = (arr: string[]): string => arr[Math.floor(rng() * arr.length)];

    for (const tile of tiles) {
        if (unavailableTileIds.has(tile.id)) continue;
        // Skip non-anchor group tiles (siblings placed when their anchor is placed)
        if (tile.parent_id !== undefined && tile.parent_id !== tile.parent_id) continue;

        // Find all sibling tiles in the same group (non-anchor members with offset coordinates)
        const siblingTiles = tile.parent_id !== undefined
            ? tiles.filter(t => t.parent_id === tile.parent_id && t.id !== tile.id && t.coordinate !== undefined)
            : [];

        let randomCoordinate = '';
        const rotation = Math.floor(rng() * 6);

        while (randomCoordinate === '' || unavailableCoordinates.has(randomCoordinate)) {
            randomCoordinate = randomChoice(coordinates);
            // Handle double hex tiles: ensure all sibling positions are also available
            for (const siblingTile of siblingTiles) {
                const dir = coordinateToDirection(siblingTile.coordinate!);
                const newDir = (dir + rotation) % 6;
                const neighborCoordinate = board.spaces[randomCoordinate].edges[newDir];
                if (neighborCoordinate === undefined || unavailableCoordinates.has(neighborCoordinate)) {
                    randomCoordinate = '';
                    break;
                }
            }
        }

        putTile(tile, randomCoordinate, rotation);

        for (const siblingTile of siblingTiles) {
            const dir = coordinateToDirection(siblingTile.coordinate!);
            const newDir = (dir + rotation) % 6;
            const neighborCoordinate = board.spaces[randomCoordinate].edges[newDir];
            putTile(siblingTile, neighborCoordinate, rotation);
        }
    }

    return tilesInBoard;
}

export function setupWithPlacement(tilesInBoard: Record<string, TileInBoard>): Puzzle {
    const board = getBoard();

    const lightResults: Record<string, LightResult> = {};
    for (const coord of borderNodeCoordinates) {
        lightResults[coord] = traverse(board, tilesInBoard, coord);
    }

    const sightResults: Record<string, Color[]> = {};
    for (const node of Object.values(board.spaces)) {
        if (node.is_border) continue;
        const coord = node.label;
        sightResults[coord] = coord in tilesInBoard ? tilesInBoard[coord].tile.colors : [];
    }

    return {
        id: 0,
        tiles: Object.values(tilesInBoard),
        light_results: lightResults,
        sight_results: sightResults,
    };
}

/** Create a puzzle with a specific seed so the same puzzle can be reproduced from a URL. */
export function setupWithSeed(options: TileOptions, seed: number): Puzzle {
    const board = getBoard();
    const rng = seededRandom(seed);
    const tilesInBoard = putTiles(board, getBasicTiles(options), rng);

    const lightResults: Record<string, LightResult> = {};
    for (const coord of borderNodeCoordinates) {
        lightResults[coord] = traverse(board, tilesInBoard, coord);
    }

    const sightResults: Record<string, Color[]> = {};
    for (const node of Object.values(board.spaces)) {
        if (node.is_border) continue;
        const coord = node.label;
        sightResults[coord] = coord in tilesInBoard ? tilesInBoard[coord].tile.colors : [];
    }

    return {
        id: 0,
        tiles: Object.values(tilesInBoard),
        light_results: lightResults,
        sight_results: sightResults,
    };
}

export function setup(options: TileOptions = defaultTileOptions): Puzzle {
    const seed = Math.floor(Math.random() * 0xFFFFFFFF);
    return setupWithSeed(options, seed);
}
