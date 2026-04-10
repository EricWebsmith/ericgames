import { beforeEach, describe, expect, it } from 'vitest';
import { putTile, setup, tranverse } from '../../../engine/orapa/gameManager';
import { getBoard, getRedTile, getTiles } from '../../../engine/orapa/mineData';
import { type Board, Color, TileInBoard } from '../../../engine/orapa/models';

describe('traverse (yellow tile at D5)', () => {
  // Yellow (parent 3) is placed with anchor at D5, forming an L-shape:
  //   tile 12 (arcs [[1,2]]) at D5, tile 13 (no arcs) at D6, tile 14 (arcs [[1,2]]) at C6.
  //
  // arc_dict for tiles 12 and 14 (rotate_angle = 0): { 1: 2, 2: 1 }
  //   entry face North (1) → exit East  (2)   … redirects beams from the top
  //   entry face East  (2) → exit North (1)   … redirects beams from the right
  //   entry face West  (0) – no match  → reflect back West
  //   entry face South (3) – no match  → reflect back South
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[2], 'D5', 0);
  });

  it.each([
    ['5', '14', [Color.Yellow]],
    ['14', '5', [Color.Yellow]],
    ['6', '15', [Color.Yellow]],
    ['15', '6', [Color.Yellow]],
    ['D', 'D', [Color.Yellow]],
    ['E', 'E', [Color.Yellow]],
    ['M', 'M', [Color.Yellow]],
    ['N', 'N', [Color.Yellow]],
    ['2', 'J', []],
    ['7', 'O', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});

describe('setup', () => {
  it('runs without error', () => {
    expect(() => setup(getBoard(), getTiles())).not.toThrow();
  });
});

describe('traverse (black tile at D5)', () => {
  // The black tile (parent 7) is a two-subtile piece placed via putTile:
  //   Tile 27 (absorbLight: true, coordinate {0:0, 1:0}) → anchor placed at D5.
  //   Tile 28 (absorbLight: true, coordinate {0:0, 1:1}) → row offset +1 → E5.
  // Any beam that reaches either D5 or E5 is absorbed entirely: end_label '' and colors [].
  // Beams on other columns pass through unaffected.
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[6], 'D5', 0);
  });

  it.each([
    // Beam enters from top border 5 (→ A5 South), absorbed at D5
    ['5', '', []],
    // Beam enters left border D (→ D1 East), absorbed at D5
    ['D', '', []],
    // Beam enters right border 14 (→ D10 West), absorbed at D5
    ['14', '', []],
    // Beam enters left border E (→ E1 East), absorbed at E5
    ['E', '', []],
    // Beam enters right border 15 (→ E10 West), absorbed at E5
    ['15', '', []],
    // Column 2 is empty – straight pass-through from top border 2 to bottom border J
    ['2', 'J', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});

describe('traverse (white tile at D5)', () => {
  // White Small (parent 5) is placed with anchor at D5, forming a 2×2 square:
  //   tile 21 (arcs [[0,1]]) at D5, tile 22 (arcs [[1,2]]) at D6,
  //   tile 23 (arcs [[0,3]]) at C5, tile 24 (arcs [[2,3]]) at C6.
  // The four tiles form a closed loop: beams entering from outside are redirected
  // around the square and exit from an adjacent edge.
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[4], 'D5', 0);
  });

  it.each([
    ['D', '5', [Color.White]],
    ['6', '14', [Color.White]],
    ['15', 'N', [Color.White]],
    ['M', 'E', [Color.White]],
    ['13', 'C', []],
    ['8', 'P', []],
    ['2', 'J', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});

describe('traverse (transparent tile at D5)', () => {
  // Transparent (parent 6) is placed with anchor at D5:
  //   tile 25 (arcs [[0,1]], colors []) at D5, tile 26 (arcs [[1,2]], colors []) at E5.
  // arc_dict for tile 25 (rotate_angle = 0): { 0: 1, 1: 0 }
  // Because the tiles have no colors, beams are redirected but no color is collected.
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[5], 'D5', 0);
  });

  it.each([
    ['D', '5', []],
    ['5', 'D', []],
    ['14', '6', []],
    ['M', 'M', []],
    ['N', 'N', []],
    ['2', 'J', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});



describe('red (red tile at D5)', () => {
  // Red (parent 0) is placed with anchor at D5:
  //   tile 0 (arcs [[0,1]], colors [Color.Red]) at D5, tile 1 (arcs [[1,2]], colors [Color.Red]) at E5.
  // arc_dict for tile 0 (rotate_angle = 0): { 0: 1, 1: 0 }
  // Because the tiles have colors, beams are redirected and color is collected.
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getRedTile(), 'D5', 0);
  });

  it.each([
    ['D', '5', [Color.Red]],
    ['5', 'D', [Color.Red]],
    ['E', 'E', [Color.Red]],
    ['F', 'F', [Color.Red]],
    ['M', '16', [Color.Red]],
    ['16', 'M', [Color.Red]],
    ['14', '14', [Color.Red]],
    ['2', 'J', []],
    ['8', 'P', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});


describe('traverse (yellow tile at D5, rotateAngle=1)', () => {
  // Yellow tile rotated 90° CW (rotateAngle=1) at anchor D5.
  // rotateCoord applies (col, row) → (−row, col):
  //   subTile (0,0) → (0,0)  → D5, reflect [[1,2]] rotated → [[2,3]], rotated_reflect {2:3, 3:2}
  //   subTile (0,1) → (−1,0) → D4, reflect []
  //   subTile (1,1) → (−1,1) → E4, reflect [[1,2]] rotated → [[2,3]], rotated_reflect {2:3, 3:2}
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[2], 'D5', 1);
  });

  it('places subtiles at rotated coordinates', () => {
    expect(Object.keys(tiles).sort()).toEqual(['D4', 'D5', 'E4'].sort());
  });

  it.each([
    // Beam from top-5 hits D5 North face (not in {2:3,3:2}) → reflects back → border 5
    ['5', '5', [Color.Yellow]],
    // Beam from bottom-M hits D5 South face (3 → 2 East) → continues East → border 14
    ['M', '14', [Color.Yellow]],
    // Beam from right-14 hits D5 East face (2 → 3 South) → continues South → border M
    ['14', 'M', [Color.Yellow]],
    // Beam from left-D hits D4 West face (not in {}) → reflects back → border D
    ['D', 'D', [Color.Yellow]],
    // Beam from top-4 hits D4 North face (not in {}) → reflects back → border 4
    ['4', '4', [Color.Yellow]],
    // Beam from bottom-N passes through col 6 (no tiles) → exits at top border 6
    ['N', '6', []],
    // Beam from right-15 hits E4 East face (2 → 3 South) → continues South → border L (bottom col 4)
    ['15', 'L', [Color.Yellow]],
    // Beam from bottom-L hits E4 South face (3 → 2 East) → continues East → border 15
    ['L', '15', [Color.Yellow]],
    // Unrelated column – passes through
    ['2', 'J', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});

describe('light blue D5', () => {
  // Light Blue (parent 7) is placed with anchor at D5:
  //   tile 7 (arcs [[0,1]], colors [Color.Blue, Color.White]) at D5.
  // arc_dict for tile 7 (rotate_angle = 0): { 0: 1, 1: 0 }
  // Because the tile has colors, beams are redirected and color is collected.
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[7], 'D5', 0);
  });

  it.each([
    ['5', '5', [Color.Blue, Color.White]],
    ['D', 'D', [Color.Blue, Color.White]],
    ['M', 'M', [Color.Blue, Color.White]],
    ['14', '14', [Color.Blue, Color.White]],
    ['4', 'L', []],
    ['16', 'F', []],
    ['2', 'J', []],
    ['8', 'P', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});
