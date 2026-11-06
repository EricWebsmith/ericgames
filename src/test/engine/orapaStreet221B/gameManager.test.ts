import { describe, expect, it } from 'vitest';
import { createGame, traceBrainwave } from '../../../engine/orapaStreet221B/gameManager';
import { isPlayable } from '../../../engine/orapaStreet221B/models';

describe('Orapa Street 221B engine', () => {
  it('creates a deterministic set of six tokens outside the shaded center', () => {
    const first = createGame(1234);
    const second = createGame(1234);
    expect(first.tokens).toEqual(second.tokens);
    expect(first.tokens).toHaveLength(6);
    expect(first.tokens.every(token => isPlayable(token.q, token.r))).toBe(true);
  });

  it('traces a brainwave and records distinct collected colors', () => {
    const game = createGame(42);
    const result = traceBrainwave(game, '1');
    expect(result.path.length).toBeGreaterThan(0);
    expect(new Set(result.colors).size).toBe(result.colors.length);
  });
});
