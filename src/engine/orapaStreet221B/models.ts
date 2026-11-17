export type Orientation = "flat-top" | "pointy-top";

export enum Direction {
    Degrees0 = 0,
    Degrees60 = 1,
    Degrees120 = 2,
    Degrees180 = 3,
    Degrees240 = 4,
    Degrees300 = 5,
}

export interface Node {
    id: string;
    /**
     * For triangles, the names are A1, B1, C2, etc.
     * For borders, the names are 1, 2, A, B, etc.
     */
    name: string;
    type: "triangle" | "border";
    orientation?: Orientation; // Optional: only used if type is "triangle"

    /**
     * For triangles, there are 6 links,
     * For borders, there is only 1 link.
     */
    links: {[key in Direction]?: string}; // Links to other nodes (triangles or borders)
}

export interface Board {
    spaces: Record<string, Node>;
}
