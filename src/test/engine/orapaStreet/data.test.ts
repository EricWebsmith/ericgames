import { getDefaultBoard, getHexBoard } from "../../../engine/orapaStreet/data";
import { Orient, type Board } from "../../../engine/orapaStreet/models";

function expectResolvedNeighbors(board: Board): void {
  const triangles = Object.values(board.spaces).filter(
    (node) => !node.isBorder,
  );
  for (const node of triangles) {
    expect(node.neighbors.length).toBeLessThanOrEqual(12);
    for (const neighborName of node.neighbors) {
      expect(board.spaces[neighborName]?.neighbors).toContain(node.name);
    }
  }

  for (const orientation of [Orient.PointyLeft, Orient.PointyRight]) {
    expect(
      triangles.some(
        (node) =>
          node.orientation === orientation && node.neighbors.length === 12,
      ),
    ).toBe(true);
  }
}

describe("getBoard", () => {
  it("should pass smoke test", () => {
    const board: Board = getDefaultBoard();
    expect(board).toHaveProperty("spaces");
    expect(Object.keys(board.spaces).length).toBe(178);

    const triangleNodes = Object.values(board.spaces).filter(
      (node) => !node.isBorder,
    );
    expect(Object.values(board.spacesByQr).flat()).toHaveLength(
      triangleNodes.length,
    );
    for (const node of triangleNodes) {
      expect(board.spacesByQr[node.q]?.[node.r]).toBe(node);
    }
    expectResolvedNeighbors(board);

    // Count nodes where isBorder is true
    const borderNodeCount = Object.values(board.spaces).filter(
      (node) => node.isBorder,
    ).length;
    // Replace with your expected border node count
    expect(borderNodeCount).toBe(56);
    // For each border node, check that it has exactly 1 link
    for (const node of Object.values(board.spaces)) {
      if (node.isBorder) {
        expect(Object.keys(node.edges).length).toBe(1);
      }
    }

    // For each triangle node, check that it has exactly 4 links
    for (const node of Object.values(board.spaces)) {
      if (!node.isBorder) {
        expect(Object.keys(node.edges).length).toBe(6);
      }
    }
  });
});

describe("getHexBoard", () => {
  it("should pass smoke test", () => {
    const board: Board = getHexBoard();
    expect(board).toHaveProperty("spaces");
    expect(Object.keys(board.spaces).length).toBe(210);

    const triangleNodes = Object.values(board.spaces).filter(
      (node) => !node.isBorder,
    );
    expect(Object.values(board.spacesByQr).flat()).toHaveLength(
      triangleNodes.length,
    );
    for (const node of triangleNodes) {
      expect(board.spacesByQr[node.q]?.[node.r]).toBe(node);
    }
    expectResolvedNeighbors(board);

    // Count nodes where isBorder is true
    const borderNodeCount = Object.values(board.spaces).filter(
      (node) => node.isBorder,
    ).length;
    // Replace with your expected border node count
    expect(borderNodeCount).toBe(60);
    // For each border node, check that it has exactly 1 link
    for (const node of Object.values(board.spaces)) {
      if (node.isBorder) {
        expect(Object.keys(node.edges).length).toBe(1);
      }
    }

    // For each triangle node, check that it has exactly 4 links
    for (const node of Object.values(board.spaces)) {
      if (!node.isBorder) {
        expect(Object.keys(node.edges).length).toBe(6);
      }
    }
  });
});
