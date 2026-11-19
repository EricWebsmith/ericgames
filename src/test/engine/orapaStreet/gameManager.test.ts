import { describe, expect, it } from 'vitest';
import { getDefaultBoard, getHexBoard } from '../../../engine/orapaStreet221B/data';
import { traverse } from '../../../engine/orapaStreet221B/gameManager';

const alpha = String.fromCharCode(945); // α
const beta = String.fromCharCode(946); // β


describe('traverse default board (empty board)', () => {
    it.each([
        ['A', '12'],
        ['B', 'P'],
        ['C', '8'],
        ['D', 'R'],
        ['E', '4'],
        ['F', 'T'],
        ['G', 'V'],
        ['H', '3'],
        ['I', 'W'],
        ['J', '7'],
        ['K', 'Y'],
        ['L', '11'],
        ['M', alpha],
        ['N', '15'],
        ['O', '14'],
        ['P', 'B'],
        ['Q', '18'],
        ['R', 'D'],
        ['S', '22'],
        ['T', 'F'],
        ['U', '26'],
        ['V', 'G'],
        ['W', 'I'],
        ['X', '25'],
        ['Y', 'K'],
        ['Z', '21'],
        [alpha, 'M'],
        [beta, '17'],
        ['1', '16'],
        ['2', '19'],
        ['3', 'H'],
        ['4', 'E'],
        ['5', '20'],
        ['6', '23'],
        ['7', 'J'],
        ['8', 'C'],
        ['9', '24'],
        ['10', '27'],
        ['11', 'L'],
        ['12', 'A'],
        ['13', '28'],
        ['14', 'O'],
        ['15', 'N'],
        ['16', '1'],
        ['17', beta],
        ['18', 'Q'],
        ['19', '2'],
        ['20', '5'],
        ['21', 'Z'],
        ['22', 'S'],
        ['23', '6'],
        ['24', '9'],
        ['25', 'X'],
        ['26', 'U'],
        ['27', '10'],
        ['28', '13'],
    ])('start %s → end %s', (startCoordinate, expectedEnd) => {
        const board = getDefaultBoard();
        const result = traverse(board, startCoordinate);
        expect(result.end_label).toBe(expectedEnd);
        expect(result.colors).toEqual([]);
    });
});




describe('traverse hex board (empty board)', () => {
    it.each([
        ['A', '31'],
        ['B', '12'],
        ['C', '33'],
        ['D', '14'],
        ['E', '35'],
        ['F', '16'],
        ['G', '37'],
        ['H', '18'],
        ['I', '39'],
        ['J', '20'],
        ['K', '21'],
        ['L', '2'],
        ['M', '23'],
        ['N', '4'],
        ['O', '25'],
        ['P', '6'],
        ['Q', '27'],
        ['R', '8'],
        ['S', '29'],
        ['T', '10'],
        ['1', '30'],
        ['2', 'L'],
        ['3', '28'],
        ['4', 'N'],
        ['5', '26'],
        ['6', 'P'],
        ['7', '24'],
        ['8', 'R'],
        ['9', '22'],
        ['10', 'T'],
        ['11', '40'],
        ['12', 'B'],
        ['13', '38'],
        ['14', 'D'],
        ['15', '36'],
        ['16', 'F'],
        ['17', '34'],
        ['18', 'H'],
        ['19', '32'],
        ['20', 'J'],
        ['21', 'K'],
        ['22', '9'],
        ['23', 'M'],
        ['24', '7'],
        ['25', 'O'],
        ['26', '5'],
        ['27', 'Q'],
        ['28', '3'],
        ['29', 'S'],
        ['30', '1'],
        ['31', 'A'],
        ['32', '19'],
        ['33', 'C'],
        ['34', '17'],
        ['35', 'E'],
        ['36', '15'],
        ['37', 'G'],
        ['38', '13'],
        ['39', 'I'],
        ['40', '11'],
    ])('start %s → end %s', (startCoordinate, expectedEnd) => {
        const board = getHexBoard();
        const result = traverse(board, startCoordinate);
        expect(result.end_label).toBe(expectedEnd);
        expect(result.colors).toEqual([]);
    });
});