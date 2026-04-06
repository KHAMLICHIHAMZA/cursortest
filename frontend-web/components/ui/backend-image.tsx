'use client';

import { useState } from 'react';
import { Car } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils/cn';

type BackendImageProps = {
  imageUrl?: string | null;
  alt: string;
  /** Classes pour la balise img en cas de succès */
  className?: string;
  /** Conteneur si pas d’URL ou erreur de chargement */
  placeholderClassName?: string;
  iconClassName?: string;
};

/**
 * Image hébergée sur l’API (ex. /uploads/vehicles/…).
 * Utilise &lt;img&gt; natif pour éviter les restrictions next/image sur les domaines (Render, etc.).
 */
export function BackendImage({
  imageUrl,
  alt,
  className,
  placeholderClassName,
  iconClassName,
}: BackendImageProps) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl ? getImageUrl(imageUrl) : undefined;

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-background text-text-muted',
          placeholderClassName,
        )}
      >
        <Car className={cn('w-12 h-12', iconClassName)} aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs API (Render) : next/image domain allowlist trop rigide
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
