/** Represents a single cell on the game board */
export interface Cell {
  row: number
  col: number
  /** Whether this cell is currently active/selected */
  active: boolean
  /** Theme-specific value for this cell (e.g. light level, ore amount, star density) */
  value: number
}

/** Player info */
export interface Player {
  id: 1 | 2
  name: string
  score: number
}

/** Phase of the game */
export type GamePhase = 'idle' | 'playing' | 'won' | 'draw'

/** Core game state shared by all games */
export interface GameState {
  board: Cell[][]
  rows: number
  cols: number
  currentPlayer: Player
  players: [Player, Player]
  phase: GamePhase
  /** Number of moves made so far */
  moveCount: number
  /** Winning cells, populated when phase === 'won' */
  winningCells: Array<{ row: number; col: number }>
}

/** Configuration for creating a new game */
export interface GameConfig {
  rows: number
  cols: number
  winLength: number
  player1Name?: string
  player2Name?: string
}
