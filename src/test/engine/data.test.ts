import { getBoard } from '../../engine/arclightData';
import { Board } from '../../engine/models';

describe('getBoard', () => {
    it('should return a board with spaces as an empty object', () => {
        const board: Board = getBoard();
        expect(board).toHaveProperty('spaces');
        expect(Object.keys(board.spaces).length).toBe(79);
        for (const label in board.spaces) {
            const node = board.spaces[label];
            if (node.is_border) {
                expect(Object.keys(node.edges).length).toBe(1);
            } else {
                expect(Object.keys(node.edges).length).toBe(6);
            }
        }
    });
});