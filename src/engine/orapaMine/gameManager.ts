import { type Board, type Color, type LightResult, type Puzzle, type Tile, TileInBoard } from '../arclight/models';
import { borderNodeCoordinates, getBasicTiles, getBoard } from './data';

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
        console.log(`${currentCoordinate}`)
        const currentNode = board.spaces[currentCoordinate];
        if (currentNode.is_border) break;

        if (currentCoordinate in tilesInBoard) {
            const tileInBoard = tilesInBoard[currentCoordinate];

            // Black gem (no arcs AND no colors) – absorb the wave.
            if (tileInBoard.tile.arcs.length === 0 && tileInBoard.tile.colors.length === 0) {
                return { end_label: '', colors: [] };
            }

            // Colored cell with no arcs – beam passes through unaffected (picks up color only).
            if (tileInBoard.tile.arcs.length > 0) {
                const entryFace = (outDir + 2) % 4;

                if (entryFace in tileInBoard.arc_dict) {
                    // Arc matched: redirect to the exit face (which equals the new travel direction).
                    outDir = tileInBoard.arc_dict[entryFace];
                } else {
                    // No matching arc: reflect straight back.
                    outDir = (outDir + 2) % 4;
                }
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
 * Place a set of gem pieces on the board.
 *
 * Each piece is a group of Tile records sharing the same parent_id.
 * The anchor tile has coordinate {0: 0, 1: 0}; siblings carry their
 * (col, row) offset relative to the anchor.
 *
 * Placement rules enforced here:
 *   - Pieces must fit within the 10×8 grid.
 *   - No two pieces may share a cell.
 *   - Piece edges (orthogonal neighbours) may not touch another piece's cells
 *     (corner-to-corner contact is fine).
 */
function putTiles(board: Board, tiles: Tile[]): Record<string, TileInBoard> {
    const tilesInBoard: Record<string, TileInBoard> = {};
    const unavailableCoords = new Set<string>();

    // Mark all border nodes as unavailable.
    for (const [coord, node] of Object.entries(board.spaces)) {
        if (node.is_border) unavailableCoords.add(coord);
    }

    const internalCoords = Object.keys(board.spaces).filter(k => !board.spaces[k].is_border);
    const randomChoice = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

    const placedParentIds = new Set<number>();

    // Identify anchor tiles (relative coordinate = origin).
    const anchorTiles = tiles.filter(t => t.coordinate[0] === 0 && t.coordinate[1] === 0);

    for (const anchorTile of anchorTiles) {
        if (placedParentIds.has(anchorTile.parent_id)) continue;

        const siblings = tiles.filter(
            t => t.parent_id === anchorTile.parent_id && !(t.coordinate[0] === 0 && t.coordinate[1] === 0),
        );

        let placed = false;

        for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
            const anchorCoord = randomChoice(internalCoords);
            if (unavailableCoords.has(anchorCoord)) continue;

            const match = anchorCoord.match(/^c(\d+)r(\d+)$/);
            if (!match) continue;
            const anchorCol = parseInt(match[1], 10);
            const anchorRow = parseInt(match[2], 10);

            // Verify all sibling positions are in-bounds and free.
            const siblingCoords: string[] = [];
            let valid = true;

            for (const sib of siblings) {
                const col = anchorCol + sib.coordinate[0];
                const row = anchorRow + sib.coordinate[1];
                if (col < 1 || col > 10 || row < 1 || row > 8) { valid = false; break; }
                const coord = `c${col}r${row}`;
                if (unavailableCoords.has(coord)) { valid = false; break; }
                siblingCoords.push(coord);
            }

            if (!valid) continue;

            // Place the piece.
            const allCells: Array<{ coord: string; tile: Tile }> = [
                { coord: anchorCoord, tile: anchorTile },
                ...siblings.map((sib, i) => ({ coord: siblingCoords[i], tile: sib })),
            ];

            for (const { coord, tile } of allCells) {
                const tib = new TileInBoard({ tile, coordinate: coord, rotate_angle: 0 });
                tib.resolve_rotate();
                tilesInBoard[coord] = tib;
                unavailableCoords.add(coord);
            }

            // Enforce non-adjacency: mark all orthogonal neighbours of the
            // newly placed cells as unavailable so the next piece cannot touch.
            for (const { coord } of allCells) {
                for (const neighbour of Object.values(board.spaces[coord].edges)) {
                    unavailableCoords.add(neighbour);
                }
            }

            placedParentIds.add(anchorTile.parent_id);
            placed = true;
        }
    }

    return tilesInBoard;
}

/** Create a random Orapa Mine puzzle and pre-compute all wave results. */
export function setup(): Puzzle {
    const board = getBoard();
    const tilesInBoard = putTiles(board, getBasicTiles());

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
