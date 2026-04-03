import { useCallback, useState } from 'react';
import { applyMove, createGameState, resetBoard } from '../shared/gameLogic';
import type { GameState } from '../shared/types';

const CELL_SIZE = 60
const PADDING = 40
const WIN_LENGTH = 4

const INITIAL_CONFIG = { rows: 6, cols: 7, winLength: WIN_LENGTH }

/**
 * Arclight – a Connect-4 style game with a neon light theme.
 * Player 1 places glowing cyan arcs; Player 2 places glowing magenta arcs.
 */
export default function Arclight() {
  const [state, setState] = useState<GameState>(() =>
    createGameState({ ...INITIAL_CONFIG, player1Name: 'Arc Blue', player2Name: 'Arc Red' }),
  )

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      setState((prev) => {
        if (prev.phase === 'idle') {
          const started = { ...prev, phase: 'playing' as const }
          return applyMove(started, row, col, WIN_LENGTH)
        }
        return applyMove(prev, row, col, WIN_LENGTH)
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
    if (state.phase === 'won') return `${state.currentPlayer.name} wins! 🎉`
    if (state.phase === 'draw') return "It's a draw!"
    return `${state.currentPlayer.name}'s turn`
  }

  return (
    <div className="game-container">
      <h2 className="game-title">Arclight</h2>

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
        className="game-svg arclight-svg"
        aria-label="Arclight game board"
        role="grid"
      >
        <defs>
          <filter id="arclight-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="cell-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0d0d1a" />
          </radialGradient>
        </defs>

        {/* Board background */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="#0a0a1a"
          rx={8}
        />

        {/* Grid cells */}
        {state.board.map((row) =>
          row.map((cell) => {
            const cx = PADDING + cell.col * CELL_SIZE + CELL_SIZE / 2
            const cy = PADDING + cell.row * CELL_SIZE + CELL_SIZE / 2
            const winning = isWinningCell(cell.row, cell.col)
            const fillColor =
              cell.value === 1 ? '#00e5ff' : cell.value === 2 ? '#ff4081' : 'none'
            const strokeColor =
              cell.value === 1 ? '#00e5ff' : cell.value === 2 ? '#ff4081' : '#2a2a4a'

            return (
              <g
                key={`${cell.row}-${cell.col}`}
                role="gridcell"
                aria-label={`Row ${cell.row + 1}, Column ${cell.col + 1}${cell.active ? `, Player ${cell.value}` : ''}`}
                onClick={() => handleCellClick(cell.row, cell.col)}
                style={{ cursor: cell.active || state.phase === 'won' || state.phase === 'draw' ? 'default' : 'pointer' }}
              >
                {/* Cell border ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={CELL_SIZE / 2 - 4}
                  fill="url(#cell-bg)"
                  stroke={strokeColor}
                  strokeWidth={winning ? 3 : 1.5}
                  filter={cell.active ? 'url(#arclight-glow)' : undefined}
                />

                {/* Arc decoration inside active cells */}
                {cell.active && (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={CELL_SIZE / 2 - 10}
                      fill={fillColor}
                      opacity={winning ? 1 : 0.85}
                      filter="url(#arclight-glow)"
                    />
                    <path
                      d={`M ${cx - 10} ${cy} A 10 10 0 0 1 ${cx + 10} ${cy}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth={2}
                    />
                  </>
                )}

                {/* Winning highlight pulse ring */}
                {winning && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={CELL_SIZE / 2 - 2}
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

        {/* Column labels */}
        {Array.from({ length: INITIAL_CONFIG.cols }, (_, col) => (
          <text
            key={`col-${col}`}
            x={PADDING + col * CELL_SIZE + CELL_SIZE / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            fill="#555577"
            fontSize={11}
          >
            {col + 1}
          </text>
        ))}
      </svg>

      <button className="btn-reset" onClick={handleReset}>
        New Round
      </button>
    </div>
  )
}
