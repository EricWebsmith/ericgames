import {
  Color,
  Direction,
  TileInBoard,
  type Board,
  type LightResult,
  type Node,
  type ParentTile,
  type Puzzle,
} from "./models";
import { rightRotateCoord, type RotationDegree } from "./triangleUtils";

function getTilePositions(
  board: Board,
  tile: ParentTile,
  anchorNode: Node,
  rotateAngle: 0 | 4 | 8,
): Node[] | null {
  const origin = tile.subTiles[0]?.coordinate;
  if (!origin) throw new Error(`Tile ${tile.name} has no subtiles`);

  const rotation = (rotateAngle * 30) as RotationDegree;
  const positions: Node[] = [];

  for (const subTile of tile.subTiles) {
    const relativeCoordinate = {
      q: subTile.coordinate.q - origin.q,
      r: subTile.coordinate.r - origin.r,
      s: subTile.coordinate.s - origin.s,
    };
    const offset = rightRotateCoord(relativeCoordinate, rotation);
    const q = anchorNode.q + offset.q;
    const r = anchorNode.r + offset.r;
    const s = anchorNode.s + offset.s;
    const node = board.spacesByQr[q]?.[r];

    if (
      !node ||
      node.s !== s ||
      node.orientation !== subTile.orient
    ) {
      return null;
    }

    positions.push(node);
  }

  return positions;
}

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

export function putTile(
  board: Board,
  tile: ParentTile,
  anchorLabel: string,
  rotateAngle: 0 | 4 | 8 = 0,
): Record<string, TileInBoard> {
  const anchorNode = board.spaces[anchorLabel];
  if (!anchorNode) throw new Error(`Invalid anchor coordinate: ${anchorLabel}`);

  const positions = getTilePositions(board, tile, anchorNode, rotateAngle);
  if (!positions) {
    throw new Error(
      `Tile ${tile.name} extends outside the board or mismatches triangle orientation from ${anchorLabel}`,
    );
  }

  const result: Record<string, TileInBoard> = {};

  for (const [index, subTile] of tile.subTiles.entries()) {
    const nodeToPut = positions[index];
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
  const occupiedSpaces = new Set<string>(board.restrictedArea);

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
      if (anchorNode.orientation != parentTile.subTiles[0].orient) {
        continue;
      }
      const rotateAngle = 0;
      const positions = getTilePositions(
        board,
        parentTile,
        anchorNode,
        rotateAngle,
      );
      if (
        !positions ||
        positions.some((node) => occupiedSpaces.has(node.name))
      ) {
        continue;
      }

      // Check border connection
      const newTiles = putTile(board, parentTile, anchorLabel, rotateAngle);

      for (const [label, tib] of Object.entries(newTiles)) {
        tilesInBoard[label] = tib;
        occupiedSpaces.add(label);
        for (const neighbor of board.spaces[label].neighbors) {
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

  const lightResults: Record<string, LightResult[]> = {};
  for (const coord of borderLabels) {
    lightResults[coord] = traverse(board, tilesInBoard, coord);
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
