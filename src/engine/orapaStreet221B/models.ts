export const Orientation = {
    PointyLeft: "pointy-left",
    PointyRight: "pointy-right",
} as const;
export type Orientation = typeof Orientation[keyof typeof Orientation];

export function alternateOrientation(orientation: Orientation): Orientation {
    return orientation === Orientation.PointyLeft ? Orientation.PointyRight : Orientation.PointyLeft;
}

export const Direction = {
    Clock0: 0,   // 12 o'clock (top)
    Clock2: 2,   // 2 o'clock (top-right)
    Clock4: 4,   // 4 o'clock (bottom-right)
    Clock6: 6,   // 6 o'clock (bottom)
    Clock8: 8,   // 8 o'clock (bottom-left)
    Clock10: 10,  // 10 o'clock (top-left)
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

/**
 * Returns the opposite 6-direction on the clock face.
 */
export function getOppositeDirection(dir: Direction): Direction {
    return ((dir + 6) % 12) as Direction;
}

export interface Node {
    /**
     * For triangles, the names are A1, B1, C2, etc.
     * For borders, the names are _1U, _2D, _AD, _BD, etc.
     */
    name: string;
    isBorder: boolean; // True if this node is a border, false if it's a triangle
    orientation?: Orientation; // Optional: only used if type is "triangle"

    /**
     * For triangles, there are 6 links,
     * For borders, there is only 1 link.
     */
    links: { [key in Direction]?: string }; // Links to other nodes (triangles or borders)

    q: number; // Column index (0-based) -1 if border
    r: number; // Row index (0-based) -1 if border
}

export interface Board {
    spaces: Record<string, Node>;
}
