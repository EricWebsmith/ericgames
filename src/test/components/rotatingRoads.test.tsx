import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RotatingRoads from '../../components/RotatingRoads';

describe('Rotating Roads', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/#/rotating-roads');
  });

  it('records steps and clears them on reset', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<RotatingRoads />);

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
      const { container } = render(<RotatingRoads />);
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
      const { container } = render(<RotatingRoads />);
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

  it('loads board settings from query string', () => {
    window.history.replaceState(
      null,
      '',
      '/#/rotating-roads?b=rhombic16&t=0123012301230123&r=0123450123450123&s=0.1&e=15.5',
    );

    const { container } = render(<RotatingRoads />);
    const boardTypeSelect = container.querySelector('#rotating-roads-board-type');

    expect(screen.getByLabelText('Start tile 0')).toBeInTheDocument();
    expect(screen.getByLabelText('End tile 15')).toBeInTheDocument();
    expect(boardTypeSelect).toHaveValue('rhombic16');
  });

  it('writes current board state to query string', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<RotatingRoads />);

      const rotateTarget = container.querySelector('polygon[fill-opacity="0"]');
      expect(rotateTarget).not.toBeNull();
      act(() => {
        fireEvent.click(rotateTarget!);
      });
      act(() => {
        vi.runAllTimers();
      });

      const hashQuery = window.location.hash.split('?')[1] ?? '';
      const params = new URLSearchParams(hashQuery);
      const rotates = params.get('r');
      const tileTypes = params.get('t');

      expect(params.get('b')).toBe('rhombic9');
      expect(params.get('s')).toMatch(/^\d+\.\d+$/);
      expect(params.get('e')).toMatch(/^\d+\.\d+$/);
      expect(rotates).not.toBeNull();
      expect(tileTypes).not.toBeNull();
      expect(rotates).toHaveLength(9);
      expect(tileTypes).toHaveLength(9);
      expect(window.location.search).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});
