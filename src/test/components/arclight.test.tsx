import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Arclight from '../../components/Arclight';

describe('Arclight', () => {
  it('renders the game title', () => {
    render(<Arclight />)
    expect(screen.getByText('Arclight')).toBeInTheDocument()
  })
})