// --- Enums & Types ---

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

export interface Tile {
    colors: Color[];
    opacity: number; // 0 to 100, for rendering purposes
    reflect: Reflect[];
    // For Arclight hexagonal tiles, the coordinates are determined by axial coordinates. Using QR.  
    // For Orapa Mine square tiles, the coordinates are determined by Cartesian coordinates. Using XY.
    coordinate: Record<number, number>;
    absorbLight: boolean; // true for black gem tiles that absorb the beam entirely
    parentName?: string; // the name of the parent tile this sub-tile belongs to
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

    constructor(data: Partial<ITileInBoard> & { tile: Tile; coordinate: string; }) {
        this.tile = data.tile;
        this.coordinate = data.coordinate;
        this.rotate_angle = data.rotate_angle ?? 0;
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
            const a = (in_dir + this.rotate_angle) % 4;
            const b = (out_dir + this.rotate_angle) % 4;

            this.rotated_reflect[a] = b;
            this.rotated_reflect[b] = a;
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