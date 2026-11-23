import { afterEach, describe, expect, it, vi } from "vitest";
import { getRandomTile, getTiles } from "../../../engine/orapaStreet/tiles";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getRandomTile", () => {
  it("can select each of the 12 blue3 variants", () => {
    const blueTile = getTiles(4, () => 0).find((tile) =>
      tile.subTiles[0].colors.includes("blue"),
    );
    if (!blueTile) throw new Error("No blue tile is available");
    const variants = Array.from({ length: 12 }, () => blueTile);
    const random = vi.spyOn(Math, "random");
    const selections = [];
    for (let index = 0; index < 12; index++) {
      random.mockReturnValue((index + 0.5) / 12);
      selections.push(getRandomTile(variants));
    }

    expect(new Set(selections).size).toBe(12);
  });

  it("rejects random values outside [0, 1)", () => {
    const blueTile = getTiles(4, () => 0).find((tile) =>
      tile.subTiles[0].colors.includes("blue"),
    );
    if (!blueTile) throw new Error("No blue tile is available");

    vi.spyOn(Math, "random").mockReturnValue(1);
    expect(() => getRandomTile([blueTile])).toThrow(
      "Random source must return a value in [0, 1)",
    );
  });
});
