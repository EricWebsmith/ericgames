import {
  Color,
  Direction,
  Orient,
  Tile,
  TileInBoard,
  type Board,
  type LightResult,
  type ParentTile,
  type Puzzle,
} from "./models";
import { rotateCoord } from "./triangleUtils";

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
  const colors = new Set<Color>();
  const startNode = board.spaces[startLabel];
  // Border nodes have exactly one edge: the direction into the grid.
  const travelDir = Number(Object.keys(startNode.edges)[0]) as Direction;
  let label = startNode.edges[travelDir] ?? "";
  labels.push(label);
  results.push({
    label,
    direction: travelDir,
    colors: [],
  });
  let outDir = travelDir;

  // Guard against infinite reflection loops (e.g. two gems facing each other).
  const MAX_STEPS = 100;

  for (let step = 0; step < MAX_STEPS; step++) {
    const currentNode = board.spaces[label];
    if (currentNode.isBorder) break;
    const inDir = ((outDir + 6) % 12) as Direction;

    if (label in tilesInBoard) {
      const tileInBoard = tilesInBoard[label];
      for (const color of tileInBoard.tile.colors) {
        colors.add(color);
      }
      if (inDir in tileInBoard.rotated_reflect) {
        outDir = tileInBoard.rotated_reflect[inDir] as Direction;
      }
    }

    label = currentNode.edges[outDir] ?? "";
    results.push({
      label,
      direction: outDir,
      colors: [...colors],
    });
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

export function getBorderLabels(board: Board): string[] {
  return Object.values(board.spaces)
    .filter((node) => node.isBorder)
    .map((node) => node.name);
}

export function getTilesInBoard(board: Board): Record<string, TileInBoard> {
  const positions = Object.values(board.spaces)
    .filter((node) => !node.isBorder)
    .map((node) => node.name);
  const shuffledPositions = [...positions];
  for (let index = shuffledPositions.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledPositions[index], shuffledPositions[randomIndex]] = [
      shuffledPositions[randomIndex],
      shuffledPositions[index],
    ];
  }

  const rightRotatedReflect = {
    0: 2,
    2: 0,
    4: 6,
    6: 4,
    8: 10,
    10: 8,
  };

  const leftRotatedReflect = {
    0: 10,
    10: 0,
    8: 6,
    6: 8,
    2: 4,
    4: 2,
  };

  const tileColors = [Color.Red, Color.Blue, Color.Yellow, Color.White];

  return Object.fromEntries(
    shuffledPositions.slice(0, 10).map((position) => {
      const color = tileColors[Math.floor(Math.random() * tileColors.length)];
      return [
        position,
        new TileInBoard({
          tile: new Tile({
            colors: [color],
            orient: Orient.PointyLeft,
            parentName: `${color[0].toUpperCase()}${color.slice(1)}`,
            coordinate: { 0: 1, 1: 1 },
            reflect: [
              [0, 2],
              [2, 0],
              [4, 6],
              [6, 4],
              [8, 10],
              [10, 8],
            ],
          }),
          label: position,
          rotated_reflect:
            board.spaces[position].orientation === Orient.PointyLeft
              ? leftRotatedReflect
              : rightRotatedReflect,
          rotatedLateReflect: {},
          rotate_angle: 0,
        }),
      ];
    }),
  );
}

export function putTile(
  board: Board,
  tile: ParentTile,
  anchorLabel: string,
  rotateAngle: number = 0,
): Record<string, TileInBoard> {
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const m = anchorLabel.match(/^([A-Z])(\d{1,2})$/);
  if (!m) throw new Error(`Invalid anchor coordinate: ${anchorLabel}`);
  const anchorRow = rowLetters.indexOf(m[1]);
  const anchorCol = parseInt(m[2], 10);

  const result: Record<string, TileInBoard> = {};

  for (const subTile of tile.subTiles) {
    const offsets = rotateCoord(
      subTile.coordinate[0],
      subTile.coordinate[1],
      rotateAngle as 60 | 120 | 180 | 240 | 300,
    );

    const q = anchorCol + offsets.q;
    const r = anchorRow + offsets.r;

    const nodeToPut = board.spacesByQr[q]?.[r];

    const tib = new TileInBoard({
      tile: subTile,
      label: nodeToPut.name,
      rotate_angle: rotateAngle,
    });
    tib.resolve_rotate();
    result[nodeToPut.name] = tib;
  }

  return result;
}

