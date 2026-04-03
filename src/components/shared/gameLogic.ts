import type { Cell, GameConfig, GamePhase, GameState, Player } from './types'

/** Create an empty board of cells */
export function createBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      active: false,
      value: 0,
    })),
  )
}

/** Create a fresh game state from config */
export function createGameState(config: GameConfig): GameState {
  const { rows, cols, player1Name = 'Player 1', player2Name = 'Player 2' } = config

  const player1: Player = { id: 1, name: player1Name, score: 0 }
  const player2: Player = { id: 2, name: player2Name, score: 0 }

  return {
    board: createBoard(rows, cols),
    rows,
    cols,
    currentPlayer: player1,
    players: [player1, player2],
    phase: 'idle',
    moveCount: 0,
    winningCells: [],
  }
}

/**
 * Check for a winning sequence of `winLength` in a row, column, or diagonal
 * starting from the given cell.
 * Returns the winning cell positions if found, otherwise null.
 */
export function findWinningCells(
  board: Cell[][],
  rows: number,
  cols: number,
  lastRow: number,
  lastCol: number,
  winLength: number,
): Array<{ row: number; col: number }> | null {
  const directions = [
    { dr: 0, dc: 1 },   // horizontal
    { dr: 1, dc: 0 },   // vertical
    { dr: 1, dc: 1 },   // diagonal ↘
    { dr: 1, dc: -1 },  // diagonal ↙
  ]

  for (const { dr, dc } of directions) {
    const cells: Array<{ row: number; col: number }> = []

    for (let step = -(winLength - 1); step <= winLength - 1; step++) {
      const r = lastRow + dr * step
      const c = lastCol + dc * step
      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        cells.length = 0
        continue
      }
      if (board[r][c].active) {
        cells.push({ row: r, col: c })
        if (cells.length === winLength) return cells
      } else {
        cells.length = 0
      }
    }
  }
  return null
}

/** Apply a move to the board and return the new game state */
export function applyMove(
  state: GameState,
  row: number,
  col: number,
  winLength: number,
): GameState {
  if (state.phase !== 'idle' && state.phase !== 'playing') return state
  if (state.board[row][col].active) return state

  const newBoard = state.board.map((r) =>
    r.map((cell) =>
      cell.row === row && cell.col === col
        ? { ...cell, active: true, value: state.currentPlayer.id }
        : cell,
    ),
  )

  const moveCount = state.moveCount + 1
  const winCells = findWinningCells(newBoard, state.rows, state.cols, row, col, winLength)

  let phase: GamePhase = 'playing'
  let winningCells: Array<{ row: number; col: number }> = []

  if (winCells) {
    phase = 'won'
    winningCells = winCells
  } else if (moveCount >= state.rows * state.cols) {
    phase = 'draw'
  }

  const nextPlayer =
    state.currentPlayer.id === 1 ? state.players[1] : state.players[0]

  const updatedPlayers: [Player, Player] = [
    {
      ...state.players[0],
      score:
        phase === 'won' && state.currentPlayer.id === 1
          ? state.players[0].score + 1
          : state.players[0].score,
    },
    {
      ...state.players[1],
      score:
        phase === 'won' && state.currentPlayer.id === 2
          ? state.players[1].score + 1
          : state.players[1].score,
    },
  ]

  return {
    ...state,
    board: newBoard,
    currentPlayer: phase === 'playing' ? nextPlayer : state.currentPlayer,
    players: updatedPlayers,
    phase,
    moveCount,
    winningCells,
  }
}

/** Reset the board for a new round, keeping scores */
export function resetBoard(state: GameState): GameState {
  return {
    ...state,
    board: createBoard(state.rows, state.cols),
    phase: 'idle',
    moveCount: 0,
    winningCells: [],
    currentPlayer: state.players[0],
  }
}
