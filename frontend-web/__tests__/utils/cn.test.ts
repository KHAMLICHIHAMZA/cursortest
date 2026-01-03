import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'valid-class');
    expect(result).toContain('base-class');
    expect(result).toContain('valid-class');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('p-4 p-2', 'm-2 m-4');
    // tailwind-merge should keep the last conflicting class
    expect(result).toContain('p-2');
    expect(result).toContain('m-4');
  });

  it('should handle empty strings', () => {
    const result = cn('base-class', '', 'another-class');
    expect(result).toContain('base-class');
    expect(result).toContain('another-class');
  });
});


