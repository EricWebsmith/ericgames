import { describe, it, expect } from 'vitest'
import {
  createBoard,
  createGameState,
  applyMove,
  findWinningCells,
  resetBoard,
} from '../games/shared/gameLogic'
import type { GameConfig, GameState } from '../games/shared/types'

const cfg: GameConfig = { rows: 6, cols: 7, winLength: 4 }

describe('createBoard', () => {
  it('creates a board with the correct dimensions', () => {
    const board = createBoard(3, 4)
    expect(board).toHaveLength(3)
    board.forEach((row) => expect(row).toHaveLength(4))
  })

  it('initialises all cells as inactive with value 0', () => {
    const board = createBoard(2, 2)
    board.forEach((row) =>
      row.forEach((cell) => {
        expect(cell.active).toBe(false)
        expect(cell.value).toBe(0)
      }),
    )
  })

  it('sets correct row and col coordinates', () => {
    const board = createBoard(2, 3)
    expect(board[1][2]).toMatchObject({ row: 1, col: 2 })
  })
})

describe('createGameState', () => {
  it('creates initial state with default player names', () => {
    const state = createGameState(cfg)
    expect(state.players[0].name).toBe('Player 1')
    expect(state.players[1].name).toBe('Player 2')
  })

  it('starts in idle phase', () => {
    const state = createGameState(cfg)
    expect(state.phase).toBe('idle')
  })

  it('sets current player to player 1', () => {
    const state = createGameState(cfg)
    expect(state.currentPlayer.id).toBe(1)
  })

  it('respects custom player names', () => {
    const state = createGameState({ ...cfg, player1Name: 'Alice', player2Name: 'Bob' })
    expect(state.players[0].name).toBe('Alice')
    expect(state.players[1].name).toBe('Bob')
  })

  it('creates board with correct dimensions', () => {
    const state = createGameState(cfg)
    expect(state.board).toHaveLength(cfg.rows)
    expect(state.board[0]).toHaveLength(cfg.cols)
  })
})

describe('applyMove', () => {
  it('activates the clicked cell', () => {
    const state = { ...createGameState(cfg), phase: 'playing' as const }
    const next = applyMove(state, 0, 0, 4)
    expect(next.board[0][0].active).toBe(true)
    expect(next.board[0][0].value).toBe(1)
  })

  it('switches the current player after a move', () => {
    const state = { ...createGameState(cfg), phase: 'playing' as const }
    const next = applyMove(state, 0, 0, 4)
    expect(next.currentPlayer.id).toBe(2)
  })

  it('does not allow placing on an already occupied cell', () => {
    let state: GameState = { ...createGameState(cfg), phase: 'playing' }
    state = applyMove(state, 0, 0, 4)
    const again = applyMove(state, 0, 0, 4)
    expect(again.board[0][0].value).toBe(1)
  })

  it('increments move count', () => {
    const state = { ...createGameState(cfg), phase: 'playing' as const }
    const next = applyMove(state, 0, 0, 4)
    expect(next.moveCount).toBe(1)
  })

  it('does nothing when phase is won', () => {
    const state = { ...createGameState(cfg), phase: 'won' as const }
    const next = applyMove(state, 0, 0, 4)
    expect(next.moveCount).toBe(0)
  })
})

describe('findWinningCells', () => {
  it('returns null when no win exists', () => {
    const board = createBoard(4, 4)
    board[0][0] = { ...board[0][0], active: true }
    expect(findWinningCells(board, 4, 4, 0, 0, 4)).toBeNull()
  })

  it('detects a horizontal win', () => {
    const board = createBoard(4, 4)
    for (let c = 0; c < 4; c++) {
      board[0][c] = { ...board[0][c], active: true }
    }
    const result = findWinningCells(board, 4, 4, 0, 3, 4)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(4)
  })

  it('detects a vertical win', () => {
    const board = createBoard(4, 4)
    for (let r = 0; r < 4; r++) {
      board[r][0] = { ...board[r][0], active: true }
    }
    const result = findWinningCells(board, 4, 4, 3, 0, 4)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(4)
  })

  it('detects a diagonal win (↘)', () => {
    const board = createBoard(4, 4)
    for (let i = 0; i < 4; i++) {
      board[i][i] = { ...board[i][i], active: true }
    }
    const result = findWinningCells(board, 4, 4, 3, 3, 4)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(4)
  })

  it('detects a diagonal win (↙)', () => {
    const board = createBoard(4, 4)
    for (let i = 0; i < 4; i++) {
      board[i][3 - i] = { ...board[i][3 - i], active: true }
    }
    const result = findWinningCells(board, 4, 4, 3, 0, 4)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(4)
  })
})

describe('applyMove – win detection', () => {
  it('sets phase to won after 4 in a row horizontally', () => {
    let state: GameState = { ...createGameState(cfg), phase: 'playing' }
    // Player 1 places at row 0, cols 0-3 (interleaved with player 2 placing elsewhere)
    const p1Moves = [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ] as const
    const p2Moves = [
      [1, 0],
      [1, 1],
      [1, 2],
    ] as const

    let p1i = 0
    let p2i = 0
    while (p1i < p1Moves.length) {
      state = applyMove(state, p1Moves[p1i][0], p1Moves[p1i][1], 4)
      p1i++
      if (state.phase === 'won') break
      if (p2i < p2Moves.length) {
        state = applyMove(state, p2Moves[p2i][0], p2Moves[p2i][1], 4)
        p2i++
      }
    }

    expect(state.phase).toBe('won')
    expect(state.currentPlayer.id).toBe(1)
    expect(state.winningCells).toHaveLength(4)
  })

  it('increments winner score after win', () => {
    let state: GameState = { ...createGameState({ rows: 3, cols: 3, winLength: 3 }), phase: 'playing' }
    // P1: (0,0),(0,1),(0,2) -> wins; P2: (1,0),(1,1)
    state = applyMove(state, 0, 0, 3)
    state = applyMove(state, 1, 0, 3)
    state = applyMove(state, 0, 1, 3)
    state = applyMove(state, 1, 1, 3)
    state = applyMove(state, 0, 2, 3)
    expect(state.phase).toBe('won')
    expect(state.players[0].score).toBe(1)
    expect(state.players[1].score).toBe(0)
  })
})

describe('resetBoard', () => {
  it('clears the board and resets phase', () => {
    let state: GameState = { ...createGameState(cfg), phase: 'playing' }
    state = applyMove(state, 0, 0, 4)
    const reset = resetBoard(state)
    expect(reset.phase).toBe('idle')
    expect(reset.moveCount).toBe(0)
    expect(reset.board[0][0].active).toBe(false)
  })

  it('preserves scores after reset', () => {
    let state: GameState = { ...createGameState({ rows: 3, cols: 3, winLength: 3 }), phase: 'playing' }
    state = applyMove(state, 0, 0, 3)
    state = applyMove(state, 1, 0, 3)
    state = applyMove(state, 0, 1, 3)
    state = applyMove(state, 1, 1, 3)
    state = applyMove(state, 0, 2, 3)
    expect(state.players[0].score).toBe(1)
    const reset = resetBoard(state)
    expect(reset.players[0].score).toBe(1)
  })
})
