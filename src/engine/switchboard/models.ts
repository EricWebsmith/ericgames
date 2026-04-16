export type Arc = [number, number];

// --- Board Models ---

export interface Tile {
    id: number;
    arcs: Arc[];
}

export interface ITileInBoard {
    tile: Tile;
    tileNo: number;
    arcDict: Record<number, number>;
    rotate: number; // 0 to 5
    // Connections to other tiles
    edges: Record<number, number>;
}

export class TileInBoard implements ITileInBoard {
    tile: Tile;
    tileNo: number;
    arcDict: Record<number, number> = {};
    rotate: number;
    edges: Record<number, number> = {};

    constructor(data: Partial<ITileInBoard> & { tile: Tile; tileNo: number; rotate: number }) {
        this.tile = data.tile;
        this.tileNo = data.tileNo;
        this.rotate = data.rotate ?? 0;
        this.arcDict = data.arcDict ?? {};
        this.edges = data.edges ?? {};
    }

    /**
     * Rotate the tile clockwise by rotate_angle * 60 degrees.
     * Equivalent to Python's resolve_rotate()
     */
    resolve_rotate(): this {
        // Reset arc_dict before recalculating
        this.arcDict = {};

        for (const [in_dir, out_dir] of this.tile.arcs) {
            const a = (in_dir + this.rotate) % 6;
            const b = (out_dir + this.rotate) % 6;

            this.arcDict[a] = b;
            this.arcDict[b] = a;
        }

        return this;
    }
}

export const BoardType = {
    Rhombic9: "rhombic9",
    Rhombic16: "rhombic16",
    Rhombic25: "rhombic25",
    Hexagonal19: "hexagonal19",
    Hexagonal37: "hexagonal37",
} as const;

export type BoardType = typeof BoardType[keyof typeof BoardType];

export interface Board {
    boardId: number;
    boardType: BoardType;
    startTileIndex: number;
    startTileDirection: number;
    endTileIndex: number;
    endTileDirection: number;
    tiles: TileInBoard[];
}

export interface PathSegment {
    tileIndex: number;
    inDir: number;
    outDir: number;
}
