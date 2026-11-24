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

  q: number;
  r: number;
}

export interface Board {
  spaces: Record<string, Node>;
  spacesByQr: Record<number, Record<number, Node>>;
  restrictedArea: string[];
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

export type Reflect = Record<number, number>;

export interface Offset {
  dq: number;
  dr: number;
}

export const TriangleLine = {
  Vertical: "vertical",
  Top: "up",
  Bottom: "down",
} as const;
export type TriangleLine = (typeof TriangleLine)[keyof typeof TriangleLine];
export class Tile {
  colors: Color[];
  parentName: string;
  q: number;
  r: number;
  reflect: Record<number, number>;
  orient: Orient = Orient.PointyLeft;
  lineTileLine: TriangleLine = TriangleLine.Vertical;
  lineTile: boolean = false;

  constructor(data: {
    colors: Color[];
    parentName: string;
    q: number;
    r: number;
    reflect: Record<number, number>;
    orient: Orient;
    lineTileLine?: TriangleLine;
    belt?: number;
    lineTile?: boolean;
  }) {
    this.colors = data.colors;
    this.parentName = data.parentName;
    this.q = data.q;
    this.r = data.r;
    this.reflect = data.reflect;
    this.lineTileLine = data.lineTileLine ?? TriangleLine.Vertical;
    this.lineTile = data.lineTile ?? false;
    this.orient = data.orient;
  }
}

export interface ITileInBoard {
  tile: Tile;
  label: string;
}

export class TileInBoard implements ITileInBoard {
  tile: Tile;
  label: string;

  constructor(data: Partial<ITileInBoard> & { tile: Tile; label: string; }) {
    this.tile = data.tile;
    this.label = data.label;
  }
}

/** This interface represents a parent tile, which can have multiple child tiles. */
export interface ParentTile {
  name: string;
  flipable: boolean;
  hasLineTile: boolean;
  subTiles: Tile[];
}


export interface TileOptions {
  includeTransparent: boolean;
  includeLightBlue: boolean;
}

export const defaultTileOptions: TileOptions = {
  includeTransparent: true,
  includeLightBlue: true,
};

// endregion
