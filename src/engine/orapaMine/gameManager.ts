import { borderNodeCoordinates, getBoard, getTiles } from './data';
import { TileInBoard, type Board, type Color, type LightResult, type ParentTile, type Puzzle } from './models';

/**
 * Traverse the board from a border node and return where the wave exits and
 * what colours it collected.
 *
 * OrapaMine rules differ from Arclight:
 *   - The grid is rectangular (square cells), so there are 4 directions:
 *       0 = West, 1 = North, 2 = East, 3 = South
 *   - Directions on an arc represent *faces* of a cell, not travel directions.
 *     arc [a, b] means: wave entering through face a exits through face b (and
 *     vice-versa, the mapping is bidirectional).
 *   - If the wave hits a gem but no arc matches its entry face, it is reflected
 *     straight back (travel direction reverses by 180°).
 *   - A gem with arcs: [] is a black gem and absorbs the wave entirely.
 *
 * Entry face vs. travel direction:
 *   travel_dir 0 (West)  → entry face 2 (East),  i.e. (travel_dir + 2) % 4
 *   travel_dir 1 (North) → entry face 3 (South)
 *   travel_dir 2 (East)  → entry face 0 (West)
 *   travel_dir 3 (South) → entry face 1 (North)
 *
 * After redirecting via an arc, the new travel direction equals the exit face
 * (face 1 = North face → travel North, etc.).
 */
export function traverse(
    board: Board,
    tilesInBoard: Record<string, TileInBoard>,
    startCoordinate: string,
): LightResult {
    const startNode = board.spaces[startCoordinate];
    // Border nodes have exactly one edge: the direction into the grid.
    const travelDir = Number(Object.keys(startNode.edges)[0]);
    let currentCoordinate = startNode.edges[travelDir];
    let outDir = travelDir;
    const colors = new Set<Color>();

    // Guard against infinite reflection loops (e.g. two gems facing each other).
    const MAX_STEPS = 400;

    for (let step = 0; step < MAX_STEPS; step++) {
        const currentNode = board.spaces[currentCoordinate];
        if (currentNode.is_border) break;

        if (currentCoordinate in tilesInBoard) {
            const tileInBoard = tilesInBoard[currentCoordinate];

            // Black gem – absorb the wave entirely.
            if (tileInBoard.tile.absorbLight) {
                return { end_label: '', colors: [] };
            }

            // Colored cell with no arcs: beam passes through unaffected (picks up color only).
            // Only enter this block when the tile has arcs that can redirect the beam.

            let turned90 = false;
            if (tileInBoard.tile.reflect.length > 0) {

                const entryFace = (outDir + 2) % 4;

                if (entryFace in tileInBoard.rotated_reflect) {
                    // Arc matched: redirect to the exit face (which equals the new travel direction).
                    outDir = tileInBoard.rotated_reflect[entryFace];
                    turned90 = true;
                }
            }

            // If not turned 90 degree, turn 180 degree, 
            if (!turned90) {
                // No matching arc: reflect straight back.
                outDir = (outDir + 2) % 4;
            }

            for (const color of tileInBoard.tile.colors) {
                colors.add(color);
            }
        }
        currentCoordinate = currentNode.edges[outDir];
    }

    return { end_label: currentCoordinate, colors: [...colors] };
}

/**
 * Place all subtiles of a single piece at a specific anchor coordinate on the board.
 *
 * The anchor subtile has relative coordinate (0, 0); every other subtile is placed
 * at anchorLabel offset by its (col, row) delta.
 *
 * Coordinate format: `{Letter}{Number}` where A–H are rows 0–7 and 1–10 are
 * columns (matching the labels produced by getBoard()).
 */
export function putTile(
    tile: ParentTile,
    anchorLabel: string,
    rotateAngle: number = 0,
): Record<string, TileInBoard> {
    const rowLetters = 'ABCDEFGH';
    const m = anchorLabel.match(/^([A-H])(\d{1,2})$/);
    if (!m) throw new Error(`Invalid anchor coordinate: ${anchorLabel}`);
    const anchorRow = rowLetters.indexOf(m[1]);
    const anchorCol = parseInt(m[2], 10);

    const result: Record<string, TileInBoard> = {};

    for (const subTile of tile.subTiles) {
        const row = anchorRow + subTile.coordinate[1];
        const col = anchorCol + subTile.coordinate[0];
        const coord = `${rowLetters[row]}${col}`;
        const tib = new TileInBoard({ tile: subTile, coordinate: coord, rotate_angle: rotateAngle });
        tib.resolve_rotate();
        result[coord] = tib;
    }

    return result;
}

/**
 * Place a set of gem pieces on the board.
 *
 * Each ParentTile carries its subTiles with (col, row) offsets relative to the
 * anchor subtile (coordinate {0: 0, 1: 0}).
 *
 * Placement rules enforced here:
 *   - Pieces must fit within the 10×8 grid.
 *   - No two pieces may share a cell.
 *   - Piece edges (orthogonal neighbours) may not touch another piece's cells
 *     (corner-to-corner contact is fine).
 */
function putTiles(board: Board, tiles: ParentTile[]): Record<string, TileInBoard> {
    const tilesInBoard: Record<string, TileInBoard> = {};
    const unavailableCoords = new Set<string>();

    // Mark all border nodes as unavailable.
    for (const [coord, node] of Object.entries(board.spaces)) {
        if (node.is_border) unavailableCoords.add(coord);
    }

    const internalCoords = Object.keys(board.spaces).filter(k => !board.spaces[k].is_border);
    const randomChoice = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];
    const rowLetters = 'ABCDEFGH';

    for (const parentTile of tiles) {
        let placed = false;

        for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
            const anchorCoord = randomChoice(internalCoords);
            if (unavailableCoords.has(anchorCoord)) continue;

            const m = anchorCoord.match(/^([A-H])(\d{1,2})$/);
            if (!m) continue;
            const anchorRow = rowLetters.indexOf(m[1]);
            const anchorCol = parseInt(m[2], 10);

            // Verify all subtile positions are in-bounds and free.
            let valid = true;
            for (const subTile of parentTile.subTiles) {
                const row = anchorRow + subTile.coordinate[1];
                const col = anchorCol + subTile.coordinate[0];
                if (row < 0 || row >= 8 || col < 1 || col > 10) { valid = false; break; }
                const coord = `${rowLetters[row]}${col}`;
                if (unavailableCoords.has(coord)) { valid = false; break; }
            }
            if (!valid) continue;

            // Place the piece via putTile and merge into tilesInBoard.
            const newTiles = putTile(parentTile, anchorCoord, 0);
            for (const [coord, tib] of Object.entries(newTiles)) {
                tilesInBoard[coord] = tib;
                unavailableCoords.add(coord);
            }

            // Enforce non-adjacency: mark all orthogonal neighbours as unavailable.
            for (const coord of Object.keys(newTiles)) {
                for (const neighbour of Object.values(board.spaces[coord].edges)) {
                    unavailableCoords.add(neighbour);
                }
            }

            placed = true;
        }
    }

    return tilesInBoard;
}

/** Create a random Orapa Mine puzzle and pre-compute all wave results. */
export function setup(): Puzzle {
    const board = getBoard();
    const tiles = getTiles();
    const tilesInBoard = putTiles(board, tiles);

    // Compute wave results for every border position.
    const lightResults: Record<string, LightResult> = {};
    for (const coord of borderNodeCoordinates) {
        lightResults[coord] = traverse(board, tilesInBoard, coord);
    }

    // Compute sight results (which gem, if any, occupies each internal cell).
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
