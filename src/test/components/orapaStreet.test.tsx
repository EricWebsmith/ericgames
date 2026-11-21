import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import OrapaStreet221B from "../../components/OrapaStreet";
import {
  getDefaultBoard,
  getHexBoard,
} from "../../engine/orapaStreet/data";

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

function liesOnSegment(point: Point, start: Point, end: Point): boolean {
  const edge = { x: end.x - start.x, y: end.y - start.y };
  const relative = { x: point.x - start.x, y: point.y - start.y };
  const cross = edge.x * relative.y - edge.y * relative.x;
  const projection = edge.x * relative.x + edge.y * relative.y;
  const lengthSquared = edge.x * edge.x + edge.y * edge.y;
  return (
    Math.abs(cross) < 0.001 &&
    projection >= -0.001 &&
    projection <= lengthSquared + 0.001
  );
}

function liesOnTriangleEdge(point: Point, vertices: Point[]): boolean {
  return vertices.some((start, index) =>
    liesOnSegment(point, start, vertices[(index + 1) % vertices.length]),
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

  it("draws each traversed triangle from one side edge to another", () => {
    render(<OrapaStreet221B />);

    fireEvent.click(screen.getByTestId("border-A"));

    expect(screen.getAllByTestId(/^light-line-/).length).toBeGreaterThan(0);

    const firstSegment = screen.getAllByTestId(/^light-line-/)[0];
    const trianglePoints = getTrianglePoints("A1");
    const start = {
      x: Number(firstSegment.getAttribute("x1")),
      y: Number(firstSegment.getAttribute("y1")),
    };
    const end = {
      x: Number(firstSegment.getAttribute("x2")),
      y: Number(firstSegment.getAttribute("y2")),
    };
    expect(liesOnTriangleEdge(start, trianglePoints)).toBe(true);
    expect(liesOnTriangleEdge(end, trianglePoints)).toBe(true);
    expect(pointsMatch(start, end)).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);
  });

  it("connects two border nodes to a side midpoint at 60 and 120 degrees", () => {
    const board = getDefaultBoard();
    const borderNames = Object.values(board.spaces)
      .filter(
        (node) => node.isBorder && Object.values(node.edges).includes("A1"),
      )
      .map((node) => node.name);
    expect(borderNames).toHaveLength(2);

    render(<OrapaStreet221B />);

    const trianglePoints = getTrianglePoints("A1");
    const connections = borderNames.map((name) => {
      const sideLine = screen.getByTestId(`border-link-line-${name}`);
      const borderCircle = screen.getByTestId(`border-${name}`);
      return {
        sidePoint: {
          x: Number(sideLine.getAttribute("x1")),
          y: Number(sideLine.getAttribute("y1")),
        },
        borderCenter: {
          x: Number(borderCircle.getAttribute("cx")),
          y: Number(borderCircle.getAttribute("cy")),
        },
      };
    });
    expect(pointsMatch(connections[0].sidePoint, connections[1].sidePoint)).toBe(
      true,
    );

    const sidePoint = connections[0].sidePoint;
    const edgeIndex = trianglePoints.findIndex((start, index) => {
      const end = trianglePoints[(index + 1) % trianglePoints.length];
      return pointsMatch(sidePoint, {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      });
    });
    expect(edgeIndex).toBeGreaterThanOrEqual(0);

    const edgeStart = trianglePoints[edgeIndex];
    const edgeEnd = trianglePoints[(edgeIndex + 1) % trianglePoints.length];
    const edge = { x: edgeEnd.x - edgeStart.x, y: edgeEnd.y - edgeStart.y };
    const angles = connections
      .map(({ borderCenter }) => {
        const connector = {
          x: borderCenter.x - sidePoint.x,
          y: borderCenter.y - sidePoint.y,
        };
        return (
          (edge.x * connector.x + edge.y * connector.y) /
          (Math.hypot(edge.x, edge.y) *
            Math.hypot(connector.x, connector.y))
        );
      })
      .sort((first, second) => first - second);
    expect(angles[0]).toBeCloseTo(-0.5);
    expect(angles[1]).toBeCloseTo(0.5);

    const extensionLine = screen.getByTestId(
      `border-extension-line-${borderNames[0]}`,
    );
    const extension = {
      x:
        Number(extensionLine.getAttribute("x2")) -
        Number(extensionLine.getAttribute("x1")),
      y:
        Number(extensionLine.getAttribute("y2")) -
        Number(extensionLine.getAttribute("y1")),
    };
    expect(Math.abs(edge.x * extension.x + edge.y * extension.y)).toBeLessThan(
      0.001,
    );
  });

  it.each([
    ["default", getDefaultBoard],
    ["hex", getHexBoard],
  ] as const)(
    "displays both border nodes attached to one triangle on the %s board",
    (boardType, getBoard) => {
      const board = getBoard();
      const bordersByTriangle = new Map<string, string[]>();
      for (const border of Object.values(board.spaces).filter(
        (node) => node.isBorder,
      )) {
        const triangleName = Object.values(border.edges)[0];
        if (!triangleName) throw new Error(`Missing link for ${border.name}`);
        const borders = bordersByTriangle.get(triangleName) ?? [];
        borders.push(border.name);
        bordersByTriangle.set(triangleName, borders);
      }

      const groupsWithMultipleBorders = [...bordersByTriangle].filter(
        ([, borders]) => borders.length > 1,
      );
      expect(groupsWithMultipleBorders.length).toBeGreaterThan(0);

      render(<OrapaStreet221B />);
      if (boardType === "hex") {
        fireEvent.change(screen.getByRole("combobox", { name: "Board" }), {
          target: { value: "hex" },
        });
      }

      for (const [, borderNames] of groupsWithMultipleBorders) {
        const centers = borderNames.map((name) => {
          const circle = screen.getByTestId(`border-${name}`);
          return {
            x: Number(circle.getAttribute("cx")),
            y: Number(circle.getAttribute("cy")),
          };
        });
        for (let first = 0; first < centers.length; first++) {
          for (let second = first + 1; second < centers.length; second++) {
            expect(pointsMatch(centers[first], centers[second])).toBe(false);
          }
        }
      }
    },
  );

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
