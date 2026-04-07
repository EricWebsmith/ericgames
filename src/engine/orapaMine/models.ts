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

// tuple[int, int] in Python is [number, number] in TS
export type Arc = [number, number];

// --- Board Models ---


/** This interface represents a parent tile, which can have multiple child tiles. */
export interface ParentTile {
    id: number;
    name: string;
    optional: boolean;
    subTiles: Tile[];
}

export interface Tile {
    id: number;
    colors: Color[];
    opacity: number; // 0 to 100, for rendering purposes
    arcs: Arc[];
    parent_id: number; // for generator use, to indicate tiles that belong to the same cross space
    // For Arclight hexagonal tiles, the coordinates are determined by axial coordinates. Using QR.  
    // For Orapa Mine square tiles, the coordinates are determined by Cartesian coordinates. Using XY.
    coordinate: Record<number, number>;
    absorbLight: boolean; // true for black gem tiles that absorb the beam entirely
}

export interface ITileInBoard {
    tile: Tile;
    coordinate: string;
    arc_dict: Record<number, number>;
    rotate_angle: number; // 0 to 5
}

export class TileInBoard implements ITileInBoard {
    tile: Tile;
    coordinate: string;
    arc_dict: Record<number, number> = {};
    rotate_angle: number;

    constructor(data: Partial<ITileInBoard> & { tile: Tile; coordinate: string; }) {
        this.tile = data.tile;
        this.coordinate = data.coordinate;
        this.rotate_angle = data.rotate_angle ?? 0;
        this.arc_dict = data.arc_dict ?? {};
    }

    /**
     * Rotate the tile clockwise by rotate_angle * 60 degrees.
     * Equivalent to Python's resolve_rotate()
     */
    resolve_rotate(): this {
        // Reset arc_dict before recalculating
        this.arc_dict = {};

        for (const [in_dir, out_dir] of this.tile.arcs) {
            const a = (in_dir + this.rotate_angle) % 6;
            const b = (out_dir + this.rotate_angle) % 6;

            this.arc_dict[a] = b;
            this.arc_dict[b] = a;
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