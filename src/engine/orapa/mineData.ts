import { type Board, type Node, type ParentTile, Color, Tile } from './models';

const TRANSPARENT_TILE_NAME = 'Transparent';
const BLACK_TILE_NAME = 'Black';
const LIGHT_BLUE_TILE_NAME = 'Light Blue';


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


export function getRedTile(): ParentTile {
    return {
        name: 'Red', optional: false, subTiles: [
            new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'Red' }),
            new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 1 }, reflect: [], parentName: 'Red' }),
            new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 2 }, reflect: [[2, 3], [3, 2]], parentName: 'Red' }),
        ]
    };
};

export function getAlternativeRedTile(): ParentTile {
    return {
        name: 'Flipped Red', optional: false, subTiles: [
            new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'Flipped Red' }),
            new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 1 }, reflect: [], parentName: 'Flipped Red' }),
            new Tile({ colors: [Color.Red], coordinate: { 0: 0, 1: 2 }, reflect: [[0, 3], [3, 0]], parentName: 'Flipped Red' }),
        ]
    };
}

export interface TileOptions {
    includeTransparent: boolean;
    includeBlack: boolean;
    includeLightBlue: boolean;
}

export const defaultTileOptions: TileOptions = {
    includeTransparent: true,
    includeBlack: true,
    includeLightBlue: true,
};

export function getTiles(options: TileOptions = defaultTileOptions): ParentTile[] {

    // Red tile – 1×3 vertical strip
    const redTile: ParentTile = Math.random() < 0.5 ? getRedTile() : getAlternativeRedTile();

    return [
        redTile
        ,
        // Blue tile – irregular 6-cell shape
        {
            name: 'Blue', optional: false, subTiles: [
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: -1, 1: 1 }, reflect: [[0, 1], [1, 0]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 1 }, reflect: [], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 1, 1: 1 }, reflect: [], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 2, 1: 1 }, reflect: [[1, 2], [2, 1]], parentName: 'Blue' }),
            ]
        },
        // Yellow tile – 3-cell L-shape
        {
            name: 'Yellow', optional: false, subTiles: [
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 0, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 0, 1: 1 }, reflect: [], parentName: 'Yellow' }),
                new Tile({ colors: [Color.Yellow], coordinate: { 0: 1, 1: 1 }, reflect: [[1, 2], [2, 1]], parentName: 'Yellow' }),
            ]
        },
        // White Big tile – same 6-cell shape as Blue but white
        {
            name: 'White Big', optional: false, subTiles: [
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: -1, 1: 1 }, reflect: [[0, 1], [1, 0]], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 1 }, reflect: [], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 1 }, reflect: [], parentName: 'White Big' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 2, 1: 1 }, reflect: [[1, 2], [2, 1]], parentName: 'White Big' }),
            ]
        },
        // White Small tile – 2×2 square
        {
            name: 'White Small', optional: false, subTiles: [
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2], [2, 1]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 0, 1: 1 }, reflect: [[0, 3], [3, 0]], parentName: 'White Small' }),
                new Tile({ colors: [Color.White], coordinate: { 0: 1, 1: 1 }, reflect: [[2, 3], [3, 2]], parentName: 'White Small' }),
            ]
        },
        // Transparent tile – 1×2 vertical strip, 50% opacity
        {
            name: TRANSPARENT_TILE_NAME, optional: true, subTiles: [
                new Tile({ colors: [], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 1], [1, 0]], opacity: 50, parentName: TRANSPARENT_TILE_NAME }),
                new Tile({ colors: [], coordinate: { 0: 1, 1: 0 }, reflect: [[1, 2], [2, 1]], opacity: 50, parentName: TRANSPARENT_TILE_NAME }),
            ]
        },
        // Black tile – 1×2 vertical strip, absorbs light
        {
            name: BLACK_TILE_NAME, optional: true, subTiles: [
                new Tile({ colors: [], coordinate: { 0: 0, 1: 0 }, reflect: [], absorbLight: true, parentName: BLACK_TILE_NAME }),
                new Tile({ colors: [], coordinate: { 0: 0, 1: 1 }, reflect: [], absorbLight: true, parentName: BLACK_TILE_NAME }),
            ]
        },
        // Light Blue tile – single cell
        {
            name: LIGHT_BLUE_TILE_NAME, optional: true, subTiles: [
                new Tile({ colors: [Color.Blue, Color.White], coordinate: { 0: 0, 1: 0 }, reflect: [], parentName: LIGHT_BLUE_TILE_NAME }),
            ]
        },
    ].filter(tile => {
        if (tile.name === TRANSPARENT_TILE_NAME) return options.includeTransparent;
        if (tile.name === BLACK_TILE_NAME) return options.includeBlack;
        if (tile.name === LIGHT_BLUE_TILE_NAME) return options.includeLightBlue;
        return true;
    });
}