function putTiles(
  board: Board,
  tiles: ParentTile[],
  rng: () => number,
): Record<string, TileInBoard> {
  const tilesInBoard: Record<string, TileInBoard> = {};
  const occupiedSpaces = new Set<string>();

  // Mark all border nodes as unavailable.
  for (const [coord, node] of Object.entries(board.spaces)) {
    if (node.isBorder) occupiedSpaces.add(coord);
  }

  const internalCoords = Object.keys(board.spaces).filter(
    (k) => !board.spaces[k].isBorder,
  );
  const randomChoice = (arr: string[]): string =>
    arr[Math.floor(rng() * arr.length)];

  for (const parentTile of tiles) {
    let placed = false;

    for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
      const anchorLabel = randomChoice(internalCoords);
      const anchorNode = board.spaces[anchorLabel];
      const anchorRow = anchorNode.q;
      const anchorCol = anchorNode.r;

      const rotateAngle = Math.floor(rng() * 6) * 60;

      // Verify all subtile positions (after rotation) are in-bounds and free.
      let valid = false;
      for (const subTile of parentTile.subTiles) {
        const newCoord = rotateCoord(
          subTile.coordinate[0],
          subTile.coordinate[1],
          rotateAngle as 60 | 120 | 180 | 240 | 300,
        );
        const q = anchorCol + newCoord.q;
        const r = anchorRow + newCoord.r;

        const nodeToPut = board.spacesByQr[q]?.[r];
        if (!nodeToPut) {
          break;
        }

        if (occupiedSpaces.has(nodeToPut.name)) {
          break;
        }

        valid = true;
      }

      if (!valid) continue;

      // Check border connection
      const newTiles = putTile(board, parentTile, anchorLabel, rotateAngle);

      for (const [label, tib] of Object.entries(newTiles)) {
        tilesInBoard[label] = tib;
        occupiedSpaces.add(label);
        for (const neighbor in board.spaces[label].neighbors) {
          occupiedSpaces.add(neighbor);
        }
      }

      placed = true;
    }
  }

  return tilesInBoard;
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

/** Create a random Orapa puzzle with a specific seed and pre-compute all wave results. */
export function setupWithSeed(
  board: Board,
  tiles: ParentTile[],
  seed: number,
): Puzzle {
  const rng = seededRandom(seed);
  const tilesInBoard = putTiles(board, tiles, rng);
  const borderLabels = Object.values(board.spaces)
    .filter((node) => node.isBorder === true)
    .map((node) => node.name);

  const lightResults: Record<string, LightResult> = {};
  for (const coord of borderLabels) {
    lightResults[coord] = getLightResult(board, tilesInBoard, coord);
  }

  const sightResults: Record<string, Color[]> = {};
  for (const node of Object.values(board.spaces)) {
    if (node.isBorder) continue;
    const coord = node.name;
    sightResults[coord] =
      coord in tilesInBoard ? tilesInBoard[coord].tile.colors : [];
  }

  return {
    id: 0,
    tiles: Object.values(tilesInBoard),
    light_results: lightResults,
  };
}

/** Create a random Orapa Street puzzle and pre-compute all wave results. */
export function setup(board: Board, tiles: ParentTile[]): Puzzle {
  const seed = Math.floor(Math.random() * 0xffffffff);
  return setupWithSeed(board, tiles, seed);
}
