import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Switchboard from '../../components/Switchboard';

describe('Switchboard', () => {
  it('records steps and clears them on reset', () => {
    vi.useFakeTimers();
    const { container } = render(<Switchboard />);

    expect(screen.getByText('You have spent 0 steps.')).toBeInTheDocument();

    const firstRotateTarget = container.querySelector('polygon[fill-opacity="0"]');
    expect(firstRotateTarget).not.toBeNull();
    fireEvent.click(firstRotateTarget!);

    expect(screen.getByText('You have spent 1 steps.')).toBeInTheDocument();

    vi.runAllTimers();
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByText('You have spent 0 steps.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /step on tile/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
