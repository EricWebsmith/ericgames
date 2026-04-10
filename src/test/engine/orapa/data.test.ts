
import { getBoard } from '../../../engine/orapa/mineData';
import type { Board } from '../../../engine/orapa/models';

describe('getBoard', () => {
    it('should return a board with spaces as an empty object', () => {
        const board: Board = getBoard();
        expect(board).toHaveProperty('spaces');
        expect(Object.keys(board.spaces).length).toBe(116);
        for (const label in board.spaces) {
            const node = board.spaces[label];
            if (node.is_border) {
                if (["A1", "A10", "H1", "H10"].includes(node.label)) {
                    expect(Object.keys(node.edges).length).toBe(2);
                } else {
                    expect(Object.keys(node.edges).length).toBe(1);
                }
            } else {
                
                expect(Object.keys(node.edges).length).toBe(4);
            }
        }
    });
});
