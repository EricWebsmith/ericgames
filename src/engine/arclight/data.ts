import { type Board, type Node, type ParentTile, type Tile, Color } from './models';

export const borderNodeCoordinates: string[] = [
    ...'ABCDEFGHIJKLMNOPQRSTU'.split(''),
    ...Array.from({ length: 21 }, (_, i) => String(i + 1)),
];

// Axial (q, r) offset for direction 5 (one hex step in the slash/SE direction).
// Sibling tiles in a double-hex piece are placed at this offset relative to their anchor.
const DIR5_OFFSET = { 0: -1, 1: 1 };
// Origin offset for anchor tiles within a group.
const ORIGIN_OFFSET = { 0: 0, 1: 0 };

export function getParentTiles(): ParentTile[] {
    const parentTiles: ParentTile[] = [
        { id: 0, name: 'Red Tile', optional: false },
        { id: 1, name: 'Blue Tile', optional: false },
        { id: 2, name: 'Yellow Tile', optional: false },
        { id: 3, name: 'Green Tile', optional: false },
        { id: 4, name: 'Transparent Tile', optional: true },
        { id: 5, name: 'Black Tile', optional: true },
        { id: 6, name: 'Light Blue Tile', optional: false },
    ];
    return parentTiles;
}

export function getBasicTiles(): Tile[] {
    const tiles: Tile[] = [
        {
            id: 0,
            colors: [Color.Red],
            opacity: 100,
            arcs: [[1, 0], [2, 3], [4, 5]],
            absorbLight: false,
            parent_id: 0,
            coordinate: ORIGIN_OFFSET,
        },
        {
            id: 1,
            colors: [Color.Red],
            opacity: 100,
            arcs: [[1, 0], [2, 3], [4, 5]],
            absorbLight: false,
            parent_id: 0,
            coordinate: DIR5_OFFSET,
        },
        {
            id: 2,
            colors: [Color.Blue],
            opacity: 100,
            arcs: [[1, 3], [2, 5], [4, 0]],
            absorbLight: false,
            parent_id: 1,
            coordinate: ORIGIN_OFFSET,
        },
        {
            id: 3,
            colors: [Color.Blue],
            opacity: 100,
            arcs: [[1, 3], [2, 5], [4, 0]],
            absorbLight: false,
            parent_id: 1,
            coordinate: DIR5_OFFSET,
        },
        {
            id: 4,
            colors: [Color.Yellow],
            opacity: 100,
            arcs: [[1, 0], [2, 4], [3, 5]],
            absorbLight: false,
            parent_id: 2,
            coordinate: ORIGIN_OFFSET,
        },
        {
            id: 5,
            colors: [Color.Yellow],
            opacity: 100,
            arcs: [[1, 0], [2, 4], [3, 5]],
            absorbLight: false,
            parent_id: 2,
            coordinate: DIR5_OFFSET,
        },
        // Green
        {
            id: 6,
            colors: [Color.Blue, Color.Yellow],
            opacity: 100,
            arcs: [[1, 0], [2, 5], [3, 4]],
            absorbLight: false,
            parent_id: 3,
            coordinate: ORIGIN_OFFSET,
        },
        {
            id: 7,
            colors: [Color.Blue, Color.Yellow],
            opacity: 100,
            arcs: [[1, 0], [2, 5], [3, 4]],
            absorbLight: false,
            parent_id: 3,
            coordinate: DIR5_OFFSET,
        },
        { // Transparent tile, render as a white tile with 50% opacity
            id: 8,
            colors: [],
            opacity: 50,
            arcs: [[1, 0], [2, 4], [3, 5]],
            absorbLight: false,
            parent_id: 4,
            coordinate: ORIGIN_OFFSET,
        },
        { // Black hole tile, render as a black tile with 100% opacity
            id: 9,
            colors: [],
            opacity: 100,
            arcs: [],
            absorbLight: true,
            parent_id: 5,
            coordinate: ORIGIN_OFFSET,
        },
    ];

    return tiles;
}

