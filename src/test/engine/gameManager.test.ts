import { describe, expect, it } from 'vitest';
import { getBasicTiles, getBoard } from '../../engine/arclight/data';
import { setup, traverse } from '../../engine/arclight/gameManager';
import { TileInBoard } from '../../engine/arclight/models';

describe('traverse (empty board)', () => {
  it.each([
    ['A', '9'],
    ['B', 'S'],
    ['C', '11'],
    ['D', 'Q'],
    ['E', '13'],
    ['F', 'O'],
    ['G', '15'],
    ['H', '2'],
    ['I', '17'],
    ['J', '4'],
    ['K', '19'],
    ['L', '6'],
    ['M', '21'],
    ['N', '8'],
    ['O', 'F'],
    ['P', '10'],
    ['Q', 'D'],
    ['R', '12'],
    ['S', 'B'],
    ['T', '14'],
    ['U', '1'],
    ['1', 'U'],
    ['2', 'H'],
    ['3', '20'],
    ['4', 'J'],
    ['5', '18'],
    ['6', 'L'],
    ['7', '16'],
    ['8', 'N'],
    ['9', 'A'],
    ['10', 'P'],
    ['11', 'C'],
    ['12', 'R'],
    ['13', 'E'],
    ['14', 'T'],
    ['15', 'G'],
    ['16', '7'],
    ['17', 'I'],
    ['18', '5'],
    ['19', 'K'],
    ['20', '3'],
    ['21', 'M'],
  ])('start %s → end %s', (startCoordinate, expectedEnd) => {
    const board = getBoard()
    const result = traverse(board, {}, startCoordinate)
    expect(result.end_label).toBe(expectedEnd)
    expect(result.colors).toEqual([])
  })
})

describe('traverse (transparent tile at G8)', () => {
  it.each([
    ['A', '9'],
    ['B', 'S'],
    ['20', '3'],
    ['21', 'M'],
    ['1', '8'],
    ['G', 'U'],
    ['N', '15'],
  ])('start %s → end %s', (startCoordinate, expectedEnd) => {
    const basicTiles = getBasicTiles()
    const board = getBoard()
    const tiles: Record<string, TileInBoard> = {}
    tiles['G8'] = new TileInBoard({ tile: basicTiles[8], coordinate: 'G8', rotate_angle: 0 })
    tiles['G8'].resolve_rotate()
    const result = traverse(board, tiles, startCoordinate)
    expect(result.end_label).toBe(expectedEnd)
    expect(result.colors).toEqual([])
  })
})

describe('traverse (black tile at G8)', () => {
  it.each([
    ['A', '9'],
    ['B', 'S'],
    ['20', '3'],
    ['21', 'M'],
    ['1', ''],
    ['G', ''],
    ['N', ''],
  ])('start %s → end %s', (startCoordinate, expectedEnd) => {
    const basicTiles = getBasicTiles()
    const board = getBoard()
    const tiles: Record<string, TileInBoard> = {}
    tiles['G8'] = new TileInBoard({ tile: basicTiles[9], coordinate: 'G8', rotate_angle: 0 })
    tiles['G8'].resolve_rotate()
    const result = traverse(board, tiles, startCoordinate)
    expect(result.end_label).toBe(expectedEnd)
    expect(result.colors).toEqual([])
  })
})

describe('setup', () => {
  it('runs without error', () => {
    expect(() => setup()).not.toThrow()
  })
})
