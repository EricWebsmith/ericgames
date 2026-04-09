import { beforeEach, describe, expect, it } from 'vitest';
import { putTile, tranverse } from '../../../engine/orapa/gameManager';
import { getBoard } from '../../../engine/orapa/mineData';
import { type Board, Color, TileInBoard } from '../../../engine/orapa/models';
import { getTiles } from '../../../engine/orapa/spaceData';

describe('traverse (yellow tile at D5)', () => {
  let board: Board;
  let tiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    tiles = putTile(getTiles()[5], 'D5', 0);
  });

  it.each([
    ['5', '5', [Color.White]],
    ['6', 'D', [Color.White]],
    ['7', '14', [Color.White]],
    ['15', 'O', [Color.White]],
    ['N', 'E', [Color.White]],
    ['P', 'P', [Color.White]],
    ['M', 'M', [Color.White]],
    ['2', 'J', []],
    ['9', 'Q', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, tiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});