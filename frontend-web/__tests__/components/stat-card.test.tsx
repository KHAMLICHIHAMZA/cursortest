import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/ui/stat-card';
import { Building2 } from 'lucide-react';

describe('StatCard component', () => {
  it('should render title and value', () => {
    render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
      />
    );

    expect(screen.getByText('Total Agences')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
      />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
        isLoading={true}
      />
    );

    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('should handle onClick when provided', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
        onClick={handleClick}
      />
    );

    const card = container.querySelector('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();

    if (card) {
      (card as HTMLElement).click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should not have cursor-pointer class when onClick is not provided', () => {
    const { container } = render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
      />
    );

    const card = container.querySelector('[class*="cursor-pointer"]');
    expect(card).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(
      <StatCard
        title="Status"
        value="Active"
        icon={Building2}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should use custom icon color', () => {
    const { container } = render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
        iconColor="text-red-500"
      />
    );

    const icon = container.querySelector('.text-red-500');
    expect(icon).toBeInTheDocument();
  });
});


