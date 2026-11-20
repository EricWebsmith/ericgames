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
    edges: { [key in Direction]?: string }; // Links to other nodes (triangles or borders)

    neighbors: string[];

    q: number; // Column index (0-based) -1 if border
    r: number; // Row index (0-based) -1 if border
}

export interface Board {
    spaces: Record<string, Node>;
    spacesByQr: Record<number, Record<number, Node>>;
}

// #region tiles

export const Color = {
    Red: "red",
    Blue: "blue",
    Yellow: "yellow",
    White: "white",
} as const;

export type Color = typeof Color[keyof typeof Color];

export interface LightResult {
    direction: Direction;
    label: string;
    colors: Color[];
}

export type Reflect = [number, number];

export interface Offset {
    dq: number;
    dr: number;
}


export class Tile {
    colors: Color[];
    parentName: string;
    label: Record<number, number>;
    reflect: Reflect[];
    orientation: Orientation = Orientation.PointyLeft;
    belt: number = -1;
    lateReflect: Reflect[] = [];


    constructor(data: {
        colors: Color[];
        parentName: string;
        coordinate: Record<number, number>;
        reflect: Reflect[];
        orientation: Orientation;
        opacity?: number;
        absorbLight?: boolean;
        belt?: number;
        connectBorder?: boolean;
        lateReflect?: Reflect[];
    }) {
        this.colors = data.colors;
        this.parentName = data.parentName;
        this.label = data.coordinate;
        this.reflect = data.reflect;
        this.lateReflect = data.lateReflect??[];
        this.belt = data.belt??-1;
    }
}


export interface ITileInBoard {
    tile: Tile;
    coordinate: string;
    rotated_reflect: Record<number, number>;
    rotate_angle: number; // 0 to 2
    rotatedLateReflect: Record<number, number>;
}

export class TileInBoard implements ITileInBoard {
    tile: Tile;
    coordinate: string;
    rotated_reflect: Record<number, number> = {};
    rotatedLateReflect: Record<number, number> = {};
    rotate_angle: number;
    belt: number;

    constructor(data: Partial<ITileInBoard> & { tile: Tile; coordinate: string; }) {
        this.tile = data.tile;
        this.coordinate = data.coordinate;
        this.rotate_angle = data.rotate_angle ?? 0;
        this.belt = data.tile.belt ?? -1;
        this.rotated_reflect = data.rotated_reflect ?? {};
        this.rotatedLateReflect = data.rotatedLateReflect ?? {};
    }

    /**
     * Rotate the tile clockwise by rotate_angle * 60 degrees.
     * Equivalent to Python's resolve_rotate()
     */
    resolve_rotate(): this {
        // Reset arc_dict before recalculating
        this.rotated_reflect = {};

        for (const [in_dir, out_dir] of this.tile.reflect) {
            const rotatedInDir = (in_dir + this.rotate_angle) % 4;
            const rotatedOutDir = (out_dir + this.rotate_angle) % 4;

            this.rotated_reflect[rotatedInDir] = rotatedOutDir;
        }

        for (const [in_dir, out_dir] of this.tile.lateReflect) {
            const rotatedInDir = (in_dir + this.rotate_angle) % 4;
            const rotatedOutDir = (out_dir + this.rotate_angle) % 4;

            this.rotatedLateReflect[rotatedInDir] = rotatedOutDir;
        }

        if (this.belt !== -1) {
            this.belt = (this.belt + this.rotate_angle) % 4;
        }

        return this;
    }
}


/** This interface represents a parent tile, which can have multiple child tiles. */
export interface ParentTile {
    name: string;
    flipable: boolean;
    subTiles: Tile[];
}

// endregion