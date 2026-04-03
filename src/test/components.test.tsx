import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Arclight from '../games/arclight/Arclight'
import OrapaMine from '../games/orapaMine/OrapaMine'
import OrapaSpace from '../games/orapaSpace/OrapaSpace'
import App from '../App'

describe('Arclight', () => {
  it('renders the game title', () => {
    render(<Arclight />)
    expect(screen.getByText('Arclight')).toBeInTheDocument()
  })

  it('shows the current player turn', () => {
    render(<Arclight />)
    expect(screen.getByText(/Arc Blue's turn/)).toBeInTheDocument()
  })

  it('renders a "New Round" button', () => {
    render(<Arclight />)
    expect(screen.getByRole('button', { name: /new round/i })).toBeInTheDocument()
  })

  it('renders the SVG board', () => {
    render(<Arclight />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('switches player after a cell click', async () => {
    const user = userEvent.setup()
    render(<Arclight />)
    const cells = screen.getAllByRole('gridcell')
    await user.click(cells[0])
    expect(screen.getByText(/Arc Red's turn/)).toBeInTheDocument()
  })
})

describe('OrapaMine', () => {
  it('renders the game title', () => {
    render(<OrapaMine />)
    expect(screen.getByText('Orapa Mine')).toBeInTheDocument()
  })

  it('shows the current player turn', () => {
    render(<OrapaMine />)
    expect(screen.getByText(/Gold Miner's turn/)).toBeInTheDocument()
  })

  it('renders a "New Round" button', () => {
    render(<OrapaMine />)
    expect(screen.getByRole('button', { name: /new round/i })).toBeInTheDocument()
  })

  it('renders the SVG board', () => {
    render(<OrapaMine />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('switches player after clicking a cell', async () => {
    const user = userEvent.setup()
    render(<OrapaMine />)
    const cells = screen.getAllByRole('gridcell')
    await user.click(cells[0])
    expect(screen.getByText(/Crystal Miner's turn/)).toBeInTheDocument()
  })
})

describe('OrapaSpace', () => {
  it('renders the game title', () => {
    render(<OrapaSpace />)
    expect(screen.getByText('Orapa Space')).toBeInTheDocument()
  })

  it('shows the current player turn', () => {
    render(<OrapaSpace />)
    expect(screen.getByText(/Planet Blue's turn/)).toBeInTheDocument()
  })

  it('renders a "New Round" button', () => {
    render(<OrapaSpace />)
    expect(screen.getByRole('button', { name: /new round/i })).toBeInTheDocument()
  })

  it('renders the SVG board', () => {
    render(<OrapaSpace />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('switches player after clicking a cell', async () => {
    const user = userEvent.setup()
    render(<OrapaSpace />)
    const cells = screen.getAllByRole('gridcell')
    await user.click(cells[0])
    expect(screen.getByText(/Star Orange's turn/)).toBeInTheDocument()
  })
})

describe('App', () => {
  it('renders the home page with game links', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Eric Games' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /arclight/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /orapa mine/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /orapa space/i }).length).toBeGreaterThan(0)
  })

  it('renders Arclight when navigating to /arclight', () => {
    render(<Arclight />)
    expect(screen.getByText('Arclight')).toBeInTheDocument()
  })

  it('renders OrapaMine when navigating to /orapa-mine', () => {
    render(<OrapaMine />)
    expect(screen.getByText('Orapa Mine')).toBeInTheDocument()
  })

  it('renders OrapaSpace when navigating to /orapa-space', () => {
    render(<OrapaSpace />)
    expect(screen.getByText('Orapa Space')).toBeInTheDocument()
  })
})
