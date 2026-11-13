export type Orientation = "flat-top" | "pointy-top";

export enum Direction {
    Degrees0 = 0,
    Degrees60 = 1,
    Degrees120 = 2,
    Degrees180 = 3,
    Degrees240 = 4,
    Degrees300 = 5,
}

export interface TriangleNode {
    type: "triangle";
    /// Interger numbers representing the triangle grid's position in the board.
    /// The left-top triagle is 0, the second in the same row is 1, and so on. The second row starts with the next integer after the last number of the first row.
    /// The right-bottom triangle is the last number in the grid.
    no: number;
    orientation: Orientation;
    // A triangle always has 6 directional links (0 through 5)
    links: Record<Direction, string | number>;
}

export interface BorderNode {
    type: "border";
    id: string; // e.g., "A", "2", "13"
    // A border links to exactly one adjacent triangle and the direction it faces into the board
    link: {
        direction: Direction;
        triangleNo: number;
    };
}


// The overall graph can be a union or a lookup map of all nodes
export type GraphNode = TriangleNode | BorderNode;

export interface BoardGraph {
    triangles: Map<number, TriangleNode>;
    borders: Map<string, BorderNode>;
}

/*
Relationship examples

A Triangle can link to other triangles or to the border. 
The relationship is represented by an array of 6 elements, 
each corresponding to a direction (0 to 5). 
Each element can be either a number (representing another triangle's number) 
or a string (representing a border label).

like for Triangle 1:
0: 2 // Direction 0 linked to triangle 2
1: "2" // Direction 1 linked to Border 2
2: "1" // Direction 2 linked to Border 1
3: "A" // Direction 3 linked to Border A
4: "B" // Direction 4 linked to Border B
5: 2 // Direction 5 linked to triangle 2



*/