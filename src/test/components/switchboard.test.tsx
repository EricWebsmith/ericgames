import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Switchboard from '../../components/Switchboard';

describe('Switchboard', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/#/switchboard');
  });

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

  it('loads board settings from query string', () => {
    window.history.replaceState(
      null,
      '',
      '/?board-type=rhombic16&tile-types=0123012301230123&rotates=0123450123450123&start-tile=0&start-border=1&end-tile=15&end-border=5#/switchboard',
    );

    const { container } = render(<Switchboard />);
    const boardTypeSelect = container.querySelector('#switchboard-board-type');

    expect(screen.getByLabelText('Start tile 0')).toBeInTheDocument();
    expect(screen.getByLabelText('End tile 15')).toBeInTheDocument();
    expect(boardTypeSelect).toHaveValue('rhombic16');
  });

  it('writes current board state to query string', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Switchboard />);

      const rotateTarget = container.querySelector('polygon[fill-opacity="0"]');
      expect(rotateTarget).not.toBeNull();
      act(() => {
        fireEvent.click(rotateTarget!);
      });
      act(() => {
        vi.runAllTimers();
      });

      const params = new URLSearchParams(window.location.search);
      const rotates = params.get('rotates');
      const tileTypes = params.get('tile-types');

      expect(params.get('board-type')).toBe('rhombic9');
      expect(params.get('start-tile')).toMatch(/^\d+$/);
      expect(params.get('start-border')).toMatch(/^\d+$/);
      expect(params.get('end-tile')).toMatch(/^\d+$/);
      expect(params.get('end-border')).toMatch(/^\d+$/);
      expect(rotates).not.toBeNull();
      expect(tileTypes).not.toBeNull();
      expect(rotates).toHaveLength(9);
      expect(tileTypes).toHaveLength(9);
    } finally {
      vi.useRealTimers();
    }
  });
});
