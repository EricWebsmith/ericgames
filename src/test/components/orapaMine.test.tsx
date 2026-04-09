import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import OrapaMine from '../../components/OrapaMine';



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

  it('clicking a border circle shows a wave result annotation', async () => {
    const user = userEvent.setup()
    render(<OrapaMine />)
    const border = screen.getByLabelText('Border 1')
    await user.click(border)
    // After firing a wave, an annotation (→<exit> or ✕ for absorbed) is shown
    expect(screen.queryByText(/→|✕/)).toBeInTheDocument()
  })
})
