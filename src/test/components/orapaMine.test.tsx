import { render, screen } from '@testing-library/react';
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

  it('renders a "Light Blue Gem Expansion" checkbox', () => {
    render(<OrapaMine />)
    expect(screen.getByRole('checkbox', { name: /light blue gem expansion/i })).toBeInTheDocument()
  })

})
