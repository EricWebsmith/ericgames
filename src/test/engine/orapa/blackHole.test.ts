import { beforeEach, describe, expect, it } from 'vitest';
import { putTile, tranverse } from '../../../engine/orapa/gameManager';
import { getBoard } from '../../../engine/orapa/mineData';
import { type Board, TileInBoard } from '../../../engine/orapa/models';
import { getTiles } from '../../../engine/orapa/spaceData';

describe('Black hole at D5', () => {
  let board: Board;
  let blackHoleTiles: Record<string, TileInBoard>;

  beforeEach(() => {
    board = getBoard();
    blackHoleTiles = putTile(getTiles()[6], 'D5', 0);
  });

  it.each([
    ['3', 'K', []],
    ['4', '15', []],
    ['5', '', []],
    ['6', 'E', []],
    ['7', 'O', []],
    ['12', 'B', []],
    ['13', 'L', []],
    ['14', '', []],
    ['15', '4', []],
    ['16', 'F', []],
    ['O', '7', []],
    ['N', 'C', []],
    ['M', '', []],
    ['L', '13', []],
    ['K', '3', []],
    ['F', '16', []],
    ['E', '6', []],
    ['D', '', []],
    ['C', 'N', []],
    ['B', '12', []],
  ])('start %s → end %s', (startCoordinate, expectedEnd, expectedColors) => {
    const result = tranverse(board, blackHoleTiles, startCoordinate);
    expect(result.end_label).toBe(expectedEnd);
    expect(result.colors).toEqual(expectedColors);
  });
});