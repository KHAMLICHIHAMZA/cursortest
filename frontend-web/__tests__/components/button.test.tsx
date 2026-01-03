import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button component', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('should be disabled when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('Chargement...')).toBeDisabled();
  });

  it('should show loading text when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
  });

  it('should apply primary variant styles', () => {
    const { container } = render(<Button variant="primary">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-primary');
  });

  it('should apply secondary variant styles', () => {
    const { container } = render(<Button variant="secondary">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-card');
  });

  it('should apply outline variant styles', () => {
    const { container } = render(<Button variant="outline">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('border');
  });

  it('should apply ghost variant styles', () => {
    const { container } = render(<Button variant="ghost">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-text');
  });

  it('should apply danger variant styles', () => {
    const { container } = render(<Button variant="danger">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-error');
  });

  it('should apply size sm styles', () => {
    const { container } = render(<Button size="sm">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-sm');
  });

  it('should apply size md styles', () => {
    const { container } = render(<Button size="md">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-base');
  });

  it('should apply size lg styles', () => {
    const { container } = render(<Button size="lg">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-lg');
  });

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-class">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Click me</Button>);
    expect(ref).toHaveBeenCalled();
  });
});


