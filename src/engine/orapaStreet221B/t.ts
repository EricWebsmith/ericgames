import { Direction, Orientation, type Board } from './models';

export const sampleBoard: Board = {
    spaces: {
        "A1": {
            name: "A1", isBorder: false, orientation: Orientation.PointyLeft, links:
            {
                [Direction.Clock0]: "B",
                [Direction.Clock2]: "B2",
                [Direction.Clock4]: "B2",
                [Direction.Clock6]: "A2",
                [Direction.Clock8]: "A2",
                [Direction.Clock10]: "A",
            }
        },
        "A2": {
            name: "A2", isBorder: false, orientation: Orientation.PointyRight,
            links:
            {
                [Direction.Clock0]: "A1",
                [Direction.Clock2]: "A1",
                [Direction.Clock8]: "3",
                [Direction.Clock10]: "1",
            }
        },
        "B1": {
            name: "B1", isBorder: false, orientation: Orientation.PointyLeft, links: {
                [Direction.Clock0]: "D",
                [Direction.Clock6]: "B2",
                [Direction.Clock8]: "B2",
                [Direction.Clock10]: "C",
            }
        },
        "B2": {
            name: "B2", isBorder: false, orientation: Orientation.PointyRight, links: {
                [Direction.Clock0]: "B1",
                [Direction.Clock2]: "B1",
                [Direction.Clock8]: "A1",
                [Direction.Clock10]: "A1",
            }
        },
        "1": {
            name: "1", isBorder: true, links: {
                [Direction.Clock4]: "A2",
            }
        },
        "3": {
            name: "3", isBorder: true, links: {
                [Direction.Clock2]: "A2",
            }
        },
        "A": {
            name: "A", isBorder: true, links: {
                [Direction.Clock4]: "A1",
            }
        },
        "B": {
            name: "B", isBorder: true, links: {
                [Direction.Clock6]: "A1",
            }
        },
        "C": {
            name: "C", isBorder: true, links: {
                [Direction.Clock4]: "B1",
            }
        },
        "D": {
            name: "D", isBorder: true, links: {
                [Direction.Clock6]: "B1",
            }
        },
    }
};