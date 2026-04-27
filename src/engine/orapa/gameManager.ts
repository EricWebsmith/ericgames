import { borderNodeCoordinates } from '../arclight/data';
import { borderLabels, TileInBoard, type Board, type Color, type LightResult, type ParentTile, type Puzzle } from './models';

function getBlackHoleVirtualTiles(board: Board, tilesInBoard: Record<string, TileInBoard>): Record<string, TileInBoard> {
    const virtualTiles: Record<string, TileInBoard> = {};

    for (const [label, tileInBoard] of Object.entries(tilesInBoard)) {
        if (tileInBoard.tile.blackHole) {
            const centerSpace = board.spaces[label];
            const upSpace = board.spaces[centerSpace.edges[1]];
            const upLeftSpace = board.spaces?.[upSpace.edges[0]];
            const upRightSpace = board.spaces?.[upSpace.edges[2]];
            const downSpace = board.spaces[centerSpace.edges[3]];
            const downLeftSpace = board.spaces?.[downSpace.edges[0]];
            const downRightSpace = board.spaces?.[downSpace.edges[2]];

            if (upLeftSpace) {
                virtualTiles[upLeftSpace.label] = new TileInBoard({
                    tile: tileInBoard.tile,
                    coordinate: upLeftSpace.label,
                    rotate_angle: 0,
                    rotated_reflect: { 3: 2, 2: 3 }
                }
                );
            }

            if (upRightSpace) {
                virtualTiles[upRightSpace.label] = new TileInBoard({
                    tile: tileInBoard.tile,
                    coordinate: upRightSpace.label,
                    rotate_angle: 0,
                    rotated_reflect: { 3: 0, 0: 3 }
                }
                );
            }

            if (downLeftSpace) {
                virtualTiles[downLeftSpace.label] = new TileInBoard({
                    tile: tileInBoard.tile,
                    coordinate: downLeftSpace.label,
                    rotate_angle: 0,
                    rotated_reflect: { 1: 2, 2: 1 }
                }
                );
            }

            if (downRightSpace) {
                virtualTiles[downRightSpace.label] = new TileInBoard({
                    tile: tileInBoard.tile,
                    coordinate: downRightSpace.label,
                    rotate_angle: 0,
                    rotated_reflect: { 1: 0, 0: 1 }
                });
            }

            break; // There is only one black hole tile
        }

    }

    return virtualTiles;
}

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
export function tranverse(
    board: Board,
    tilesInBoard: Record<string, TileInBoard>,
    startCoordinate: string,
): LightResult {
    // Before tranverse, add virtual tiles
    let virtualTiles = getBlackHoleVirtualTiles(board, tilesInBoard);

    const startNode = board.spaces[startCoordinate];
    // Border nodes have exactly one edge: the direction into the grid.
    const travelDir = Number(Object.keys(startNode.edges)[0]);
    let currentCoordinate = startNode.edges[travelDir];
    let outDir = travelDir;
    const colors = new Set<Color>();

    // Guard against infinite reflection loops (e.g. two gems facing each other).
    const MAX_STEPS = 100;

    for (let step = 0; step < MAX_STEPS; step++) {
        const currentNode = board.spaces[currentCoordinate];
        if (currentNode.is_border) break;
        const inDir = (outDir + 2) % 4;
        let lateReflect: Record<number, number> = {};

        if (currentCoordinate in tilesInBoard) {
            const tileInBoard = tilesInBoard[currentCoordinate];
            lateReflect = tileInBoard.rotatedLateReflect;

            // Black gem – absorb the wave entirely.
            if (tileInBoard.tile.absorbLight) {
                return { end_label: '', colors: [] };
            }

            // Colored cell with no arcs: beam passes through unaffected (picks up color only).
            // Only enter this block when the tile has arcs that can redirect the beam.

            let turned = false; // including turning 0 degree (pass through)

            if (tileInBoard.tile.reflect.length > 0) {
                if (inDir in tileInBoard.rotated_reflect) {
                    // Arc matched: redirect to the exit face (which equals the new travel direction).
                    outDir = tileInBoard.rotated_reflect[inDir];
                    turned = true;
                }
            }

            // If not turned 90 degree, turn 180 degree, 
            if (!turned) {
                // No matching arc: reflect straight back.
                outDir = (outDir + 2) % 4;
            }

            for (const color of tileInBoard.tile.colors) {
                colors.add(color);
            }
        }

        // If the light is not affected by the actual tile, use the virtual tile    
        if (Math.abs(outDir - inDir) == 2) {
            if (currentCoordinate in virtualTiles) {
                const virtualTile = virtualTiles[currentCoordinate];
                if (inDir in virtualTile.rotated_reflect) {
                    outDir = virtualTile.rotated_reflect[inDir];
                    virtualTiles = {}; // virtual tiles only work for one reflection
                }
            }
        }

        // Handle Late reflect after all other reflections, but before moving to the next cell.
        if (outDir in lateReflect) {
            outDir = lateReflect[outDir];
        }

        currentCoordinate = currentNode.edges[outDir];
    }

    if (borderNodeCoordinates.includes(currentCoordinate)) {
        return { end_label: currentCoordinate, colors: [...colors] };
    } else {
        return { end_label: '', colors: [] };
    }
}

