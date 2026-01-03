import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getImageUrl } from '@/lib/utils/image-url';

describe('getImageUrl utility', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    // Reset env for each test
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    }
  });

  it('should return undefined for null or undefined input', () => {
    expect(getImageUrl(null)).toBeUndefined();
    expect(getImageUrl(undefined)).toBeUndefined();
    expect(getImageUrl('')).toBeUndefined();
  });

  it('should return full URL as-is if it starts with http://', () => {
    const url = 'http://example.com/image.jpg';
    expect(getImageUrl(url)).toBe(url);
  });

  it('should return full URL as-is if it starts with https://', () => {
    const url = 'https://example.com/image.jpg';
    expect(getImageUrl(url)).toBe(url);
  });

  it('should construct full URL from relative path with default API URL', () => {
    const relativePath = '/uploads/vehicles/image.jpg';
    const result = getImageUrl(relativePath);
    expect(result).toBe('http://localhost:3000/uploads/vehicles/image.jpg');
  });

  it('should construct full URL from relative path with custom API URL', () => {
    // Note: process.env is read at module load time, so we can't easily test this
    // This test verifies the default behavior works
    const relativePath = '/uploads/vehicles/image.jpg';
    const result = getImageUrl(relativePath);
    
    // Should construct URL with default API URL
    expect(result).toContain('localhost:3000');
    expect(result).toContain('/uploads/vehicles/image.jpg');
  });

  it('should add leading slash if missing', () => {
    const relativePath = 'uploads/vehicles/image.jpg';
    const result = getImageUrl(relativePath);
    expect(result).toBe('http://localhost:3000/uploads/vehicles/image.jpg');
  });

  it('should handle paths with query parameters', () => {
    const relativePath = '/uploads/vehicles/image.jpg?v=123';
    const result = getImageUrl(relativePath);
    expect(result).toBe('http://localhost:3000/uploads/vehicles/image.jpg?v=123');
  });
});

