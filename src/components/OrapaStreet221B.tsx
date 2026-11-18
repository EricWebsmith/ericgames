import { useMemo, useState } from 'react';
import { getBoard } from '../engine/orapaStreet221B/data';
import { Orientation, type Board, type Node } from '../engine/orapaStreet221B/models';

const BOARD = getBoard();
const SVG_WIDTH = 760;
const SVG_HEIGHT = 560;
const TRIANGLE_SIDE = 36;
const TRIANGLE_HALF_HEIGHT = (Math.sqrt(3) * TRIANGLE_SIDE) / 2;
const ROW_GAP = TRIANGLE_SIDE / 2;
const Q_STEP = (TRIANGLE_HALF_HEIGHT * 2) / 3;
const R_X_STEP = -TRIANGLE_HALF_HEIGHT / 3;

type Point = { x: number; y: number };

function getGridPosition(node: Node): Point {
  return {
    x: node.q * Q_STEP + node.r * R_X_STEP,
    y: node.r * ROW_GAP,
  };
}

function getTriangleNodes(board: Board): Node[] {
  return Object.values(board.spaces).filter(node => !node.isBorder);
}

const TRIANGLE_NODES = getTriangleNodes(BOARD);
const gridPositions = TRIANGLE_NODES.map(getGridPosition);
const boardBounds = {
  left: Math.min(...gridPositions.map(point => point.x)) - (TRIANGLE_HALF_HEIGHT * 2 / 3),
  right: Math.max(...gridPositions.map(point => point.x)) + (TRIANGLE_HALF_HEIGHT * 2 / 3),
  top: Math.min(...gridPositions.map(point => point.y)) - TRIANGLE_SIDE / 2,
  bottom: Math.max(...gridPositions.map(point => point.y)) + TRIANGLE_SIDE / 2,
};
const BOARD_OFFSET = {
  x: SVG_WIDTH / 2 - (boardBounds.left + boardBounds.right) / 2,
  y: SVG_HEIGHT / 2 - (boardBounds.top + boardBounds.bottom) / 2,
};

function getTrianglePosition(node: Node): Point {
  const position = getGridPosition(node);
  return {
    x: position.x + BOARD_OFFSET.x,
    y: position.y + BOARD_OFFSET.y,
  };
}

function getTrianglePoints(center: Point, orientation: Node['orientation']): string {
  const direction = orientation === Orientation.PointyLeft ? -1 : 1;
  const apexX = center.x + direction * (TRIANGLE_HALF_HEIGHT * 2 / 3);
  const baseX = center.x - direction * (TRIANGLE_HALF_HEIGHT / 3);
  return `${apexX},${center.y} ${baseX},${center.y - TRIANGLE_SIDE / 2} ${baseX},${center.y + TRIANGLE_SIDE / 2}`;
}

export default function OrapaStreet221B() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showConnections, setShowConnections] = useState(false);
  const triangleNodes = TRIANGLE_NODES;
  const nodesByName = useMemo(() => new Map(triangleNodes.map(node => [node.name, node])), [triangleNodes]);
  const selected = selectedNode ? nodesByName.get(selectedNode) : undefined;
  const selectedNeighbors = new Set(Object.values(selected?.links ?? {}));
  const visibleConnections = showConnections
    ? triangleNodes.flatMap(node => Object.values(node.links)
      .filter((name): name is string => Boolean(name) && name.localeCompare(node.name) > 0)
      .map(name => ({ from: node, to: nodesByName.get(name) })))
      .filter(connection => connection.to)
    : [];

  return (
    <section className="game-container" style={{ maxWidth: 900 }}>
      <h2 className="game-title">Orapa Street 221B</h2>
      <p className="status-message">A triangular tiling built from the board data. Select a triangle to inspect its six-direction links.</p>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 18 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} />
          Show labels
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showConnections} onChange={event => setShowConnections(event.target.checked)} />
          Show links
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

        {visibleConnections.map(({ from, to }) => {
          if (!to) return null;
          const start = getTrianglePosition(from);
          const end = getTrianglePosition(to);
          const isSelectedLink = from.name === selectedNode || to.name === selectedNode;
          return (
            <line
              key={`${from.name}-${to.name}`}
              x1={start.x} y1={start.y} x2={end.x} y2={end.y}
              stroke={isSelectedLink ? '#ffd166' : '#38536d'}
              strokeWidth={isSelectedLink ? 2 : 1}
              opacity={isSelectedLink ? 0.9 : 0.38}
            />
          );
        })}

        {triangleNodes.map(node => {
          const center = getTrianglePosition(node);
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
                points={getTrianglePoints(center, node.orientation)}
                fill={fill}
                stroke={isSelected ? '#fff1be' : isNeighbor ? '#9bd7e8' : '#7ba4bd'}
                strokeWidth={isSelected ? 2.5 : 1.25}
              >
                <title>{`${node.name} · ${node.orientation} · ${Object.keys(node.links).length} links`}</title>
              </polygon>
              {showLabels && (
                <text
                  x={center.x - (node.orientation === Orientation.PointyLeft ? 2 : -2)}
                  y={center.y}
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
