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
type Bounds = { top: number; bottom: number; left: number; right: number };
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
  return Object.values(board.spaces).filter((node) => !node.isBorder);
}

function getBorderNodes(board: Board): Node[] {
  return Object.values(board.spaces).filter((node) => node.isBorder);
}

function getTriangleVertices(node: Node): Point[] {
  const bounds = getTriangleBounds(node);
  const middleY = (bounds.top + bounds.bottom) / 2;
  return node.orientation === Orient.PointyLeft
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
  const triangleBounds = triangleNodes.map(getTriangleBounds);
  const boardBounds: Bounds = {
    left: Math.min(...triangleBounds.map((bounds) => bounds.left)),
    right: Math.max(...triangleBounds.map((bounds) => bounds.right)),
    top: Math.min(...triangleBounds.map((bounds) => bounds.top)),
    bottom: Math.max(...triangleBounds.map((bounds) => bounds.bottom)),
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
    const borders = bordersByTriangle.get(triangleName) ?? [];
    borders.push({
      node: border,
      direction: { x: Math.sin(angle), y: -Math.cos(angle) },
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

    const center = getTriangleLabelPosition(
      getTriangleBounds(triangle),
      triangle.orientation,
    );
    const assignments = new Map<
      string,
      { edge: Edge; borders: typeof borders }
    >();
    for (const border of borders) {
      const rankedEdges = openEdges
        .map((edge) => {
          const key = getEdgeKey(edge);
          const midpoint = {
            x: (edge.start.x + edge.end.x) / 2,
            y: (edge.start.y + edge.end.y) / 2,
          };
          const normal = { x: midpoint.x - center.x, y: midpoint.y - center.y };
          const length = Math.hypot(normal.x, normal.y);
          const alignment =
            (normal.x * border.direction.x + normal.y * border.direction.y) /
            length;
          return { edge, key, alignment };
        })
        .sort((first, second) => second.alignment - first.alignment);

      const match = rankedEdges[0];
      if (!match) {
        throw new Error(
          `Missing exposed triangle edge for border node: ${border.node.name}`,
        );
      }
      const assignment = assignments.get(match.key) ?? {
        edge: match.edge,
        borders: [],
      };
      assignment.borders.push(border);
      assignments.set(match.key, assignment);
    }

    for (const { edge, borders: edgeBorders } of assignments.values()) {
      const midpoint = {
        x: (edge.start.x + edge.end.x) / 2,
        y: (edge.start.y + edge.end.y) / 2,
      };
      const outward = { x: midpoint.x - center.x, y: midpoint.y - center.y };
      const outwardLength = Math.hypot(outward.x, outward.y);
      edgeBorders.forEach(({ node, direction }) => {
        const distance =
          Math.hypot(edge.end.x - edge.start.x, edge.end.y - edge.start.y) / 2;
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
            x:
              borderCenter.x +
              (outward.x / outwardLength) * distance +
              boardOffset.x,
            y:
              borderCenter.y +
              (outward.y / outwardLength) * distance +
              boardOffset.y,
          },
        });
      });
    }
  }
  return positions;
}

function getTriangleViewBounds(node: Node, boardOffset: Point): Bounds {
  const bounds = getTriangleBounds(node);
  return {
    top: bounds.top + boardOffset.y,
    bottom: bounds.bottom + boardOffset.y,
    left: bounds.left + boardOffset.x,
    right: bounds.right + boardOffset.x,
  };
}

function getTrianglePoints(
  bounds: Bounds,
  orientation: Node["orientation"],
): string {
  const middleY = (bounds.top + bounds.bottom) / 2;
  return orientation === Orient.PointyLeft
    ? `${bounds.left},${middleY} ${bounds.right},${bounds.top} ${bounds.right},${bounds.bottom}`
    : `${bounds.right},${middleY} ${bounds.left},${bounds.top} ${bounds.left},${bounds.bottom}`;
}

function getTriangleLabelPosition(
  bounds: Bounds,
  orientation: Node["orientation"],
): Point {
  const width = bounds.right - bounds.left;
  return {
    x:
      bounds.left + width * (orientation === Orient.PointyLeft ? 2 / 3 : 1 / 3),
    y: (bounds.top + bounds.bottom) / 2,
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

console.log(puzzle.tiles);

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
            console.log(nextTiles);
            setSeed(nextSeed);
            setSeedInput(String(nextSeed));
            setTiles(nextTiles);
            setPuzzle(setupWithSeed(board, nextTiles, nextSeed));
            // console.log(puzzle.tiles);
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
          const bounds = getTriangleViewBounds(node, boardOffset);
          const labelPosition = getTriangleLabelPosition(
            bounds,
            node.orientation,
          );
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
                points={getTrianglePoints(bounds, node.orientation)}
                fill={fill}
                stroke={
                  isSelected ? "#fff1be" : isNeighbor ? "#9bd7e8" : "#7ba4bd"
                }
                strokeWidth={isSelected ? 2.5 : 1.25}
              >
                <title>{`${node.name} · q: ${node.q}, r: ${node.r} · ${node.orientation} · ${Object.keys(node.edges).length} links`}</title>
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
