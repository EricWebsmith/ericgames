import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OrapaStreet221B from '../../components/OrapaStreet221B';

type Point = { x: number; y: number };

function getTrianglePoints(name: string): Point[] {
  const polygon = screen.getByTestId(`triangle-${name}`).querySelector('polygon');
  if (!polygon) throw new Error(`Missing polygon for ${name}`);

  return (polygon.getAttribute('points') ?? '')
    .split(/\s+/)
    .map(point => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    });
}

function pointsMatch(first: Point, second: Point): boolean {
  return Math.abs(first.x - second.x) < 0.001 && Math.abs(first.y - second.y) < 0.001;
}

function sharesEdge(first: Point[], second: Point[]): boolean {
  return first.some((start, index) => {
    const end = first[(index + 1) % first.length];
    return second.some((otherStart, otherIndex) => {
      const otherEnd = second[(otherIndex + 1) % second.length];
      return (pointsMatch(start, otherEnd) && pointsMatch(end, otherStart))
        || (pointsMatch(start, otherStart) && pointsMatch(end, otherEnd));
    });
  });
}

describe('OrapaStreet221B', () => {
  it('uses q/r positions to place C1 and D1 edge-to-edge', () => {
    render(<OrapaStreet221B />);

    expect(sharesEdge(getTrianglePoints('C1'), getTrianglePoints('D1'))).toBe(true);
  });

  it('shows q/r coordinates in each triangle tooltip', () => {
    render(<OrapaStreet221B />);

    expect(screen.getByTestId('triangle-C1').querySelector('title')?.textContent).toContain('q: 2, r: 0');
  });
});
