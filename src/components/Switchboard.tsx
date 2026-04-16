import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getHexCoordinatesByTileNo, getRhombicCoordinatesByTileNo } from '../engine/switchboard/data';
import { setup, traverse } from '../engine/switchboard/gameManager';
import { BoardType, TileInBoard, type Board, type PathSegment, type Step } from '../engine/switchboard/models';
import StepSvg from './shared/StepSvg';

const SVG_W = 700;
const SVG_H = 560;
const HEX_SIZE = 46;
const HEX_R = 40;
const BORDER_MARKER_DISTANCE = HEX_R + 12;
const BORDER_MARKER_RADIUS = 14;
const START_MARKER_COLOR = '#ffd36a';
const END_MARKER_COLOR = '#ff4d4f';
const ARC_UNHIGHLIGHTED_COLOR = '#9de7ff';
const BOARD_BACKGROUND_COLOR = '#081826';
const ROTATION_ANIMATION_DURATION_MS = 500;
const HEX_DIRECTION_COUNT = 6;
const DEGREES_PER_HEX_ROTATION = 60;
const HEX_VERTEX_TOP = 0;
const HEX_VERTEX_UPPER_RIGHT = 1;
const HEX_VERTEX_LOWER_RIGHT = 2;
const HEX_VERTEX_BOTTOM = 3;
const HEX_VERTEX_LOWER_LEFT = 4;
const HEX_VERTEX_UPPER_LEFT = 5;

const DIR_DEG: Record<number, number> = {
  0: 180, 1: 240, 2: 300, 3: 0, 4: 60, 5: 120,
};

const BOARD_LENGTH_BY_TYPE: Record<BoardType, number> = {
  [BoardType.Rhombic9]: 3,
  [BoardType.Rhombic16]: 4,
  [BoardType.Rhombic25]: 5,
  [BoardType.Hexagonal19]: -1,
  [BoardType.Hexagonal37]: -1,
};

const HEX_RADIUS_BY_TYPE: Record<BoardType, number> = {
  [BoardType.Rhombic9]: -1,
  [BoardType.Rhombic16]: -1,
  [BoardType.Rhombic25]: -1,
  [BoardType.Hexagonal19]: 2,
  [BoardType.Hexagonal37]: 3,
};

const BOARD_OPTIONS = [
  BoardType.Rhombic9,
  BoardType.Rhombic16,
  BoardType.Rhombic25,
  BoardType.Hexagonal19,
  BoardType.Hexagonal37,
] as const;

const toRawPx = (q: number, r: number) => ({
  x: HEX_SIZE * Math.sqrt(3) * (q + r / 2),
  y: HEX_SIZE * 1.5 * r,
});

const edgeMidForDir = (cx: number, cy: number, direction: number): { x: number; y: number; } => {
  const angle = (Math.PI / 180) * DIR_DEG[direction];
  const inradius = HEX_R * Math.sqrt(3) / 2;
  return { x: cx + inradius * Math.cos(angle), y: cy + inradius * Math.sin(angle) };
};

const pointAlongDir = (cx: number, cy: number, direction: number, distance: number): { x: number; y: number; } => {
  const angle = (Math.PI / 180) * DIR_DEG[direction];
  return { x: cx + distance * Math.cos(angle), y: cy + distance * Math.sin(angle) };
};

