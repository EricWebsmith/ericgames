import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setup } from '../engine/switchboard/gameManager';
import { BoardType, type Puzzle } from '../engine/switchboard/models';

const SVG_W = 700;
const SVG_H = 560;
const OX = 350;
const OY = 280;
const HEX_SIZE = 46;
const HEX_R = 40;
const BORDER_DIST = 35;
const BORDER_R = 10;

const DIR_DEG: Record<number, number> = {
  0: 180, 1: 240, 2: 300, 3: 0, 4: 60, 5: 120,
};

const BOARD_LENGTH_BY_TYPE: Record<BoardType, number> = {
  [BoardType.Rhombic9]: 3,
  [BoardType.Rhombic16]: 4,
  [BoardType.Rhombic25]: 5,
  [BoardType.Hexagonal19]: 0,
  [BoardType.Hexagonal37]: 0,
};

const BOARD_OPTIONS = [
  BoardType.Rhombic9,
  BoardType.Rhombic16,
  BoardType.Rhombic25,
] as const;

const toPx = (q: number, r: number) => ({
  x: OX + HEX_SIZE * Math.sqrt(3) * (q + r / 2) - 160,
  y: OY + HEX_SIZE * 1.5 * r - 130,
});

const edgeMidForDir = (cx: number, cy: number, d: number): { x: number; y: number; } => {
  const angle = (Math.PI / 180) * DIR_DEG[d];
  const inradius = HEX_R * Math.sqrt(3) / 2;
  return { x: cx + inradius * Math.cos(angle), y: cy + inradius * Math.sin(angle) };
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
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (-90 + 60 * k);
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

export default function Switchboard() {
  const { t } = useTranslation();
  const [boardType, setBoardType] = useState<BoardType>(BoardType.Rhombic9);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => setup(BoardType.Rhombic9));
  console.log("Generated puzzle:", puzzle);

  const handleNewGame = useCallback((nextBoardType: BoardType = boardType) => {
    setPuzzle(setup(nextBoardType));
  }, [boardType]);

  const handleBoardTypeChange = useCallback((value: string) => {
    const nextBoardType = value as BoardType;
    setBoardType(nextBoardType);
    handleNewGame(nextBoardType);
  }, [handleNewGame]);

  const boardLength = BOARD_LENGTH_BY_TYPE[puzzle.board.boardType];
  const tilePx = useMemo(
    () => Object.fromEntries(
      puzzle.board.tiles.map(tile => {
        const q = Math.floor(tile.tileNo / boardLength);
        const r = tile.tileNo % boardLength;
        return [tile.tileNo, toPx(q, r)];
      }),
    ),
    [boardLength, puzzle.board.tiles],
  );

  const borderPoints = useMemo(() => {
    const points: Array<{ key: string; tileNo: number; direction: number; x: number; y: number; }> = [];
    for (const tile of puzzle.board.tiles) {
      const center = tilePx[tile.tileNo];
      for (let direction = 0; direction < 6; direction++) {
        if (tile.edges[direction] !== undefined) continue;
        const angle = (Math.PI / 180) * DIR_DEG[direction];
        points.push({
          key: `${tile.tileNo}-${direction}`,
          tileNo: tile.tileNo,
          direction,
          x: center.x + BORDER_DIST * Math.cos(angle),
          y: center.y + BORDER_DIST * Math.sin(angle),
        });
      }
    }
    return points;
  }, [puzzle.board.tiles, tilePx]);

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
      </div>

      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="game-svg"
        aria-label={t('switchboard.boardAriaLabel')}
      >
        <rect width={SVG_W} height={SVG_H} fill="#081826" rx={10} />

        {puzzle.board.tiles.map((tile) => {
          const { x, y } = tilePx[tile.tileNo];
          return (
            <g key={tile.tileNo}>
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
                return (
                  <path
                    key={`${tile.tileNo}-${inDir}-${outDir}`}
                    d={path}
                    stroke="#9de7ff"
                    strokeWidth={2.6}
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          );
        })}

        {borderPoints.map((point) => {
          const isStart = point.tileNo === puzzle.startTileIndex && point.direction === puzzle.startTileDirection;
          const isEnd = point.tileNo === puzzle.endTileIndex && point.direction === puzzle.endTileDirection;
          if (!isStart && !isEnd) return null;
          return (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r={BORDER_R}
                fill={isStart ? '#ffb14a' : '#54e8a4'}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <text
                x={point.x}
                y={point.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#101820"
                fontWeight="bold"
                fontSize={8}
              >
                {isStart && isEnd ? 'S/E' : isStart ? t('switchboard.start') : t('switchboard.end')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
