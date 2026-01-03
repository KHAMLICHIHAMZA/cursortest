import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge component', () => {
  it('should render children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply active status styles', () => {
    const { container } = render(<Badge status="active">Active</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-blue-500');
  });

  it('should apply pending status styles', () => {
    const { container } = render(<Badge status="pending">Pending</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-orange-500');
  });

  it('should apply completed status styles', () => {
    const { container } = render(<Badge status="completed">Completed</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-gray-500');
  });

  it('should apply error status styles', () => {
    const { container } = render(<Badge status="error">Error</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-red-500');
  });

  it('should apply outline variant styles', () => {
    const { container } = render(<Badge status="active" variant="outline">Active</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('border');
    expect(badge?.className).toContain('bg-transparent');
  });

  it('should apply size sm styles', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('should apply size md styles', () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('should map status from children string', () => {
    const { container } = render(<Badge>IN_PROGRESS</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-blue-500');
  });

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Badge ref={ref}>Test</Badge>);
    expect(ref).toHaveBeenCalled();
  });
});

