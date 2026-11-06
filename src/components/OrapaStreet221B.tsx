import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { borderEntries, BOARD_SIZE, cellKey, cellLabel, COLOR_HEX, colorName, isPlayable } from '../engine/orapaStreet221B/models';
import { createGame, traceBrainwave } from '../engine/orapaStreet221B/gameManager';
import BorderCircle from './shared/BorderCircle';
import ShareButton from './shared/ShareButton';

// The board is a tessellation of equilateral triangles, not square cells.
const TRIANGLE = 42;
const TRIANGLE_HEIGHT = TRIANGLE * Math.sqrt(3) / 2;
const PAD = 72;
const entries = borderEntries();
const BOARD_ROWS = BOARD_SIZE;
const BOARD_COLS = BOARD_SIZE;

export default function OrapaStreet221B() {
  const { t } = useTranslation();
  const [game, setGame] = useState(() => createGame());
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [fired, setFired] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const tokenAt = useMemo(() => new Map(game.tokens.map(token => [cellKey(token.q, token.r), token])), [game]);
  const traces = useMemo(() => new Map([...fired].map(label => [label, traceBrainwave(game, label)])), [fired, game]);
  const boardWidth = BOARD_COLS * TRIANGLE;
  const boardHeight = BOARD_ROWS * TRIANGLE_HEIGHT;
  const width = boardWidth + PAD * 2;
  const height = boardHeight + PAD * 2;
  const newGame = () => { setGame(createGame()); setShowAnswer(false); setRevealed(new Set()); setFired(new Set()); setSelected(null); };
  const fire = (label: string) => { setFired(prev => new Set(prev).add(label)); setSelected(label); };

  const triangle = (row: number, col: number, half: 0 | 1) => {
    // Each rhombus-sized grid position contains two equilateral triangles sharing a diagonal.
    const x = PAD + col * TRIANGLE;
    const y = PAD + row * TRIANGLE_HEIGHT;
    const up = (row + col + half) % 2 === 0;
    const points = up
      ? `${x},${y + TRIANGLE_HEIGHT} ${x + TRIANGLE},${y + TRIANGLE_HEIGHT} ${x + TRIANGLE / 2},${y}`
      : `${x},${y} ${x + TRIANGLE},${y} ${x + TRIANGLE / 2},${y + TRIANGLE_HEIGHT}`;
    return { points, x: x + TRIANGLE / 2, y: y + TRIANGLE_HEIGHT / 2 };
  };

  return <div className="game-container">
    <h2 className="game-title">{t('orapaStreet221B.title', 'En Drapa Street 221B')}</h2>
    <p className="status-message">{t('orapaStreet221B.instructions', 'Click a triangle to inspect it. Fire a brainwave from a numbered or lettered border position to trace its path and collected colors.')}</p>
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="game-svg" aria-label="En Drapa Street 221B triangular puzzle board">
        <rect width={width} height={height} rx={10} fill="#101827" />
        {Array.from({ length: BOARD_ROWS }, (_, row) => Array.from({ length: BOARD_COLS }, (_, col) => {
          const blocked = col >= 5 && col <= 8 && row >= 5 && row <= 8;
          return ([0, 1] as const).map(half => {
            const { points, x, y } = triangle(row, col, half);
            const q = col;
            const r = row;
            const key = `${cellKey(q, r)}:${half}`;
            const token = half === 0 ? tokenAt.get(cellKey(q, r)) : undefined;
            const visible = showAnswer || revealed.has(key);
            return <g key={key} onClick={() => setRevealed(prev => new Set(prev).add(key))} style={{ cursor: blocked ? 'not-allowed' : 'pointer' }}>
              <polygon points={points}
                fill={blocked ? '#263241' : visible && token ? COLOR_HEX[token.color] : '#172436'}
                stroke={blocked ? '#303d4b' : '#38516b'} strokeWidth={1.5} />
              {visible && <text x={x} y={y + 3} textAnchor="middle" fontSize={8} fill="#dbeafe">{cellLabel(q, r)}{half ? '′' : ''}</text>}
            </g>;
          });
        }))}
        {entries.map(item => {
          const x = PAD + item.cell.q * TRIANGLE + TRIANGLE / 2;
          const y = PAD + item.cell.r * TRIANGLE_HEIGHT + TRIANGLE_HEIGHT / 2;
          const result = traces.get(item.label);
          const isEntry = fired.has(item.label);
          const isExit = result?.exit ? fired.has(result.exit) : false;
          return <g key={item.label}>
            <BorderCircle cx={x} cy={y} r={9} colors={isEntry && result ? result.colors : []} isEntry={isEntry} isExit={isExit}
              label={item.label} onClick={() => fire(item.label)} />
            {isEntry && result && <text x={x + 12} y={y - 10} fill="#e2e8f0" fontSize={9}>{colorName(result.colors)}</text>}
          </g>;
        })}
        {[...traces.entries()].flatMap(([label, result]) => result.path.slice(0, -1).map((cell, i) => {
          const next = result.path[i + 1];
          const a = { x: PAD + cell.q * TRIANGLE + TRIANGLE / 2, y: PAD + cell.r * TRIANGLE_HEIGHT + TRIANGLE_HEIGHT / 2 };
          const b = { x: PAD + next.q * TRIANGLE + TRIANGLE / 2, y: PAD + next.r * TRIANGLE_HEIGHT + TRIANGLE_HEIGHT / 2 };
          return <line key={`${label}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#67e8f9" strokeWidth={2} opacity={0.55} pointerEvents="none" />;
        }))}
      </svg>
    </div>
    {selected && traces.get(selected) && <p className="status-message" aria-live="polite">{selected}: {traces.get(selected)?.exit ? `exits at ${traces.get(selected)?.exit}` : 'beam ended'} · {colorName(traces.get(selected)?.colors ?? [])}</p>}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
      <button className="btn-reset" onClick={() => setShowAnswer(value => !value)}>{t('orapaStreet221B.showAnswer', 'See Answer')}</button>
      <button className="btn-reset" onClick={() => setFired(new Set(entries.map(entry => entry.label)))}>{t('orapaStreet221B.fireAll', 'Fire All')}</button>
      <button className="btn-reset" onClick={newGame}>{t('shared.newGame')}</button>
      <ShareButton />
    </div>
  </div>;
}
