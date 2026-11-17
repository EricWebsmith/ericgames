import { type Board } from './models';

export function getDefaultBoard(): Board {
    const board: Board = {
        spaces: {}
    };

    return board;
}