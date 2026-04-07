import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SimpleSignaturePad } from '@/components/ui/simple-signature-pad';

describe('SimpleSignaturePad', () => {
  const rect = {
    width: 400,
    height: 192,
    top: 0,
    left: 0,
    bottom: 192,
    right: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(rect);

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      if (type !== '2d') return null;
      const el = this;
      el.toDataURL = () => 'data:image/png;base64,mocksignature';
      return {
        lineCap: 'round',
        lineJoin: 'round',
        strokeStyle: '#111827',
        lineWidth: 2.75,
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        clearRect: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    if (!HTMLCanvasElement.prototype.setPointerCapture) {
      (HTMLCanvasElement.prototype as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture =
        vi.fn();
    }
    if (!HTMLCanvasElement.prototype.releasePointerCapture) {
      (HTMLCanvasElement.prototype as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture =
        vi.fn();
    }
    if (!HTMLCanvasElement.prototype.hasPointerCapture) {
      (HTMLCanvasElement.prototype as unknown as { hasPointerCapture: (id: number) => boolean }).hasPointerCapture =
        () => true;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders canvas and clear control', () => {
    const { container } = render(<SimpleSignaturePad />);
    expect(container.querySelector('canvas')).toBeTruthy();
    expect(container.querySelector('canvas')).toHaveAttribute('aria-label', 'Zone de signature');
  });

  it('calls onChange with data URL after pointer stroke', () => {
    const onChange = vi.fn();
    const { container } = render(<SimpleSignaturePad onChange={onChange} />);
    const canvas = container.querySelector('canvas')!;

    fireEvent.pointerDown(canvas, {
      clientX: 50,
      clientY: 50,
      pointerId: 42,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(canvas, {
      clientX: 120,
      clientY: 80,
      pointerId: 42,
    });
    fireEvent.pointerUp(canvas, {
      clientX: 120,
      clientY: 80,
      pointerId: 42,
    });

    const calls = onChange.mock.calls.map((c) => c[0]).filter(Boolean);
    expect(calls.length).toBeGreaterThan(0);
    expect(String(calls[calls.length - 1])).toMatch(/^data:image\/png;base64,/i);
  });

  it('clear invokes onChange(null)', () => {
    const onChange = vi.fn();
    const { container, getByRole } = render(<SimpleSignaturePad onChange={onChange} />);
    const canvas = container.querySelector('canvas')!;

    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1, pointerType: 'pen' });
    fireEvent.pointerMove(canvas, { clientX: 30, clientY: 30, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 30, pointerId: 1 });

    onChange.mockClear();
    const clearBtn = getByRole('button', { name: /effacer la signature/i });
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
