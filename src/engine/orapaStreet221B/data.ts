import { Direction, Orientation, getOppositeDirection, alternateOrientation, type Board, type Node } from './models';

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

function addNode(board: Board, node: Node): void {
    board.spaces[node.name] = node;
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

    source.links[direction] = to;
    destination.links[getOppositeDirection(direction)] = from; // Connect in the opposite direction
}

function connectColumns(board: Board, leftCol: string, leftColFirstRow: number, rightCol: string, bottomRowFirstCol: number): void {
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

export function getBoard(): Board {
    const board: Board = { spaces: {} };

    // Create triangle nodes
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
                links: {},
            });
        }
    }

    // Connect nodes in the same column.
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

    // Connect rows
    connectColumns(board, "A", 1, "B", 2);
    connectColumns(board, "B", 1, "C", 2);
    connectColumns(board, "C", 1, "D", 1);
    connectColumns(board, "D", 2, "E", 1);
    connectColumns(board, "E", 2, "F", 1);
    connectColumns(board, "F", 2, "G", 1);

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
            links: {},
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

    return board;
}

