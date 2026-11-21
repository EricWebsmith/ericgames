import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import OrapaStreet221B from "../../components/OrapaStreet";

type Point = { x: number; y: number };

function getTrianglePoints(name: string): Point[] {
  const polygon = screen
    .getByTestId(`triangle-${name}`)
    .querySelector("polygon");
  if (!polygon) throw new Error(`Missing polygon for ${name}`);

  return (polygon.getAttribute("points") ?? "").split(/\s+/).map((point) => {
    const [x, y] = point.split(",").map(Number);
    return { x, y };
  });
}

function getTriangleCenter(name: string): Point {
  const points = getTrianglePoints(name);
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function pointsMatch(first: Point, second: Point): boolean {
  return (
    Math.abs(first.x - second.x) < 0.001 && Math.abs(first.y - second.y) < 0.001
  );
}

function sharesEdge(first: Point[], second: Point[]): boolean {
  return first.some((start, index) => {
    const end = first[(index + 1) % first.length];
    return second.some((otherStart, otherIndex) => {
      const otherEnd = second[(otherIndex + 1) % second.length];
      return (
        (pointsMatch(start, otherEnd) && pointsMatch(end, otherStart)) ||
        (pointsMatch(start, otherStart) && pointsMatch(end, otherEnd))
      );
    });
  });
}

describe("OrapaStreet221B", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("randomly colors triangles containing tiles", () => {
    render(<OrapaStreet221B />);

    const polygons = screen
      .getAllByTestId(/^triangle-/)
      .map((triangle) => triangle.querySelector("polygon"));
    const colored = polygons.filter(
      (polygon) => polygon?.getAttribute("fill") !== "none",
    );
    const empty = polygons.filter(
      (polygon) => polygon?.getAttribute("fill") === "none",
    );
    expect(colored.length).toBeGreaterThan(0);
    expect(colored.length + empty.length).toBe(122);
  });

  it("draws each traversed triangle from one side midpoint to another", () => {
    render(<OrapaStreet221B />);

    fireEvent.click(screen.getByTestId("border-A"));

    expect(screen.getAllByTestId(/^light-line-/).length).toBeGreaterThan(0);

    const firstSegment = screen.getAllByTestId(/^light-line-/)[0];
    const trianglePoints = getTrianglePoints("A1");
    const sideMidpoints = trianglePoints.map((start, index) => {
      const end = trianglePoints[(index + 1) % trianglePoints.length];
      return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    });
    const start = {
      x: Number(firstSegment.getAttribute("x1")),
      y: Number(firstSegment.getAttribute("y1")),
    };
    const end = {
      x: Number(firstSegment.getAttribute("x2")),
      y: Number(firstSegment.getAttribute("y2")),
    };
    expect(sideMidpoints.some((midpoint) => pointsMatch(start, midpoint))).toBe(
      true,
    );
    expect(sideMidpoints.some((midpoint) => pointsMatch(end, midpoint))).toBe(
      true,
    );
    expect(
      sideMidpoints.some(
        (midpoint) =>
          pointsMatch(start, midpoint) && pointsMatch(end, midpoint),
      ),
    ).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);
  });

  it("draws a perpendicular extension from a border node to a second circle", () => {
    render(<OrapaStreet221B />);

    const borderCircle = screen.getByTestId("border-A");
    const sideLine = screen.getByTestId("border-link-line-A");
    const extensionLine = screen.getByTestId("border-extension-line-A");
    const extensionCircle = screen.getByTestId("border-extension-circle-A");
    const borderCenter = {
      x: Number(borderCircle.getAttribute("cx")),
      y: Number(borderCircle.getAttribute("cy")),
    };
    const resultCenter = {
      x: Number(extensionCircle.getAttribute("cx")),
      y: Number(extensionCircle.getAttribute("cy")),
    };
    const lineStart = {
      x: Number(extensionLine.getAttribute("x1")),
      y: Number(extensionLine.getAttribute("y1")),
    };
    const lineEnd = {
      x: Number(extensionLine.getAttribute("x2")),
      y: Number(extensionLine.getAttribute("y2")),
    };
    expect(
      Math.hypot(lineStart.x - borderCenter.x, lineStart.y - borderCenter.y),
    ).toBeGreaterThanOrEqual(8);
    expect(
      Math.hypot(lineEnd.x - resultCenter.x, lineEnd.y - resultCenter.y),
    ).toBeGreaterThanOrEqual(8);

    const sideMidpoint = {
      x: Number(sideLine.getAttribute("x1")),
      y: Number(sideLine.getAttribute("y1")),
    };
    const trianglePoints = getTrianglePoints("A1");
    const edgeIndex = trianglePoints.findIndex((start, index) => {
      const end = trianglePoints[(index + 1) % trianglePoints.length];
      return pointsMatch(sideMidpoint, {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      });
    });
    expect(edgeIndex).toBeGreaterThanOrEqual(0);

    const edgeStart = trianglePoints[edgeIndex];
    const edgeEnd = trianglePoints[(edgeIndex + 1) % trianglePoints.length];
    const extension = {
      x:
        Number(extensionLine.getAttribute("x2")) -
        Number(extensionLine.getAttribute("x1")),
      y:
        Number(extensionLine.getAttribute("y2")) -
        Number(extensionLine.getAttribute("y1")),
    };
    expect(
      Math.abs(
        (edgeEnd.x - edgeStart.x) * extension.x +
          (edgeEnd.y - edgeStart.y) * extension.y,
      ),
    ).toBeLessThan(0.001);
  });

  it("switches between the default and hex boards", () => {
    render(<OrapaStreet221B />);

    expect(
      screen.getByText(
        "122 triangles · click or keyboard-select a triangle to inspect its neighbors",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Board" }), {
      target: { value: "hex" },
    });

    expect(
      screen.getByText(
        "150 triangles · click or keyboard-select a triangle to inspect its neighbors",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("triangle-J11")).toBeInTheDocument();
    expect(sharesEdge(getTrianglePoints("A1"), getTrianglePoints("A2"))).toBe(
      true,
    );
  });

  it("uses q/r positions to place C1 and D1 edge-to-edge", () => {
    render(<OrapaStreet221B />);

    expect(sharesEdge(getTrianglePoints("C1"), getTrianglePoints("D1"))).toBe(
      true,
    );
  });

  it("places consecutive triangles in a column edge-to-edge", () => {
    render(<OrapaStreet221B />);

    expect(sharesEdge(getTrianglePoints("A1"), getTrianglePoints("A2"))).toBe(
      true,
    );
  });

  it("projects q upright and r down-right with a 120-degree angle", () => {
    render(<OrapaStreet221B />);

    const origin = getTriangleCenter("A1");
    const qNeighbor = getTriangleCenter("B2");
    const rNeighbor = getTriangleCenter("A2");
    const qAxis = {
      x: qNeighbor.x - origin.x,
      y: qNeighbor.y - origin.y,
    };
    const rAxis = {
      x: rNeighbor.x - origin.x,
      y: rNeighbor.y - origin.y,
    };

    expect(qAxis.x).toBeCloseTo(0);
    expect(qAxis.y).toBeLessThan(0);
    expect(rAxis.x).toBeGreaterThan(0);
    expect(rAxis.y).toBeGreaterThan(0);
    expect(
      (qAxis.x * rAxis.x + qAxis.y * rAxis.y) /
        (Math.hypot(qAxis.x, qAxis.y) * Math.hypot(rAxis.x, rAxis.y)),
    ).toBeCloseTo(-0.5);
  });

  it("keeps each triangle equilateral in the projected layout", () => {
    render(<OrapaStreet221B />);

    const points = getTrianglePoints("A1");
    const sideLengths = points.map((start, index) => {
      const end = points[(index + 1) % points.length];
      return Math.hypot(end.x - start.x, end.y - start.y);
    });

    expect(Math.max(...sideLengths) - Math.min(...sideLengths)).toBeLessThan(
      0.001,
    );
  });

  it("shows q/r coordinates in each triangle tooltip", () => {
    render(<OrapaStreet221B />);

    expect(
      screen.getByTestId("triangle-C1").querySelector("title")?.textContent,
    ).toContain("q: 2, r: 0");
  });

  it("does not show the links control", () => {
    render(<OrapaStreet221B />);

    expect(
      screen.queryByRole("checkbox", { name: "Show links" }),
    ).not.toBeInTheDocument();
  });
});
