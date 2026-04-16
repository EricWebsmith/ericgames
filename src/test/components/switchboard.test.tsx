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

  it('supports undo and redo', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Switchboard />);
      const rotateTargets = container.querySelectorAll('polygon[fill-opacity="0"]');
      expect(rotateTargets.length).toBeGreaterThan(2);

      act(() => {
        fireEvent.click(rotateTargets[0]);
      });
      act(() => {
        vi.runAllTimers();
      });
      act(() => {
        fireEvent.click(rotateTargets[2]);
      });
      act(() => {
        vi.runAllTimers();
      });

      expect(screen.getByText(/spent 2 step/i)).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /undo/i }));
      });
      expect(screen.getByText(/spent 1 step/i)).toBeInTheDocument();
      act(() => {
        vi.runAllTimers();
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /redo/i }));
      });
      expect(screen.getByText(/spent 2 step/i)).toBeInTheDocument();
      act(() => {
        vi.runAllTimers();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears redo history when making a new step after undo', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Switchboard />);
      const rotateTargets = container.querySelectorAll('polygon[fill-opacity="0"]');
      expect(rotateTargets.length).toBeGreaterThan(4);

      act(() => {
        fireEvent.click(rotateTargets[0]);
      });
      act(() => {
        vi.runAllTimers();
      });
      act(() => {
        fireEvent.click(rotateTargets[2]);
      });
      act(() => {
        vi.runAllTimers();
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /undo/i }));
      });
      act(() => {
        vi.runAllTimers();
      });
      act(() => {
        fireEvent.click(rotateTargets[4]);
      });
      act(() => {
        vi.runAllTimers();
      });

      expect(screen.getByText(/spent 2 step/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });
});
