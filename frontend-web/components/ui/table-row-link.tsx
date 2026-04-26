'use client';

import { useRouter } from 'next/navigation';
import { TableRow } from './table';
import { cn } from '@/lib/utils/cn';

export type TableRowLinkProps = React.ComponentProps<typeof TableRow> & {
  href: string;
};

/**
 * Ligne de tableau cliquable : ouvre `href` (les cellules d’action doivent appeler
 * `e.stopPropagation()` sur le conteneur des boutons).
 */
export function TableRowLink({ href, className, children, onKeyDown, ...rest }: TableRowLinkProps) {
  const router = useRouter();
  return (
    <TableRow
      {...rest}
      className={cn('cursor-pointer hover:bg-primary/[0.08]', className)}
      tabIndex={0}
      role="link"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </TableRow>
  );
}
