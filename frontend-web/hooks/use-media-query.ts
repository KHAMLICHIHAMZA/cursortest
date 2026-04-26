'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * Souscrire à matchMedia. Premier rendu côté client : sync avant peinture (useLayoutEffect) pour limiter le flash.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const onChange = () => setMatches(m.matches);
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
