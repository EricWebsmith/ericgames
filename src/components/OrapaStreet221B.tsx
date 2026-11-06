import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { borderEntries, BOARD_SIZE, cellKey, cellLabel, COLOR_HEX, colorName, isPlayable, ROWS } from '../engine/orapaStreet221B/models';
import { createGame, traceBrainwave } from '../engine/orapaStreet221B/gameManager';
import BorderCircle from './shared/BorderCircle';
import ShareButton from './shared/ShareButton';

const CELL = 36;
const PAD = 62;
const entries = borderEntries();
const directions = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
] as const;

export default function OrapaStreet221B() {
  const { t } = useTranslation();
  const [game, setGame] = useState(() => createGame());
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [fired, setFired] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const tokenAt = useMemo(() => new Map(game.tokens.map(token => [cellKey(token.q, token.r), token])), [game]);
  const traces = useMemo(() => new Map([...fired].map(label => [label, traceBrainwave(game, label)])), [fired, game]);
  const width = PAD * 2 + BOARD_SIZE * CELL;
  const point = (q: number, r: number) => ({ x: PAD + q * CELL + CELL / 2, y: PAD + r * CELL + CELL / 2 });
  const newGame = () => { setGame(createGame()); setShowAnswer(false); setRevealed(new Set()); setFired(new Set()); setSelected(null); };
  const fire = (label: string) => { setFired(prev => new Set(prev).add(label)); setSelected(label); };

  return <div className="game-container">
    <h2 className="game-title">{t('orapaStreet221B.title', 'En Drapa Street 221B')}</h2>
    <p className="status-message">{t('orapaStreet221B.instructions', 'Click a cell to inspect it. Fire a brainwave from a numbered or lettered border position to trace its path and collected colors.')}</p>
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <svg width={width} height={width} viewBox={`0 0 ${width} ${width}`} className="game-svg" aria-label="En Drapa Street 221B puzzle board">
        <rect width={width} height={width} rx={10} fill="#101827" />
        {Array.from({ length: BOARD_SIZE }, (_, r) => Array.from({ length: BOARD_SIZE }, (_, q) => {
          const { x, y } = point(q, r); const key = cellKey(q, r); const token = tokenAt.get(key);
          const visible = showAnswer || revealed.has(key);
          const blocked = !isPlayable(q, r);
          return <g key={key} onClick={() => setRevealed(prev => new Set(prev).add(key))} style={{ cursor: 'pointer' }}>
            <rect x={x - CELL / 2 + 1} y={y - CELL / 2 + 1} width={CELL - 2} height={CELL - 2} rx={3}
              fill={blocked ? '#263241' : visible && token ? COLOR_HEX[token.color] : '#172436'}
              stroke={blocked ? '#303d4b' : '#38516b'} strokeWidth={1} />
            {visible && token && <circle cx={x} cy={y} r={8} fill="#fff" opacity={0.45} />}
            {visible && <text x={x} y={y + 3} textAnchor="middle" fontSize={9} fill="#dbeafe">{cellLabel(q, r)}</text>}
          </g>;
        }))}
        {directions.map(([dq, dr], i) => <g key={`guide-${i}`} opacity={0.05}>
          <line x1={PAD} y1={PAD} x2={PAD + dq * CELL} y2={PAD + dr * CELL} stroke="white" />
        </g>)}
        {entries.map(item => {
          const x = PAD + item.cell.q * CELL + CELL / 2;
          const y = PAD + item.cell.r * CELL + CELL / 2;
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
          const next = result.path[i + 1]; const a = point(cell.q, cell.r); const b = point(next.q, next.r);
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
