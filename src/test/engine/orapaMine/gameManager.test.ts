import { beforeEach, describe, expect, it } from 'vitest';
import { type Board, Color, TileInBoard } from '../../../engine/arclight/models';
import { getBasicTiles, getBoard } from '../../../engine/orapaMine/data';
import { setup, traverse } from '../../../engine/orapaMine/gameManager';

describe('traverse (yellow tile at D5)', () => {
  // Tile 12 (yellow, arcs [[1,2]]) is placed at D5 and tile 14 (yellow, arcs [[1,2]])
  // is placed at E6.  Tile 13 (the absorbing black cell of the yellow piece) is
  // omitted so that beams can pass freely through D6.
  //
  // arc_dict for both tiles (rotate_angle = 0): { 1: 2, 2: 1 }
  //   entry face North (1) → exit East  (2)   … redirects beams from the top
  //   entry face East  (2) → exit North (1)   … redirects beams from the right
  //   entry face West  (0) – no match  → reflect back West
  //   entry face South (3) – no match  → reflect back South
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    const basicTiles = getBasicTiles();
    board = getBoard();
    tiles = {};
    tiles['D5'] = new TileInBoard({ tile: basicTiles[12], coordinate: 'D5', rotate_angle: 0 });
    tiles['D5'].resolve_rotate();
    tiles['D6'] = new TileInBoard({ tile: basicTiles[13], coordinate: 'D6', rotate_angle: 0 });
    tiles['D6'].resolve_rotate();
    tiles['E6'] = new TileInBoard({ tile: basicTiles[14], coordinate: 'E6', rotate_angle: 0 });
    tiles['E6'].resolve_rotate();
  });

  it.each([
    // Beam enters from top border 5 (→ A5 South), deflected East at D5, exits right border 14
    ['5', '14', [Color.Yellow]],
    // Bidirectional: enters right border 14 (→ D10 West), deflected North at D5, exits top border 5
    ['14', '5', [Color.Yellow]],
    // Beam enters from top border 6 (→ A6 South), deflected East at E6, exits right border 15
    ['6', '15', [Color.Yellow]],
    // Bidirectional: enters right border 15 (→ E10 West), deflected North at E6, exits top border 6
    ['15', '6', [Color.Yellow]],
    // Beam enters left border D (→ D1 East), West-face of D5 has no matching arc → reflects back
    ['D', 'D', [Color.Yellow]],
    // Beam enters left border E (→ E1 East), West-face of E6 has no matching arc → reflects back
    ['E', 'E', [Color.Yellow]],
    // Beam enters bottom border M (→ H5 North), South-face of D5 has no matching arc → reflects back
    ['M', 'M', [Color.Yellow]],
    // Beam enters bottom border N (→ H6 North), South-face of E6 has no matching arc → reflects back
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
