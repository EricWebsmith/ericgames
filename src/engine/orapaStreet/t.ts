import { Direction, Orient, type Board, type Node } from "./models";

export const sampleBoard: Board = {
  spaces: {
    A1: {
      name: "A1",
      isBorder: false,
      orientation: Orient.PointyLeft,
      q: 0,
      r: 2,
      edges: {
        [Direction.Clock0]: "B",
        [Direction.Clock2]: "B2",
        [Direction.Clock4]: "B2",
        [Direction.Clock6]: "A2",
        [Direction.Clock8]: "A2",
        [Direction.Clock10]: "A",
      },
      neighbors: [],
    },
    A2: {
      name: "A2",
      isBorder: false,
      orientation: Orient.PointyRight,
      q: 0,
      r: 3,
      edges: {
        [Direction.Clock0]: "A1",
        [Direction.Clock2]: "A1",
        [Direction.Clock8]: "3",
        [Direction.Clock10]: "1",
      },
      neighbors: [],
    },
    B1: {
      name: "B1",
      isBorder: false,
      orientation: Orient.PointyLeft,
      q: 1,
      r: 1,
      edges: {
        [Direction.Clock0]: "D",
        [Direction.Clock6]: "B2",
        [Direction.Clock8]: "B2",
        [Direction.Clock10]: "C",
      },
      neighbors: [],
    },
    B2: {
      name: "B2",
      isBorder: false,
      orientation: Orient.PointyRight,
      q: 1,
      r: 2,
      edges: {
        [Direction.Clock0]: "B1",
        [Direction.Clock2]: "B1",
        [Direction.Clock8]: "A1",
        [Direction.Clock10]: "A1",
      },
      neighbors: [],
    },
    "1": {
      name: "1",
      isBorder: true,
      q: -1,
      r: -1,
      edges: {
        [Direction.Clock4]: "A2",
      },
      neighbors: [],
    },
    "3": {
      name: "3",
      isBorder: true,
      q: -1,
      r: -1,
      edges: {
        [Direction.Clock2]: "A2",
      },
      neighbors: [],
    },
    A: {
      name: "A",
      isBorder: true,
      q: -1,
      r: -1,
      edges: {
        [Direction.Clock4]: "A1",
      },
      neighbors: [],
    },
    B: {
      name: "B",
      isBorder: true,
      q: -1,
      r: -1,
      edges: {
        [Direction.Clock6]: "A1",
      },
      neighbors: [],
    },
    C: {
      name: "C",
      isBorder: true,
      q: -1,
      r: -1,
      edges: {
        [Direction.Clock4]: "B1",
      },
      neighbors: [],
    },
    D: {
      name: "D",
      isBorder: true,
      q: -1,
      r: -1,
      edges: {
        [Direction.Clock6]: "B1",
      },
      neighbors: [],
    },
  },
  get spacesByQr() {
    const index: Record<number, Record<number, Node>> = {};
    for (const node of Object.values(this.spaces)) {
      if (!node.isBorder) {
        index[node.q] ??= {};
        index[node.q][node.r] = node;
      }
    }
    return index;
  },
};
