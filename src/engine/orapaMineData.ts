import { type Board, type Node, type ParentTile, type Tile, Color } from './models';

// Border positions for a 10×8 square grid (10 columns, 8 rows).
// A 10×8 grid has 2×(10+8) = 36 border positions total, split evenly:
//   Letters A–R  (18): A–J (10 letters) along the bottom edge,
//                       K–R  (8 letters) along the right edge.
//   Numbers 1–18 (18): 1–10 along the top edge,
//                       11–18 along the left edge.
export const borderNodeCoordinates: string[] = [
    ...'ABCDEFGHIJKLMNOPQR'.split(''),
    ...Array.from({ length: 18 }, (_, i) => String(i + 1)),
];

// There are four directions for the square grid:
// 0: West
// 1: North
// 2: East
// 3: South
//
// arcs: [[in_face, out_face], ...]
// e.g. [[0, 1]] means: light entering through the West face exits through the North face.
// If no arc matches the entry face, light is reflected straight back (reverses direction).
// A tile with arcs: [] absorbs light entirely (black gem behaviour).


export function getParentTiles(): ParentTile[] {
    const parentTiles: ParentTile[] = [
        { id: 0, name: 'Red', optional: false },
        { id: 1, name: 'Flipped Red', optional: false },
        { id: 2, name: 'Blue', optional: false },
        { id: 3, name: 'Yellow', optional: false },
        { id: 4, name: 'White Big', optional: false },
        { id: 5, name: 'White Small', optional: false },
        { id: 6, name: 'Transparent', optional: true },
        { id: 7, name: 'Black', optional: true },
        { id: 8, name: 'Light Blue', optional: false },
    ];
    return parentTiles;
}


export function getBasicTiles(): Tile[] {
    const tiles: Tile[] = [
        // Red tile – 1×3 vertical strip (parent 0)
        {
            id: 0,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 0,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 1,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 0,
            coordinate: { 0: 0, 1: 1 },
            arcs: [],
        },
        {
            id: 2,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 0,
            coordinate: { 0: 0, 1: 2 },
            arcs: [[2, 3]],
        },
        // Flipped Red tile – same shape as Red, mirrored arc pattern (parent 1).
        // Having a separate parent avoids the need for run-time tile flipping:
        // the generator randomly selects one of the two.
        {
            id: 3,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 1,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 4,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 1,
            coordinate: { 0: 0, 1: 1 },
            arcs: [],
        },
        {
            id: 5,
            colors: [Color.Red],
            opacity: 100,
            parent_id: 1,
            coordinate: { 0: 0, 1: 2 },
            arcs: [[0, 3]],
        },
        // Blue tile – irregular 6-cell shape (parent 2)
        {
            id: 6,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 7,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 1, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 8,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: -1, 1: -1 },
            arcs: [[0, 1]],
        },
        {
            id: 9,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 0, 1: -1 },
            arcs: [],
        },
        {
            id: 10,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 1, 1: -1 },
            arcs: [],
        },
        {
            id: 11,
            colors: [Color.Blue],
            opacity: 100,
            parent_id: 2,
            coordinate: { 0: 2, 1: -1 },
            arcs: [[1, 2]],
        },
        // Yellow tile – 3-cell L-shape (parent 3)
        {
            id: 12,
            colors: [Color.Yellow],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 13,
            colors: [Color.Yellow],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: 0 },
            arcs: [],
        },
        {
            id: 14,
            colors: [Color.Yellow],
            opacity: 100,
            parent_id: 3,
            coordinate: { 0: 1, 1: -1 },
            arcs: [[1, 2]],
        },
        // White Big tile – same 6-cell shape as Blue but white (parent 4)
        {
            id: 15,
            colors: [Color.White],
            opacity: 100,
            parent_id: 4,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 16,
            colors: [Color.White],
            opacity: 100,
            parent_id: 4,
            coordinate: { 0: 1, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 17,
            colors: [Color.White],
            opacity: 100,
            parent_id: 4,
            coordinate: { 0: -1, 1: -1 },
            arcs: [[0, 1]],
        },
        {
            id: 18,
            colors: [Color.White],
            opacity: 100,
            parent_id: 4,
            coordinate: { 0: 0, 1: -1 },
            arcs: [],
        },
        {
            id: 19,
            colors: [Color.White],
            opacity: 100,
            parent_id: 4,
            coordinate: { 0: 1, 1: -1 },
            arcs: [],
        },
        {
            id: 20,
            colors: [Color.White],
            opacity: 100,
            parent_id: 4,
            coordinate: { 0: 2, 1: -1 },
            arcs: [[1, 2]],
        },
        // White Small tile – 2×2 square (parent 5)
        {
            id: 21,
            colors: [Color.White],
            opacity: 100,
            parent_id: 5,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 22,
            colors: [Color.White],
            opacity: 100,
            parent_id: 5,
            coordinate: { 0: 1, 1: 0 },
            arcs: [[1, 2]],
        },
        {
            id: 23,
            colors: [Color.White],
            opacity: 100,
            parent_id: 5,
            coordinate: { 0: 0, 1: -1 },
            arcs: [[0, 3]],
        },
        {
            id: 24,
            colors: [Color.White],
            opacity: 100,
            parent_id: 5,
            coordinate: { 0: 1, 1: -1 },
            arcs: [[2, 3]],
        },
        // Transparent tile – 1×2 vertical strip, 50% opacity (parent 6)
        {
            id: 25,
            colors: [],
            opacity: 50,
            parent_id: 6,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
        {
            id: 26,
            colors: [],
            opacity: 50,
            parent_id: 6,
            coordinate: { 0: 0, 1: 1 },
            arcs: [[1, 2]],
        },
        // Black tile – 1×2 vertical strip, absorbs light (parent 7)
        {
            id: 27,
            colors: [],
            opacity: 100,
            parent_id: 7,
            coordinate: { 0: 0, 1: 0 },
            arcs: [],
        },
        {
            id: 28,
            colors: [],
            opacity: 100,
            parent_id: 7,
            coordinate: { 0: 0, 1: 1 },
            arcs: [],
        },
        // Light Blue tile – single cell (parent 8)
        {
            id: 29,
            colors: [Color.Blue, Color.White],
            opacity: 100,
            parent_id: 8,
            coordinate: { 0: 0, 1: 0 },
            arcs: [[0, 1]],
        },
    ];

    return tiles;
}


