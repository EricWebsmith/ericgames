import { useState, useCallback } from 'react'
import type { GameState } from '../shared/types'
import { createGameState, applyMove, resetBoard } from '../shared/gameLogic'

const CELL_SIZE = 64
const PADDING = 40
const WIN_LENGTH = 4

const INITIAL_CONFIG = { rows: 6, cols: 6, winLength: WIN_LENGTH }

/**
 * Orapa Space – a space-themed strategy game on a 6×6 grid.
 * Player 1 places blue planets; Player 2 places orange stars.
 * Win condition: 4 in a row.
 */
export default function OrapaSpace() {
  const [state, setState] = useState<GameState>(() =>
    createGameState({ ...INITIAL_CONFIG, player1Name: 'Planet Blue', player2Name: 'Star Orange' }),
  )

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      setState((prev) => {
        const next = prev.phase === 'idle' ? { ...prev, phase: 'playing' as const } : prev
        return applyMove(next, row, col, WIN_LENGTH)
      })
    },
    [],
  )

  const handleReset = useCallback(() => {
    setState((prev) => resetBoard(prev))
  }, [])

  const svgWidth = INITIAL_CONFIG.cols * CELL_SIZE + PADDING * 2
  const svgHeight = INITIAL_CONFIG.rows * CELL_SIZE + PADDING * 2

  const isWinningCell = (row: number, col: number) =>
    state.winningCells.some((c) => c.row === row && c.col === col)

  const statusMessage = () => {
    if (state.phase === 'won') return `${state.currentPlayer.name} conquers the galaxy! 🚀`
    if (state.phase === 'draw') return 'The universe is in balance!'
    return `${state.currentPlayer.name}'s turn`
  }

  /** Generate a deterministic star field based on position */
  const starField = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: ((i * 137.5) % svgWidth),
    y: ((i * 97.3) % svgHeight),
    r: 0.5 + (i % 3) * 0.5,
    opacity: 0.3 + (i % 4) * 0.15,
  }))

  return (
    <div className="game-container">
      <h2 className="game-title">Orapa Space</h2>

      <div className="score-board">
        <span className="score player1">
          {state.players[0].name}: {state.players[0].score}
        </span>
        <span className="score player2">
          {state.players[1].name}: {state.players[1].score}
        </span>
      </div>

      <p className="status-message">{statusMessage()}</p>

      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="game-svg space-svg"
        aria-label="Orapa Space game board"
        role="grid"
      >
        <defs>
          <filter id="space-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="planet-blue" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#90caf9" />
            <stop offset="100%" stopColor="#1565c0" />
          </radialGradient>
          <radialGradient id="star-orange" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffcc80" />
            <stop offset="100%" stopColor="#e65100" />
          </radialGradient>
        </defs>

        {/* Space background */}
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#03030f" rx={8} />

        {/* Static star field */}
        {starField.map((star) => (
          <circle key={star.id} cx={star.x} cy={star.y} r={star.r} fill="white" opacity={star.opacity} />
        ))}

        {/* Grid lines */}
        {Array.from({ length: INITIAL_CONFIG.rows + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={PADDING}
            y1={PADDING + i * CELL_SIZE}
            x2={svgWidth - PADDING}
            y2={PADDING + i * CELL_SIZE}
            stroke="#1a1a3a"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: INITIAL_CONFIG.cols + 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={PADDING + i * CELL_SIZE}
            y1={PADDING}
            x2={PADDING + i * CELL_SIZE}
            y2={svgHeight - PADDING}
            stroke="#1a1a3a"
            strokeWidth={1}
          />
        ))}

        {/* Cells */}
        {state.board.map((row) =>
          row.map((cell) => {
            const x = PADDING + cell.col * CELL_SIZE
            const y = PADDING + cell.row * CELL_SIZE
            const cx = x + CELL_SIZE / 2
            const cy = y + CELL_SIZE / 2
            const winning = isWinningCell(cell.row, cell.col)

            return (
              <g
                key={`${cell.row}-${cell.col}`}
                role="gridcell"
                aria-label={`Row ${cell.row + 1}, Column ${cell.col + 1}${cell.active ? `, Player ${cell.value}` : ''}`}
                onClick={() => handleCellClick(cell.row, cell.col)}
                style={{ cursor: cell.active || state.phase === 'won' || state.phase === 'draw' ? 'default' : 'pointer' }}
              >
                {/* Hover area */}
                <rect x={x + 1} y={y + 1} width={CELL_SIZE - 2} height={CELL_SIZE - 2} fill="transparent" />

                {/* Planet (Player 1) */}
                {cell.value === 1 && (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={22}
                      fill="url(#planet-blue)"
                      filter={winning ? 'url(#space-glow)' : undefined}
                    />
                    {/* Ring */}
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={28}
                      ry={6}
                      fill="none"
                      stroke="#90caf9"
                      strokeWidth={1.5}
                      opacity={0.6}
                    />
                  </>
                )}

                {/* Star (Player 2) */}
                {cell.value === 2 && (
                  <polygon
                    points={[
                      [cx, cy - 22],
                      [cx + 6, cy - 8],
                      [cx + 22, cy - 8],
                      [cx + 9, cy + 2],
                      [cx + 14, cy + 18],
                      [cx, cy + 9],
                      [cx - 14, cy + 18],
                      [cx - 9, cy + 2],
                      [cx - 22, cy - 8],
                      [cx - 6, cy - 8],
                    ]
                      .map((p) => p.join(','))
                      .join(' ')}
                    fill="url(#star-orange)"
                    filter={winning ? 'url(#space-glow)' : undefined}
                  />
                )}

                {/* Winning highlight */}
                {winning && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={28}
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                )}
              </g>
            )
          }),
        )}
      </svg>

      <button className="btn-reset" onClick={handleReset}>
        New Round
      </button>
    </div>
  )
}
