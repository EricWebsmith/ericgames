export const Orient = {
  PointyLeft: "pointy-left",
  PointyRight: "pointy-right",
} as const;
export type Orient = (typeof Orient)[keyof typeof Orient];

export function alternateOrientation(orientation: Orient): Orient {
  return orientation === Orient.PointyLeft
    ? Orient.PointyRight
    : Orient.PointyLeft;
}

export const Direction = {
  Clock0: 0, // 12 o'clock (top)
  Clock2: 2, // 2 o'clock (top-right)
  Clock4: 4, // 4 o'clock (bottom-right)
  Clock6: 6, // 6 o'clock (bottom)
  Clock8: 8, // 8 o'clock (bottom-left)
  Clock10: 10, // 10 o'clock (top-left)
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

/**
 * Returns the opposite 6-direction on the clock face.
 */
export function getOppositeDirection(dir: Direction): Direction {
  return ((dir + 6) % 12) as Direction;
}

export interface Node {
  isOccupied: false;
  /**
   * For triangles, the names are A1, B1, C2, etc.
   * For borders, the names are _1U, _2D, _AD, _BD, etc.
   */
  name: string;
  isBorder: boolean; // True if this node is a border, false if it's a triangle
  orientation?: Orient; // Optional: only used if type is "triangle"

  /**
   * For triangles, there are 6 links,
   * For borders, there is only 1 link.
   */
  edges: { [key in Direction]?: string }; // Links to other nodes (triangles or borders)

  neighbors: string[];

  q: number; // Column index (0-based) -1 if border
  r: number; // Row index (0-based) -1 if border
  s: number;
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

export type Color = (typeof Color)[keyof typeof Color];

export interface LightResult {
  direction: Direction;
  label: string;
  colors: Color[];
}

export interface Puzzle {
  id: number;
  tiles: TileInBoard[];
  light_results: Record<string, LightResult[]>;
}

export type Reflect = [number, number];

export interface Offset {
  dq: number;
  dr: number;
}

export class Tile {
  colors: Color[];
  parentName: string;
  coordinate: CubeCoord;
  reflect: Reflect[];
  orient: Orient = Orient.PointyLeft;
  belt: number = -1;
  lateReflect: Reflect[] = [];
  lineTile: boolean = false;

  constructor(data: {
    colors: Color[];
    parentName: string;
    coordinate: CubeCoord;
    reflect: Reflect[];
    orient: Orient;
    opacity?: number;
    absorbLight?: boolean;
    belt?: number;
    connectBorder?: boolean;
    lateReflect?: Reflect[];
    lineTile?: boolean;
  }) {
    this.colors = data.colors;
    this.parentName = data.parentName;
    this.coordinate = data.coordinate;
    this.reflect = data.reflect;
    this.lateReflect = data.lateReflect ?? [];
    this.belt = data.belt ?? -1;
    this.lineTile = data.lineTile ?? false;
    this.orient = data.orient;
  }
}

export interface ITileInBoard {
  tile: Tile;
  label: string;
  rotated_reflect: Record<number, number>;
  rotate_angle: number; // 0 to 2
}

export class TileInBoard implements ITileInBoard {
  tile: Tile;
  label: string;
  // to be removed
  rotated_reflect: Record<number, number> = {};
  rotate_angle: number;
  belt: number;

  constructor(data: Partial<ITileInBoard> & { tile: Tile; label: string }) {
    this.tile = data.tile;
    this.label = data.label;
    this.rotate_angle = data.rotate_angle ?? 0;
    this.belt = data.tile.belt ?? -1;
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
      const rotatedInDir = (in_dir + this.rotate_angle) % 12;
      const rotatedOutDir = (out_dir + this.rotate_angle) % 12;

      this.rotated_reflect[rotatedInDir] = rotatedOutDir;
    }

    if (this.belt !== -1) {
      this.belt = (this.belt + this.rotate_angle) % 12;
    }

    return this;
  }
}

/** This interface represents a parent tile, which can have multiple child tiles. */
export interface ParentTile {
  name: string;
  flipable: boolean;
  hasLineTile: boolean;
  subTiles: Tile[];
}

// endregion
