import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OrapaStreet221B from '../../components/OrapaStreet';
import { getDefaultBoard } from '../../engine/orapaStreet/data';
import { traverse } from '../../engine/orapaStreet/gameManager';

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
  it('draws each traversed triangle from one side midpoint to another', () => {
    render(<OrapaStreet221B />);

    fireEvent.click(screen.getByTestId('border-A'));

    const board = getDefaultBoard();
    const results = traverse(board, 'A');
    const traversedTriangles = results.filter(result => !board.spaces[result.label].isBorder);
    expect(screen.getAllByTestId(/^light-line-/)).toHaveLength(traversedTriangles.length);

    const firstSegment = screen.getByTestId('light-line-A1');
    const trianglePoints = getTrianglePoints('A1');
    const sideMidpoints = trianglePoints.map((start, index) => {
      const end = trianglePoints[(index + 1) % trianglePoints.length];
      return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    });
    const start = {
      x: Number(firstSegment.getAttribute('x1')),
      y: Number(firstSegment.getAttribute('y1')),
    };
    const end = {
      x: Number(firstSegment.getAttribute('x2')),
      y: Number(firstSegment.getAttribute('y2')),
    };
    expect(sideMidpoints.some(midpoint => pointsMatch(start, midpoint))).toBe(true);
    expect(sideMidpoints.some(midpoint => pointsMatch(end, midpoint))).toBe(true);
    expect(sideMidpoints.some(midpoint => pointsMatch(start, midpoint) && pointsMatch(end, midpoint))).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryAllByTestId(/^light-line-/)).toHaveLength(0);
  });

  it('draws a perpendicular extension from a border node to a second circle', () => {
    render(<OrapaStreet221B />);

    const borderCircle = screen.getByTestId('border-A').querySelector('circle');
    const sideLine = screen.getByTestId('border-link-line-A');
    const extensionLine = screen.getByTestId('border-extension-line-A');
    const extensionCircle = screen.getByTestId('border-extension-circle-A');
    if (!borderCircle) throw new Error('Missing border circle');

    expect(extensionLine.getAttribute('x1')).toBe(borderCircle.getAttribute('cx'));
    expect(extensionLine.getAttribute('y1')).toBe(borderCircle.getAttribute('cy'));
    expect(extensionLine.getAttribute('x2')).toBe(extensionCircle.getAttribute('cx'));
    expect(extensionLine.getAttribute('y2')).toBe(extensionCircle.getAttribute('cy'));

    const sideMidpoint = {
      x: Number(sideLine.getAttribute('x1')),
      y: Number(sideLine.getAttribute('y1')),
    };
    const trianglePoints = getTrianglePoints('A1');
    const edgeIndex = trianglePoints.findIndex((start, index) => {
      const end = trianglePoints[(index + 1) % trianglePoints.length];
      return pointsMatch(
        sideMidpoint,
        { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      );
    });
    expect(edgeIndex).toBeGreaterThanOrEqual(0);

    const edgeStart = trianglePoints[edgeIndex];
    const edgeEnd = trianglePoints[(edgeIndex + 1) % trianglePoints.length];
    const extension = {
      x: Number(extensionLine.getAttribute('x2')) - Number(extensionLine.getAttribute('x1')),
      y: Number(extensionLine.getAttribute('y2')) - Number(extensionLine.getAttribute('y1')),
    };
    expect(Math.abs(
      (edgeEnd.x - edgeStart.x) * extension.x + (edgeEnd.y - edgeStart.y) * extension.y,
    )).toBeLessThan(0.001);
  });

  it('switches between the default and hex boards', () => {
    render(<OrapaStreet221B />);

    expect(screen.getByText('122 triangles · click or keyboard-select a triangle to inspect its neighbors')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Board' }), { target: { value: 'hex' } });

    expect(screen.getByText('150 triangles · click or keyboard-select a triangle to inspect its neighbors')).toBeInTheDocument();
    expect(screen.getByTestId('triangle-J11')).toBeInTheDocument();
  });

  it('uses q/r positions to place C1 and D1 edge-to-edge', () => {
    render(<OrapaStreet221B />);

    expect(sharesEdge(getTrianglePoints('C1'), getTrianglePoints('D1'))).toBe(true);
  });

  it('places consecutive triangles in a column edge-to-edge', () => {
    render(<OrapaStreet221B />);

    expect(sharesEdge(getTrianglePoints('A1'), getTrianglePoints('A2'))).toBe(true);
  });

  it('aligns same-orientation triangles in a column', () => {
    render(<OrapaStreet221B />);

    const first = getTrianglePoints('A1');
    const third = getTrianglePoints('A3');
    expect(third.map(point => point.x)).toEqual(first.map(point => point.x));
  });

  it('shows q/r coordinates in each triangle tooltip', () => {
    render(<OrapaStreet221B />);

    expect(screen.getByTestId('triangle-C1').querySelector('title')?.textContent).toContain('q: 2, r: 0');
  });

  it('does not show the links control', () => {
    render(<OrapaStreet221B />);

    expect(screen.queryByRole('checkbox', { name: 'Show links' })).not.toBeInTheDocument();
  });
});
