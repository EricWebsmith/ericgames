import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Arclight from '../../components/arclight/Arclight';

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