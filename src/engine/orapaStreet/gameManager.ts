import { Color, Direction, Tile, TileInBoard, type Board, type LightResult } from './models';


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
    startLabel: string,
): LightResult[] {
    // Before traverse, add virtual tiles

    const results: LightResult[] = [];
    const labels: string[] = [startLabel];
    const startNode = board.spaces[startLabel];
    // Border nodes have exactly one edge: the direction into the grid.
    const travelDir = Number(Object.keys(startNode.edges)[0]) as Direction;
    let label = startNode.edges[travelDir] ?? "";
    labels.push(label);
    results.push(
        {
            label,
            direction: travelDir,
            colors: [],
        }
    );
    let outDir = travelDir;

    // Guard against infinite reflection loops (e.g. two gems facing each other).
    const MAX_STEPS = 100;

    for (let step = 0; step < MAX_STEPS; step++) {
        const currentNode = board.spaces[label];
        if (currentNode.isBorder) break;
        const inDir = (outDir + 6) % 12 as Direction;

        if (label in tilesInBoard) {
            const tileInBoard = tilesInBoard[label];
            if (inDir in tileInBoard.rotated_reflect) {
                outDir = tileInBoard.rotated_reflect[inDir] as Direction;
            }
        }

        label = currentNode.edges[outDir] ?? "";
        results.push(
            {
                label,
                direction: outDir,
                colors: [],
            }
        );
    }

    return results;
}

export function getLightResult(
    board: Board,
    tilesInBoard: Record<string, TileInBoard>,
    startLabel: string,
) {
    const results = traverse(board, tilesInBoard, startLabel);
    return results[results.length - 1];
}

export function getTilesInBoard(): Record<string, TileInBoard> {
    return {
        "C6": new TileInBoard( {
            tile: new Tile({
                colors: [Color.Blue],
                parentName: "Blue",
                coordinate: { 0: 1, 1: 1 },
                reflect: [[0, 2], [2, 0], [4, 6], [6, 4], [8, 10], [10, 8]],

            }),
            coordinate: "C6",
            rotated_reflect: {
                0:2,
                2:0,
                4:6,
                6:4,
                8:10,
                10:8,
            },
            rotatedLateReflect: {},
            rotate_angle: 0,
        })
    };
}