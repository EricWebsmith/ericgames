import { Color, Direction, Orientation, Tile, alternateOrientation, getOppositeDirection, type Board, type Node, type Offset, type ParentTile } from './models';

const LEFT_TRIANGLE_OFFSETS: Offset[] = [
    { dq: -1, dr: -1 },
    { dq: -1, dr: 0 },
    { dq: -1, dr: 1 },

    { dq: 0, dr: -2 },
    { dq: 0, dr: -1 },
    { dq: 0, dr: 1 },
    { dq: 0, dr: 2 },

    { dq: 1, dr: -2 },
    { dq: 1, dr: -1 },
    { dq: 1, dr: 0 },
    { dq: 1, dr: 1 },
    { dq: 1, dr: 2 },
];

const RIGHT_TRIANGLE_OFFSETS: Offset[] = [
    { dq: -1, dr: -2 },
    { dq: -1, dr: -1 },
    { dq: -1, dr: 0 },
    { dq: -1, dr: 1 },
    { dq: -1, dr: 2 },

    { dq: 0, dr: -2 },
    { dq: 0, dr: -1 },
    { dq: 0, dr: 1 },
    { dq: 0, dr: 2 },

    { dq: 1, dr: -1 },
    { dq: 1, dr: 0 },
    { dq: 1, dr: 1 },
];

function addNode(board: Board, node: Node): void {
    board.spaces[node.name] = node;
    if (!node.isBorder) {
        board.spacesByQr[node.q] ??= {};
        board.spacesByQr[node.q][node.r] = node;
    }
}

function createTriangleNodes(
    board: Board,
    colCounts: Record<string, number>,
    firstRowShapes: Record<string, Orientation>,
    firstRowR: Record<string, number>,
): void {
    let colOrder = 0;
    for (const col in colCounts) {
        const count = colCounts[col];
        const firstRowOrientation = firstRowShapes[col];
        let orientation = firstRowOrientation;
        for (let row = 1; row <= count; row++) {
            const id = `${col}${row}`;
            if (row === 1) {
                orientation = firstRowOrientation;
            } else {
                orientation = alternateOrientation(orientation);
            }

            addNode(board, {
                name: id,
                isBorder: false,
                orientation,
                edges: {},
                neighbors: [],
                q: colOrder,
                r: firstRowR[col] + row - 1,
            });
        }
        colOrder++;
    }
}

function connect(board: Board, from: string, direction: Direction, to: string): void {
    const source = board.spaces[from];
    if (!source) {
        throw new Error(`Missing source node: ${from}`);
    }
    const destination = board.spaces[to];
    if (!destination) {
        throw new Error(`Missing destination node: ${to}`);
    }

    source.edges[direction] = to;
    destination.edges[getOppositeDirection(direction)] = from; // Connect in the opposite direction
}

function connectNodesWithinColumns(board: Board, colCounts: Record<string, number>): void {
    for (const col in colCounts) {
        const count = colCounts[col];
        for (let row = 1; row < count; row++) {
            // Connect to next row in the same column on Horizontal direction (Degrees0)
            const currentId = `${col}${row}`;
            const nextId = `${col}${row + 1}`;
            connect(board, currentId, Direction.Clock6, nextId);

            // Connect to next triangle from 2 o'clock if this triangle is pointy-left.
            if (board.spaces[currentId].orientation === Orientation.PointyLeft) {
                connect(board, currentId, Direction.Clock8, nextId);
            }

            // Connect to next triangle from 4 o'clock if this triangle is pointy-right.
            if (board.spaces[currentId].orientation === Orientation.PointyRight) {
                connect(board, currentId, Direction.Clock4, nextId);
            }
        }
    }
}

function connectColumns(board: Board, colCounts: Record<string, number>, leftCol: string, leftColFirstRow: number, rightCol: string, bottomRowFirstCol: number): void {
    for (let i = 0; i < colCounts[leftCol]; i += 2) {
        const leftId = `${leftCol}${leftColFirstRow + i}`;
        if (!board.spaces[leftId]) {
            break; // Break if the top node doesn't exist
        }

        const rightId = `${rightCol}${bottomRowFirstCol + i}`;
        if (!board.spaces[rightId]) {
            break; // Break if the bottom node doesn't exist
        }

        connect(board, leftId, Direction.Clock2, rightId);
        connect(board, leftId, Direction.Clock4, rightId);
    }
}

function resolveNeighbors(board: Board): void {
    for (const node of Object.values(board.spaces)) {
        const neighborOffsets = node.orientation === Orientation.PointyLeft ? LEFT_TRIANGLE_OFFSETS : RIGHT_TRIANGLE_OFFSETS;
        for (const offset of neighborOffsets) {
            const neighborNode = board.spacesByQr[node.q + offset.dq]?.[node.r + offset.dr] ?? null;
            if (neighborNode) {
                node.neighbors.push(neighborNode.name);
            }
        }
    }
}