/**
 * Rotate a (col, row) offset clockwise by `times` × 90°.
 * One 90° CW step in screen coordinates (y increases downward): (col, row) → (−row, col).
 */
function rotateCoord(col: number, row: number, times: number): [number, number] {
    let c = col, r = row;
    for (let i = 0; i < times % 4; i++) {
        [c, r] = [-r, c];
    }
    return [c, r];
}

/**
 * Place all subtiles of a single piece at a specific anchor coordinate on the board.
 *
 * The anchor subtile has relative coordinate (0, 0); every other subtile is placed
 * at anchorLabel offset by its (col, row) delta, rotated clockwise by rotateAngle × 90°.
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
        const [rotCol, rotRow] = rotateCoord(subTile.coordinate[0], subTile.coordinate[1], rotateAngle);
        const row = anchorRow + rotRow;
        const col = anchorCol + rotCol;
        const coord = `${rowLetters[row]}${col}`;
        const tib = new TileInBoard({ tile: subTile, coordinate: coord, rotate_angle: rotateAngle });
        tib.resolve_rotate();
        result[coord] = tib;
    }

    return result;
}

export function borderTouch(board: Board, tilesInBoard: Record<string, TileInBoard>, newTilesInBoard: Record<string, TileInBoard>): boolean {
    for (const [label, tile] of Object.entries(newTilesInBoard)) {
        for (let dir = 0; dir < 4; dir++) {
            if (dir in tile.rotated_reflect) {
                continue;
            }
            const space = board.spaces[label];
            const neiborSpaceLabel = space.edges[dir];
            if (!(neiborSpaceLabel in tilesInBoard)) {
                continue;
            }
            const neiborTile = tilesInBoard[neiborSpaceLabel];
            const neiborDir = (dir + 2) % 4;
            if (!(neiborDir in neiborTile.rotated_reflect)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Travel in a straight line from a border node (no reflections) and return the
 * parentName of the first gem tile encountered, or null if no gem is found.
 *
 * A "gem tile" is any tile whose colors array is non-empty.
 * Any occupied tile (including black and transparent tiles) blocks the line of
 * sight – if the first occupied cell is not a gem, null is returned.
 */
export function firstSee(
    board: Board,
    tilesInBoard: Record<string, TileInBoard>,
    startLabel: string,
): string | null {
    const startNode = board.spaces[startLabel];
    const travelDir = Number(Object.keys(startNode.edges)[0]);
    let currentLabel = startNode.edges[travelDir];

    while (true) {
        const currentNode = board.spaces[currentLabel];
        if (currentNode.is_border) break;

        if (currentLabel in tilesInBoard) {
            return tilesInBoard[currentLabel].tile.parentName;
        }

        currentLabel = currentNode.edges[travelDir];
    }

    return null;
}

/**
 * Check whether all gem tiles in the combined board (tilesInBoard + newTilesInBoard)
 * are visible from at least one border direction via a straight-line beam.
 *
 * Returns true if every gem's parentName appears among the first-seen gems from
 * at least one border node, false if any gem is fully hidden.
 */
