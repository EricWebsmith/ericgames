import { beforeEach, describe, expect, it } from 'vitest';
import { getBoard, getRedTile, getTiles } from '../../../engine/orapaMine/data';
import { putTile, setup, traverse } from '../../../engine/orapaMine/gameManager';
import { type Board, Color, TileInBoard } from '../../../engine/orapaMine/models';

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
    // Beam enters from top border 5 (→ A5 South), deflected East at D5, exits right border 14
    ['5', '14', [Color.Yellow]],
    // Bidirectional: enters right border 14 (→ D10 West), passes D6, deflected North at D5, exits top border 5
    ['14', '5', [Color.Yellow]],
    // Beam enters from top border 6 (→ A6 South), deflected East at C6, exits right border 13
    ['6', '13', [Color.Yellow]],
    // Bidirectional: enters right border 13 (→ C10 West), deflected North at C6, exits top border 6
    ['13', '6', [Color.Yellow]],
    // Beam enters left border D (→ D1 East), West-face of D5 has no matching arc → reflects back
    ['D', 'D', [Color.Yellow]],
    // Beam enters left border E (→ E1 East), row E is empty → passes straight through to right border 15
    ['E', '15', []],
    // Beam enters bottom border M (→ H5 North), South-face of D5 has no matching arc → reflects back
    ['M', 'M', [Color.Yellow]],
    // Beam enters bottom border N (→ H6 North), passes D6, South-face of C6 has no matching arc → reflects back
    ['N', 'N', [Color.Yellow]],
    // Column 2 is empty – straight pass-through from top border 2 to bottom border J
    ['2', 'J', []],
    // Column 7 is empty – straight pass-through from top border 7 to bottom border O
    ['7', 'O', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = traverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});

describe('setup', () => {
  it('runs without error', () => {
    expect(() => setup()).not.toThrow();
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
    const result = traverse(board, tiles, startCoordinate);
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
    // Beam enters left border D (→ D1 East), deflected North at D5, deflected West at C5, exits left border C
    ['D', 'C', [Color.White]],
    // Bidirectional: enters left border C (→ C1 East), deflected South at C5, deflected West at D5, exits left border D
    ['C', 'D', [Color.White]],
    // Beam enters top border 5 (→ A5 South), North-face of C5 has no matching arc → reflects back
    ['5', '5', [Color.White]],
    // Beam enters right border 14 (→ D10 West), deflected North at D6, deflected East at C6, exits right border 13
    ['14', '13', [Color.White]],
    // Bidirectional: enters right border 13 (→ C10 West), deflected South at C6, deflected East at D6, exits right border 14
    ['13', '14', [Color.White]],
    // Beam enters bottom border M (→ H5 North), South-face of D5 has no matching arc → reflects back
    ['M', 'M', [Color.White]],
    // Column 2 is empty – straight pass-through from top border 2 to bottom border J
    ['2', 'J', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = traverse(board, tiles, startCoordinate);
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
    // Beam enters left border D (→ D1 East), deflected North at D5, exits top border 5 – no color
    ['D', '5', []],
    // Bidirectional: enters top border 5 (→ A5 South), deflected West at D5, exits left border D – no color
    ['5', 'D', []],
    // Beam enters right border 14 (→ D10 West), East face of D5 has no matching arc → reflects back – no color
    ['14', '14', []],
    // Beam enters bottom border M (→ H5 North), South face of E5 has no matching arc → reflects back – no color
    ['M', 'M', []],
    // Column 2 is empty – straight pass-through from top border 2 to bottom border J
    ['2', 'J', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = traverse(board, tiles, startCoordinate);
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
    const result = traverse(board, tiles, startCoordinate);
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
    const result = traverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});
