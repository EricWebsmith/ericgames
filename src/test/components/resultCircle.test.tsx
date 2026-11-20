import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Color } from "../../engine/orapaStreet/models";
import ResultCircle from "../../components/shared/ResultCircle";

describe("ResultCircle", () => {
  it.each([
    [
      [Color.Red, Color.Blue],
      ["#5577ff", "#ff5555"],
    ],
    [
      [Color.Red, Color.Blue, Color.Yellow],
      ["#5577ff", "#ff5555", "#ccaa00"],
    ],
    [
      [Color.Red, Color.Blue, Color.Yellow, Color.White],
      ["#5577ff", "#ff5555", "#e0e0e0", "#ccaa00"],
    ],
  ])("renders equal color sectors", (colors, expectedFills) => {
    const { container } = render(
      <svg>
        <ResultCircle
          cx={10}
          cy={10}
          r={7}
          testId="result-circle"
          colors={colors}
        />
      </svg>,
    );

    expect(container.querySelectorAll("path")).toHaveLength(
      expectedFills.length,
    );
    expect(
      Array.from(container.querySelectorAll("path"), (path) =>
        path.getAttribute("fill"),
      ),
    ).toEqual(expectedFills);
    expect(
      container.querySelector('[data-testid="result-circle"]'),
    ).toHaveAttribute("fill", "none");
  });
});
