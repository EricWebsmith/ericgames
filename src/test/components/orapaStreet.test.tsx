import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrapaStreet from "../../components/OrapaStreet";
import i18n from "../../i18n";

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the selected parent tiles at the left of the board", () => {
    window.history.replaceState(null, "", "/?s=123&n=4");
    render(<OrapaStreet />);
    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));

    const palette = screen.getByRole("complementary", {
      name: "Available Tiles",
    });
    expect(palette).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Available Tiles" }),
    ).toBeInTheDocument();
    const paletteTiles = screen.getAllByTestId(/^palette-tile-/);
    expect(paletteTiles).toHaveLength(4);
    for (const tile of paletteTiles) {
      expect(tile).not.toHaveAttribute("title");
      expect(tile.querySelector("span")).toBeNull();
    }
    const triangles = Array.from(palette.querySelectorAll("polygon"));
    expect(triangles.length).toBeGreaterThan(0);
    for (const triangle of triangles) {
      const vertices = (triangle.getAttribute("points") ?? "")
        .split(/\s+/)
        .map((point) => point.split(",").map(Number));
      const sideLengths = vertices.map((start, index) => {
        const end = vertices[(index + 1) % vertices.length];
        return Math.hypot(
          (end?.[0] ?? 0) - (start[0] ?? 0),
          (end?.[1] ?? 0) - (start[1] ?? 0),
        );
      });

      expect(Math.max(...sideLengths) - Math.min(...sideLengths)).toBeLessThan(
        0.001,
      );
    }

    const paletteTileElements = Array.from(
      palette.querySelectorAll('[data-testid^="palette-tile-"]'),
    );
    expect(
      paletteTileElements.some((paletteTile) => {
        const tileTriangles = Array.from(
          paletteTile.querySelectorAll("polygon"),
        ).map((triangle) =>
          (triangle.getAttribute("points") ?? "")
            .split(/\s+/)
            .map((point) => {
              const [x, y] = point.split(",").map(Number);
              return { x: x ?? 0, y: y ?? 0 };
            }),
        );
        return tileTriangles.some((triangle, index) =>
          tileTriangles
            .slice(index + 1)
            .some((otherTriangle) => sharesEdge(triangle, otherTriangle)),
        );
      }),
    ).toBe(true);

    const lineMarkers = Array.from(palette.querySelectorAll("line"));
    expect(lineMarkers.length).toBeGreaterThan(0);
    for (const line of lineMarkers) {
      expect(line.getAttribute("x1")).toBe(line.getAttribute("x2"));
      expect(line.parentElement?.querySelector("polygon")).toBeNull();
    }
  });

  it("supports transparent and sapphire expansion options", () => {
    render(<OrapaStreet />);

    const transparentOption = screen.getByRole("checkbox", {
      name: "Transparent Expansion",
    });
    const sapphireOption = screen.getByRole("checkbox", {
      name: "Sapphire Expansion",
    });

    expect(transparentOption).toBeChecked();
    expect(sapphireOption).toBeChecked();

    fireEvent.click(transparentOption);
    fireEvent.click(sapphireOption);
    fireEvent.click(screen.getByRole("button", { name: "New puzzle" }));

    expect(screen.queryByTestId("palette-tile-transparent1")).toBeNull();
    expect(screen.queryByTestId("palette-tile-lightblue1")).toBeNull();
    expect(new URLSearchParams(window.location.search).get("o")).toBe("00");
  });

  it("renders transparent tiles in light gray when revealing the answer", () => {
    window.history.replaceState(null, "", "/?s=123&n=4&o=10");
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<OrapaStreet />);

    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));

    expect(
      screen
        .getAllByTestId(/^triangle-/)
        .some(
          (triangle) =>
            triangle.querySelector("polygon")?.getAttribute("fill") ===
            "#eeeeee",
        ),
    ).toBe(true);
  });

  it("translates the page into Simplified Chinese", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh");
    });

    try {
      render(<OrapaStreet />);

      expect(
        screen.getByRole("heading", { name: "奥拉帕街 221B" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("棋盘")).toBeInTheDocument();
      expect(screen.getByLabelText("Token")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "看答案" }));
      expect(
        screen.getByRole("complementary", { name: "可用 Token" }),
      ).toBeInTheDocument();
    } finally {
      await act(async () => {
        await i18n.changeLanguage("en");
      });
    }
  });

  it("paints restricted board triangles with diagonal stripes", () => {
    render(<OrapaStreet />);

    const restricted = screen
      .getAllByTestId(/^triangle-/)
      .filter(
        (triangle) => triangle.getAttribute("data-restricted-area") === "true",
      );

    expect(restricted.length).toBeGreaterThan(0);
    for (const triangle of restricted) {
      expect(triangle.querySelector("polygon")).toHaveAttribute(
        "fill",
        "url(#orapa-street-restricted-stripes)",
      );
    }
  });

  it("uses dark triangle labels on white tiles", () => {
    window.history.replaceState(null, "", "/?s=123&n=6");
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<OrapaStreet />);
    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));

    const whitePolygons = screen
      .getAllByTestId(/^triangle-/)
      .map((triangle) => triangle.querySelector("polygon"))
      .filter((polygon) => polygon?.getAttribute("fill") === "#e0e0e0");

    expect(whitePolygons.length).toBeGreaterThan(0);
    for (const polygon of whitePolygons) {
      const label = polygon?.parentElement?.querySelector("text");
      expect(label).toHaveAttribute("fill", "#111827");
    }
  });

  it("randomly colors triangles containing tiles", () => {
    render(<OrapaStreet />);
    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));

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

  it("draws one reflector line along a side of each placed line tile", () => {
    window.history.replaceState(null, "", "/?s=123&n=6");
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<OrapaStreet />);
    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));

    const reflectorLines = screen.getAllByTestId(/^line-tile-reflector-/);
    expect(new Set(reflectorLines.map((line) => line.dataset.testid)).size).toBe(
      reflectorLines.length,
    );

    for (const line of reflectorLines) {
      const triangleName = line.dataset.testid?.replace(
        "line-tile-reflector-",
        "",
      );
      if (!triangleName) throw new Error("Missing line-tile triangle name");

      const points = getTrianglePoints(triangleName);
      const lineStart = {
        x: Number(line.getAttribute("x1")),
        y: Number(line.getAttribute("y1")),
      };
      const lineEnd = {
        x: Number(line.getAttribute("x2")),
        y: Number(line.getAttribute("y2")),
      };
      const polygon = screen
        .getByTestId(`triangle-${triangleName}`)
        .querySelector("polygon");
      expect(polygon?.getAttribute("fill")).toBe("none");
      expect(line.getAttribute("stroke")).toMatch(/^#[0-9a-f]{6}$/i);
      expect(Math.abs(lineStart.x - lineEnd.x)).toBeLessThan(0.001);
      const lineVector = {
        x: lineEnd.x - lineStart.x,
        y: lineEnd.y - lineStart.y,
      };
      const parallelToSide = points.some((start, index) => {
        const end = points[(index + 1) % points.length];
        const sideVector = { x: end.x - start.x, y: end.y - start.y };
        return Math.abs(
          sideVector.x * lineVector.y - sideVector.y * lineVector.x,
        ) < 0.001;
      });

      expect(parallelToSide).toBe(true);
    }
  });

  it("draws each traversed triangle from one side midpoint to another", () => {
    render(<OrapaStreet />);

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

    expect(screen.queryAllByTestId(/^light-line-/).length).toBeGreaterThan(0);
  });

  it("renders paths that terminate before reaching a border", () => {
    window.history.replaceState(null, "", "/?s=123");
    render(<OrapaStreet />);

    const borders = screen.getAllByTestId(
      /^border-(?:[A-Z]|α|β|[0-9]+)$/,
    );
    for (const border of borders) {
      fireEvent.click(border);
    }
  });

  it("bends the light at a line tile reflector", () => {
    window.history.replaceState(null, "", "/?s=123&n=6");
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<OrapaStreet />);
    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));

    let incoming: HTMLElement | null = null;
    for (const border of screen.getAllByTestId(
      /^border-(?:[A-Z]|α|β|[0-9]+)$/,
    )) {
      fireEvent.click(border);
      incoming = screen.queryAllByTestId(/^light-line-.*-incoming$/)[0] ?? null;
      if (incoming) break;
    }

    if (!incoming?.dataset.testid || !incoming.dataset.triangleName) {
      throw new Error("No reflected light path found");
    }
    const outgoing = screen.getByTestId(
      incoming.dataset.testid.replace(/-incoming$/, "-outgoing"),
    );
    const bounce = {
      x: Number(incoming.getAttribute("x2")),
      y: Number(incoming.getAttribute("y2")),
    };
    expect(Number(outgoing.getAttribute("x1"))).toBe(bounce.x);
    expect(Number(outgoing.getAttribute("y1"))).toBe(bounce.y);

    const reflector = screen.getByTestId(
      `line-tile-reflector-${incoming.dataset.triangleName}`,
    );
    const reflectorStart = {
      x: Number(reflector.getAttribute("x1")),
      y: Number(reflector.getAttribute("y1")),
    };
    const reflectorEnd = {
      x: Number(reflector.getAttribute("x2")),
      y: Number(reflector.getAttribute("y2")),
    };
    const reflectorVector = {
      x: reflectorEnd.x - reflectorStart.x,
      y: reflectorEnd.y - reflectorStart.y,
    };
    const bounceVector = {
      x: bounce.x - reflectorStart.x,
      y: bounce.y - reflectorStart.y,
    };
    expect(
      Math.abs(
        reflectorVector.x * bounceVector.y -
          reflectorVector.y * bounceVector.x,
      ),
    ).toBeLessThan(0.01);
  });

  it("draws a perpendicular extension from a border node to a second circle", () => {
    render(<OrapaStreet />);

    fireEvent.click(screen.getByTestId("border-A"));
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

  it("hides tile answers and light paths until See Answer is clicked", () => {
    render(<OrapaStreet />);

    expect(
      screen.getByRole("complementary", { name: "Available Tiles" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^line-tile-reflector-/)).toHaveLength(0);
    expect(screen.queryAllByTestId(/^border-extension-circle-/)).toHaveLength(
      0,
    );
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);
    expect(
      screen.getAllByTestId(/^triangle-/).some((triangle) => {
        const fill = triangle.querySelector("polygon")?.getAttribute("fill");
        return fill !== "none" && fill !== "url(#orapa-street-restricted-stripes)";
      }),
    ).toBe(false);

    fireEvent.click(screen.getByTestId("border-A"));
    expect(screen.getByTestId("border-extension-circle-A")).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^border-extension-circle-/)).toHaveLength(
      1,
    );
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Click All Borders" }),
    );
    expect(screen.getAllByTestId(/^border-extension-circle-/).length).toBeGreaterThan(1);
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));
    expect(
      screen.getByRole("complementary", { name: "Available Tiles" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId(/^triangle-/).some((triangle) => {
        const fill = triangle.querySelector("polygon")?.getAttribute("fill");
        return fill !== "none" && fill !== "url(#orapa-street-restricted-stripes)";
      }),
    ).toBe(true);
    expect(screen.getAllByTestId(/^light-line-/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "See Answer" }));
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);
  });

  it("switches between the default and hex boards", () => {
    render(<OrapaStreet />);
    const tileCountSelect = screen.getByRole("combobox", { name: "Tiles" });

    expect(screen.getAllByTestId(/^triangle-/)).toHaveLength(122);
    expect(
      Array.from(tileCountSelect.querySelectorAll("option")).map(
        (option) => option.value,
      ),
    ).toEqual(["4", "5", "6"]);

    fireEvent.change(screen.getByRole("combobox", { name: "Board" }), {
      target: { value: "hex" },
    });

    expect(screen.getAllByTestId(/^triangle-/)).toHaveLength(150);
    expect(screen.getByTestId("triangle-J11")).toBeInTheDocument();
    expect(tileCountSelect).toHaveValue("5");
    expect(
      Array.from(tileCountSelect.querySelectorAll("option")).map(
        (option) => option.value,
      ),
    ).toEqual(["5", "6", "7", "8"]);

    fireEvent.change(tileCountSelect, { target: { value: "8" } });
    expect(tileCountSelect).toHaveValue("8");

    fireEvent.change(screen.getByRole("combobox", { name: "Board" }), {
      target: { value: "default" },
    });
    expect(tileCountSelect).toHaveValue("4");
  });

  it("maximizes the board and restores it with Escape", () => {
    render(<OrapaStreet />);

    const maximizeButton = screen.getByRole("button", {
      name: "Maximize board",
    });
    const board = screen.getByRole("img", {
      name: "Orapa Street 221B triangular board",
    });
    const originalViewBox = board.getAttribute("viewBox");
    fireEvent.click(maximizeButton);

    expect(maximizeButton).toHaveAttribute("aria-pressed", "true");
    expect(board.getAttribute("viewBox")).not.toBe(originalViewBox);
    expect(
      screen.getByRole("button", { name: "Restore board" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".orapa-street-board-fullscreen"),
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.getByRole("button", { name: "Maximize board" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(board).toHaveAttribute("viewBox", originalViewBox);
    expect(
      document.querySelector(".orapa-street-board-fullscreen"),
    ).not.toBeInTheDocument();
  });

  it("rotates the whole board by 90 degrees", () => {
    render(<OrapaStreet />);

    const board = screen.getByRole("img", {
      name: "Orapa Street 221B triangular board",
    });
    const rotateButton = screen.getByRole("button", {
      name: "Rotate board 90°",
    });

    expect(board).toHaveAttribute("viewBox", "0 0 760 560");
    fireEvent.click(rotateButton);

    expect(rotateButton).toHaveAttribute("aria-pressed", "true");
    expect(board).toHaveAttribute("viewBox", "0 0 560 760");
    expect(board.querySelector('g[transform="translate(560 0) rotate(90)"]'))
      .toBeInTheDocument();

    fireEvent.click(rotateButton);
    expect(rotateButton).toHaveAttribute("aria-pressed", "false");
    expect(board).toHaveAttribute("viewBox", "0 0 760 560");
  });

  it("uses q/r positions to place C1 and D1 edge-to-edge", () => {
    render(<OrapaStreet />);

    expect(sharesEdge(getTrianglePoints("C1"), getTrianglePoints("D1"))).toBe(
      true,
    );
  });

  it("places consecutive triangles in a column edge-to-edge", () => {
    render(<OrapaStreet />);

    expect(sharesEdge(getTrianglePoints("A1"), getTrianglePoints("A2"))).toBe(
      true,
    );
  });

  it("aligns same-orientation triangles in a column", () => {
    render(<OrapaStreet />);

    const first = getTrianglePoints("A1");
    const third = getTrianglePoints("A3");
    expect(third.map((point) => point.x)).toEqual(
      first.map((point) => point.x),
    );
  });

  it("shows q/r coordinates in each triangle tooltip", () => {
    render(<OrapaStreet />);

    expect(
      screen.getByTestId("triangle-C1").querySelector("title")?.textContent,
    ).toContain("q: 2, r: 0");
  });

  it("does not show the links control", () => {
    render(<OrapaStreet />);

    expect(
      screen.queryByRole("checkbox", { name: "Show links" }),
    ).not.toBeInTheDocument();
  });
});
