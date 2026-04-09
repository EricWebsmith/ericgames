// --- Enums & Types ---

// Border positions for a 10×8 square grid (10 columns, 8 rows).
// A 10×8 grid has 2×(10+8) = 36 border positions total, split evenly:
//   Letters A–R  (18): A–J (10 letters) along the bottom edge,
//                       K–R  (8 letters) along the right edge.
//   Numbers 1–18 (18): 1–10 along the top edge,
//                       11–18 along the left edge.
export const borderLabels: string[] = [
    ...'ABCDEFGHIJKLMNOPQR'.split(''),
    ...Array.from({ length: 18 }, (_, i) => String(i + 1)),
];

export const Color = {
    Red: "red",
    Blue: "blue",
    Yellow: "yellow",
    White: "white",
} as const;

export type Color = typeof Color[keyof typeof Color];

export const LightOrSight = {
    LIGHT: "light",
    SIGHT: "sight"
} as const;

export type LightOrSight = typeof LightOrSight[keyof typeof LightOrSight];

// For example [0, 1] means the tile reflects light coming from west to north.
export type Reflect = [number, number];

// --- Board Models ---


/** This interface represents a parent tile, which can have multiple child tiles. */
export interface ParentTile {
    name: string;
    optional: boolean;
    subTiles: Tile[];
}

export class Tile {
    colors: Color[];
    parentName: string;
    coordinate: Record<number, number>;
    reflect: Reflect[];

    opacity: number = 100;
    absorbLight: boolean = false;
    belt: number = -1;
    connectBorder: boolean = false;
    blackHole: boolean = false;


    constructor(data: {
        colors: Color[];
        parentName: string;
        coordinate: Record<number, number>;
        reflect: Reflect[];
        opacity?: number;
        absorbLight?: boolean;
        belt?: number;
        connectBorder?: boolean;
        blackHole?: boolean;
    }) {
        const { reflect, opacity = 100, absorbLight = false, belt = -1, connectBorder = false, blackHole = false } = data;
        this.colors = data.colors;
        this.parentName = data.parentName;
        this.coordinate = data.coordinate;
        this.reflect = reflect;
        this.opacity = opacity;
        this.absorbLight = absorbLight;
        this.belt = belt;
        this.connectBorder = connectBorder;
        this.blackHole = blackHole;
    }
}

export interface ITileInBoard {
    tile: Tile;
    coordinate: string;
    rotated_reflect: Record<number, number>;
    rotate_angle: number; // 0 to 2
}

export class TileInBoard implements ITileInBoard {
    tile: Tile;
    coordinate: string;
    rotated_reflect: Record<number, number> = {};
    rotate_angle: number;
    onlyBorder: number;

    constructor(data: Partial<ITileInBoard> & { tile: Tile; coordinate: string; }) {
        this.tile = data.tile;
        this.coordinate = data.coordinate;
        this.rotate_angle = data.rotate_angle ?? 0;
        this.onlyBorder = data.tile.belt ?? -1;
        this.rotated_reflect = data.rotated_reflect ?? {};
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

        if (this.onlyBorder !== -1) {
            this.onlyBorder = (this.onlyBorder + this.rotate_angle) % 4;
        }

        return this;
    }
}

// --- Play Models ---

export interface Action {
    id: number;
    light_or_sight: LightOrSight;
    coordinate: string;
}

export interface Game {
    id: number;
    name: string;
    board_id: number;
    moves: Action[];
}

// --- Generator Models ---

export interface Edge {
    from_node: string;
    from_border: number;
    to_node: string;
    to_border: number;
}

export interface Node {
    label: string;
    is_border: boolean;
    edges: Record<number, string>;
}

export interface Board {
    rows: number;
    cols: number;
    spaces: Record<string, Node>;
}

export interface LightResult {
    end_label: string;
    colors: Color[];
}

export interface SightResult {
    colors: Color[];
}

export interface Puzzle {
    id: number;
    tiles: TileInBoard[];
    light_results: Record<string, LightResult>;
    sight_results: Record<string, Color[]>;
}