export function getBoard(): Board {
    const nodes: Record<string, Node> = {};

    // Internal cells – c{col}r{row}, col 1–10, row 1–8
    for (let col = 1; col <= 10; col++) {
        for (let row = 1; row <= 8; row++) {
            const label = `c${col}r${row}`;
            nodes[label] = { label, is_border: false, edges: {} };
        }
    }

    // Internal edges (directions: 0=West, 1=North, 2=East, 3=South)
    for (let col = 1; col <= 10; col++) {
        for (let row = 1; row <= 8; row++) {
            const label = `c${col}r${row}`;
            if (col > 1)  nodes[label].edges[0] = `c${col - 1}r${row}`;
            if (row > 1)  nodes[label].edges[1] = `c${col}r${row - 1}`;
            if (col < 10) nodes[label].edges[2] = `c${col + 1}r${row}`;
            if (row < 8)  nodes[label].edges[3] = `c${col}r${row + 1}`;
        }
    }

    // Border nodes
    for (let k = 1; k <= 18; k++) nodes[String(k)] = { label: String(k), is_border: true, edges: {} };
    for (const c of 'ABCDEFGHIJKLMNOPQR'.split('')) nodes[c] = { label: c, is_border: true, edges: {} };

    // Connect each border node to its adjacent cell.
    // borderDir is the direction FROM the border node INTO the grid.
    // The cell's edge back to the border is the opposite direction: (borderDir + 2) % 4.
    const addBorderEdge = (borderLabel: string, borderDir: number, cellLabel: string): void => {
        const cellDir = (borderDir + 2) % 4;
        nodes[borderLabel].edges[borderDir] = cellLabel;
        nodes[cellLabel].edges[cellDir] = borderLabel;
    };

    // Numbers 1–10: top edge (enter going South, direction 3)
    for (let col = 1; col <= 10; col++) {
        addBorderEdge(String(col), 3, `c${col}r1`);
    }

    // Numbers 11–18: left edge (enter going East, direction 2)
    for (let row = 1; row <= 8; row++) {
        addBorderEdge(String(10 + row), 2, `c1r${row}`);
    }

    // Letters A–J: bottom edge (enter going North, direction 1)
    const bottomLetters = 'ABCDEFGHIJ'.split('');
    for (let col = 1; col <= 10; col++) {
        addBorderEdge(bottomLetters[col - 1], 1, `c${col}r8`);
    }

    // Letters K–R: right edge (enter going West, direction 0)
    const rightLetters = 'KLMNOPQR'.split('');
    for (let row = 1; row <= 8; row++) {
        addBorderEdge(rightLetters[row - 1], 0, `c10r${row}`);
    }

    return { spaces: nodes };
}