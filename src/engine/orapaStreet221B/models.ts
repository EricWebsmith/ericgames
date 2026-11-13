export type TriangleOrientation = "flat-top" | "pointy-top";

export enum Direction {
  Degrees0 = 0,
  Degrees60 = 1,
  Degrees120 = 2,
  Degrees180 = 3,
  Degrees240 = 4,
  Degrees300 = 5,
}

export interface Triangle {
  orientation: TriangleOrientation;
}
