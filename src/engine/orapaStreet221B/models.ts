export type TriangleOrientation = "flat-top" | "pointy-top";

export enum TriangleDirection {
  Zero = 0,
  Sixty = 1,
  OneHundredTwenty = 2,
  OneHundredEighty = 3,
  TwoHundredForty = 4,
  ThreeHundred = 5,
}

export interface Triangle {
  orientation: TriangleOrientation;
}
