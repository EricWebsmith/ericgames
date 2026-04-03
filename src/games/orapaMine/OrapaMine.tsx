import { useState, useCallback } from 'react'
import type { GameState } from '../shared/types'
import { createGameState, applyMove, resetBoard } from '../shared/gameLogic'

const CELL_SIZE = 64
const PADDING = 36
const WIN_LENGTH = 3

const INITIAL_CONFIG = { rows: 5, cols: 5, winLength: WIN_LENGTH }

/**
 * Orapa Mine – a Tic-Tac-Toe style game set in an underground mine.
 * Player 1 places gold ore; Player 2 places crystal ore.
 * Win condition: 3 in a row on a 5×5 grid.
 */
export default function OrapaMine() {
  const [state, setState] = useState<GameState>(() =>
    createGameState({ ...INITIAL_CONFIG, player1Name: 'Gold Miner', player2Name: 'Crystal Miner' }),
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
    if (state.phase === 'won') return `${state.currentPlayer.name} strikes it rich! ⛏️`
    if (state.phase === 'draw') return 'The mine is exhausted!'
    return `${state.currentPlayer.name}'s turn`
  }

  return (
    <div className="game-container">
      <h2 className="game-title">Orapa Mine</h2>

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
        className="game-svg mine-svg"
        aria-label="Orapa Mine game board"
        role="grid"
      >
        <defs>
          <filter id="mine-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="rock-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#2d1f0e" />
            <rect x="0" y="0" width="4" height="4" fill="#362412" opacity={0.6} />
            <rect x="4" y="4" width="4" height="4" fill="#2a1c0c" opacity={0.6} />
          </pattern>
        </defs>

        {/* Background – mine rock texture */}
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="url(#rock-pattern)" rx={6} />

        {/* Grid lines */}
        {Array.from({ length: INITIAL_CONFIG.rows + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={PADDING}
            y1={PADDING + i * CELL_SIZE}
            x2={svgWidth - PADDING}
            y2={PADDING + i * CELL_SIZE}
            stroke="#5a3e20"
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
            stroke="#5a3e20"
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

                {/* Gold ore (Player 1) */}
                {cell.value === 1 && (
                  <polygon
                    points={`${cx},${cy - 18} ${cx + 16},${cy + 10} ${cx - 16},${cy + 10}`}
                    fill={winning ? '#ffd700' : '#c9a227'}
                    stroke="#8b6914"
                    strokeWidth={1.5}
                    filter={winning ? 'url(#mine-glow)' : undefined}
                  />
                )}

                {/* Crystal ore (Player 2) */}
                {cell.value === 2 && (
                  <polygon
                    points={`${cx},${cy - 18} ${cx + 14},${cy} ${cx},${cy + 18} ${cx - 14},${cy}`}
                    fill={winning ? '#a8d8ea' : '#5b9ecc'}
                    stroke="#2a6080"
                    strokeWidth={1.5}
                    filter={winning ? 'url(#mine-glow)' : undefined}
                  />
                )}

                {/* Winning highlight */}
                {winning && (
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={CELL_SIZE - 4}
                    height={CELL_SIZE - 4}
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth={2}
                    rx={4}
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