export function getDefaultBoard(): Board {
    const colCounts: Record<string, number> = {
        "A": 15,
        "B": 17,
        "C": 19,
        "D": 20,
        "E": 19,
        "F": 17,
        "G": 15,
    };

    const firstRowShapes: Record<string, Orientation> = {
        "A": Orientation.PointyLeft,
        "B": Orientation.PointyLeft,
        "C": Orientation.PointyLeft,
        "D": Orientation.PointyRight,
        "E": Orientation.PointyRight,
        "F": Orientation.PointyRight,
        "G": Orientation.PointyRight,
    };

    const firstRowR: Record<string, number> = {
        "A": 2,
        "B": 1,
        "C": 0,
        "D": 0,
        "E": 1,
        "F": 2,
        "G": 3,
    };

    const board: Board = { spaces: {}, spacesByQr: {} };

    createTriangleNodes(board, colCounts, firstRowShapes, firstRowR);

    connectNodesWithinColumns(board, colCounts);

    // Connect rows
    connectColumns(board, colCounts, "A", 1, "B", 2);
    connectColumns(board, colCounts, "B", 1, "C", 2);
    connectColumns(board, colCounts, "C", 1, "D", 1);
    connectColumns(board, colCounts, "D", 2, "E", 1);
    connectColumns(board, colCounts, "E", 2, "F", 1);
    connectColumns(board, colCounts, "F", 2, "G", 1);

    // Create border nodes and connect them to the triangles
    const borderNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const alpha = String.fromCharCode(945); // α
    const beta = String.fromCharCode(946);

    // Greek letters alpha and beta
    borderNames.push(alpha); // α
    borderNames.push(beta); // β

    for (let i = 1; i <= 28; i++) {
        borderNames.push(`${i}`);
    }

    for (const name of borderNames) {
        addNode(board, {
            name,
            isBorder: true,
            q: -999,
            r: -999,
            edges: {},
            neighbors: [],
        });
    }

    // Connect border nodes to triangles
    connect(board, "A", Direction.Clock4, "A1");
    connect(board, "B", Direction.Clock6, "A1");
    connect(board, "C", Direction.Clock4, "B1");
    connect(board, "D", Direction.Clock6, "B1");
    connect(board, "E", Direction.Clock4, "C1");
    connect(board, "F", Direction.Clock6, "C1");

    connect(board, "G", Direction.Clock6, "D1");
    connect(board, "H", Direction.Clock8, "D1");
    connect(board, "I", Direction.Clock6, "E1");
    connect(board, "J", Direction.Clock8, "E1");
    connect(board, "K", Direction.Clock6, "F1");
    connect(board, "L", Direction.Clock8, "F1");
    connect(board, "M", Direction.Clock6, "G1");
    connect(board, "N", Direction.Clock8, "G1");

    connect(board, "O", Direction.Clock2, "A15");
    connect(board, "P", Direction.Clock0, "A15");
    connect(board, "Q", Direction.Clock2, "B17");
    connect(board, "R", Direction.Clock0, "B17");
    connect(board, "S", Direction.Clock2, "C19");
    connect(board, "T", Direction.Clock0, "C19");
    connect(board, "U", Direction.Clock2, "D20");
    connect(board, "V", Direction.Clock0, "D20");

    connect(board, "W", Direction.Clock0, "E19");
    connect(board, "X", Direction.Clock10, "E19");
    connect(board, "Y", Direction.Clock0, "F17");
    connect(board, "Z", Direction.Clock10, "F17");
    connect(board, alpha, Direction.Clock0, "G15");
    connect(board, beta, Direction.Clock10, "G15");

    // Col A
    for (let row = 2; row <= 14; row += 2) {
        connect(board, `${row * 2 - 3}`, Direction.Clock4, `A${row}`);
        connect(board, `${row * 2 - 1}`, Direction.Clock2, `A${row}`);
    }

    // Col G
    for (let row = 2; row <= 14; row += 2) {
        connect(board, `${row * 2 - 2}`, Direction.Clock8, `G${row}`);
        connect(board, `${row * 2}`, Direction.Clock10, `G${row}`);
    }

    resolveNeighbors(board);
    return board;
}



