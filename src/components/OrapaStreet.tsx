import { useEffect, useMemo, useState } from "react";
import {
  getDefaultBoard,
  getHexBoard,
  getTiles,
} from "../engine/orapaStreet/data";
import { setupWithSeed } from "../engine/orapaStreet/gameManager";
import {
  Orient,
  type Board,
  type Color,
  type Node,
  type ParentTile,
  type Puzzle,
} from "../engine/orapaStreet/models";
import { GEM_FILL } from "./shared/colors";
import ResultCircle from "./shared/ResultCircle";
import ShareButton from "./shared/ShareButton";

const SVG_WIDTH = 760;
const SVG_HEIGHT = 560;
const TRIANGLE_SIDE = 36;
const TRIANGLE_WIDTH = (Math.sqrt(3) * TRIANGLE_SIDE) / 2;
const ROW_GAP = TRIANGLE_SIDE / 2;
const BORDER_CIRCLE_RADIUS = 7;
const RESULT_CIRCLE_RADIUS = 7;
const CIRCLE_LINE_INSET = 8.5;

type Point = { x: number; y: number };
type BoardType = "default" | "hex";

const QUERY_PARAM_SEED = "s";
const QUERY_PARAM_BOARD_TYPE = "b";

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getSearchParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const params = new URLSearchParams(window.location.search);
  if (window.location.hash.includes("?")) {
    const hashQuery = window.location.hash.split("?")[1];
    for (const [key, value] of new URLSearchParams(hashQuery)) {
      params.set(key, value);
    }
  }
  return params;
}

function getInitialState(): {
  boardType: BoardType;
  seed: number;
  tiles: ParentTile[];
  puzzle: Puzzle;
} {
  const params = getSearchParams();
  const boardParam = params.get(QUERY_PARAM_BOARD_TYPE);
  const boardType: BoardType =
    boardParam === "hex" ? "hex" : "default";
  const seedParam = params.get(QUERY_PARAM_SEED);
  const seed =
    seedParam !== null && /^\d+$/.test(seedParam)
      ? parseInt(seedParam, 10)
      : Math.floor(Math.random() * 0xffffffff);
  const board = boardType === "default" ? getDefaultBoard() : getHexBoard();
  const tiles = getTiles(4, seededRandom(seed));
  return {
    boardType,
    seed,
    tiles,
    puzzle: setupWithSeed(board, tiles, seed),
  };
}

function getTileColor(colors: Color[]): string {
  if (colors.length === 0) return "none";
  if (colors.includes("blue") && colors.includes("white")) return "#66ccee";
  return GEM_FILL[colors[0]] ?? "#aaaaaa";
}

function getTriangleNodes(board: Board): Node[] {
  return Object.values(board.spaces).filter((node) => !node.isBorder);
}

function getBorderNodes(board: Board): Node[] {
  return Object.values(board.spaces).filter((node) => node.isBorder);
}

function getTriangleVertices(node: Node): Point[] {
  const left = node.q * TRIANGLE_WIDTH;
  const top = node.r * ROW_GAP;
  const bounds = {
    left,
    right: left + TRIANGLE_WIDTH,
    top,
    bottom: top + TRIANGLE_SIDE,
  };
  const middleY = (bounds.top + bounds.bottom) / 2;
  const vertices = node.orientation === Orient.PointyLeft
    ? [
        { x: bounds.left, y: middleY },
        { x: bounds.right, y: bounds.top },
        { x: bounds.right, y: bounds.bottom },
      ]
    : [
        { x: bounds.right, y: middleY },
        { x: bounds.left, y: bounds.top },
        { x: bounds.left, y: bounds.bottom },
      ];
  return vertices.map(rotateBoardPoint90);
}

function rotateBoardPoint90(point: Point): Point {
  return { x: point.y, y: -point.x };
}

function rotateBoardVector90(vector: Point): Point {
  return { x: vector.y, y: -vector.x };
}

type Edge = { start: Point; end: Point };

function getTriangleEdges(node: Node): Edge[] {
  const vertices = getTriangleVertices(node);
  return vertices.map((start, index) => ({
    start,
    end: vertices[(index + 1) % vertices.length],
  }));
}

