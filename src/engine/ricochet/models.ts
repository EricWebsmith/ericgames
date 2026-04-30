export const RobotColor = {
    Red: 'red',
    Blue: 'blue',
    Green: 'green',
    Yellow: 'yellow',
} as const;

export type RobotColor = typeof RobotColor[keyof typeof RobotColor];

export const ROBOT_COLORS: readonly RobotColor[] = [
    RobotColor.Red,
    RobotColor.Blue,
    RobotColor.Green,
    RobotColor.Yellow,
] as const;

export interface Robot {
    color: RobotColor;
    q: number;
    r: number;
}

export interface Target {
    q: number;
    r: number;
    color: RobotColor;
}

export interface Wall {
    q: number;
    r: number;
    direction: number; // 0–5: wall on this side of the cell (both directions stored)
}

export interface Board {
    radius: number;
    walls: Wall[];
}

export interface Move {
    color: RobotColor;
    direction: number;
    fromQ: number;
    fromR: number;
    toQ: number;
    toR: number;
}

export interface Puzzle {
    board: Board;
    robots: Robot[];
    target: Target;
}