const makeArcPath = (inDir: number, outDir: number, cx: number, cy: number): string | null => {
  if (inDir > outDir) return null;
  const distance = (outDir - inDir) % 6;

  if (distance === 1 || distance === 5) {
    const dir = distance === 1 ? inDir : outDir;
    const s = edgeMidForDir(cx, cy, dir);
    const e = edgeMidForDir(cx, cy, (dir + 1) % 6);
    const r = HEX_R / 2;
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r},${r} 0 0,0 ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  }

  if (distance === 2 || distance === 4) {
    const dir = distance === 2 ? inDir : outDir;
    const s = edgeMidForDir(cx, cy, dir);
    const e = edgeMidForDir(cx, cy, (dir + 2) % 6);
    const r = Math.sqrt((3 / 4) * HEX_R * HEX_R - (3 / 2) * HEX_R * HEX_SIZE + 3 * HEX_SIZE * HEX_SIZE);
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r.toFixed(1)},${r.toFixed(1)} 0 0,0 ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  }

  if (distance === 3) {
    const s = edgeMidForDir(cx, cy, inDir);
    const e = edgeMidForDir(cx, cy, outDir);
    return `M${s.x.toFixed(1)},${s.y.toFixed(1)} L${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  }

  return null;
};

const hexPoints = (cx: number, cy: number, R: number): string =>
  Array.from({ length: HEX_DIRECTION_COUNT }, (_, k) => {
    const a = (Math.PI / 180) * (-90 + 60 * k);
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const hexVertices = (cx: number, cy: number, R: number): Array<{ x: number; y: number; }> =>
  Array.from({ length: HEX_DIRECTION_COUNT }, (_, k) => {
    const a = (Math.PI / 180) * (-90 + 60 * k);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

const pointsToString = (points: Array<{ x: number; y: number; }>): string =>
  points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');

const halfHexPoints = (cx: number, cy: number, R: number, side: 'left' | 'right'): string => {
  const vertices = hexVertices(cx, cy, R);
  // Vertex order from hexVertices(): top, upper-right, lower-right, bottom, lower-left, upper-left.
  if (side === 'left') {
    return pointsToString([
      vertices[HEX_VERTEX_TOP],
      vertices[HEX_VERTEX_UPPER_LEFT],
      vertices[HEX_VERTEX_LOWER_LEFT],
      vertices[HEX_VERTEX_BOTTOM],
      { x: cx, y: cy },
    ]);
  }
  return pointsToString([
    vertices[HEX_VERTEX_TOP],
    { x: cx, y: cy },
    vertices[HEX_VERTEX_BOTTOM],
    vertices[HEX_VERTEX_LOWER_RIGHT],
    vertices[HEX_VERTEX_UPPER_RIGHT],
  ]);
};

const normalizeRotation = (value: number): number =>
  ((value % HEX_DIRECTION_COUNT) + HEX_DIRECTION_COUNT) % HEX_DIRECTION_COUNT;

const pathSegmentKey = (tileIndex: number, inDir: number, outDir: number): string => {
  const a = Math.min(inDir, outDir);
  const b = Math.max(inDir, outDir);
  return `${tileIndex}-${a}-${b}`;
};

const pathSegmentToKey = (pathSegment: PathSegment): string =>
  pathSegmentKey(pathSegment.tileIndex, pathSegment.inDir, pathSegment.outDir);

const inverseRotate = (rotate: Step['rotate']): Step['rotate'] =>
  rotate === 1 ? -1 : 1;

const applyStep = (board: Board, step: Step): Board => {
  const tileIndex = board.tiles.findIndex(tile => tile.tileNo === step.tileNo);
  if (tileIndex < 0) return board;

  const tile = board.tiles[tileIndex];
  const nextRotate = normalizeRotation(tile.rotate + step.rotate);
  const nextTile = new TileInBoard({
    tile: tile.tile,
    tileNo: tile.tileNo,
    rotate: nextRotate,
    edges: { ...tile.edges },
  }).resolve_rotate();

  const nextTiles = [...board.tiles];
  nextTiles[tileIndex] = nextTile;

  return {
    ...board,
    tiles: nextTiles,
  };
};

export default function Switchboard() {
  const { t } = useTranslation();
  const [boardType, setBoardType] = useState<BoardType>(BoardType.Rhombic9);
  const [board, setBoard] = useState<Board>(() => setup(BoardType.Rhombic9));
  const [showTips, setShowTips] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [rotatingTile, setRotatingTile] = useState<{ tileNo: number; delta: number; } | null>(null);
  const rotationTimeoutRef = useRef<number | null>(null);

  const clearPendingRotation = useCallback(() => {
    if (rotationTimeoutRef.current !== null) {
      window.clearTimeout(rotationTimeoutRef.current);
      rotationTimeoutRef.current = null;
    }
    setRotatingTile(null);
  }, []);

  const handleNewGame = useCallback((nextBoardType: BoardType = boardType) => {
    clearPendingRotation();
    setBoard(setup(nextBoardType));
    setSteps([]);
  }, [boardType, clearPendingRotation]);

  const handleBoardTypeChange = useCallback((value: string) => {
    const nextBoardType = value as BoardType;
    setBoardType(nextBoardType);
    handleNewGame(nextBoardType);
  }, [handleNewGame]);

  const handleRotateTile = useCallback((tileNo: number, delta: Step['rotate']) => {
    if (rotatingTile) return;
    setRotatingTile({ tileNo, delta });
    setSteps(prev => [...prev, { tileNo, rotate: delta }]);

    rotationTimeoutRef.current = window.setTimeout(() => {
      setBoard(prevBoard => applyStep(prevBoard, { tileNo, rotate: delta }));

      setRotatingTile(null);
      rotationTimeoutRef.current = null;
    }, ROTATION_ANIMATION_DURATION_MS);
  }, [rotatingTile]);

  const handleResetSteps = useCallback(() => {
    if (steps.length === 0 || rotatingTile) return;
    clearPendingRotation();
    setBoard(prevBoard => [...steps].reverse().reduce(
      (nextBoard, step) => applyStep(nextBoard, { tileNo: step.tileNo, rotate: inverseRotate(step.rotate) }),
      prevBoard,
    ));
    setSteps([]);
  }, [clearPendingRotation, rotatingTile, steps]);

  useEffect(() => () => {
    clearPendingRotation();
  }, [clearPendingRotation]);

  const boardLength = BOARD_LENGTH_BY_TYPE[board.boardType];
  const hexRadius = HEX_RADIUS_BY_TYPE[board.boardType];
  const tilePx = useMemo(() => {
    const rawTiles = boardLength > 0
      ? (() => {
        const coordinatesByTileNo = getRhombicCoordinatesByTileNo(board.tiles.length);
        return board.tiles.map(tile => {
          const coordinate = coordinatesByTileNo[tile.tileNo];
          return { tileNo: tile.tileNo, ...toRawPx(coordinate.q, coordinate.r) };
        });
      })()
      : (() => {
        const coordinatesByTileNo = getHexCoordinatesByTileNo(hexRadius);
        return board.tiles.map(tile => {
          const coordinate = coordinatesByTileNo[tile.tileNo];
          return { tileNo: tile.tileNo, ...toRawPx(coordinate.q, coordinate.r) };
        });
      })();

    const minX = Math.min(...rawTiles.map(tile => tile.x));
    const maxX = Math.max(...rawTiles.map(tile => tile.x));
    const minY = Math.min(...rawTiles.map(tile => tile.y));
    const maxY = Math.max(...rawTiles.map(tile => tile.y));

    const boardCenterX = (minX + maxX) / 2;
    const boardCenterY = (minY + maxY) / 2;
    const offsetX = SVG_W / 2 - boardCenterX;
    const offsetY = SVG_H / 2 - boardCenterY;

    return Object.fromEntries(
      rawTiles.map(tile => [
        tile.tileNo,
        { x: tile.x + offsetX, y: tile.y + offsetY },
      ]),
    );
  }, [boardLength, hexRadius, board.tiles]);

  const startTilePosition = tilePx[board.startTileIndex];
  const endTilePosition = tilePx[board.endTileIndex];
  const startBorderPosition = pointAlongDir(
    startTilePosition.x,
    startTilePosition.y,
    board.startTileDirection,
    BORDER_MARKER_DISTANCE,
  );
  const endBorderPosition = pointAlongDir(
    endTilePosition.x,
    endTilePosition.y,
    board.endTileDirection,
    BORDER_MARKER_DISTANCE,
  );
  const startPathSegments = useMemo(
    () => traverse(board, board.startTileIndex, board.startTileDirection),
    [board],
  );
  const endPathSegments = useMemo(
    () => traverse(board, board.endTileIndex, board.endTileDirection),
    [board],
  );
  const startPathSegmentKeys = useMemo(
    () => new Set(startPathSegments.map(pathSegmentToKey)),
    [startPathSegments],
  );
  const endPathSegmentKeys = useMemo(
    () => new Set(endPathSegments.map(pathSegmentToKey)),
    [endPathSegments],
  );

  return (
    <div className="game-container">
      <h2 className="game-title">{t('switchboard.title')}</h2>
      <p className="status-message">{t('switchboard.instructions')}</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <label htmlFor="switchboard-board-type">{t('switchboard.boardSizeLabel')}</label>
        <select
          id="switchboard-board-type"
          className="lang-switcher"
          value={boardType}
          onChange={(e) => handleBoardTypeChange(e.target.value)}
        >
          {BOARD_OPTIONS.map(option => (
            <option key={option} value={option}>
              {t(`switchboard.${option}`)}
            </option>
          ))}
        </select>
        <button className="btn-reset" onClick={() => handleNewGame()}>
          {t('switchboard.newGame')}
        </button>
        <button className="btn-reset" onClick={handleResetSteps} disabled={steps.length === 0 || Boolean(rotatingTile)}>
          {t('switchboard.reset')}
        </button>
        <label htmlFor="switchboard-show-tips" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            id="switchboard-show-tips"
            type="checkbox"
            checked={showTips}
            onChange={(e) => setShowTips(e.target.checked)}
          />
          show tips
        </label>
      </div>

      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="game-svg"
        aria-label={t('switchboard.boardAriaLabel')}
      >
        <rect width={SVG_W} height={SVG_H} fill={BOARD_BACKGROUND_COLOR} rx={10} />

        {board.tiles.map((tile) => {
          const { x, y } = tilePx[tile.tileNo];
          const isStartTile = tile.tileNo === board.startTileIndex;
          const isEndTile = tile.tileNo === board.endTileIndex;
          const tileAriaLabel = isStartTile
            ? `Start tile ${tile.tileNo}`
            : isEndTile
              ? `End tile ${tile.tileNo}`
              : `Tile ${tile.tileNo}`;
          return (
            <g key={tile.tileNo} aria-label={tileAriaLabel}>
              <g
                style={{
                  transition: rotatingTile?.tileNo === tile.tileNo
                    ? `transform ${ROTATION_ANIMATION_DURATION_MS}ms ease`
                    : 'none',
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transform: rotatingTile?.tileNo === tile.tileNo
                    ? `rotate(${rotatingTile.delta * DEGREES_PER_HEX_ROTATION}deg)`
                    : 'rotate(0deg)',
                }}
              >
                <polygon
                  points={hexPoints(x, y, HEX_R)}
                  fill="#0b2438"
                  stroke="#3a78a1"
                  strokeWidth={1.5}
                />
                {Object.entries(tile.arcDict).map(([inDirStr, outDir]) => {
                  const inDir = Number(inDirStr);
                  const path = makeArcPath(inDir, outDir, x, y);
                  if (!path) return null;
                  const segmentKey = pathSegmentKey(tile.tileNo, inDir, outDir);
                  const stroke = !showTips
                    ? ARC_UNHIGHLIGHTED_COLOR
                    : endPathSegmentKeys.has(segmentKey)
                      ? END_MARKER_COLOR
                      : startPathSegmentKeys.has(segmentKey)
                        ? START_MARKER_COLOR
                        : ARC_UNHIGHLIGHTED_COLOR;
                  return (
                    <path
                      key={`${tile.tileNo}-${inDir}-${outDir}`}
                      d={path}
                      stroke={stroke}
                      strokeWidth={2.6}
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
                <text
                  x={x}
                  y={y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontWeight="bold"
                  fontSize={12}
                >
                  {tile.tileNo}
                </text>
              </g>
              <polygon
                points={halfHexPoints(x, y, HEX_R, 'left')}
                fill="#ffffff"
                fillOpacity={0}
                style={{ cursor: rotatingTile ? 'default' : 'pointer' }}
                onClick={() => handleRotateTile(tile.tileNo, -1)}
              />
              <polygon
                points={halfHexPoints(x, y, HEX_R, 'right')}
                fill="#ffffff"
                fillOpacity={0}
                style={{ cursor: rotatingTile ? 'default' : 'pointer' }}
                onClick={() => handleRotateTile(tile.tileNo, 1)}
              />
            </g>
          );
        })}

        {[
          { ...startBorderPosition, label: 'S', stroke: START_MARKER_COLOR },
          { ...endBorderPosition, label: 'E', stroke: END_MARKER_COLOR },
        ].map(({ x, y, label, stroke }) => (
          <g key={`border-${label}`}>
            <circle
              cx={x}
              cy={y}
              r={BORDER_MARKER_RADIUS}
              fill={BOARD_BACKGROUND_COLOR}
              stroke={stroke}
              strokeWidth={2.8}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={stroke}
              fontWeight="bold"
              fontSize={12}
            >
              {label}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ width: '100%', maxWidth: SVG_W }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {steps.map((step, index) => (
            <StepSvg
              key={index}
              tileNo={step.tileNo}
              rotate={step.rotate}
              ariaLabel={step.rotate === 1
                ? t('switchboard.stepClockwiseAria', { tileNo: step.tileNo })
                : t('switchboard.stepCounterClockwiseAria', { tileNo: step.tileNo })}
            />
          ))}
        </div>
        <p className="status-message" style={{ textAlign: 'center', marginTop: 8 }}>
          {t('switchboard.stepsSpent', { count: steps.length })}
        </p>
      </div>
    </div>
  );
}
