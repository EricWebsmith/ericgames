import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Arclight from '../components/Arclight';
import OrapaMine from '../components/orapaMine/OrapaMine';


describe('App', () => {

  it('renders Arclight when navigating to /arclight', () => {
    render(<Arclight />);
    expect(screen.getByText('Arclight')).toBeInTheDocument();
  });

  it('renders OrapaMine when navigating to /orapa-mine', () => {
    render(<OrapaMine />);
    expect(screen.getByText('Orapa Mine')).toBeInTheDocument();
  });

});
