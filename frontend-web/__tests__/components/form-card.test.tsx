import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormCard } from '@/components/ui/form-card';
import userEvent from '@testing-library/user-event';

describe('FormCard component', () => {
  it('should render title and children', () => {
    render(
      <FormCard title="Test Form" backHref="/test">
        <div>Form content</div>
      </FormCard>
    );

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <FormCard title="Test Form" description="Test description" backHref="/test">
        <div>Form content</div>
      </FormCard>
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render back button with custom label', () => {
    render(
      <FormCard title="Test Form" backHref="/test" backLabel="Go Back">
        <div>Form content</div>
      </FormCard>
    );

    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <FormCard title="Test Form" backHref="/test" onSubmit={handleSubmit} submitLabel="Save">
        <input type="text" name="test" />
      </FormCard>
    );

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should disable submit button when isLoading is true', () => {
    render(
      <FormCard title="Test Form" backHref="/test" onSubmit={vi.fn()} isLoading={true}>
        <div>Form content</div>
      </FormCard>
    );

    const submitButton = screen.getByText('Chargement...');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading text when isLoading is true', () => {
    render(
      <FormCard title="Test Form" backHref="/test" onSubmit={vi.fn()} isLoading={true}>
        <div>Form content</div>
      </FormCard>
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should apply correct maxWidth class', () => {
    const { container } = render(
      <FormCard title="Test Form" backHref="/test" maxWidth="md">
        <div>Form content</div>
      </FormCard>
    );

    const formCard = container.querySelector('.max-w-md');
    expect(formCard).toBeInTheDocument();
  });

  it('should render cancel button', () => {
    render(
      <FormCard title="Test Form" backHref="/test" onSubmit={vi.fn()}>
        <div>Form content</div>
      </FormCard>
    );

    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });
});

