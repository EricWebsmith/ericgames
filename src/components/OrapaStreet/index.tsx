import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDefaultBoard, getHexBoard } from "../../engine/orapaStreet/boards";
import { setupWithSeed } from "../../engine/orapaStreet/gameManager";
import {
  Color,
  Orient,
  TriangleLine,
  type Board,
  type Node,
  type ParentTile,
  type Puzzle,
  type TileInBoard,
} from "../../engine/orapaStreet/models";
import { getTiles } from "../../engine/orapaStreet/tiles";
import { GEM_FILL } from "../shared/colors";
import BoardControls from "../shared/BoardControls";
import ResultCircle from "../shared/ResultCircle";
import ShareButton from "../shared/ShareButton";
import { getBoardView } from "../shared/boardView";
import { useBoardViewControls } from "../shared/useBoardViewControls";
import Palette from "./Palette";

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
const QUERY_PARAM_TILE_COUNT = "n";

function getTileCountOptions(boardType: BoardType): number[] {
  return boardType === "default" ? [4, 5, 6] : [5, 6, 7, 8];
}

function getDefaultTileCount(boardType: BoardType): number {
  return boardType === "default" ? 4 : 5;
}

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
  tileCount: number;
  tiles: ParentTile[];
  puzzle: Puzzle;
} {
  const params = getSearchParams();
  const boardParam = params.get(QUERY_PARAM_BOARD_TYPE);
  const boardType: BoardType = boardParam === "hex" ? "hex" : "default";
  const seedParam = params.get(QUERY_PARAM_SEED);
  const seed =
    seedParam !== null && /^\d+$/.test(seedParam)
      ? parseInt(seedParam, 10)
      : Math.floor(Math.random() * 0xffffffff);
  const tileCountOptions = getTileCountOptions(boardType);
  const tileCountParam = params.get(QUERY_PARAM_TILE_COUNT);
  const requestedTileCount =
    tileCountParam !== null && /^\d+$/.test(tileCountParam)
      ? parseInt(tileCountParam, 10)
      : Number.NaN;
  const tileCount = tileCountOptions.includes(requestedTileCount)
    ? requestedTileCount
    : getDefaultTileCount(boardType);
  const board = boardType === "default" ? getDefaultBoard() : getHexBoard();
  const tiles = getTiles(tileCount, seededRandom(seed));
  return {
    boardType,
    seed,
    tileCount,
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

function getLineTileSegment(
  node: Node,
  tileInBoard: TileInBoard,
  boardOffset: Point,
): Edge {
  const vertices = getTriangleVertices(node);
  const center = vertices.reduce(
    (point, vertex) => ({
      x: point.x + vertex.x / vertices.length,
      y: point.y + vertex.y / vertices.length,
    }),
    { x: 0, y: 0 },
  );
  const edgeIndex = {
    [TriangleLine.Top]: 0,
    [TriangleLine.Vertical]: 1,
    [TriangleLine.Bottom]: 2,
  }[tileInBoard.tile.lineTileLine];
  const lineEdge = getTriangleEdges(node)[edgeIndex];

  if (!lineEdge) {
    throw new Error(`Missing line tile side for triangle: ${node.name}`);
  }

  const dx = lineEdge.end.x - lineEdge.start.x;
  const dy = lineEdge.end.y - lineEdge.start.y;
  const edgeLength = Math.hypot(dx, dy);
  const tangent = { x: dx / edgeLength, y: dy / edgeLength };
  const midpoint = {
    x: (lineEdge.start.x + lineEdge.end.x) / 2,
    y: (lineEdge.start.y + lineEdge.end.y) / 2,
  };
  const towardCenter = { x: center.x - midpoint.x, y: center.y - midpoint.y };
  const centerDistance = Math.hypot(towardCenter.x, towardCenter.y);
  const inset = 3;
  const endpointInset = 3;
  const inward = {
    x: (towardCenter.x / centerDistance) * inset,
    y: (towardCenter.y / centerDistance) * inset,
  };

  return {
    start: {
      x:
        lineEdge.start.x + tangent.x * endpointInset + inward.x + boardOffset.x,
      y:
        lineEdge.start.y + tangent.y * endpointInset + inward.y + boardOffset.y,
    },
    end: {
      x:
        lineEdge.end.x - tangent.x * endpointInset + inward.x + boardOffset.x,
      y:
        lineEdge.end.y - tangent.y * endpointInset + inward.y + boardOffset.y,
    },
  };
}

function getLineReflectionPoint(
  nodeName: string,
  start: Point,
  end: Point,
  mirror: Edge,
): Point {
  const mirrorVector = {
    x: mirror.end.x - mirror.start.x,
    y: mirror.end.y - mirror.start.y,
  };
  const mirrorLengthSquared =
    mirrorVector.x * mirrorVector.x + mirrorVector.y * mirrorVector.y;
  const projectionRatio =
    ((end.x - mirror.start.x) * mirrorVector.x +
      (end.y - mirror.start.y) * mirrorVector.y) /
    mirrorLengthSquared;
  const projection = {
    x: mirror.start.x + projectionRatio * mirrorVector.x,
    y: mirror.start.y + projectionRatio * mirrorVector.y,
  };
  const reflectedEnd = {
    x: 2 * projection.x - end.x,
    y: 2 * projection.y - end.y,
  };
  const ray = { x: reflectedEnd.x - start.x, y: reflectedEnd.y - start.y };
  const offset = { x: mirror.start.x - start.x, y: mirror.start.y - start.y };
  const cross = (first: Point, second: Point) =>
    first.x * second.y - first.y * second.x;
  const denominator = cross(ray, mirrorVector);

  if (Math.abs(denominator) < 0.001) {
    throw new Error(`Light path is parallel to line tile in triangle: ${nodeName}`);
  }

  const rayRatio = cross(offset, mirrorVector) / denominator;
  const mirrorRatio = cross(offset, ray) / denominator;
  if (
    rayRatio < 0 ||
    rayRatio > 1 ||
    mirrorRatio < 0 ||
    mirrorRatio > 1
  ) {
    throw new Error(`Light path misses line tile in triangle: ${nodeName}`);
  }

  return {
    x: start.x + rayRatio * ray.x,
    y: start.y + rayRatio * ray.y,
  };
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

function getBoardViewBounds(
  triangleNodes: Node[],
  borderNodePositions: Map<string, BorderNodePosition>,
  boardOffset: Point,
): Bounds {
  const triangleBounds = triangleNodes.map((node) =>
    getTriangleViewBounds(node, boardOffset),
  );
  const borderCenters = Array.from(borderNodePositions.values(), ({ outerCenter }) => outerCenter);
  const margin = TRIANGLE_SIDE;
  const left = Math.min(
    ...triangleBounds.map((bounds) => bounds.left),
    ...borderCenters.map((point) => point.x),
  );
  const right = Math.max(
    ...triangleBounds.map((bounds) => bounds.right),
    ...borderCenters.map((point) => point.x),
  );
  const top = Math.min(
    ...triangleBounds.map((bounds) => bounds.top),
    ...borderCenters.map((point) => point.y),
  );
  const bottom = Math.max(
    ...triangleBounds.map((bounds) => bounds.bottom),
    ...borderCenters.map((point) => point.y),
  );

  return {
    left: left - margin,
    right: right + margin,
    top: top - margin,
    bottom: bottom + margin,
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
  const { t } = useTranslation();
  const [initialState] = useState(getInitialState);
  const [boardType, setBoardType] = useState<BoardType>(initialState.boardType);
  const [seed, setSeed] = useState(initialState.seed);
  const [tileCount, setTileCount] = useState(initialState.tileCount);
  const [tiles, setTiles] = useState<ParentTile[]>(initialState.tiles);
  const [puzzle, setPuzzle] = useState<Puzzle>(initialState.puzzle);
  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);
  const [revealedBorders, setRevealedBorders] = useState<Set<string>>(
    () => new Set(),
  );
  const [showAllBorders, setShowAllBorders] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const {
    isBoardMaximized,
    setBoardMaximized,
    isBoardRotated,
    setBoardRotated,
  } = useBoardViewControls();
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
  const boardViewBounds = useMemo(
    () => getBoardViewBounds(triangleNodes, borderNodePositions, boardOffset),
    [triangleNodes, borderNodePositions, boardOffset],
  );
  const resetReveals = () => {
    setRevealedBorders(new Set());
    setShowAllBorders(false);
    setShowAnswer(false);
  };
  const resultByBorder = useMemo(
    () =>
      new Map(
        borderNodes.map((node) => {
          const results = puzzle.light_results[node.name] ?? [];
          const exitResult = results[results.length - 1];
          if (!exitResult) {
            throw new Error(
              `Missing light result for border node: ${node.name}`,
            );
          }
          return [
            node.name,
            { destination: exitResult.label, colors: exitResult.colors },
          ];
        }),
      ),
    [board, borderNodes, puzzle.light_results],
  );
  const sourceViewBox = isBoardMaximized
    ? boardViewBounds
    : { left: 0, right: SVG_WIDTH, top: 0, bottom: SVG_HEIGHT };
  const { viewBox, transform: boardTransform } = getBoardView(
    sourceViewBox,
    isBoardRotated,
  );
  const lightSegments = useMemo(() => {
    if (!showAnswer || !selectedBorder) {
      return [];
    }

    const results = puzzle.light_results[selectedBorder] ?? [];
    return results.flatMap((result, index) => {
      const triangle = board.spaces[result.label];
      if (!triangle) {
        if (index === results.length - 1 && !result.label) {
          return [];
        }
        throw new Error(`Missing traversed node: ${result.label}`);
      }
      if (triangle.isBorder) {
        return [];
      }

      const previousLabel =
        index === 0 ? selectedBorder : results[index - 1]?.label;
      const nextResult = results[index + 1];
      const nextLabel = nextResult?.label;
      if (!previousLabel || !nextLabel) {
        if (index >= results.length - 2) {
          return [];
        }
        throw new Error(`Incomplete light path at triangle: ${triangle.name}`);
      }
      const start = getConnectionMidpoint(
        board,
        previousLabel,
        triangle.name,
        borderNodePositions,
        boardOffset,
      );
      const end = getConnectionMidpoint(
        board,
        triangle.name,
        nextLabel,
        borderNodePositions,
        boardOffset,
      );
      const tileInBoard = tilesInBoard[triangle.name];
      const reflectionPoint =
        tileInBoard?.tile.lineTile && result.direction !== nextResult.direction
          ? getLineReflectionPoint(
              triangle.name,
              start,
              end,
              getLineTileSegment(triangle, tileInBoard, boardOffset),
            )
          : undefined;

      return [
        {
          triangleName: triangle.name,
          direction: result.direction,
          start,
          end,
          reflectionPoint,
        },
      ];
    });
  }, [
    showAnswer,
    selectedBorder,
    board,
    puzzle.light_results,
    tilesInBoard,
    borderNodePositions,
    boardOffset,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = getSearchParams();
    params.set(QUERY_PARAM_SEED, String(seed));
    params.set(QUERY_PARAM_BOARD_TYPE, boardType);
    params.set(QUERY_PARAM_TILE_COUNT, String(tileCount));
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
  }, [seed, boardType, tileCount]);

  return (
    <section className="game-container" style={{ maxWidth: 900 }}>
      <h2 className="game-title">{t("orapaStreet.title")}</h2>
      <p className="status-message">{t("orapaStreet.instructions")}</p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <label htmlFor="orapa-street-board-type">
          {t("orapaStreet.board")}
        </label>
        <select
          id="orapa-street-board-type"
          className="lang-switcher"
          value={boardType}
          onChange={(event) => {
            const nextBoardType = event.target.value;
            if (nextBoardType === "default" || nextBoardType === "hex") {
              const nextTileCount = getTileCountOptions(nextBoardType).includes(
                tileCount,
              )
                ? tileCount
                : getDefaultTileCount(nextBoardType);
              const nextTiles =
                nextTileCount === tileCount
                  ? tiles
                  : getTiles(nextTileCount, seededRandom(seed));
              setBoardType(nextBoardType);
              setTileCount(nextTileCount);
              setTiles(nextTiles);
              setSelectedBorder(null);
              resetReveals();
              const nextBoard =
                nextBoardType === "default" ? getDefaultBoard() : getHexBoard();
              setPuzzle(setupWithSeed(nextBoard, nextTiles, seed));
            }
          }}
        >
          <option value="default">{t("orapaStreet.defaultBoard")}</option>
          <option value="hex">{t("orapaStreet.hexBoard")}</option>
        </select>
        <label htmlFor="orapa-street-tile-count">
          {t("orapaStreet.tiles")}
        </label>
        <select
          id="orapa-street-tile-count"
          className="lang-switcher"
          value={tileCount}
          onChange={(event) => {
            const nextTileCount = Number(event.target.value);
            if (!getTileCountOptions(boardType).includes(nextTileCount)) {
              return;
            }

            const nextTiles = getTiles(nextTileCount, seededRandom(seed));
            setTileCount(nextTileCount);
            setTiles(nextTiles);
            setPuzzle(setupWithSeed(board, nextTiles, seed));
            setSelectedBorder(null);
            resetReveals();
          }}
        >
          {getTileCountOptions(boardType).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
        <button
          className="btn-reset"
          onClick={() => {
            const nextSeed = Math.floor(Math.random() * 0xffffffff);
            const nextTiles = getTiles(tileCount, seededRandom(nextSeed));
            setSeed(nextSeed);
            setTiles(nextTiles);
            setPuzzle(setupWithSeed(board, nextTiles, nextSeed));
            setSelectedBorder(null);
            resetReveals();
          }}
        >
          {t("orapaStreet.newPuzzle")}
        </button>
        <ShareButton />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(event) => setShowLabels(event.target.checked)}
          />
          {t("orapaStreet.showLabels")}
        </label>
        <button
          className="btn-reset"
          onClick={() => setShowAnswer((visible) => !visible)}
          aria-pressed={showAnswer}
        >
          {t("orapaStreet.showAnswer")}
        </button>
        <button
          className="btn-reset"
          onClick={() => setShowAllBorders(true)}
          aria-pressed={showAllBorders}
        >
          {t("orapaStreet.clickAllBorders")}
        </button>
      </div>

      <div
        className={`orapa-street-board-layout${isBoardMaximized ? " orapa-street-board-layout-fullscreen" : ""}`}
      >
        <Palette tiles={tiles} getTileColor={getTileColor} />
        <div
          className={[
            "shared-board-frame",
            "orapa-street-board-frame",
            isBoardMaximized ? "orapa-street-board-fullscreen" : "",
            isBoardRotated ? "orapa-street-board-frame-rotated" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
        <BoardControls
          isMaximized={isBoardMaximized}
          isRotated={isBoardRotated}
          onMaximizeChange={() =>
            setBoardMaximized((maximized) => !maximized)
          }
          onRotateChange={() =>
            setBoardRotated((rotated) => !rotated)
          }
        />
        <svg
          viewBox={viewBox}
          className="game-svg"
          role="img"
          aria-label={t("orapaStreet.boardAriaLabel")}
        >
        <defs>
          <pattern
            id="orapa-street-restricted-stripes"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="#08111f" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="#7ba4bd"
              strokeWidth="3"
              strokeOpacity="0.65"
            />
          </pattern>
        </defs>

        <g transform={boardTransform}>
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#08111f" rx={10} />

        {triangleNodes.map((node) => {
          const bounds = getTriangleViewBounds(node, boardOffset);
          const labelPosition = getTriangleLabelPosition(
            bounds,
            node.orientation,
          );
          const tileInBoard = tilesInBoard[node.name];
          const tileColor = showAnswer
            ? getTileColor(tileInBoard?.tile.colors ?? [])
            : "none";
          const isRestricted = board.restrictedArea.includes(node.name);
          const fill = isRestricted
            ? "url(#orapa-street-restricted-stripes)"
            : tileInBoard?.tile.lineTile
              ? "none"
              : tileColor;
          const labelTextColor =
            showAnswer &&
            tileInBoard?.tile.colors.length === 1 &&
            tileInBoard.tile.colors[0] === Color.White
              ? "#111827"
              : "#f2f7ff";
          const reflectorSegment =
            showAnswer && tileInBoard?.tile.lineTile
              ? getLineTileSegment(node, tileInBoard, boardOffset)
              : null;
          return (
            <g
              key={node.name}
              data-testid={`triangle-${node.name}`}
              data-restricted-area={isRestricted ? "true" : undefined}
            >
              <polygon
                points={getTrianglePoints(bounds, node.orientation)}
                fill={fill}
                stroke="#7ba4bd"
                strokeWidth={1.25}
              >
                <title>{`${node.name} · q: ${node.q}, r: ${node.r} · ${node.orientation} · ${Object.keys(node.edges).length} links`}</title>
              </polygon>
              {reflectorSegment && (
                <line
                  data-testid={`line-tile-reflector-${node.name}`}
                  x1={reflectorSegment.start.x}
                  y1={reflectorSegment.start.y}
                  x2={reflectorSegment.end.x}
                  y2={reflectorSegment.end.y}
                  stroke={tileColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              )}
              {showLabels && (
                <text
                  x={
                    labelPosition.x -
                    (node.orientation === Orient.PointyLeft ? 2 : -2)
                  }
                  y={labelPosition.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={labelTextColor}
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
                x2={position.outerCenter.x - extensionUnitX * CIRCLE_LINE_INSET}
                y2={position.outerCenter.y - extensionUnitY * CIRCLE_LINE_INSET}
                stroke="#a9bfd5"
                strokeWidth={1}
                pointerEvents="none"
              />
            </g>
          );
        })}

        {lightSegments.flatMap((segment, index) => {
          const paths = segment.reflectionPoint
            ? [
                {
                  start: segment.start,
                  end: segment.reflectionPoint,
                  part: "incoming",
                },
                {
                  start: segment.reflectionPoint,
                  end: segment.end,
                  part: "outgoing",
                },
              ]
            : [{ start: segment.start, end: segment.end, part: "direct" }];
          return paths.map((path) => (
            <line
              key={`light-line-${segment.triangleName}-${segment.direction}-${index}-${path.part}`}
              data-testid={`light-line-${segment.triangleName}-${segment.direction}-${index}-${path.part}`}
              data-triangle-name={segment.triangleName}
              x1={path.start.x}
              y1={path.start.y}
              x2={path.end.x}
              y2={path.end.y}
              stroke="#fff1a8"
              strokeWidth={2.5}
              strokeDasharray="3 6"
              strokeLinecap="round"
              pointerEvents="none"
            />
          ));
        })}

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
            <g
              key={node.name}
              aria-label={t("orapaStreet.borderNodeAriaLabel", {
                name: node.name,
              })}
            >
              <circle
                cx={position.center.x}
                cy={position.center.y}
                r={BORDER_CIRCLE_RADIUS}
                fill="#08111f"
                stroke="#a9bfd5"
                strokeDasharray="3 2"
                strokeWidth={1.5}
                data-testid={`border-${node.name}`}
                aria-label={t("orapaStreet.borderNodeAriaLabel", {
                  name: node.name,
                })}
                onClick={() => {
                  setSelectedBorder(node.name);
                  setRevealedBorders((revealed) =>
                    new Set(revealed).add(node.name),
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedBorder(node.name);
                    setRevealedBorders((revealed) =>
                      new Set(revealed).add(node.name),
                    );
                  }
                }}
                style={{ cursor: "pointer" }}
              />
              {(showAllBorders || revealedBorders.has(node.name)) && (
                <ResultCircle
                  testId={`border-extension-circle-${node.name}`}
                  cx={position.outerCenter.x}
                  cy={position.outerCenter.y}
                  r={RESULT_CIRCLE_RADIUS}
                  colors={result.colors}
                  destination={result.destination}
                />
              )}
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
        </g>
        </svg>
        </div>
      </div>

      <p
        className="status-message"
        aria-live="polite"
        style={{ textAlign: "center" }}
      />
    </section>
  );
}
