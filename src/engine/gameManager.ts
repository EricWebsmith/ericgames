import { borderNodeCoordinates, getBasicTiles, getBoard } from './arclightData';
import { type Board, type Color, type LightResult, type PathStep, type Puzzle, type Tile, TileInBoard } from './models';

export function traverse(board: Board, tilesInBoard: Record<string, TileInBoard>, startCoordinate: string): LightResult {
    const startNode = board.spaces[startCoordinate];
    const outDirKey = Number(Object.keys(startNode.edges)[0]);
    let currentCoordinate = startNode.edges[outDirKey];
    let outDir = outDirKey;
    const colors = new Set<Color>();
    const path: PathStep[] = [];

    while (true) {
        const currentNode = board.spaces[currentCoordinate];
        if (currentNode.is_border) break;

        if (currentCoordinate in tilesInBoard) {
            const tile = tilesInBoard[currentCoordinate];
            const inDir = (outDir + 3) % 6;
            if (!(inDir in tile.arc_dict)) {
                path.push({ coordinate: currentCoordinate, accumulated_colors: [...colors], absorbed: true });
                return { end_label: '', colors: [], path };
            }
            outDir = tile.arc_dict[inDir];
            for (const color of tile.tile.colors) {
                colors.add(color);
            }
            path.push({ coordinate: currentCoordinate, accumulated_colors: [...colors], absorbed: false });
        }

        currentCoordinate = currentNode.edges[outDir];
    }

    return { end_label: currentCoordinate, colors: [...colors], path };
}

function putTiles(board: Board, tiles: Tile[]): Record<string, TileInBoard> {
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

    console.log('unavailable_coordinates', unavailableCoordinates);

    const putTile = (tile: Tile, coordinate: string, rotateAngle: number): void => {
        tilesInBoard[coordinate] = new TileInBoard({ tile, coordinate, rotate_angle: rotateAngle });
        tilesInBoard[coordinate].resolve_rotate();
        unavailableTileIds.add(tile.id);
        unavailableCoordinates.add(coordinate);
        for (const neighbor of Object.values(board.spaces[coordinate].edges)) {
            unavailableCoordinates.add(neighbor);
        }
    };

    const randomChoice = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

    for (const tile of tiles) {
        if (unavailableTileIds.has(tile.id)) continue;

        let randomCoordinate = '';
        const rotation = Math.floor(Math.random() * 6);

        while (randomCoordinate === '' || unavailableCoordinates.has(randomCoordinate)) {
            randomCoordinate = randomChoice(coordinates);
            // Handle double hex tiles
            for (const dirStr of Object.keys(tile.link_tiles)) {
                const dir = Number(dirStr);
                const newDir = (dir + rotation) % 6;
                const neighborCoordinate = board.spaces[randomCoordinate].edges[newDir];
                console.log('neighbor_coordinate in check', neighborCoordinate);
                if (neighborCoordinate === undefined || unavailableCoordinates.has(neighborCoordinate)) {
                    randomCoordinate = '';
                    break;
                }
            }
        }

        putTile(tile, randomCoordinate, rotation);

        for (const [dirStr, neighborTileId] of Object.entries(tile.link_tiles)) {
            const dir = Number(dirStr);
            const neighborTile = tiles[neighborTileId];
            const newDir = (dir + rotation) % 6;
            console.log('dir, new_dir', dir, newDir);
            const neighborCoordinate = board.spaces[randomCoordinate].edges[newDir];
            putTile(neighborTile, neighborCoordinate, rotation);
        }
    }

    return tilesInBoard;
}

export function setup(): Puzzle {
    const board = getBoard();
    const tilesInBoard = putTiles(board, getBasicTiles());

    // Resolve Light Actions
    const lightResults: Record<string, LightResult> = {};
    for (const coord of borderNodeCoordinates) {
        lightResults[coord] = traverse(board, tilesInBoard, coord);
    }

    // Resolve Sight Actions
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