function getEdgeKey(edge: Edge): string {
  return [edge.start, edge.end]
    .map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`)
    .sort()
    .join("|");
}

function getConnectionMidpoint(
  board: Board,
  firstName: string,
  secondName: string,
  borderNodePositions: Map<string, BorderNodePosition>,
  boardOffset: Point,
): Point {
  const first = board.spaces[firstName];
  const second = board.spaces[secondName];
  if (!first || !second) {
    throw new Error(
      `Missing node in light path: ${firstName} or ${secondName}`,
    );
  }

  if (first.isBorder || second.isBorder) {
    const borderName = first.isBorder ? firstName : secondName;
    const position = borderNodePositions.get(borderName);
    if (!position) {
      throw new Error(`Missing position for border node: ${borderName}`);
    }
    return position.sideMidpoint;
  }

  const secondEdgeKeys = new Set(getTriangleEdges(second).map(getEdgeKey));
  const sharedEdge = getTriangleEdges(first).find((edge) =>
    secondEdgeKeys.has(getEdgeKey(edge)),
  );
  if (!sharedEdge) {
    throw new Error(
      `Missing shared edge between triangles: ${firstName} and ${secondName}`,
    );
  }
  return {
    x: (sharedEdge.start.x + sharedEdge.end.x) / 2 + boardOffset.x,
    y: (sharedEdge.start.y + sharedEdge.end.y) / 2 + boardOffset.y,
  };
}

function getBoardOffset(triangleNodes: Node[]): Point {
  const vertices = triangleNodes.flatMap(getTriangleVertices);
  const boardBounds = {
    left: Math.min(...vertices.map((point) => point.x)),
    right: Math.max(...vertices.map((point) => point.x)),
    top: Math.min(...vertices.map((point) => point.y)),
    bottom: Math.max(...vertices.map((point) => point.y)),
  };
  return {
    x: SVG_WIDTH / 2 - (boardBounds.left + boardBounds.right) / 2,
    y: SVG_HEIGHT / 2 - (boardBounds.top + boardBounds.bottom) / 2,
  };
}

type BorderNodePosition = {
  sideMidpoint: Point;
  center: Point;
  outerCenter: Point;
};

function getBorderNodePositions(
  board: Board,
  triangleNodes: Node[],
  borderNodes: Node[],
  boardOffset: Point,
): Map<string, BorderNodePosition> {
  const allEdges = triangleNodes.flatMap((triangle) =>
    getTriangleEdges(triangle).map((edge) => ({
      triangleName: triangle.name,
      ...edge,
    })),
  );
  const edgeCounts = new Map<string, number>();
  for (const edge of allEdges) {
    const key = getEdgeKey(edge);
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  }

  const openEdgesByTriangle = new Map<string, Edge[]>();
  for (const edge of allEdges) {
    if (edgeCounts.get(getEdgeKey(edge)) === 1) {
      const openEdges = openEdgesByTriangle.get(edge.triangleName) ?? [];
      openEdges.push(edge);
      openEdgesByTriangle.set(edge.triangleName, openEdges);
    }
  }

  const bordersByTriangle = new Map<
    string,
    Array<{ node: Node; direction: Point }>
  >();
  for (const border of borderNodes) {
    const link = Object.entries(border.edges)[0];
    if (!link) {
      throw new Error(
        `Missing linked triangle for border node: ${border.name}`,
      );
    }
    const [borderToTriangleDirection, triangleName] = link;
    const triangle = board.spaces[triangleName];
    const openEdges = openEdgesByTriangle.get(triangleName);
    if (!triangle || triangle.isBorder || !openEdges?.length) {
      throw new Error(
        `Missing exposed triangle edge for border node: ${border.name}`,
      );
    }

    const angle =
      (((Number(borderToTriangleDirection) + 6) % 12) * Math.PI) / 6;
    const direction = rotateBoardVector90({
      x: Math.sin(angle),
      y: -Math.cos(angle),
    });
    const directionLength = Math.hypot(direction.x, direction.y);
    const borders = bordersByTriangle.get(triangleName) ?? [];
    borders.push({
      node: border,
      direction: {
        x: direction.x / directionLength,
        y: direction.y / directionLength,
      },
    });
    bordersByTriangle.set(triangleName, borders);
  }

  const positions = new Map<string, BorderNodePosition>();
  for (const [triangleName, borders] of bordersByTriangle) {
    const triangle = board.spaces[triangleName];
    const openEdges = openEdgesByTriangle.get(triangleName);
    if (!triangle || !openEdges?.length) {
      throw new Error(
        `Missing exposed triangle edge for triangle: ${triangleName}`,
      );
    }

    const center = getTriangleLabelPosition(triangle);
    const getEdgeFrame = (edge: Edge) => {
      const midpoint = {
        x: (edge.start.x + edge.end.x) / 2,
        y: (edge.start.y + edge.end.y) / 2,
      };
      const edgeVector = {
        x: edge.end.x - edge.start.x,
        y: edge.end.y - edge.start.y,
      };
      const edgeLength = Math.hypot(edgeVector.x, edgeVector.y);
      const tangent = {
        x: edgeVector.x / edgeLength,
        y: edgeVector.y / edgeLength,
      };
      let outward = { x: -tangent.y, y: tangent.x };
      if (
        outward.x * (midpoint.x - center.x) +
          outward.y * (midpoint.y - center.y) <
        0
      ) {
        outward = { x: -outward.x, y: -outward.y };
      }
      return { midpoint, tangent, outward, edgeLength };
    };
    const alignment = (
      border: (typeof borders)[number],
      edge: Edge,
    ): number => {
      const { outward } = getEdgeFrame(edge);
      return outward.x * border.direction.x + outward.y * border.direction.y;
    };

    type BorderEdgeAssignment = {
      border: (typeof borders)[number];
      edge: Edge;
    };
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestUniqueEdgeCount = -1;
    let bestAssignment: BorderEdgeAssignment[] = [];
    // Prefer separate exposed edges when possible, then maximize directional alignment.
    const assignBorders = (
      borderIndex: number,
      usedEdgeKeys: Set<string>,
      current: BorderEdgeAssignment[],
      score: number,
      uniqueEdgeCount: number,
    ): void => {
      if (borderIndex === borders.length) {
        if (
          uniqueEdgeCount > bestUniqueEdgeCount ||
          (uniqueEdgeCount === bestUniqueEdgeCount && score > bestScore)
        ) {
          bestUniqueEdgeCount = uniqueEdgeCount;
          bestScore = score;
          bestAssignment = current.slice();
        }
        return;
      }

      const border = borders[borderIndex];
      for (const edge of openEdges) {
        const key = getEdgeKey(edge);
        const isNewEdge = !usedEdgeKeys.has(key);
        usedEdgeKeys.add(key);
        current.push({ border, edge });
        assignBorders(
          borderIndex + 1,
          usedEdgeKeys,
          current,
          score + alignment(border, edge),
          uniqueEdgeCount + Number(isNewEdge),
        );
        current.pop();
        if (isNewEdge) usedEdgeKeys.delete(key);
      }
    };
    assignBorders(0, new Set(), [], 0, 0);

    const connectorDirections = new Map<string, Point>();
    if (borders.length === 2) {
      const [first, second] = bestAssignment;
      if (!first || !second) {
        throw new Error(
          `Unable to position border nodes for triangle: ${triangleName}`,
        );
      }
      const getConnector = (edge: Edge, angle: number): Point => {
        const { tangent, outward } = getEdgeFrame(edge);
        return {
          x: tangent.x * Math.cos(angle) + outward.x * Math.sin(angle),
          y: tangent.y * Math.cos(angle) + outward.y * Math.sin(angle),
        };
      };
      const angle60 = Math.PI / 3;
      const angle120 = (2 * Math.PI) / 3;
      const firstAt60 = getConnector(first.edge, angle60);
      const secondAt120 = getConnector(second.edge, angle120);
      const firstAt120 = getConnector(first.edge, angle120);
      const secondAt60 = getConnector(second.edge, angle60);
      const score =
        first.border.direction.x * firstAt60.x +
        first.border.direction.y * firstAt60.y +
        second.border.direction.x * secondAt120.x +
        second.border.direction.y * secondAt120.y;
      const alternateScore =
        first.border.direction.x * firstAt120.x +
        first.border.direction.y * firstAt120.y +
        second.border.direction.x * secondAt60.x +
        second.border.direction.y * secondAt60.y;
      if (score >= alternateScore) {
        connectorDirections.set(first.border.node.name, firstAt60);
        connectorDirections.set(second.border.node.name, secondAt120);
      } else {
        connectorDirections.set(first.border.node.name, firstAt120);
        connectorDirections.set(second.border.node.name, secondAt60);
      }
    }

    const assignments = new Map<
      string,
      { edge: Edge; borders: typeof borders }
    >();
    for (const { border, edge } of bestAssignment) {
      const key = getEdgeKey(edge);
      const assignment = assignments.get(key) ?? { edge, borders: [] };
      assignment.borders.push(border);
      assignments.set(key, assignment);
    }

    for (const { edge, borders: edgeBorders } of assignments.values()) {
      const { midpoint, outward, edgeLength } = getEdgeFrame(edge);
      edgeBorders.forEach(({ node }) => {
        const direction = connectorDirections.get(node.name) ?? outward;
        const distance = edgeLength / 2;
        const borderCenter = {
          x: midpoint.x + direction.x * distance,
          y: midpoint.y + direction.y * distance,
        };
        positions.set(node.name, {
          sideMidpoint: {
            x: midpoint.x + boardOffset.x,
            y: midpoint.y + boardOffset.y,
          },
          center: {
            x: borderCenter.x + boardOffset.x,
            y: borderCenter.y + boardOffset.y,
          },
          outerCenter: {
            x: borderCenter.x + outward.x * distance + boardOffset.x,
            y: borderCenter.y + outward.y * distance + boardOffset.y,
          },
        });
      });
    }
  }
  return positions;
}

function getTrianglePoints(node: Node, boardOffset: Point): string {
  return getTriangleVertices(node)
    .map(
      (point) =>
        `${point.x + boardOffset.x},${point.y + boardOffset.y}`,
    )
    .join(" ");
}

function getTriangleLabelPosition(
  node: Node,
  boardOffset: Point = { x: 0, y: 0 },
): Point {
  const vertices = getTriangleVertices(node);
  return {
    x:
      vertices.reduce((sum, point) => sum + point.x, 0) / vertices.length +
      boardOffset.x,
    y:
      vertices.reduce((sum, point) => sum + point.y, 0) / vertices.length +
      boardOffset.y,
  };
}

export default function OrapaStreet221B() {
  const [initialState] = useState(getInitialState);
  const [boardType, setBoardType] = useState<BoardType>(
    initialState.boardType,
  );
  const [seed, setSeed] = useState(initialState.seed);
  const [seedInput, setSeedInput] = useState(String(initialState.seed));
  const [tiles, setTiles] = useState<ParentTile[]>(initialState.tiles);
  const [puzzle, setPuzzle] = useState<Puzzle>(initialState.puzzle);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const board = useMemo(
    () => (boardType === "default" ? getDefaultBoard() : getHexBoard()),
    [boardType],
  );
  const triangleNodes = useMemo(() => getTriangleNodes(board), [board]);
  const borderNodes = useMemo(() => getBorderNodes(board), [board]);
  const tilesInBoard = useMemo(
    () =>
      Object.fromEntries(
        puzzle.tiles.map((tileInBoard) => [tileInBoard.label, tileInBoard]),
      ),
    [puzzle.tiles],
  );
  const boardOffset = useMemo(
    () => getBoardOffset(triangleNodes),
    [triangleNodes],
  );
  const borderNodePositions = useMemo(
    () =>
      getBorderNodePositions(board, triangleNodes, borderNodes, boardOffset),
    [board, triangleNodes, borderNodes, boardOffset],
  );
  const resultByBorder = useMemo(
    () =>
      new Map(
        borderNodes.map((node) => {
          const results = puzzle.light_results[node.name] ?? [];
          const exitResult = results[results.length - 1];
          if (!exitResult) {
            throw new Error(`Missing light result for border node: ${node.name}`);
          }
          return [
            node.name,
            { destination: exitResult.label, colors: exitResult.colors },
          ];
        }),
      ),
    [board, borderNodes, puzzle.light_results],
  );
  const nodesByName = useMemo(
    () => new Map(triangleNodes.map((node) => [node.name, node])),
    [triangleNodes],
  );
  const selected = selectedNode ? nodesByName.get(selectedNode) : undefined;
  const selectedNeighbors = new Set(Object.values(selected?.edges ?? {}));
  const lightSegments = useMemo(() => {
    if (!selectedBorder) {
      return [];
    }

    const results = puzzle.light_results[selectedBorder] ?? [];
    return results.flatMap((result, index) => {
      const triangle = board.spaces[result.label];
      if (!triangle) {
        throw new Error(`Missing traversed node: ${result.label}`);
      }
      if (triangle.isBorder) {
        return [];
      }

      const previousLabel =
        index === 0 ? selectedBorder : results[index - 1]?.label;
      const nextLabel = results[index + 1]?.label;
      if (!previousLabel || !nextLabel) {
        throw new Error(`Incomplete light path at triangle: ${triangle.name}`);
      }
      return [
        {
          triangleName: triangle.name,
          direction: result.direction,
          start: getConnectionMidpoint(
            board,
            previousLabel,
            triangle.name,
            borderNodePositions,
            boardOffset,
          ),
          end: getConnectionMidpoint(
            board,
            triangle.name,
            nextLabel,
            borderNodePositions,
            boardOffset,
          ),
        },
      ];
    });
  }, [
    selectedBorder,
    board,
    puzzle.light_results,
    borderNodePositions,
    boardOffset,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = getSearchParams();
    params.set(QUERY_PARAM_SEED, String(seed));
    params.set(QUERY_PARAM_BOARD_TYPE, boardType);
    const search = params.toString();
    const querySuffix = search ? `?${search}` : "";
    const hashPath = window.location.hash.split("?")[0];
    const hasHashPathRoute = hashPath.startsWith("#/");
    const nextUrl = hasHashPathRoute
      ? `${window.location.pathname}${hashPath}${querySuffix}`
      : `${window.location.pathname}${querySuffix}${hashPath}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [seed, boardType]);

  return (
    <section className="game-container" style={{ maxWidth: 900 }}>
      <h2 className="game-title">Orapa Street 221B</h2>
      <p className="status-message">
        Select a triangle to inspect its links, or click a border to trace the
        light path.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <label htmlFor="orapa-street-board-type">Board</label>
        <select
          id="orapa-street-board-type"
          className="lang-switcher"
          value={boardType}
          onChange={(event) => {
            const nextBoardType = event.target.value;
            if (nextBoardType === "default" || nextBoardType === "hex") {
              setBoardType(nextBoardType);
              setSelectedNode(null);
              setSelectedBorder(null);
              const nextBoard =
                nextBoardType === "default" ? getDefaultBoard() : getHexBoard();
              setPuzzle(setupWithSeed(nextBoard, tiles, seed));
            }
          }}
        >
          <option value="default">Default board</option>
          <option value="hex">Hex board</option>
        </select>
        <label htmlFor="orapa-street-seed">Seed</label>
        <button
          className="btn-reset"
          onClick={() => {
            const nextSeed = Math.floor(Math.random() * 0xffffffff);
            const nextTiles = getTiles(4, seededRandom(nextSeed));
            setSeed(nextSeed);
            setSeedInput(String(nextSeed));
            setTiles(nextTiles);
            setPuzzle(setupWithSeed(board, nextTiles, nextSeed));
            setSelectedNode(null);
            setSelectedBorder(null);
          }}
        >
          New puzzle
        </button>
        <ShareButton />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(event) => setShowLabels(event.target.checked)}
          />
          Show labels
        </label>
        <button
          className="btn-reset"
          onClick={() => {
            setSelectedNode(null);
            setSelectedBorder(null);
          }}
          disabled={!selectedNode && !selectedBorder}
        >
          Clear selection
        </button>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="game-svg"
        style={{
          width: "min(100%, 760px)",
          background: "#08111f",
          border: "1px solid #263b56",
        }}
        role="img"
        aria-label="Orapa Street 221B triangular board"
      >
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#08111f" rx={10} />

        {triangleNodes.map((node) => {
          const labelPosition = getTriangleLabelPosition(node, boardOffset);
          const isSelected = selectedNode === node.name;
          const isNeighbor = selectedNeighbors.has(node.name);
          const fill = getTileColor(tilesInBoard[node.name]?.tile.colors ?? []);
          return (
            <g
              key={node.name}
              data-testid={`triangle-${node.name}`}
              role="button"
              tabIndex={0}
              aria-label={`${node.name}, ${node.orientation}, ${Object.keys(node.edges).length} links`}
              onClick={() => {
                setSelectedBorder(null);
                setSelectedNode(node.name);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedBorder(null);
                  setSelectedNode(node.name);
                }
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <polygon
                points={getTrianglePoints(node, boardOffset)}
                fill={fill}
                stroke={
                  isSelected ? "#fff1be" : isNeighbor ? "#9bd7e8" : "#7ba4bd"
                }
                strokeWidth={isSelected ? 2.5 : 1.25}
              >
                <title>
                  {`${node.name} · q: ${node.q}, r: ${node.r}, s: ${node.s} · ${node.orientation} · ${Object.keys(node.edges).length} links`}
                </title>
              </polygon>
              {showLabels && (
                <text
                  x={
                    labelPosition.x -
                    (node.orientation === Orient.PointyLeft ? 2 : -2)
                  }
                  y={labelPosition.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#f2f7ff"
                  fontSize={8}
                  fontWeight={700}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}

        {borderNodes.map((node) => {
          const position = borderNodePositions.get(node.name);
          if (!position) {
            throw new Error(`Missing position for border node: ${node.name}`);
          }
          const extensionDx = position.outerCenter.x - position.center.x;
          const extensionDy = position.outerCenter.y - position.center.y;
          const extensionLength = Math.hypot(extensionDx, extensionDy);
          const extensionUnitX =
            extensionLength > 0 ? extensionDx / extensionLength : 0;
          const extensionUnitY =
            extensionLength > 0 ? extensionDy / extensionLength : 0;
          return (
            <g key={`border-lines-${node.name}`}>
              <line
                data-testid={`border-link-line-${node.name}`}
                x1={position.sideMidpoint.x}
                y1={position.sideMidpoint.y}
                x2={position.center.x}
                y2={position.center.y}
                stroke="#a9bfd5"
                strokeWidth={1}
                pointerEvents="none"
              />
              <line
                data-testid={`border-extension-line-${node.name}`}
                x1={position.center.x + extensionUnitX * CIRCLE_LINE_INSET}
                y1={position.center.y + extensionUnitY * CIRCLE_LINE_INSET}
                x2={
                  position.outerCenter.x - extensionUnitX * CIRCLE_LINE_INSET
                }
                y2={
                  position.outerCenter.y - extensionUnitY * CIRCLE_LINE_INSET
                }
                stroke="#a9bfd5"
                strokeWidth={1}
                pointerEvents="none"
              />
            </g>
          );
        })}

        {lightSegments.map((segment) => (
          <line
            key={`light-line-${segment.triangleName}-${segment.direction}`}
            data-testid={`light-line-${segment.triangleName}-${segment.direction}`}
            x1={segment.start.x}
            y1={segment.start.y}
            x2={segment.end.x}
            y2={segment.end.y}
            stroke="#fff1a8"
            strokeWidth={2.5}
            strokeDasharray="3 6"
            strokeLinecap="round"
            pointerEvents="none"
          />
        ))}

        {borderNodes.map((node) => {
          
          const position = borderNodePositions.get(node.name);
          const result = resultByBorder.get(node.name);
          if (!position) {
            throw new Error(`Missing position for border node: ${node.name}`);
          }
          if (!result) {
            throw new Error(`Missing result for border node: ${node.name}`);
          }
          return (
            <g key={node.name} aria-label={`Border node ${node.name}`}>
              <circle
                cx={position.center.x}
                cy={position.center.y}
                r={BORDER_CIRCLE_RADIUS}
                fill="#08111f"
                stroke="#a9bfd5"
                strokeDasharray="3 2"
                strokeWidth={1.5}
                data-testid={`border-${node.name}`}
                aria-label={`Border node ${node.name}`}
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedBorder(node.name);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedNode(null);
                    setSelectedBorder(node.name);
                  }
                }}
                style={{ cursor: "pointer" }}
              />
              <ResultCircle
                testId={`border-extension-circle-${node.name}`}
                cx={position.outerCenter.x}
                cy={position.outerCenter.y}
                r={RESULT_CIRCLE_RADIUS}
                colors={result.colors}
                destination={result.destination}
              />
              <text
                x={position.center.x}
                y={position.center.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f2f7ff"
                fontSize={7}
                fontWeight={700}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <p
        className="status-message"
        aria-live="polite"
        style={{ textAlign: "center" }}
      >
        {selected
          ? `${selected.name} · ${selected.orientation} · linked to: ${Object.values(selected.edges).join(", ") || "none"}`
          : `${triangleNodes.length} triangles · click or keyboard-select a triangle to inspect its neighbors`}
      </p>
    </section>
  );
}