export function getHexBoard(): Board {
    const colCounts: Record<string, number> = {
        "A": 11,
        "B": 13,
        "C": 15,
        "D": 17,
        "E": 19,
        "F": 19,
        "G": 17,
        "H": 15,
        "I": 13,
        "J": 11,
    };

    const firstRowShapes: Record<string, Orientation> = {
        "A": Orientation.PointyLeft,
        "B": Orientation.PointyLeft,
        "C": Orientation.PointyLeft,
        "D": Orientation.PointyLeft,
        "E": Orientation.PointyLeft,
        "F": Orientation.PointyRight,
        "G": Orientation.PointyRight,
        "H": Orientation.PointyRight,
        "I": Orientation.PointyRight,
        "J": Orientation.PointyRight,
    };

    const firstRowR: Record<string, number> = {
        "A": 4,
        "B": 3,
        "C": 2,
        "D": 1,
        "E": 0,
        "F": 0,
        "G": 1,
        "H": 2,
        "I": 3,
        "J": 4,
    };

    const board: Board = { spaces: {}, spacesByQr: {} };

    createTriangleNodes(board, colCounts, firstRowShapes, firstRowR);

    connectNodesWithinColumns(board, colCounts);

    // Connect rows
    connectColumns(board, colCounts, "A", 1, "B", 2);
    connectColumns(board, colCounts, "B", 1, "C", 2);
    connectColumns(board, colCounts, "C", 1, "D", 2);
    connectColumns(board, colCounts, "D", 1, "E", 2);
    connectColumns(board, colCounts, "E", 1, "F", 1);
    connectColumns(board, colCounts, "F", 2, "G", 1);
    connectColumns(board, colCounts, "G", 2, "H", 1);
    connectColumns(board, colCounts, "H", 2, "I", 1);
    connectColumns(board, colCounts, "I", 2, "J", 1);

    // Create border nodes and connect them to the triangles
    const borderNames = "ABCDEFGHIJKLMNOPQRST".split("");

    for (let i = 1; i <= 40; i++) {
        borderNames.push(`${i}`);
    }

    for (const name of borderNames) {
        addNode(board, {
            name,
            isBorder: true,
            q: -999,
            r: -999,
            edges: {},
            neighbors: [],
        });
    }

    // Connect border nodes to triangles
    connect(board, "A", Direction.Clock4, "A1");
    connect(board, "B", Direction.Clock6, "A1");
    connect(board, "C", Direction.Clock4, "B1");
    connect(board, "D", Direction.Clock6, "B1");
    connect(board, "E", Direction.Clock4, "C1");
    connect(board, "F", Direction.Clock6, "C1");
    connect(board, "G", Direction.Clock4, "D1");
    connect(board, "H", Direction.Clock6, "D1");
    connect(board, "I", Direction.Clock4, "E1");
    connect(board, "J", Direction.Clock6, "E1");

    connect(board, "K", Direction.Clock6, "F1");
    connect(board, "L", Direction.Clock8, "F1");
    connect(board, "M", Direction.Clock6, "G1");
    connect(board, "N", Direction.Clock8, "G1");
    connect(board, "O", Direction.Clock6, "H1");
    connect(board, "P", Direction.Clock8, "H1");
    connect(board, "Q", Direction.Clock6, "I1");
    connect(board, "R", Direction.Clock8, "I1");
    connect(board, "S", Direction.Clock6, "J1");
    connect(board, "T", Direction.Clock8, "J1");



    // Col A connects border nodes 1 to 10
    for (let row = 2; row <= 10; row += 2) {
        connect(board, `${row - 1}`, Direction.Clock4, `A${row}`);
        connect(board, `${row}`, Direction.Clock2, `A${row}`);
    }

    // Left bottom border nodes connect to border nodes 11 to 20
    connect(board, "11", Direction.Clock2, "A11");
    connect(board, "12", Direction.Clock0, "A11");
    connect(board, "13", Direction.Clock2, "B13");
    connect(board, "14", Direction.Clock0, "B13");
    connect(board, "15", Direction.Clock2, "C15");
    connect(board, "16", Direction.Clock0, "C15");
    connect(board, "17", Direction.Clock2, "D17");
    connect(board, "18", Direction.Clock0, "D17");
    connect(board, "19", Direction.Clock2, "E19");
    connect(board, "20", Direction.Clock0, "E19");

    // Right bottom border nodes connect to border nodes 21 to 30
    connect(board, "21", Direction.Clock0, "F19");
    connect(board, "22", Direction.Clock10, "F19");
    connect(board, "23", Direction.Clock0, "G17");
    connect(board, "24", Direction.Clock10, "G17");
    connect(board, "25", Direction.Clock0, "H15");
    connect(board, "26", Direction.Clock10, "H15");
    connect(board, "27", Direction.Clock0, "I13");
    connect(board, "28", Direction.Clock10, "I13");
    connect(board, "29", Direction.Clock0, "J11");
    connect(board, "30", Direction.Clock10, "J11");

    // Col J connects border nodes 31 to 40
    for (let row = 10; row >= 2; row -= 2) {
        connect(board, `${40 - row + 1}`, Direction.Clock10, `J${row}`);
        connect(board, `${40 - row + 2}`, Direction.Clock8, `J${row}`);
    }

    resolveNeighbors(board);
    return board;
}

export function getTiles(): ParentTile[] {
    return [
        // Blue tile – irregular 6-cell shape
        {
            name: 'Blue', optional: false, subTiles: [
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 0 }, reflect: [[0, 10], [10, 0], [2, 4], [4, 2]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 1 }, reflect: [[10, 8], [8, 10]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 2 }, reflect: [[2, 4], [4, 2]], parentName: 'Blue' }),
                new Tile({ colors: [Color.Blue], coordinate: { 0: 0, 1: 3 }, reflect: [[10, 8], [8, 10], [6, 4], [4, 6],], parentName: 'Blue' }),
            ]
        },
    ];
}