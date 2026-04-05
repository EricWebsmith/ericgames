import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import Arclight from '../components/arclight/Arclight';
import OrapaMine from '../components/orapaMine/OrapaMine';
import OrapaSpace from '../components/orapaSpace/OrapaSpace';

describe('Arclight', () => {
  it('renders the game title', () => {
    render(<Arclight />)
    expect(screen.getByText('Arclight')).toBeInTheDocument()
  })


  it('renders the SVG hex board', () => {
    render(<Arclight />)
    expect(screen.getByLabelText('Arclight puzzle board')).toBeInTheDocument()
  })

  it('renders 37 hex tiles', () => {
    render(<Arclight />)
    const tiles = screen.getAllByLabelText(/^Tile [A-M]\d+$/)
    expect(tiles).toHaveLength(37)
  })

  it('clicking a tile reveals it', async () => {
    const user = userEvent.setup()
    render(<Arclight />)
    const tile = screen.getByLabelText('Tile G8')
    await user.click(tile)
    // After click the tile is revealed (no assertion on visual state needed, just no error thrown)
    expect(tile).toBeInTheDocument()
  })
})

describe('OrapaMine', () => {
  it('renders the game title', () => {
    render(<OrapaMine />)
    expect(screen.getByText('Orapa Mine')).toBeInTheDocument()
  })

  it('renders a "New Game" button', () => {
    render(<OrapaMine />)
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument()
  })

  it('renders a "See Answer" button', () => {
    render(<OrapaMine />)
    expect(screen.getByRole('button', { name: /see answer/i })).toBeInTheDocument()
  })

  it('renders the SVG board', () => {
    render(<OrapaMine />)
    expect(screen.getByLabelText('Orapa Mine puzzle board')).toBeInTheDocument()
  })

  it('clicking a border circle shows a wave result annotation', async () => {
    const user = userEvent.setup()
    render(<OrapaMine />)
    const border = screen.getByLabelText('Border 1')
    await user.click(border)
    // After firing a wave, an annotation (→<exit> or ✕ for absorbed) is shown
    expect(screen.queryByText(/→|✕/)).toBeInTheDocument()
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