export function allVisible(board: Board, tilesInBoard: Record<string, TileInBoard>, newTilesInBoard: Record<string, TileInBoard>): boolean {
    const combinedTiles = { ...tilesInBoard, ...newTilesInBoard };

    // Collect parentNames of all gem tiles in the combined board.
    const allGemParentNames = new Set<string>();
    for (const tib of Object.values(combinedTiles)) {
        if (tib.tile.colors.length > 0 && tib.tile.parentName) {
            allGemParentNames.add(tib.tile.parentName);
        }
    }

    if (allGemParentNames.size === 0) return true;

    // Find all gem parentNames visible from any border node.
    const visibleParentNames = new Set<string>();
    for (const borderLabel of borderLabels) {
        const parentName = firstSee(board, combinedTiles, borderLabel);
        if (parentName !== null) {
            visibleParentNames.add(parentName);
        }
    }

    // Every gem must be visible from at least one direction.
    for (const name of allGemParentNames) {
        if (!visibleParentNames.has(name)) {
            return false;
        }
    }
    return true;
}

/**
 * The White Big tile must connect to the border.
 * @param board 
 * @param tiles 
 * @returns 
 */
function checkBorderConnection(board: Board, tiles: TileInBoard[]): boolean {
    for (const tile of tiles) {
        if (!tile.tile.connectBorder) {
            continue;
        }

        let connected = false;
        for (let dir = 0; dir < 4; dir++) {
            const label = board.spaces[tile.coordinate].edges[dir];
            if (borderLabels.includes(label)) {
                connected = true;
            }
        }
        if (!connected) {
            return false;
        }
    }

    return true;
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
    const occupiedSpaces = new Set<string>();

    // Mark all border nodes as unavailable.
    for (const [coord, node] of Object.entries(board.spaces)) {
        if (node.is_border) occupiedSpaces.add(coord);
    }

    const internalCoords = Object.keys(board.spaces).filter(k => !board.spaces[k].is_border);
    const randomChoice = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];
    const rowLetters = 'ABCDEFGH';

    for (const parentTile of tiles) {
        let placed = false;

        for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
            const anchorCoord = randomChoice(internalCoords);
            if (occupiedSpaces.has(anchorCoord)) continue;

            const m = anchorCoord.match(/^([A-H])(\d{1,2})$/);
            if (!m) continue;
            const anchorRow = rowLetters.indexOf(m[1]);
            const anchorCol = parseInt(m[2], 10);

            const rotateAngle = Math.floor(Math.random() * 4);

            // Verify all subtile positions (after rotation) are in-bounds and free.
            let valid = true;
            for (const subTile of parentTile.subTiles) {
                const [rotCol, rotRow] = rotateCoord(subTile.coordinate[0], subTile.coordinate[1], rotateAngle);
                const row = anchorRow + rotRow;
                const col = anchorCol + rotCol;
                if (row < 0 || row >= 8 || col < 1 || col > 10) { valid = false; break; }
                const coord = `${rowLetters[row]}${col}`;
                if (occupiedSpaces.has(coord)) { valid = false; break; }
            }
            if (!valid) continue;

            // Check border connection
            const newTiles = putTile(parentTile, anchorCoord, rotateAngle);
            if (!checkBorderConnection(board, Object.values(newTiles))) continue;

            if (!allVisible(board, tilesInBoard, newTiles)) continue;

            // Place the piece via putTile and merge into tilesInBoard.

            const borderTouched = borderTouch(board, tilesInBoard, newTiles);
            if (borderTouched) continue;

            for (const [coord, tib] of Object.entries(newTiles)) {
                tilesInBoard[coord] = tib;
                occupiedSpaces.add(coord);
            }

            placed = true;
        }
    }

    return tilesInBoard;
}

/** Create an Orapa puzzle from a pre-built tile placement and pre-compute all wave results. */
export function setupWithPlacement(board: Board, tilesInBoard: Record<string, TileInBoard>): Puzzle {
    const lightResults: Record<string, LightResult> = {};
    for (const coord of borderLabels) {
        lightResults[coord] = tranverse(board, tilesInBoard, coord);
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

/** Create a random Orapa Mine puzzle and pre-compute all wave results. */
export function setup(board: Board, tiles: ParentTile[]): Puzzle {
    const tilesInBoard = putTiles(board, tiles);

    // Compute wave results for every border position.
    const lightResults: Record<string, LightResult> = {};
    for (const coord of borderLabels) {
        lightResults[coord] = tranverse(board, tilesInBoard, coord);
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