export function getBoard(cols: number = 10, rows: number = 8): Board {
    const rowMax = rows;
    const colMax = cols;
    const nodes: Record<string, Node> = {};

    // Internal cells – {rowLetter}{col}, col 1–colMax, row 1–rowMax
    const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rowLetters = ALL_LETTERS.slice(0, rowMax).split('');
    for (let col = 0; col < colMax; col++) {
        for (let row = 0; row < rowMax; row++) {
            const label = `${rowLetters[row]}${col + 1}`;
            nodes[label] = { label, is_border: false, edges: {} };
            // Connect to orthogonal neighbours (if they exist)
            if (col > 0) nodes[label].edges[0] = `${rowLetters[row]}${col}`; // West
            if (row > 0) nodes[label].edges[1] = `${rowLetters[row - 1]}${col + 1}`; // North
            if (col < colMax - 1) nodes[label].edges[2] = `${rowLetters[row]}${col + 2}`; // East
            if (row < rowMax - 1) nodes[label].edges[3] = `${rowLetters[row + 1]}${col + 1}`; // South
        }
    }

    // Border nodes: top/bottom use numbers/letters; left/right use row letters/numbers.
    // Top: 1–colMax (numbers), Right: (colMax+1)–(colMax+rowMax) (numbers)
    // Left: A–(row letter for rowMax) (letters), Bottom: next colMax letters after left letters
    for (let k = 1; k <= colMax + rowMax; k++) nodes[String(k)] = { label: String(k), is_border: true, edges: {} };
    // Left border letters (A..rowMax letter) and bottom border letters (next colMax letters)
    const bottomLetterStart = rowMax; // bottom letters start after the row letters in the alphabet
    const allBorderLetters = ALL_LETTERS.slice(0, rowMax + colMax).split('');
    for (const c of allBorderLetters) nodes[c] = { label: c, is_border: true, edges: {} };

    // Connect each border node to its adjacent cell.
    // borderDir is the direction FROM the border node INTO the grid.
    // The cell's edge back to the border is the opposite direction: (borderDir + 2) % 4.
    const addBorderEdge = (borderLabel: string, borderDir: number, cellLabel: string): void => {
        const cellDir = (borderDir + 2) % 4;
        nodes[borderLabel].edges[borderDir] = cellLabel;
        nodes[cellLabel].edges[cellDir] = borderLabel;
    };

    // Add top and bottom nodes
    const bottomLetters = ALL_LETTERS.slice(bottomLetterStart, bottomLetterStart + colMax).split('');
    const lastRowLetter = rowLetters[rowMax - 1];
    for (let col = 0; col < colMax; col++) {
        addBorderEdge(String(col + 1), 3, `A${col + 1}`); // Top
        addBorderEdge(bottomLetters[col], 1, `${lastRowLetter}${col + 1}`); // Bottom
    }

    // Add left and right nodes
    for (let row = 0; row < rowMax; row++) {
        addBorderEdge(rowLetters[row], 2, `${rowLetters[row]}1`); // Left
        addBorderEdge(String(colMax + row + 1), 0, `${rowLetters[row]}${colMax}`); // Right
    }

    return { spaces: nodes, rows: rowMax, cols: colMax };
}
