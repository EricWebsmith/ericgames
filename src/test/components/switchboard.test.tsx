import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Switchboard from '../../components/Switchboard';

describe('Switchboard', () => {
  it('records steps and clears them on reset', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Switchboard />);

      expect(screen.getByText(/spent 0 step/i)).toBeInTheDocument();

      const firstRotateTarget = container.querySelector('polygon[fill-opacity="0"]');
      expect(firstRotateTarget).not.toBeNull();

      act(() => {
        fireEvent.click(firstRotateTarget!);
      });
      expect(screen.getByText(/spent 1 step/i)).toBeInTheDocument();

      act(() => {
        vi.runAllTimers();
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      });

      expect(screen.getByText(/spent 0 step/i)).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /step on tile/i })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