export function getBoard(): Board {
    const nodes: Record<string, Node> = {};

    // For a hexagonal grid, we can use axial coordinates (q, r) for the nodes.

    const letters = ['A', 'C', 'E', 'G', 'I', 'K', 'M'];
    const numbers = ['2', '4', '6', '8', '10', '12', '14'];

    for (let q = -3; q <= 3; q++) {
        for (let r = -3; r <= 3; r++) {
            const s = -q - r;
            if (Math.abs(s) > 3) continue; // Skip coordinates that are outside the hexagonal grid
            const label = `${letters[3 - s]}${numbers[r + 3]}`;
            nodes[label] = { label, is_border: false, edges: {} };
        }
    }

    // horizontal edges
    for (const number of numbers) {
        for (let letterIndex = 0; letterIndex < letters.length - 1; letterIndex++) {
            const fromLabel = `${letters[letterIndex]}${number}`;
            const toLabel = `${letters[letterIndex + 1]}${number}`;
            if (!nodes[fromLabel] || !nodes[toLabel]) continue; // Skip if either node doesn't exist
            nodes[fromLabel].edges[3] = toLabel;
            nodes[toLabel].edges[0] = fromLabel;
        }
    }

    // slash edges
    for (const letter of letters) {
        for (let i = 0; i < numbers.length - 1; i++) {
            const fromLabel = `${letter}${numbers[i]}`;
            const toLabel = `${letter}${numbers[i + 1]}`;
            if (!nodes[fromLabel] || !nodes[toLabel]) continue; // Skip if either node doesn't exist
            nodes[fromLabel].edges[5] = toLabel;
            nodes[toLabel].edges[2] = fromLabel;
        }
    }

    // backslash edges
    const addBackslashEdge = (startLetter: string, startNumber: string): void => {
        let letterIndex = letters.indexOf(startLetter);
        let numberIndex = numbers.indexOf(startNumber);
        while (letterIndex + 1 < letters.length && numberIndex + 1 < numbers.length) {
            const fromCoordinate = `${letters[letterIndex]}${numbers[numberIndex]}`;
            const toCoordinate = `${letters[letterIndex + 1]}${numbers[numberIndex + 1]}`;
            nodes[fromCoordinate].edges[4] = toCoordinate;
            nodes[toCoordinate].edges[1] = fromCoordinate;
            letterIndex++;
            numberIndex++;
        }
    };

    addBackslashEdge('A', '8');
    addBackslashEdge('A', '6');
    addBackslashEdge('A', '4');
    addBackslashEdge('A', '2');
    addBackslashEdge('C', '2');
    addBackslashEdge('E', '2');
    addBackslashEdge('G', '2');

    // Add border nodes
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTU') {
        nodes[letter] = { label: letter, is_border: true, edges: {} };
    }
    for (let i = 1; i <= 21; i++) {
        nodes[String(i)] = { label: String(i), is_border: true, edges: {} };
    }

    // Border edges
    const addBorderEdge = (fromLabel: string, fromDir: number, toLabel: string): void => {
        const toDir = (fromDir + 3) % 6;
        nodes[fromLabel].edges[fromDir] = toLabel;
        nodes[toLabel].edges[toDir] = fromLabel;
    };

    addBorderEdge('A', 5, 'A2');
    addBorderEdge('B', 4, 'C2');
    addBorderEdge('C', 5, 'C2');
    addBorderEdge('D', 4, 'E2');
    addBorderEdge('E', 5, 'E2');
    addBorderEdge('F', 4, 'G2');
    addBorderEdge('G', 5, 'G2');
    addBorderEdge('H', 0, 'G2');
    addBorderEdge('I', 5, 'I4');
    addBorderEdge('J', 0, 'I4');
    addBorderEdge('K', 5, 'K6');
    addBorderEdge('L', 0, 'K6');
    addBorderEdge('M', 5, 'M8');
    addBorderEdge('N', 0, 'M8');
    addBorderEdge('O', 1, 'M8');
    addBorderEdge('P', 0, 'M10');
    addBorderEdge('Q', 1, 'M10');
    addBorderEdge('R', 0, 'M12');
    addBorderEdge('S', 1, 'M12');
    addBorderEdge('T', 0, 'M14');
    addBorderEdge('U', 1, 'M14');

    addBorderEdge('1', 4, 'A2');
    addBorderEdge('2', 3, 'A2');
    addBorderEdge('3', 4, 'A4');
    addBorderEdge('4', 3, 'A4');
    addBorderEdge('5', 4, 'A6');
    addBorderEdge('6', 3, 'A6');
    addBorderEdge('7', 4, 'A8');
    addBorderEdge('8', 3, 'A8');
    addBorderEdge('9', 2, 'A8');
    addBorderEdge('10', 3, 'C10');
    addBorderEdge('11', 2, 'C10');
    addBorderEdge('12', 3, 'E12');
    addBorderEdge('13', 2, 'E12');
    addBorderEdge('14', 3, 'G14');
    addBorderEdge('15', 2, 'G14');
    addBorderEdge('16', 1, 'G14');
    addBorderEdge('17', 2, 'I14');
    addBorderEdge('18', 1, 'I14');
    addBorderEdge('19', 2, 'K14');
    addBorderEdge('20', 1, 'K14');
    addBorderEdge('21', 2, 'M14');

    return {
        spaces: nodes
    };
}