import type { CubeCoord } from "./models";

export type RotationDegree = 0 | 120 | 240;

function rotateClockwise120(coord: CubeCoord): CubeCoord {
  return { q: coord.s, r: coord.q, s: coord.r };
}

function rotateCounterclockwise120(coord: CubeCoord): CubeCoord {
  return { q: coord.r, r: coord.s, s: coord.q };
}

function rotate(
  coord: CubeCoord,
  degree: RotationDegree,
  rotate120: (coord: CubeCoord) => CubeCoord,
): CubeCoord {
  if (coord.q + coord.r + coord.s !== 0) {
    throw new Error("Cube coordinates must satisfy q + r + s = 0");
  }

  let result = coord;
  for (let angle = 0; angle < degree; angle += 120) {
    result = rotate120(result);
  }
  return result;
}

export function leftRotateCoord(
  coord: CubeCoord,
  degree: RotationDegree,
): CubeCoord {
  return rotate(coord, degree, rotateCounterclockwise120);
}

export function rightRotateCoord(
  coord: CubeCoord,
  degree: RotationDegree,
): CubeCoord {
  return rotate(coord, degree, rotateClockwise120);
}
