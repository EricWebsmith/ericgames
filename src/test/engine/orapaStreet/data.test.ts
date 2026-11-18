import { getBoard } from '../../../engine/orapaStreet221B/data';
import type { Board } from '../../../engine/orapaStreet221B/models';

describe('getBoard', () => {
    it('should pass smoke test', () => {
        const board: Board = getBoard();
        expect(board).toHaveProperty('spaces');
        expect(Object.keys(board.spaces).length).toBe(178);

        // Count nodes where isBorder is true
        const borderNodeCount = Object.values(board.spaces).filter(node => node.isBorder).length;
        // Replace with your expected border node count
        expect(borderNodeCount).toBe(56);
        // For each border node, check that it has exactly 1 link
        for (const node of Object.values(board.spaces)) {
            if (node.isBorder) {
                expect(Object.keys(node.links).length).toBe(1);
            }
        }

        // For each triangle node, check that it has exactly 4 links
        for (const node of Object.values(board.spaces)) {
            if (!node.isBorder) {
                expect(Object.keys(node.links).length).toBe(6);
            }
        }
    });
});