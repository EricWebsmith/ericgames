import { describe, expect, it } from "vitest";
import { leftRotateCoord, rightRotateCoord } from "../../../engine/orapaStreet/triangleUtils";

describe("cube coordinate rotation", () => {
  const coord = { q: 2, r: -1, s: -1 };

  it("rotates clockwise in 120-degree increments", () => {
    expect(rightRotateCoord(coord, 120)).toEqual({
      q: -1,
      r: 2,
      s: -1,
    });
    expect(rightRotateCoord(coord, 240)).toEqual({
      q: -1,
      r: -1,
      s: 2,
    });
  });

  it("rotates counterclockwise and preserves the cube invariant", () => {
    const rotated = leftRotateCoord(coord, 120);
    expect(rotated).toEqual({ q: -1, r: -1, s: 2 });
    expect(rotated.q + rotated.r + rotated.s).toBe(0);
    expect(rightRotateCoord(rotated, 120)).toEqual(coord);
  });

  it("rejects coordinates outside the q + r + s = 0 plane", () => {
    expect(() => rightRotateCoord({ q: 1, r: 0, s: 0 }, 120)).toThrow(
      "Cube coordinates must satisfy q + r + s = 0",
    );
  });
});
