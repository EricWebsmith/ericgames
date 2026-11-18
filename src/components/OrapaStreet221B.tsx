import { useMemo, useState } from 'react';
import { getBoard } from '../engine/orapaStreet221B/data';
import { Orientation, type Board, type Node } from '../engine/orapaStreet221B/models';

const BOARD = getBoard();
const SVG_WIDTH = 760;
const SVG_HEIGHT = 560;
const TRIANGLE_SIDE = 36;
const TRIANGLE_WIDTH = (Math.sqrt(3) * TRIANGLE_SIDE) / 2;
const ROW_GAP = TRIANGLE_SIDE / 2;

type Point = { x: number; y: number };
type Bounds = { top: number; bottom: number; left: number; right: number };

function getTriangleBounds(node: Node): Bounds {
  const left = node.q * TRIANGLE_WIDTH;
  const top = node.r * ROW_GAP;
  return {
    top,
    bottom: top + TRIANGLE_SIDE,
    left,
    right: left + TRIANGLE_WIDTH,
  };
}

function getTriangleNodes(board: Board): Node[] {
  return Object.values(board.spaces).filter(node => !node.isBorder);
}

const TRIANGLE_NODES = getTriangleNodes(BOARD);
const triangleBounds = TRIANGLE_NODES.map(getTriangleBounds);
const boardBounds: Bounds = {
  left: Math.min(...triangleBounds.map(bounds => bounds.left)),
  right: Math.max(...triangleBounds.map(bounds => bounds.right)),
  top: Math.min(...triangleBounds.map(bounds => bounds.top)),
  bottom: Math.max(...triangleBounds.map(bounds => bounds.bottom)),
};
const BOARD_OFFSET = {
  x: SVG_WIDTH / 2 - (boardBounds.left + boardBounds.right) / 2,
  y: SVG_HEIGHT / 2 - (boardBounds.top + boardBounds.bottom) / 2,
};

function getTriangleViewBounds(node: Node): Bounds {
  const bounds = getTriangleBounds(node);
  return {
    top: bounds.top + BOARD_OFFSET.y,
    bottom: bounds.bottom + BOARD_OFFSET.y,
    left: bounds.left + BOARD_OFFSET.x,
    right: bounds.right + BOARD_OFFSET.x,
  };
}

function getTrianglePoints(bounds: Bounds, orientation: Node['orientation']): string {
  const middleY = (bounds.top + bounds.bottom) / 2;
  return orientation === Orientation.PointyLeft
    ? `${bounds.left},${middleY} ${bounds.right},${bounds.top} ${bounds.right},${bounds.bottom}`
    : `${bounds.right},${middleY} ${bounds.left},${bounds.top} ${bounds.left},${bounds.bottom}`;
}

function getTriangleLabelPosition(bounds: Bounds, orientation: Node['orientation']): Point {
  const width = bounds.right - bounds.left;
  return {
    x: bounds.left + width * (orientation === Orientation.PointyLeft ? 2 / 3 : 1 / 3),
    y: (bounds.top + bounds.bottom) / 2,
  };
}

export default function OrapaStreet221B() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const triangleNodes = TRIANGLE_NODES;
  const nodesByName = useMemo(() => new Map(triangleNodes.map(node => [node.name, node])), [triangleNodes]);
  const selected = selectedNode ? nodesByName.get(selectedNode) : undefined;
  const selectedNeighbors = new Set(Object.values(selected?.links ?? {}));

  return (
    <section className="game-container" style={{ maxWidth: 900 }}>
      <h2 className="game-title">Orapa Street 221B</h2>
      <p className="status-message">A triangular tiling built from the board data. Select a triangle to inspect its six-direction links.</p>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 18 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} />
          Show labels
        </label>
        <button className="btn-reset" onClick={() => setSelectedNode(null)} disabled={!selectedNode}>Clear selection</button>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="game-svg"
        style={{ width: 'min(100%, 760px)', background: '#08111f', border: '1px solid #263b56' }}
        role="img"
        aria-label="Orapa Street 221B triangular board"
      >
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#08111f" rx={10} />

        {triangleNodes.map(node => {
          const bounds = getTriangleViewBounds(node);
          const labelPosition = getTriangleLabelPosition(bounds, node.orientation);
          const isSelected = selectedNode === node.name;
          const isNeighbor = selectedNeighbors.has(node.name);
          const fill = isSelected ? '#ffd166' : isNeighbor ? '#547b91' : node.orientation === Orientation.PointyLeft ? '#174a56' : '#253c65';
          return (
            <g
              key={node.name}
              data-testid={`triangle-${node.name}`}
              role="button"
              tabIndex={0}
              aria-label={`${node.name}, ${node.orientation}, ${Object.keys(node.links).length} links`}
              onClick={() => setSelectedNode(node.name)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedNode(node.name);
                }
              }}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <polygon
                points={getTrianglePoints(bounds, node.orientation)}
                fill={fill}
                stroke={isSelected ? '#fff1be' : isNeighbor ? '#9bd7e8' : '#7ba4bd'}
                strokeWidth={isSelected ? 2.5 : 1.25}
              >
                <title>{`${node.name} · q: ${node.q}, r: ${node.r} · ${node.orientation} · ${Object.keys(node.links).length} links`}</title>
              </polygon>
              {showLabels && (
                <text
                  x={labelPosition.x - (node.orientation === Orientation.PointyLeft ? 2 : -2)}
                  y={labelPosition.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#f2f7ff"
                  fontSize={8}
                  fontWeight={700}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="status-message" aria-live="polite" style={{ textAlign: 'center' }}>
        {selected
          ? `${selected.name} · ${selected.orientation} · linked to: ${Object.values(selected.links).join(', ') || 'none'}`
          : `${triangleNodes.length} triangles · click or keyboard-select a triangle to inspect its neighbors`}
      </p>
    </section>
  );
}
